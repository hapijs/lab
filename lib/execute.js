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


internals.executing = false;


exports.execute = function (skipTraverse) {

    if (internals.executing) {
        return;
    }

    internals.executing = true;

    Error.stackTraceLimit = Infinity;

    // Process command line

    var argv = Optimist.usage('Usage: lab [options] [path]')
        .alias('e', 'environment')
        .default('e', 'test')
        .describe('e', 'value to set NODE_ENV before tests')

        .alias('g', 'global-leaks')
        .default('g', true)
        .describe('g', 'detect global variable leaks')
        .boolean('g')

        .alias('G', 'use-global')
        .default('G', false)
        .describe('G', 'export Lab as a global')
        .boolean('G')

        .alias('i', 'id')
        .describe('i', 'test identifier')

        .alias('m', 'timeout')
        .default('m', 2000)
        .describe('m', 'timeout for each test in milliseconds')

        .alias('o', 'output')
        .describe('o', 'file path to write test results')

        .alias('r', 'reporter')
        .default('r', 'console')
        .describe('r', 'reporter module [console, json, html, coverage, threshold]')

        .alias('s', 'silence')
        .default('s', false)
        .describe('s', 'silence test output')
        .boolean('s')

        .alias('t', 'threshold')
        .default('t', 100)
        .describe('t', 'code coverage threshold in percentage')

        .alias('v', 'verbose')
        .default('v', false)
        .describe('v', 'verbose output for coverage reporter')
        .boolean('v')

        .argv;

    if (argv.G) {
        global.Lab = Lab;
    }

    if (argv.h || argv.help) {
        Optimist.showHelp();
        process.exit(0);
    }

    if (['json', 'html', 'coverage', 'threshold'].indexOf(argv.r) !== -1) {
        var currentDir = process.cwd().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        var filterPattern = '^' + currentDir + '\\/((?!node_modules|test).).*$';
        var blanketOptions = {
            pattern: new RegExp(filterPattern, 'i'),
            onlyCwd: true,
            'data-cover-flags': {
                branchTracking: true   
            }
        };

        var blanket = require('blanket')(blanketOptions);
    }

    // Setup environment

    process.env.NODE_ENV = argv.e || 'test';
    internals.timeout = argv.m;

    if (!skipTraverse) {

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
    }

    // Subscribe reporter to events

    // test      - (test, failed, err)   test results
    // end       - (ms)                  execution complete

    var emitter = new Events.EventEmitter();

    var options = {
        output: argv.o,
        threshold: argv.t,
        silence: argv.s || false,
        global: argv.g,
        verbose: argv.v,
        ids: argv.i ? [].concat(argv.i) : []
    };

    Reporter[argv.r](emitter, options);

    var failures = 0;

    // Execute experiments

    var startTime = Date.now();
    Async.forEachSeries(Lab.experiments, function (experiment, nextExperiment) {

        Async.series([
            function (next) {

                internals.executeDeps(experiment.befores, next);
            },
            function (next) {

                internals.executeTests(experiment, emitter, options.ids, next);
            },
            function (next) {

                internals.executeDeps(experiment.afters, next);
            }
        ],
        function (err, results) {

            failures += results.failures;
            if (err) {
                failures++;
            }

            nextExperiment();
        });
    },
    function (err) {

        var leaks = null;
        if (argv.G) {
            delete global.Lab;
        }

        if (options.global) {
            leaks = internals.detectLeaks();
        }

        emitter.emit('end', { ms: Date.now() - startTime, leaks: leaks });
        process.exit((failures || leaks) ? 1 : 0);
    });
};


internals.executeDeps = function (deps, callback) {

    Async.forEachSeries(deps || [], function (dep, next) {

        internals.protect(dep, false, next);
    }, function (err) {

        if (err) {
            console.error(err);
        }

        callback();
    });
};


internals.executeTests = function (experiment, emitter, ids, callback) {

    var failures = 0;

    function runTest(test, next) {

        // Unit

        var start = Date.now();
        internals.protect(test, true, function (err) {

            if (err) {
                ++failures;
                test.err = err;
                test.timeout = err.timeout;
            }

            test.duration = Date.now() - start;

            emitter.emit('test', test);
            return next();
        });
    }

    Async.forEachSeries(experiment.tests || [], function (test, nextTest) {

        if (ids.length &&
            ids.indexOf(test.id) === -1) {

            return nextTest();
        }

        Async.series([
            function (next) {

                internals.executeDeps(experiment.beforeEaches, next);
            },
            function (next) {

                runTest(test, next);
            },
            function (next) {

                internals.executeDeps(experiment.afterEaches, next);
            }
        ], function (err, results) {

            if (err) {
                console.log(err);
            }

            nextTest();
        });
    },
    function (err) {

        callback(err, failures);
    });
};


internals.protect = function (item, isTimed, callback) {

    var timeoutId = 0;

    var baseDomain = Domain.createDomain();
    var scopeDomain = Domain.createDomain();

    var causes = null;
    var finish = function (err, cause) {

        var first = false;

        if (!causes) {
            causes = {};
            baseDomain.exit();
            scopeDomain.removeAllListeners();
            clearTimeout(timeoutId);
            first = true;
        }

        if (cause === 'done' && causes.done) {
            console.error('Callback called twice in test:', item.title);
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

    scopeDomain.once('error', function (err) {

        finish(err, 'error');
    });

    baseDomain.enter();
    scopeDomain.enter();

    setImmediate(function () {

        item.fn.call(null, function () {

            finish(null, 'done');
        });
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
        global,
        constructor
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
