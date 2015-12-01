'use strict';

// Load modules

const Domain = require('domain');
const Items = require('items');
const Reporters = require('./reporters');
const Coverage = require('./coverage');
const Linters = require('./lint');
const Leaks = require('./leaks');
const Utils = require('./utils');

// prevent libraries like Sinon from clobbering global time functions

const Date = global.Date;
const setTimeout = global.setTimeout;
const clearTimeout = global.clearTimeout;
const setImmediate = global.setImmediate;


// Declare internals

const internals = {};


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
    threshold: 0,
    'lint-errors-threshold': 0,
    'lint-warnings-threshold': 0
};


exports.report = function (scripts, options, callback) {

    const settings = Utils.mergeOptions(internals.defaults, options);
    const reporter = Reporters.generate(settings);

    const executeScripts = function (next) {

        exports.execute(scripts, settings, reporter, (ignoreErr, result) => {

            if (settings.leaks) {
                result.leaks = Leaks.detect(settings.globals);
            }

            if (settings.coverage) {
                result.coverage = Coverage.analyze(settings);
            }

            return next(null, result);
        });
    };

    const executeLint = function (next) {

        if (!settings.lint) {
            return next();
        }

        Linters.lint(settings, next);
    };

    Items.parallel.execute({ notebook: executeScripts, lint: executeLint }, (ignoreErr, results) => {

        const notebook = results.notebook;
        notebook.lint = results.lint;

        if (options.assert) {
            notebook.assertions = options.assert.count && options.assert.count();
            const incompletes = options.assert.incomplete && options.assert.incomplete();
            if (incompletes) {
                for (let i = 0; i < incompletes.length; ++i) {
                    const error = new Error('Incomplete assertion at ' + incompletes[i]);
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
    const experiments = scripts.map((script) => {

        script._executed = true;
        return script._root;
    });

    reporter = reporter || { test: function () { }, start: function () { } };
    const settings = Utils.mergeOptions(internals.defaults, options);

    if (settings.environment) {
        process.env.NODE_ENV = settings.environment;
    }

    const filters = {
        ids: settings.ids,
        grep: settings.grep ? new RegExp(settings.grep) : null
    };

    const count = internals.count(experiments, { filters: filters });        // Sets test.id
    reporter.start({ count: count });

    const startTime = Date.now();
    const state = {
        report: {
            tests: [],
            failures: 0,
            errors: []
        },
        reporter: reporter,
        filters: filters,
        options: settings
    };

    internals.executeExperiments(experiments, state, settings.dry, () => {

        const notebook = {
            ms: Date.now() - startTime,
            tests: state.report.tests,
            failures: state.report.failures,
            errors: state.report.errors
        };

        return callback(null, notebook);
    });
};


internals.executeExperiments = function (experiments, state, skip, callback) {

    Items.serial(experiments, (experiment, nextExperiment) => {

        // Create a new domains context for this level of experiments, keep the old ones to restore them when finishing
        const previousDomains = state.domains;
        state.domains = [];

        const skipExperiment = skip || experiment.options.skip;
        const steps = [
            function (next) {

                // Before

                if (skipExperiment) {
                    return next();
                }

                internals.executeDeps(experiment.befores, state, (err) => {

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

        Items.serial(steps, (item, next) => {

            item(next);
        },
        (err, results) => {

            // Restore the domains we had before
            state.domains = previousDomains;

            if (err) {
                state.report.errors.push(err);
            }

            nextExperiment();
        });
    },
    (err) => {

        callback(err);
    });
};


internals.executeDeps = function (deps, state, callback) {

    if (!deps) {
        return callback();
    }

    Items.serial(deps, (dep, next) => {

        dep.options.timeout = dep.options.timeout || state.options['context-timeout'];
        internals.protect(dep, state, next);
    }, callback);
};


internals.executeTests = function (experiment, state, skip, callback) {

    if (!experiment.tests.length) {
        return callback();
    }

    // Collect beforeEach and afterEach from parents

    const befores = skip ? [] : internals.collectDeps(experiment, 'beforeEaches');
    const afters = skip ? [] : internals.collectDeps(experiment, 'afterEaches');

    // Separate serial and parallel execution tests

    const serial = [];
    const parallel = [];

    experiment.tests.forEach((test) => {

        if (test.options.parallel ||
            (test.options.parallel === undefined && state.options.parallel)) {

            parallel.push(test);
        }
        else {
            serial.push(test);
        }
    });

    // Execute tests

    const execute = function (test, nextTest) {

        if ((state.filters.ids.length && state.filters.ids.indexOf(test.id) === -1) ||
            (state.filters.grep && !state.filters.grep.test(test.title))) {

            return nextTest();
        }

        const steps = [
            function (next) {

                // Before each

                internals.executeDeps(befores, state, (err) => {

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

                const start = Date.now();
                internals.protect(test, state, (err) => {

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

        Items.serial(steps, (item, next) => {

            item(next);
        },
        (err, results) => {

            if (err) {
                state.report.errors.push(err);
            }

            return nextTest();
        });
    };

    Items.serial(serial, execute, (err) => {

        Items.parallel(parallel, execute, () => {

            return callback(err);
        });
    });
};


internals.collectDeps = function (experiment, key) {

    const set = [];

    // if we are looking at afterEaches, we want to run our parent's blocks before ours (unshift onto front)
    const arrayAddFn = key === 'afterEaches' ? Array.prototype.unshift : Array.prototype.push;

    if (experiment.parent) {
        arrayAddFn.apply(set, internals.collectDeps(experiment.parent, key));
    }

    arrayAddFn.apply(set, experiment[key] || []);
    return set;
};


internals.protect = function (item, state, callback) {

    let isFirst = true;
    let timeoutId;

    const activeDomain = Domain.active;

    // We need to keep a reference to the list of domains at the time of the call since those will change with nested
    // experiments.
    const domains = state.domains;

    const finish = function (err, cause) {

        if (err &&
            err instanceof Error === false) {

            const data = err;
            err = new Error('Non Error object received or caught');
            err.data = data;
        }

        if (!isFirst) {
            const message = 'Multiple callbacks or thrown errors received in test "' + item.title + '" (' + cause + ')';

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

        const immed = setImmediate(() => {

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

    const ms = item.options.timeout !== undefined ? item.options.timeout : state.options.timeout;
    if (ms) {
        timeoutId = setTimeout(() => {

            const error = new Error('Timed out (' + ms + 'ms) - ' + item.title);
            error.timeout = true;
            finish(error, 'timeout');
        }, ms);
    }

    const domain = Domain.createDomain();

    const onError = function (err, isForward) {

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

    domain.title = item.title;
    domain.on('error', onError);
    domains.push(domain);

    setImmediate(() => {

        domain.enter();
        item.fn.call(null, (err) => {

            finish(err, 'done');
        });
        domain.exit();
    });
};


internals.forwardError = function (err, sourceDomain, targetDomains) {

    for (let i = 0; i < targetDomains.length; ++i) {
        const d = targetDomains[i];
        if (d !== sourceDomain) {
            d.emit('error', err, true); // Add true to mark this as a forward.
        }
    }
};


internals.count = function (experiments, state) {

    state.count = state.count || 0;
    state.seq = state.seq || 0;

    for (let i = 0; i < experiments.length; ++i) {
        const experiment = experiments[i];

        for (let j = 0; j < experiment.tests.length; ++j) {
            const test = experiment.tests[j];
            test.id = ++state.seq;
            state.count += (state.filters.ids.length && state.filters.ids.indexOf(test.id) === -1) || (state.filters.grep && !state.filters.grep.test(test.title)) ? 0 : 1;
        }

        internals.count(experiment.experiments, state);
    }

    return state.count;
};


internals.fail = function (experiments, state, skip, err) {

    for (let i = 0; i < experiments.length; ++i) {
        const experiment = experiments[i];

        for (let j = 0; j < experiment.tests.length; ++j) {
            internals.failTest(experiment.tests[j], state, skip, err);
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
