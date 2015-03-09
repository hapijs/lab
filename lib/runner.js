// Load modules

var Domain = require('domain');
var Items = require('items');
var Reporters = require('./reporters');
var Coverage = require('./coverage');
var Linters = require('./lint');
var Leaks = require('./leaks');
var Utils = require('./utils');

// prevent libraries like Sinon from clobbering global time functions

var Date = global.Date;
var setTimeout = global.setTimeout;
var clearTimeout = global.clearTimeout;
var setImmediate = global.setImmediate;


// Declare internals

var internals = {};


Error.stackTraceLimit = Infinity;                   // Set Error stack size


internals.defaults = {
    // assert: { incomplete(), count() },
    coverage: false,
    // coveragePath: process.cwd(),
    // coverageExclude: ['node_modules', 'test'],
    colors: null,                                   // true, false, null (based on tty)
    dry: false,
    debug: false,
    environment: 'test',
    // flat: false,
    grep: null,
    ids: [],
    globals: null,
    leaks: true,
    timeout: 2000,
    output: false,                                  // Stream.Writable or string (filename)
    parallel: false,
    progress: 1,
    reporter: 'console',
    // schedule: true,
    threshold: 0
};


exports.report = function (scripts, options, callback) {

    var settings = Utils.mergeOptions(internals.defaults, options);
    var reporter = Reporters.generate(settings);

    var executeScripts = function (next) {

        exports.execute(scripts, settings, reporter, function (err, result) {

            if (settings.leaks) {
                result.leaks = Leaks.detect(settings.globals);
            }

            if (settings.coverage) {
                result.coverage = Coverage.analyze(settings);
            }

            return next(null, result);
        });
    };

    var executeLint = function (next) {

        if (!settings.lint) {
            return next();
        }

        Linters.lint(settings, next);
    };

    Items.parallel.execute({ notebook: executeScripts, lint: executeLint }, function (err, results) {

        var notebook = results.notebook;
        notebook.lint = results.lint;

        if (options.assert) {
            notebook.assertions = options.assert.count && options.assert.count();
            var incompletes = options.assert.incomplete && options.assert.incomplete();
            if (incompletes) {
                for (var i = 0, il = incompletes.length; i < il; ++i) {
                    var error = new Error('Incomplete assertion at ' + incompletes[i]);
                    error.stack = undefined;
                    notebook.errors.push(error);
                }
            }
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
        ids: settings.ids,
        grep: settings.grep ? new RegExp(settings.grep) : null
    };

    var count = internals.count(experiments, { filters: filters });        // Sets test.id
    reporter.start({ count: count });

    var startTime = Date.now();
    var state = {
        report: {
            tests: [],
            failures: 0,
            errors: []
        },
        reporter: reporter,
        filters: filters,
        options: settings
    };

    internals.executeExperiments(experiments, state, settings.dry, function () {

        var notebook = {
            ms: Date.now() - startTime,
            tests: state.report.tests,
            failures: state.report.failures,
            errors: state.report.errors
        };

        return callback(null, notebook);
    });
};


internals.executeExperiments = function (experiments, state, skip, callback) {

    Items.serial(experiments, function (experiment, nextExperiment) {

        // Create a new domains context for this level of experiments, keep the old ones to restore them when finishing
        var previousDomains = state.domains;
        state.domains = [];

        var skipExperiment = skip || experiment.options.skip;
        var steps = [
            function (next) {

                // Before

                if (skipExperiment) {
                    return next();
                }

                internals.executeDeps(experiment.befores, state, function (err) {

                    if (err) {
                        internals.fail([experiment], state, skip, '\'before\' action failed');
                    }

                    return next(err);
                });
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

                internals.executeDeps(experiment.afters, state, next);
            }
        ];

        Items.serial(steps, function (item, next) {

            item(next);
        },
        function (err, results) {

            // Restore the domains we had before
            state.domains = previousDomains;

            if (err) {
                state.report.errors.push(err);
            }

            nextExperiment();
        });
    },
    function (err) {

        callback();
    });
};


internals.executeDeps = function (deps, state, callback) {

    if (!deps) {
        return callback();
    }

    Items.serial(deps, function (dep, next) {

        dep.options.timeout = dep.options.timeout || state.options['context-timeout'];
        internals.protect(dep, state, next);
    }, callback);
};


internals.executeTests = function (experiment, state, skip, callback) {

    if (!experiment.tests.length) {
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

        var steps = [
            function (next) {

                // Before each

                internals.executeDeps(befores, state, function (err) {

                    if (err) {
                        internals.failTest(test, state, skip, '\'before each\' action failed');
                    }

                    return next(err);
                });
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
                internals.protect(test, state, function (err) {

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

                return internals.executeDeps(afters, state, next);
            }
        ];

        Items.serial(steps, function (item, next) {

            item(next);
        },
        function (err, results) {

            if (err) {
                state.report.errors.push(err);
            }

            return nextTest();
        });
    };

    Items.serial(serial, execute, function (err) {

        Items.parallel(parallel, execute, function () {

            return callback(err);
        });
    });
};


internals.collectDeps = function (experiment, key) {

    var set = [];

    if (experiment.parent) {
        set = set.concat(internals.collectDeps(experiment.parent, key));
    }

    set = set.concat(experiment[key] || []);
    return set;
};


internals.protect = function (item, state, callback) {

    var isFirst = true;

    var activeDomain = Domain.active;

    // We need to keep a reference to the list of domains at the time of the call since those will change with nested
    // experiments.
    var domains = state.domains;

    var finish = function (err, cause) {

        if (!isFirst) {
            var message = 'Multiple callbacks or thrown errors received in test "' + item.title + '" (' + cause + ')';

            if (err && !/^Multiple callbacks/.test(err.message)) {
                err.message = message + ': ' + err.message;
            }
            else {
                err = new Error(message);
            }

            state.report.errors.push(err);
            return;
        }

        isFirst = false;
        clearTimeout(timeoutId);

        var immed = setImmediate(function () {

            return callback(err);
        });

        /* $lab:coverage:off$ */
        if (activeDomain) {
            // The previously active domain need to be used here in case the callback throws.
            // This is of course only valid if lab itself is ran in a domain, which is the case for its own tests.
            activeDomain.add(immed);
        }
        /* $lab:coverage:on$ */
    };

    var ms = item.options.timeout !== undefined ? item.options.timeout : state.options.timeout;
    if (ms) {
        var timeoutId = setTimeout(function () {

            var error = new Error('Timed out (' + ms + 'ms) - ' + item.title);
            error.timeout = true;
            finish(error, 'timeout');
        }, ms);
    }

    var onError = function (err, isForward) {

        // 1. Do not forward what's already a forward.
        // 2. Only errors that reach before*/after* are worth forwarding, otherwise we know where they came from.
        if (!isForward && item.id === undefined) {
            internals.forwardError(err, domain, domains);
        }

        if (state.options.debug) {
            state.report.errors.push(err);
        }

        finish(err, 'error');
    };

    var domain = Domain.createDomain();
    domain.title = item.title;
    domain.on('error', onError);
    domains.push(domain);

    setImmediate(function () {

        domain.enter();
        item.fn.call(null, function (err) {

            finish(err, 'done');
        });
        domain.exit();
    });
};


internals.forwardError = function (err, sourceDomain, targetDomains) {

    for (var s = 0, sl = targetDomains.length; s < sl; ++s) {
        var d = targetDomains[s];
        if (d !== sourceDomain) {
            d.emit('error', err, true); // Add true to mark this as a forward.
        }
    }
};


internals.count = function (experiments, state) {

    state.count = state.count || 0;
    state.seq = state.seq || 0;

    for (var e = 0, el = experiments.length; e < el; ++e) {
        var experiment = experiments[e];

        for (var i = 0, il = experiment.tests.length; i < il; ++i) {
            var test = experiment.tests[i];
            test.id = ++state.seq;
            state.count += (state.filters.ids.length && state.filters.ids.indexOf(test.id) === -1) || (state.filters.grep && !state.filters.grep.test(test.title)) ? 0 : 1;
        }

        internals.count(experiment.experiments, state);
    }

    return state.count;
};


internals.fail = function (experiments, state, skip, err) {

    for (var e = 0, el = experiments.length; e < el; ++e) {
        var experiment = experiments[e];

        for (var i = 0, il = experiment.tests.length; i < il; ++i) {
            internals.failTest(experiment.tests[i], state, skip, err);
        }

        internals.fail(experiment.experiments, state, skip || experiment.options.skip);
    }
};


internals.failTest = function (test, state, skip, err) {

    if (!test.fn ||
        skip ||
        test.options.skip) {

        test[test.fn ? 'skipped' : 'todo'] = true;
    }
    else {
        state.report.failures++;
        test.err = err;
    }

    test.duration = 0;
    state.report.tests.push(test);
    state.reporter.test(test);
};
