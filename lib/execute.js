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

    // Load tests

    if (!skipTraverse) {
        var paths = argv._;
        if (!paths.length) {
            paths.push('test');        // Default to './test'
        }

        internals.traverse(paths);
    }

    // Generate reporter

    var reporter = new Reporters[argv.r]({ threshold: argv.t, silence: argv.s });

    var report = {
        tests: [],
        failures: 0
    };

    // Execute experiments

    var idsFilter = argv.i ? [].concat(argv.i) : []
    reporter.start({ count: idsFilter.length || Lab.count });

    var startTime = Date.now();
    var state = {
        report: report,
        reporter: reporter,
        ids: idsFilter
    };

    internals.executeExperiments(Lab.root, state, function (err) {

        // Cleanup

        if (argv.G) {
            delete global.Lab;
        }

        // Finalize

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
                argv.t &&
                (notebook.coverage.percent < argv.t || isNaN(notebook.coverage.percent))) {

                process.exit(1);
            }

            process.exit(report.failures || (notebook.leaks && notebook.leaks.length) ? 1 : 0);
        });
    });
};


internals.traverse = function (paths) {

    // Collect filenames using provided list of files or directories

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
    paths.forEach(function (path) {

        testFiles = testFiles.concat(traverse(path));
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
};


internals.executeExperiments = function (experiments, state, callback) {

    Async.forEachSeries(experiments || [], function (experiment, nextExperiment) {

        Async.series([
            function (next) {

                // Before

                internals.executeDeps(experiment.befores, next);
            },
            function (next) {

                // Tests

                internals.executeTests(experiment, state, next);
            },
            function (next) {

                // Sub-experiments

                internals.executeExperiments(experiment.experiments, state, next);
            },
            function (next) {

                // After

                internals.executeDeps(experiment.afters, next);
            }
        ],
        function (err, results) {

            if (err) {
                state.report.failures++;        // Force process.exit(1)
            }

            nextExperiment();
        });
    },
    function (err) {

        callback(err);
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


internals.executeTests = function (experiment, state, callback) {

    var befores = internals.collectDeps(experiment, 'beforeEaches');
    var afters = internals.collectDeps(experiment, 'afterEaches');

    Async.forEachSeries(experiment.tests || [], function (test, nextTest) {

        if (state.ids.length &&
            state.ids.indexOf(test.id) === -1) {

            return nextTest();
        }

        Async.series([
            function (next) {

                // Before each

                internals.executeDeps(befores, next);
            },
            function (next) {

                // Unit

                var start = Date.now();
                internals.protect(test, true, function (err) {

                    if (err) {
                        state.report.failures++;
                        test.err = err;
                        test.timeout = err.timeout;
                    }

                    test.duration = Date.now() - start;

                    state.report.tests.push(test);
                    state.reporter.test(test);
                    return next();
                });
            },
            function (next) {

                // After each

                internals.executeDeps(afters, next);
            }
        ], function (err, results) {

            if (err) {
                console.log(err);
            }

            nextTest();
        });
    },
    function (err) {

        callback(err);
    });
};


internals.collectDeps = function (experiment, key) {

    var set = [];

    if (experiment.parent) {
        set = set.concat(internals.collectDeps(experiment.parent, key));
    }

    set = set.concat(experiment[key] || [])
    return set;
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