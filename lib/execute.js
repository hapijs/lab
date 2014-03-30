// Load modules

var Path = require('path');
var Fs = require('fs');
var Optimist = require('optimist');
var Events = require('events');
var Domain = require('domain');
var Async = require('async');
var Reporters = require('./reporters');
var Coverage = require('./coverage');
var Leaks = require('./leaks');
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

        .alias('c', 'coverage')
        .default('c', false)
        .describe('c', 'enable code coverage analysis')
        .boolean('c')

        .alias('e', 'environment')
        .default('e', 'test')
        .describe('e', 'value to set NODE_ENV before tests')

        .alias('l', 'leaks')
        .default('l', false)
        .describe('l', 'disable global variable leaks detection')
        .boolean('l')

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
        .describe('r', 'reporter module [console, html, json, spec, summary, tap]')

        .alias('s', 'silence')
        .default('s', false)
        .describe('s', 'silence test output')
        .boolean('s')

        .alias('t', 'threshold')
        .describe('t', 'code coverage threshold in percentage')

        .argv;

    if (argv.G) {
        global.Lab = Lab;
    }

    if (argv.h || argv.help) {
        Optimist.showHelp();
        process.exit(0);
    }

    var testCoverage = (argv.c || argv.t || argv.r === 'html')
    if (testCoverage) {
        Coverage.instrument();
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

    var options = {
        threshold: argv.t,
        silence: argv.s
    };

    var idsFilter = argv.i ? [].concat(argv.i) : []
    var reporter = new Reporters[argv.r](options);

    var report = {
        tests: [],
        failures: 0
    };

    // Execute experiments

    reporter.start({ tests: Lab.index });

    var startTime = Date.now();
    Async.forEachSeries(Lab.experiments, function (experiment, nextExperiment) {

        Async.series([
            function (next) {

                internals.executeDeps(experiment.befores, next);
            },
            function (next) {

                internals.executeTests(experiment, reporter, idsFilter, next);
            },
            function (next) {

                internals.executeDeps(experiment.afters, next);
            }
        ],
        function (err, results) {

            report.tests = report.tests.concat(results[1].tests);
            report.failures += results[1].failures;

            if (err) {
                report.failures++;
            }

            nextExperiment();
        });
    },
    function (err) {

        if (argv.G) {
            delete global.Lab;
        }

        var notebook = {
            ms: Date.now() - startTime,
            tests: report.tests,
            leaks: !argv.l ? Leaks.detect() : undefined,
            coverage: testCoverage ? Coverage.analyze(report.tests) : undefined
        };

        var output = reporter.end(notebook) || '';
        var dest = argv.o ? Fs.createWriteStream(argv.o) : process.stdout;
        dest.write(output, function () {

            if (testCoverage &&
                options.threshold &&
                (notebook.coverage.percent < options.threshold || isNaN(notebook.coverage.percent))) {

                process.exit(1);
            }

            process.exit(report.failures || (notebook.leaks && notebook.leaks.length) ? 1 : 0);
        });
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


internals.executeTests = function (experiment, reporter, ids, callback) {

    var report = {
        tests: [],
        failures: 0
    };

    var runTest = function (test, next) {

        // Unit

        var start = Date.now();
        internals.protect(test, true, function (err) {

            if (err) {
                report.failures++;
                test.err = err;
                test.timeout = err.timeout;
            }

            test.duration = Date.now() - start;

            report.tests.push(test);
            reporter.test(test);
            return next();
        });
    };

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

        callback(err, report);
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