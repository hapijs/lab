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

    var argv = Optimist.usage('Usage: lab [options] [path]')
        .alias('r', 'reporter')
        .default('r', 'console')
        .describe('r', 'reporter module [console, html, coverage, threshold]')
        .alias('t', 'threshold')
        .default('t', 100)
        .describe('t', 'code coverage threshold in percentage')
        .alias('m', 'timeout')
        .default('m', 2000)
        .describe('m', 'timeout for each test in milliseconds')
        .alias('e', 'environment')
        .default('e', 'test')
        .describe('e', 'value to set NODE_ENV before tests')
        .alias('g', 'global-leaks')
        .default('g', true)
        .describe('g', 'detect global variable leaks')
        .alias('G', 'use-global')
        .default('G', false)
        .describe('G', 'export Lab as a global')
        .alias('s', 'silence')
        .default('s', false)
        .describe('s', 'silence test output')
        .alias('o', 'output')
        .describe('o', 'file path to write test results')
        .boolean(['g', 'G', 's'])
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

        var isDone = false;
        internals.protect(test.fn, true, function (err) {

            if (isDone) {
                err = new Error('Callback called twice in test: ' + test.title);
            }

            if (err) {
                ++failures;
                test.err = err;
                test.timeout = err.timeout;
            }

            if (!isDone) {
                emitter.emit('test', test);
                isDone = true;
                next();
            }
            else if (err) {
                emitter.emit('test', test);                                     // Inform listeners of errors from callback called twice
            }
        });
    }, function (err) {

        callback(err, failures);
    });
};


internals.protect = function (fn, isTimed, callback) {

    var timeoutId = 0;
    var domain = Domain.create();

    var finish = function (err) {

        domain.exit();
        domain.removeAllListeners();
        clearTimeout(timeoutId);

        return callback(err);
    };

    if (isTimed) {
        timeoutId = setTimeout(function () {

            var err = new Error('Timed out');
            err.timeout = true;
            finish(err);
        }, internals.timeout);
    }

    domain.on('error', finish);

    domain.enter();
    fn.call(null, finish);
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
