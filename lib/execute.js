// Load modules

var Path = require('path');
var Fs = require('fs');
var Optimist = require('optimist');
var Events = require('events');
var Domain = require('domain');
var Async = require('async');
var Reporter = require('./reporter');

// Declare internals

var internals = {};
var Lab = require('./');


exports.execute = function () {

    Error.stackTraceLimit = Infinity;

    // Process command line

    var argv = Optimist.usage('Usage: lab [-r reporter] [-o filename] [-t threshold] [-m timeout] [-e NODE_ENV] [-s] [-g global] [-G use_global]')
        .default('r', 'console')
        .default('t', 100)
        .default('m', 2000)
        .default('e', 'test')
        .default('g', true)
        .default('G', false)
        .argv;

    if (argv.G) global.Lab = Lab;

    if (argv.h || argv.help) {
        Optimist.showHelp();
        process.exit(0);
    }

    if (['html', 'coverage', 'threshold'].indexOf(argv.r) !== -1) {
        var currentDir = process.cwd().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        var filterPattern = '^' + currentDir + '\\/((?!node_modules|test).).*$';
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
        silence: argv.s || false,
        global: argv.g
    };

    Reporter[argv.r](emitter, options);

    var failures = 0;

    // Execute experiments

    var startTime = Date.now();
    Async.forEachSeries(Lab.experiments, function (experiment, nextExperiment) {

        Async.series({
            befores: function (next) {

                internals.executeDeps(experiment.befores, next);
            },
            failures: function (next) {

                internals.executeTests(experiment.tests, emitter, next);
            },
            afters: function (next) {

                internals.executeDeps(experiment.afters, next);
            }
        }, function (err, results) {

            failures += results.failures;
            if (err) {
                failures++;
            }

            nextExperiment();
        });
    },
    function (err) {

        var leaks = null;
        if (argv.G) delete global.Lab;
        if (options.global) {
            leaks = internals.detectLeaks();
        }

        emitter.emit('end', { ms: Date.now() - startTime, leaks: leaks });
        process.exit((failures || leaks) ? 1 : 0);
    });
};


internals.executeDeps = function (deps, callback) {

    Async.forEachSeries(deps || [], function (depsFunc, next) {

        internals.protect(depsFunc, false, next);
    }, function (err) {

        if (err) {
            console.err(err);
        }

        callback();
    });
};


internals.executeTests = function (tests, emitter, callback) {

    var failures = 0;

    Async.forEachSeries(tests || [], function (test, next) {

        // Unit

        internals.protect(test.fn, true, function (err) {

            if (err) {
                ++failures;
                test.err = err;
                test.timeout = err.timeout;
            }

            emitter.emit('test', test);
            return next();
        });
    }, function (err) {

        callback(err, failures);
    });
};


internals.protect = function (fn, isTimed, callback) {

    var timeoutId = 0;
    var domain = Domain.create();

    var causes = null;
    var finish = function (err, cause) {

        var first = false;

        if (!causes) {
            causes = {};
            domain.exit();
            domain.removeAllListeners();
            clearTimeout(timeoutId);
            first = true;
        }

        if (cause === 'done' && causes.done) {
            console.err('Callback called twice in test');
            return;
        }

        causes[cause] = true;

        if (first) {
            return callback(err);
        }
    };

    if (isTimed) {
        timeoutId = setTimeout(function () {

            var error = new Error('Timed out');
            error.timeout = true;
            finish(error, 'timeout');
        }, internals.timeout);
    }

    domain.once('error', function (err) {

        finish(err, 'error');
    });

    domain.enter();
    fn.call(null, function () {

        finish(null, 'done');
    });
};


internals.detectLeaks = function () {

    var leaks = [];
    var knownGlobals = [
        setTimeout,
        setInterval,
        setImmediate,
        clearTimeout,
        clearInterval,
        clearImmediate,
        console,
        Buffer,
        process,
        global
    ];

    if (global.gc) {
        knownGlobals.push(global.gc);
    }

    if (global._blanket) {
        knownGlobals.push(global._blanket);
    }

    if (global['_$jscoverage']) {
        knownGlobals.push(global['_$jscoverage']);
    }

    if (global.DTRACE_HTTP_SERVER_RESPONSE) {
        knownGlobals.push(DTRACE_HTTP_SERVER_RESPONSE);
        knownGlobals.push(DTRACE_HTTP_SERVER_REQUEST);
        knownGlobals.push(DTRACE_HTTP_CLIENT_RESPONSE);
        knownGlobals.push(DTRACE_HTTP_CLIENT_REQUEST);
        knownGlobals.push(DTRACE_NET_STREAM_END);
        knownGlobals.push(DTRACE_NET_SERVER_CONNECTION);
        knownGlobals.push(DTRACE_NET_SOCKET_READ);
        knownGlobals.push(DTRACE_NET_SOCKET_WRITE);
    }
    if (global.COUNTER_NET_SERVER_CONNECTION) {
        knownGlobals.push(COUNTER_NET_SERVER_CONNECTION);
        knownGlobals.push(COUNTER_NET_SERVER_CONNECTION_CLOSE);
        knownGlobals.push(COUNTER_HTTP_SERVER_REQUEST);
        knownGlobals.push(COUNTER_HTTP_SERVER_RESPONSE);
        knownGlobals.push(COUNTER_HTTP_CLIENT_REQUEST);
        knownGlobals.push(COUNTER_HTTP_CLIENT_RESPONSE);
    }

    if (global.ArrayBuffer) {
        knownGlobals.push(ArrayBuffer);
        knownGlobals.push(Int8Array);
        knownGlobals.push(Uint8Array);
        knownGlobals.push(Uint8ClampedArray);
        knownGlobals.push(Int16Array);
        knownGlobals.push(Uint16Array);
        knownGlobals.push(Int32Array);
        knownGlobals.push(Uint32Array);
        knownGlobals.push(Float32Array);
        knownGlobals.push(Float64Array);
        knownGlobals.push(DataView);
    }

    for (var currentGlobal in global) {
        var found = false;

        for (var knownGlobal in knownGlobals) {
            if (global[currentGlobal] === knownGlobals[knownGlobal]) {
                found = true;
                break;
            }
        }

        if (!found) {
            leaks.push(currentGlobal);
        }
    }

    return leaks.length ? leaks : null;
};
