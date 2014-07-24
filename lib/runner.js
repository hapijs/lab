// Load modules

var Fs = require('fs');
var Domain = require('domain');
var Async = require('async');
var Reporters = require('./reporters');
var Coverage = require('./coverage');
var Leaks = require('./leaks');
var Output = require('./output');


// Declare internals

var internals = {};


Error.stackTraceLimit = Infinity;       // Set Error stack size


exports.defaults = {
    coverage: false,
    color: false,
    dry: false,
    environment: 'test',
    grep: null,
    id: null,
    globals: null,
    leaks: false,
    timeout: 2000,
    output: null,
    parallel: false,
    reporter: 'console',
    silence: false,
    threshold: 0,
    verbose: false
};


internals.executing = false;

exports.execute = function (experiments, options) {

    options = options || exports.defaults;

    if (internals.executing) {
        return;
    }

    internals.executing = true;

    // Setup environment

    if (options.environment) {
        process.env.NODE_ENV = options.environment;
    }

    // Generate reporter

    var reporter = new Reporters[options.reporter]({ threshold: options.threshold, level: options.silence ? 0 : (options.verbose ? 2 : 1) });
    var dest = options.output ? Fs.createWriteStream(options.output) : process.stdout;
    Output.decorate(reporter, { dest: dest, forceColor: options.colors });

    var report = {
        tests: [],
        failures: 0
    };

    // Execute experiments

    var idsFilter = options.id ? [].concat(options.id) : []
    var grep = options.grep ? new RegExp(options.grep) : null;
    var count = internals.count(experiments, { filters: { ids: idsFilter, grep: grep } });        // Sets test.id
    reporter.start({ count: count });

    var startTime = Date.now();
    var state = {
        report: report,
        reporter: reporter,
        filters: { 
            ids: idsFilter,
            grep: grep
        },
        options: options
    };

    internals.executeExperiments(experiments, state, options.dry, function (err) {

        // Finalize

        var notebook = {
            ms: Date.now() - startTime,
            tests: report.tests,
            leaks: !options.leaks ? Leaks.detect(options.globals ? options.globals.trim().split(',') : []) : undefined,
            coverage: options.coverage ? Coverage.analyze(report.tests) : undefined
        };

        var output = reporter.end(notebook) || '';
        dest.write(output, function () {

            var code = (options.coverage && options.threshold && (notebook.coverage.percent < options.threshold || isNaN(notebook.coverage.percent))) ||    // Missing coverage
                        report.failures ||                                                                                                                  // Tests failed
                        (notebook.leaks && notebook.leaks.length) ? 1 : 0;                                                                                  // Global leaked

            if (dest === process.stdout) {
                process.exit(code);
            }

            dest.end(function () {

                process.exit(code);
            });
        });
    });
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

        internals.protect(dep, null, next);
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
            (test.options.parallel === undefined && state.options.parallel)) {

            parallel.push(test);
        }
        else {
            serial.push(test);
        }
    }

    // Execute tests

    var execute = function (test, nextTest) {

        if ((state.filters.ids.length && state.filters.ids.indexOf(test.id) === -1) ||
            (state.filters.grep && !state.filters.grep.test(test.title))) {

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
                internals.protect(test, state.options, function (err) {

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


internals.protect = function (item, options, callback) {

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

    if (options &&
        (item.options.timeout || options.timeout)) {

        var ms = item.options.timeout || options.timeout;
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


internals.count = function (experiments, state) {

    state.count = state.count || 0;
    state.seq = state.seq || 0;

    if (experiments) {
        for (var e = 0, el = experiments.length; e < el; ++e) {
            var experiment = experiments[e];

            if (experiment.tests) {
                for (var i = 0, il = experiment.tests.length; i < il; ++i) {
                    var test = experiment.tests[i];
                    test.id = ++state.seq;
                    state.counter += (state.filters.ids.length && state.filters.ids.indexOf(test.id) === -1) || (state.filters.grep && !state.filters.grep.test(test.title)) ? 0 : 1;
                }
            }

           internals.count(experiment.experiments, state);
        }
    }

    return state.count;
};

