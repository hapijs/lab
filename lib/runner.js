'use strict';

// Load modules

// 'cluster' loaded below in internals.loadLazyObjects()
const Domain = require('domain');
const Items = require('items');
const Hoek = require('hoek');
const Seedrandom = require('seedrandom');
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
    bail: false,
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
    output: process.stdout,                         // Stream.Writable or string (filename)
    parallel: false,
    progress: 1,
    rejections: false,
    reporter: 'console',
    shuffle: false,
    seed: Math.floor(Math.random() * 1000),

    // schedule: true,
    threshold: 0,

    lint: false,
    'lint-fix': false,
    'lint-errors-threshold': 0,
    'lint-warnings-threshold': 0
};


exports.report = function (scripts, options, callback) {

    const settings = Utils.mergeOptions(internals.defaults, options);
    settings.environment = settings.environment.trim();
    const reporter = Reporters.generate(settings);

    const executeScripts = function (next) {

        exports.execute(scripts, settings, reporter, (err, result) => {
            // Can only be (and is) covererd via CLI tests
            /* $lab:coverage:off$ */
            if (err) {
                const outputStream = [].concat(options.output).find((output) => !!output.write);
                if (outputStream) {
                    outputStream.write(err.toString() + '\n');
                }
                else {
                    console.error(err.toString());
                }
                return process.exit(1);
            }
            /* $lab:coverage:on$ */

            if (settings.leaks) {
                result.leaks = Leaks.detect(settings.globals);
            }

            if (settings.coverage) {
                result.coverage = Coverage.analyze(settings);
            }

            if (settings.shuffle) {
                result.seed = settings.seed;
                result.shuffle = true;
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

        if (settings.assert) {
            notebook.assertions = settings.assert.count && settings.assert.count();
            const incompletes = settings.assert.incomplete && settings.assert.incomplete();
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

    const settings = Utils.mergeOptions(internals.defaults, options);

    scripts = [].concat(scripts);

    if (settings.shuffle) {
        internals.shuffle(scripts, settings.seed);
    }

    const experiments = scripts.map((script) => {

        script._executed = true;
        return script._root;
    });

    const onlyNodes = Hoek.flatten(scripts.map((script) => script._onlyNodes));
    if (onlyNodes.length > 1) {
        const paths = onlyNodes.map((onlyNode) => {

            if (onlyNode.test) {
                return `Test: ${onlyNode.test.title}`;
            }
            return `Experiment: ${onlyNode.path}`;
        });
        return callback(new Error('Multiple tests are marked as "only":\n\t' + paths.join('\n\t')));
    }

    const onlyNode = onlyNodes[0];
    if (onlyNode) {
        internals.skipAllButOnly(scripts, onlyNode);
    }

    reporter = reporter || { test: function () { }, start: function () { } };

    if (settings.environment) {
        process.env.NODE_ENV = settings.environment;
    }

    const filters = {
        ids: settings.ids,
        grep: settings.grep ? new RegExp(settings.grep) : null
    };

    const count = internals.count(experiments, { filters });        // Sets test.id
    reporter.start({ count });

    const startTime = Date.now();
    const state = {
        report: {
            tests: [],
            failures: 0,
            errors: []
        },
        reporter,
        filters,
        options: settings,
        only: onlyNode
    };

    // Instantiate common lazily loaded items that can leak domains.
    internals.loadLazyObjects();

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


internals.loadLazyObjects = () => {
    // Node core lazily loads many things. Once lab starts creating domains,
    // any lazily created event emitters will hold a reference to those domains
    // indefinitely.
    process.stdout;
    process.stderr;
    require('cluster'); // Used in both TCP and UDP sockets.
};


internals.skipAllButOnly = (scripts, onlyNode) => {

    let currentExperiment = onlyNode.experiment;
    if (onlyNode.test) {
        currentExperiment.tests
            .filter(internals.not(onlyNode.test))
            .forEach(internals.enableSkip);
        currentExperiment.experiments
            .forEach(internals.enableSkip);
    }

    while (currentExperiment.parent) {
        currentExperiment.parent.tests
            .forEach(internals.enableSkip);
        currentExperiment.parent.experiments
            .filter(internals.not(currentExperiment))
            .forEach(internals.enableSkip);
        currentExperiment = currentExperiment.parent;
    }

    scripts.forEach((script) => {

        if (script._onlyNodes.indexOf(onlyNode) === -1) {
            internals.enableSkip(script._root);
        }
    });
};

internals.not = (excludedElement) => {

    return (element) => element !== excludedElement;
};


internals.enableSkip = (element) => {

    element.options.skip = true;
};

internals.shuffle = function (scripts, seed) {

    const random = Seedrandom(seed);

    const last = scripts.length - 1;
    for (let i = 0; i < scripts.length; ++i) {
        const rand = i + Math.floor(random() * (last - i + 1));
        const temp = scripts[i];
        scripts[i] = scripts[rand];
        scripts[rand] = temp;
    }
};


internals.executeExperiments = function (experiments, state, skip, callback) {

    Items.serial(experiments, (experiment, nextExperiment) => {

        // Create a new domains context for this level of experiments, keep the old ones to restore them when finishing
        const previousDomains = state.domains;
        state.domains = [];

        const skipExperiment = skip || experiment.options.skip || !internals.experimentHasTests(experiment, state) || (state.options.bail && state.report.failures);
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

        dep.options.timeout = Hoek.isInteger(dep.options.timeout) ? dep.options.timeout : state.options['context-timeout'];
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

        // TODO: I would remove this and use the skip mechanism for it
        if ((state.filters.ids.length && state.filters.ids.indexOf(test.id) === -1) ||
            (state.filters.grep && !state.filters.grep.test(test.title))) {

            return nextTest();
        }

        const skipTest = skip || test.options.skip || (state.options.bail && state.report.failures);

        const steps = [
            function (next) {

                if (skipTest) {
                    return next();
                }

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
                    skipTest) {

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

                    setImmediate(next);
                });
            },
            function (next) {

                if (skipTest) {
                    return next();
                }

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


internals.experimentHasTests = function (experiment, state) {

    if (experiment.experiments.length) {
        const experimentsHasTests = experiment.experiments.some((childExperiment) => {

            return internals.experimentHasTests(childExperiment, state);
        });

        if (experimentsHasTests) {
            return true;
        }
    }

    const hasTests = experiment.tests.some((test) => {

        if ((state.filters.ids.length && state.filters.ids.indexOf(test.id) === -1) ||
            (state.filters.grep && !state.filters.grep.test(test.title))) {

            return false;
        }

        if (!test.options.skip && test.fn) {
            return true;
        }
    });

    return hasTests;
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


internals.cleanupItem = function (err, item, activeDomain, callback) {

    const immed = setImmediate(() => {

        if (!item.onCleanup) {
            /* $lab:coverage:off$ */
            // Don't hold on to objects in the active domain.
            if (activeDomain) {
                activeDomain.remove(immed);
            }
            /* $lab:coverage:on$ */

            return callback(err);
        }

        item.onCleanup(() => {

            /* $lab:coverage:off$ */
            // Don't hold on to objects in the active domain.
            if (activeDomain) {
                activeDomain.remove(immed);
            }
            /* $lab:coverage:on$ */

            callback(err);
        });
    });

    /* $lab:coverage:off$ */
    if (activeDomain) {
        // The previously active domain need to be used here in case the callback throws.
        // This is of course only valid if lab itself is ran in a domain, which is the case for its own tests.
        activeDomain.add(immed);
    }
    /* $lab:coverage:on$ */
};


internals.createItemTimeout = (item, ms, finish) => {

    return setTimeout(() => {

        const error = new Error('Timed out (' + ms + 'ms) - ' + item.title);
        error.timeout = true;
        finish(error, 'timeout');
    }, ms);
};


internals.createDomainErrorHandler = (item, state, domain, domains, finish) => {

    return (err, isForward) => {

        // 1. Do not forward what's already a forward.
        // 2. Only errors that reach before*/after* are worth forwarding, otherwise we know where they came from.

        if (!isForward &&
            item.id === undefined) {

            internals.forwardError(err, domain, domains);
        }

        if (state.options.debug) {
            state.report.errors.push(err);
        }

        finish(err, 'error');
    };
};


internals.protect = function (item, state, callback) {

    const finished = Hoek.once(callback);
    let isFirst = true;
    let timeoutId;
    let countBefore = -1;
    let failedWithUnhandledRejection = false;

    if (state.options.assert && state.options.assert.count) {
        countBefore = state.options.assert.count();
    }

    const activeDomain = Domain.active;

    // We need to keep a reference to the list of domains at the time of the call since those will change with nested
    // experiments.
    const domains = state.domains;

    let cleaningUp = false;

    const finish = function (err, cause) {

        clearTimeout(timeoutId);
        timeoutId = null;
        setImmediate(() => process.removeListener('unhandledRejection', promiseRejectionHandler));
        if (failedWithUnhandledRejection) {
            return;
        }

        if (state.options.assert && state.options.assert.count) {
            item.assertions = state.options.assert.count() - countBefore;
        }

        if (err && err instanceof Error === false) {
            const data = err;
            err = new Error('Non Error object received or caught');
            err.data = data;
        }

        if (item.options.plan !== undefined && item.options.plan !== item.assertions) {
            const planMessage = (item.assertions === undefined)
                ? `Expected ${item.options.plan} assertions, but no assertion library found`
                : `Expected ${item.options.plan} assertions, but found ${item.assertions}`;
            if (err && !/^Expected \d+ assertions/.test(err.message)) {
                err.message = planMessage + ': ' + err.message;
            }
            else {
                err = new Error(planMessage);
            }

            state.report.errors.push(err);
        }

        if (!isFirst) {
            const prefix = cleaningUp ? 'An error probably occured while cleaning up' : 'Multiple callbacks or thrown errors received in';
            const message = `${prefix} test "${item.title}" (${cause})`;

            if (err && !/^Multiple callbacks/.test(err.message)) {
                err.message = message + ': ' + err.message;
            }
            else {
                err = new Error(message);
            }

            state.report.errors.push(err);

            if (cleaningUp) {
                cleaningUp = false;
                finished(err);
            }

            return;
        }
        isFirst = false;
        internals.cleanupItem(err, item, activeDomain, (err) => {

            cleaningUp = false;
            finished(err);
        });
    };

    const ms = item.options.timeout !== undefined ? item.options.timeout : state.options.timeout;
    if (ms) {
        timeoutId = internals.createItemTimeout(item, ms, finish);
    }

    const domain = Domain.createDomain();
    const onError = internals.createDomainErrorHandler(item, state, domain, domains, finish);

    domain.title = item.title;
    domain.on('error', onError);
    domains.push(domain);

    const promiseRejectionHandler = function (reason) {

        finish(reason, 'unhandledRejection');
        failedWithUnhandledRejection = true;
    };

    if (state.options.rejections) {
        process.on('unhandledRejection', promiseRejectionHandler);
    }

    setImmediate(() => {

        const exitDomain = Hoek.once(() => domain.exit());
        domain.enter();

        item.onCleanup = null;
        const onCleanup = (func) => {

            item.onCleanup = (cb) => {

                cleaningUp = true;
                domain.run(func, cb);
            };
        };

        const done = (err) => {

            exitDomain();
            setImmediate(finish, err, 'done');
        };

        item.notes = [];
        done.note = (note) => {

            item.notes.push(note);
        };

        const itemResult = item.fn.call(null, done, onCleanup);

        if (itemResult &&
            itemResult.then instanceof Function) {

            itemResult.then(() => done(), done);
        }
        else if (!item.fn.length) {
            finish(new Error(`Function for "${item.title}" should either take a callback argument or return a promise`), 'function signature');
        }

        exitDomain();
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
