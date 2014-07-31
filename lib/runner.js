// Load modules

var Domain = require('domain');
var Async = require('async');
var Reporters = require('./reporters');
var Coverage = require('./coverage');
var Leaks = require('./leaks');
var Utils = require('./utils');


// Declare internals

var internals = {};


Error.stackTraceLimit = Infinity;       // Set Error stack size


internals.defaults = {
    coverage: false,
    coverageVar: null,
    colors: null,                       // true, false, null (based on tty)
    dry: false,
    environment: 'test',
    // flat: false,
    grep: null,
    id: null,
    globals: null,
    leaks: true,
    timeout: 2000,
    output: false,                      // Stream.Writable or string (filename)
    parallel: false,
    progress: 1,
    reporter: 'console',
    // schedule: true,
    threshold: 0
};


exports.report = function (scripts, options, callback) {

    var settings = Utils.mergeOptions(internals.defaults, options);

    var reporter = Reporters.generate(settings);
    exports.execute(scripts, settings, reporter, function (err, notebook) {

        if (settings.leaks) {
            notebook.leaks = Leaks.detect(settings.globals);
        }

        if (settings.coverage) {
            notebook.coverage = Coverage.analyze({ coverageVar: settings.coverageVar });
        }

        return reporter.finalize(notebook, callback);
    });
};


exports.execute = function (scripts, options, reporter, callback) {

    scripts = [].concat(scripts);
    var experiments = scripts.map(function (script) {

        script._executed = true;
        return script._root;
    });

    reporter = reporter || { test: function () { }, start: function () { } };
    var settings = Utils.mergeOptions(internals.defaults, options);

    if (settings.environment) {
        process.env.NODE_ENV = settings.environment;
    }

    var filters = {
        ids: settings.id ? [].concat(settings.id) : [],
        grep: settings.grep ? new RegExp(settings.grep) : null
    };

    var count = internals.count(experiments, { filters: filters });        // Sets test.id
    reporter.start({ count: count });

    var startTime = Date.now();
    var state = {
        report: {
            tests: [],
            failures: 0
        },
        reporter: reporter,
        filters: filters,
        options: settings
    };

    internals.executeExperiments(experiments, state, settings.dry, function (err) {

        var notebook = {
            ms: Date.now() - startTime,
            tests: state.report.tests,
            failures: state.report.failures
        };

        return callback(null, notebook);
    });
};


internals.executeExperiments = function (experiments, state, skip, callback) {

    if (!experiments) {
        return callback();
    }

    Async.forEachSeries(experiments, function (experiment, nextExperiment) {

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

    if (!deps) {
        return callback();
    }

    Async.forEachSeries(deps, function (dep, next) {

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

    var domain = Domain.createDomain();

    var causes = null;
    var finish = function (err, cause) {

        var first = false;

        if (!causes) {
            causes = {};
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

    var onError = function (err) {

        finish(err, 'error');
    };

    domain.once('error', onError);

    setImmediate(function () {

        domain.run(function () {

            item.fn.call(null, function (err) {

                finish(err, err ? 'error' : 'done');
            });
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

