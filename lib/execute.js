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
var Output = require('./output');
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

        .alias('C', 'color')
        .default('C', false)
        .describe('C', 'force color output')
        .boolean('C')

        .alias('d', 'dry')
        .default('d', false)
        .describe('d', 'skip all tests (dry run)')
        .boolean('d')

        .alias('e', 'environment')
        .default('e', 'test')
        .describe('e', 'value to set NODE_ENV before tests')

        .alias('l', 'leaks')
        .default('l', false)
        .describe('l', 'disable global variable leaks detection')
        .boolean('l')

        .alias('g', 'grep')
        .describe('g', 'only run tests matching the given pattern which is internally compiled to a RegExp')

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

        .alias('p', 'parallel')
        .default('p', false)
        .describe('p', 'parallel test execution within each experiment')
        .boolean('p')

        .alias('r', 'reporter')
        .default('r', 'console')
        .describe('r', 'reporter module [console, html, json, tap]')

        .alias('s', 'silence')
        .default('s', false)
        .describe('s', 'silence test output')
        .boolean('s')

        .alias('t', 'threshold')
        .describe('t', 'code coverage threshold in percentage')

        .alias('v', 'verbose')
        .default('v', false)
        .describe('v', 'verbose test output')
        .boolean('v')

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
    internals.parallel = argv.p;

    // Load tests

    if (!skipTraverse) {
        var paths = argv._;
        if (!paths.length) {
            paths.push('test');        // Default to './test'
        }

        internals.traverse(paths);
    }

    // Generate reporter

    var reporter = new Reporters[argv.r]({ threshold: argv.t, level: argv.s ? 0 : (argv.v ? 2 : 1) });

    var dest = argv.o ? Fs.createWriteStream(argv.o) : process.stdout;
    Output.decorate(reporter, { dest: dest, forceColor: argv.C });

    var report = {
        tests: [],
        failures: 0
    };

    // Execute experiments

    var idsFilter = argv.i ? [].concat(argv.i) : []
    var grep = argv.g ? new RegExp(argv.g) : null;
    reporter.start({ count: internals.count(Lab.root, idsFilter, grep) });

    var startTime = Date.now();
    var state = {
        report: report,
        reporter: reporter,
        ids: idsFilter,
        grep: grep
    };

    internals.executeExperiments(Lab.root, state, argv.d, function (err) {

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
        dest.write(output, function () {

            var code = (testCoverage && argv.t && (notebook.coverage.percent < argv.t || isNaN(notebook.coverage.percent))) ||      // Missing coverage
                        report.failures ||                                                                                          // Tests failed
                        (notebook.leaks && notebook.leaks.length) ? 1 : 0;                                                          // Global leaked

            if (dest === process.stdout) {
                process.exit(code);
            }

            dest.end(function () {

                process.exit(code);
            });
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


internals.executeExperiments = function (experiments, state, skip, callback) {

    Async.forEachSeries(experiments || [], function (experiment, nextExperiment) {

        var skipExperiment = skip || experiment.options.skip;

        Async.series([
            function (next) {

                // Before

                if (skipExperiment) {
                    return next();
                }

                internals.executeDeps(experiment.befores, next);
            },
            function (next) {

                // Tests

                internals.executeTests(experiment, state, skipExperiment, next);
            },
            function (next) {

                // Sub-experiments

                internals.executeExperiments(experiment.experiments, state, skipExperiment, next);
            },
            function (next) {

                // After

                if (skipExperiment) {
                    return next();
                }

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
            internals.output(err);
        }

        callback();
    });
};


internals.executeTests = function (experiment, state, skip, callback) {

    if (!experiment.tests) {
        return callback();
    }

    // Collect beforeEach and afterEach from parents

    var befores = skip ? [] : internals.collectDeps(experiment, 'beforeEaches');
    var afters = skip ? [] : internals.collectDeps(experiment, 'afterEaches');

    // Separate serial and parallel execution tests

    var serial = [];
    var parallel = [];

    for (var i = 0, il = experiment.tests.length; i < il; ++i) {
        var test = experiment.tests[i];
        if (test.options.parallel ||
            (test.options.parallel === undefined && internals.parallel)) {

            parallel.push(test);
        }
        else {
            serial.push(test);
        }
    }

    // Execute tests

    var execute = function (test, nextTest) {

        if ((state.ids.length && state.ids.indexOf(test.id) === -1) ||
            (state.grep && !state.grep.test(test.title))) {

            return nextTest();
        }

        Async.series([
            function (next) {

                // Before each

                return internals.executeDeps(befores, next);
            },
            function (next) {

                // Unit

                if (!test.fn ||
                    skip ||
                    test.options.skip) {

                    test[test.fn ? 'skipped' : 'todo'] = true;
                    test.duration = 0;
                    state.report.tests.push(test);
                    state.reporter.test(test);
                    return setImmediate(next);
                }

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

                return internals.executeDeps(afters, next);
            }
        ], function (err, results) {

            if (err) {
                internals.output(err);
            }

            return nextTest();
        });
    };

    Async.forEachSeries(serial, execute,
    function (err) {

        Async.forEach(parallel, execute, function () {

            return callback(err);
        });
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
            internals.output(new Error('Callback called twice in test: ' + item.title));
            return;
        }

        causes[cause] = true;

        if (first) {
            return callback(err);
        }
    };

    if (isTimed) {
        var ms = item.options.timeout || internals.timeout;
        timeoutId = setTimeout(function () {

            var error = new Error('Timed out (' + ms + 'ms)');
            error.timeout = true;
            finish(error, 'timeout');
        }, ms);
    }

    scopeDomain.once('error', function (err) {

        finish(err, 'error');
    });

    baseDomain.enter();
    scopeDomain.enter();

    setImmediate(function () {

        item.fn.call(null, function (err) {

            finish(err, err ? 'error' : 'done');
        });
    });
};


internals.output = function (err) {

    process.stderr.write(err.message + '\n' + err.stack + '\n');
};


internals.count = function (experiments, ids, grep) {

    var counter = 0;

    if (experiments) {
        for (var e = 0, el = experiments.length; e < el; ++e) {
            var experiment = experiments[e];

            if (experiment.tests) {
                for (var i = 0, il = experiment.tests.length; i < il; ++i) {
                    var test = experiment.tests[i];
                    counter += (ids.length && ids.indexOf(test.id) === -1) || (grep && !grep.test(test.title)) ? 0 : 1;
                }
            }

            counter += internals.count(experiment.experiments, ids, grep);
        }
    }

    return counter;
};

