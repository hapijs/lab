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
    var processErrors = [];

    process.on('uncaughtException', function (err) {

        processErrors.push(err);
    });

    // Execute experiments

    var startTime = Date.now();
    Async.forEach(Lab.experiments, function (experiment, nextExperiment) {

            // Befores

            Async.forEachSeries(experiment.befores || [], function (beforeFunc, next) {

                    var once = function (err) {

                        if (next) {
                            next(err);
                            next = null;
                        }
                    };

                    var beforeDom = Domain.create();
                    var timeoutId = setTimeout(function () {

                        beforeDom.dispose();
                        once(new Error('Before timed out'));
                    }, argv.m);

                    beforeDom.on('error', function (err) {

                        clearTimeout(timeoutId);
                        beforeDom.dispose();
                        once(err);
                    });

                    beforeDom.enter();
                    beforeFunc.call(null, function () {

                        clearTimeout(timeoutId);
                        beforeDom.exit();
                        once();
                    });
                },
                function (err) {

                    // Execute tests

                    Async.forEach(experiment.tests || [], function (test, next) {

                            // Unit

                            var once = function (err) {

                                if (!next) {
                                    err = new Error('Callback called twice in test: ' + test.title);
                                }

                                if (test.timeoutId) {
                                    clearTimeout(test.timeoutId);
                                    test.timeoutId = 0;
                                }

                                if (err) {
                                    ++failures;
                                    test.err = err;
                                }

                                emitter.emit('test', test);

                                if (next) {
                                    next();
                                    next = null;                                         // Prevent next from being called twice
                                }
                            };

                            process.nextTick(function () {

                                var domain = Domain.create();

                                domain.once('error', function (err) {

                                    domain.dispose();
                                    once(err);
                                });

                                test.timeoutId = setTimeout(function () {

                                    test.timeoutId = 0;
                                    test.timeout = true;
                                    domain.exit();
                                    once(new Error('Test timed out'));
                                }, argv.m);

                                domain.enter();
                                test.fn.call(null, function () {

                                    domain.exit();
                                    once();
                                });
                            });
                        },
                        function (err) {

                            // Afters

                            Async.forEachSeries(experiment.afters || [], function (afterFunc, next) {

                                    var once = function (err) {

                                        if (next) {
                                            next(err);
                                            next = null;
                                        }
                                    };

                                    var afterDom = Domain.create();
                                    var timeoutId = setTimeout(function () {

                                        afterDom.dispose();
                                        once(new Error('After timed out'));
                                    }, argv.m);

                                    afterDom.on('error', function (err) {

                                        clearTimeout(timeoutId);
                                        afterDom.dispose();
                                        once(err);
                                    });

                                    afterDom.enter();
                                    afterFunc.call(null, function () {

                                        clearTimeout(timeoutId);
                                        afterDom.exit();
                                        once();
                                    });
                                },
                                function (err) {

                                    nextExperiment();
                                });
                        }
                    );
                });
        },
        function (err) {

            emitter.emit('end', Date.now() - startTime, processErrors);
            process.exit(failures);
        }
    );
};