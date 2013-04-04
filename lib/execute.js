// Load modules

var Path = require('path');
var Fs = require('fs');
var Optimist = require('optimist');
var Events = require('events');
var Domain = require('domain');
var Async = require('async');
var Reporter = require('./reporter');
var Lab = require('./');


// Declare internals

var internals = {};


exports.execute = function () {

    Error.stackTraceLimit = Infinity;

    // Process command line

    var argv = Optimist.usage('Usage: lab [-r reporter] [-o filename] [-t threshold] [-m timeout] [-e NODE_ENV] [-s]')
        .default('r', 'console')
        .default('t', 100)
        .default('m', 2000)
        .default('e', 'test')
        .argv;

    if (['html', 'coverage', 'threshold'].indexOf(argv.r) !== -1) {
        var currentDir = Path.join(process.cwd(), 'lib').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        var filterPattern = '^' + currentDir + '.*$';
        var blanketOptions = {
            pattern: new RegExp(filterPattern, 'i'),
            onlyCwd: true,
            branchTracking: true
        };

        var blanket = require('blanket')(blanketOptions);
    }

    // Setup environment

    process.env.NODE_ENV = argv.e || 'test';

    // Collect filenames using provided list of files or directories (defaults to ./test)

    if (!argv._.length) {
        argv._.push('test');
    }

    internals.timeout = argv.m;

    var traverse = function (path) {

        var files = [];

        var stat = Fs.statSync(path);
        if (stat.isFile()) {
            return path;
        }

        Fs.readdirSync(path).forEach(function (file) {

            file = Path.join(path, file);
            var stat = Fs.statSync(file);
            if (stat.isDirectory()) {
                files = files.concat(traverse(file));
                return;
            }

            if (stat.isFile() &&
                /\.(js)$/.test(file) &&
                Path.basename(file)[0] !== '.') {

                files.push(file);
            }
        });

        return files;
    };

    var testFiles = [];
    argv._.forEach(function (arg) {

        testFiles = testFiles.concat(traverse(arg));
    });

    testFiles = testFiles.map(function (path) {

        return Path.resolve(path);
    });

    if (testFiles.length) {
        testFiles.forEach(function (file) {

            file = Path.resolve(file);
            require(file);
        });
    }

    // Subscribe reporter to events

    // test      - (test, failed, err)   test results
    // end       - (ms)                  execution complete

    var emitter = new Events.EventEmitter();

    var options = {
        output: argv.o,
        threshold: argv.t,
        silence: argv.s || false
    };

    Reporter[argv.r](emitter, options);

    var failures = 0;

    // Execute experiments

    var startTime = Date.now();
    Async.forEach(Lab.experiments, function (experiment, nextExperiment) {

            Async.series({
                befores: function (next) {

                    internals.executeDeps(experiment.befores, next);
                },
                tests: function (next) {

                    internals.executeTests(experiment.tests, emitter, next);
                },
                afters: function (next) {

                    internals.executeDeps(experiment.afters, next);
                }
            }, function (err, results) {

                failures += results.tests;
                nextExperiment();
            });
        },
        function (err) {

            emitter.emit('end', Date.now() - startTime);
            process.exit(failures);
        }
    );
};


internals.executeDeps = function (deps, callback) {

    Async.forEachSeries(deps || [], function (depsFunc, next) {

        internals.protect(depsFunc, next);
    }, function (err) {

        callback();
    });
};


internals.executeTests = function (tests, emitter, callback) {

    var failures = 0;

    Async.forEach(tests || [], function (test, next) {

        // Unit

        internals.protect(test.fn, function (err) {

            if (!next) {
                err = new Error('Callback called twice in test: ' + test.title);
            }

            if (err) {
                ++failures;
                test.err = err;
                test.timeout = err.timeout;
            }

            emitter.emit('test', test);

            if (next) {
                next();
                next = null;                                         // Prevent next from being called twice
            }
        });
    }, function (err) {

        callback(null, failures);
    });
};


internals.protect = function (fn, callback) {

    var once = function (err) {

        if (callback) {
            callback(err);
            callback = null;
        }
    };

    var domain = Domain.create();
    var timeoutId = setTimeout(function () {

        domain.exit();
        var err = new Error('Timed out');
        err.timeout = true;
        once(err);
    }, internals.timeout);

    domain.on('error', function (err) {

        clearTimeout(timeoutId);
        domain.dispose();
        once(err);
    });

    process.nextTick(function () {
        domain.enter();
        fn.call(null, function () {

            clearTimeout(timeoutId);
            domain.exit();
            once();
        });
    });
};