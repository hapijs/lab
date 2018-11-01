'use strict';

// Load modules

const Hoek = require('hoek');
const Seedrandom = require('seedrandom');
const WillCall = require('will-call');
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
    assert: null,
    bail: false,
    coverage: false,

    // coveragePath: process.cwd(),
    // coverageExclude: ['node_modules', 'test'],
    colors: null,                                   // true, false, null (based on tty)
    dry: false,
    environment: 'test',

    // flat: false,
    grep: null,
    ids: [],
    globals: null,
    leaks: true,
    timeout: 2000,
    output: process.stdout,                         // Stream.Writable or string (filename)
    progress: 1,
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


exports.report = async (scripts, options) => {

    const settings = Utils.mergeOptions(internals.defaults, options);
    settings.environment = settings.environment.trim();
    const reporter = Reporters.generate(settings);

    const executeScripts = async function () {

        try {
            const result = await exports.execute(scripts, settings, reporter);

            if (settings.leaks) {
                result.leaks = Leaks.detect(settings.globals);
            }

            if (settings.coverage) {
                result.coverage = await Coverage.analyze(settings);
            }

            if (settings.shuffle) {
                result.seed = settings.seed;
                result.shuffle = true;
            }

            return Promise.resolve(result);
        }
        catch (ex) {
            // Can only be (and is) covererd via CLI tests
            /* $lab:coverage:off$ */
            const outputStream = [].concat(options.output).find((output) => !!output.write);
            if (outputStream) {
                outputStream.write(ex.toString() + '\n');
            }
            else {
                console.error(ex.toString());
            }

            return process.exit(1);
            /* $lab:coverage:on$ */
        }
    };

    const executeLint = async function () {

        return settings.lint ? await Linters.lint(settings) : Promise.resolve();
    };

    const results = await Promise.all([executeScripts(), executeLint()]);
    const notebook = results[0];
    notebook.lint = results[1];

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

    return reporter.finalize(notebook);
};


exports.execute = async function (scripts, options, reporter) {

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
    if (onlyNodes.length) {
        onlyNodes.forEach((onlyNode) => {

            internals.skipAllButOnly(scripts, onlyNode);
        });
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
        only: onlyNodes
    };

    await internals.executeExperiments(experiments, state, settings.dry);
    const notebook = {
        ms: Date.now() - startTime,
        tests: state.report.tests,
        failures: state.report.failures,
        errors: state.report.errors
    };

    return Promise.resolve(notebook);
};


internals.skipAllButOnly = (scripts, onlyNode) => {

    let currentExperiment = onlyNode.experiment;
    if (onlyNode.test) {
        currentExperiment.tests
            .filter(internals.not(onlyNode.test))
            .filter(internals.notOnly)
            .forEach(internals.enableSkip);

        currentExperiment.experiments
            .filter(internals.notOnly)
            .forEach(internals.enableSkip);
    }

    while (currentExperiment.parent) {
        currentExperiment.parent.tests
            .filter(internals.notOnly)
            .forEach(internals.enableSkip);

        currentExperiment.parent.experiments
            .filter(internals.not(currentExperiment))
            .filter(internals.notOnly)
            .filter((experiment) => {

                return experiment.tests.every(internals.notOnly);
            })
            .forEach(internals.enableSkip);

        currentExperiment = currentExperiment.parent;
    }

    scripts.forEach((script) => {

        if (!script._onlyNodes.length) {
            internals.enableSkip(script._root);
        }
    });
};

internals.not = (excludedElement) => {

    return (element) => element !== excludedElement;
};

internals.notOnly = (element) => {

    return !element.options.only;
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


internals.executeExperiments = async function (experiments, state, skip, parentContext) {

    for (const experiment of experiments) {
        const skipExperiment = skip || experiment.options.skip || !internals.experimentHasTests(experiment, state) || (state.options.bail && state.report.failures);

        state.currentContext = parentContext ? Hoek.clone(parentContext) : {};

        // Before

        if (!skipExperiment) {
            try {
                await internals.executeDeps(experiment.befores, state);
            }
            catch (ex) {
                internals.fail([experiment], state, skip, '\'before\' action failed');
                state.report.errors.push(ex);

                // skip the tests and afters since the before fails
                continue;
            }
        }

        // Tests

        await internals.executeTests(experiment, state, skipExperiment);

        // Sub-experiments

        await internals.executeExperiments(experiment.experiments, state, skipExperiment, state.currentContext);

        // After

        if (!skipExperiment) {
            try {
                await internals.executeDeps(experiment.afters, state);
            }
            catch (ex) {
                internals.fail([experiment], state, skip, '\'after\' action failed');
                state.report.errors.push(ex);
            }
        }
    }
};


internals.executeDeps = async function (deps, state) {

    if (!deps || !deps.length) {
        return Promise.resolve();
    }

    for (const dep of deps) {
        dep.options.timeout = Number.isSafeInteger(dep.options.timeout) ? dep.options.timeout : state.options['context-timeout'];
        await internals.protect(dep, state);
    }
};


internals.executeTests = async function (experiment, state, skip) {

    if (!experiment.tests.length) {
        return Promise.resolve();
    }

    // Collect beforeEach and afterEach from parents

    const befores = skip ? [] : internals.collectDeps(experiment, 'beforeEaches');
    const afters = skip ? [] : internals.collectDeps(experiment, 'afterEaches');

    // Execute tests

    const execute = async function (test) {

        const isNotFiltered = state.filters.ids.length && !state.filters.ids.includes(test.id);
        const isNotGrepped = state.filters.grep && !state.filters.grep.test(test.title);

        if (isNotFiltered || isNotGrepped) {
            return new Promise((resolve) => {

                setImmediate(resolve);
            });
        }

        const isSkipped = skip || test.options.skip || (state.options.bail && state.report.failures);

        if (!test.fn ||
            isSkipped) {

            test[test.fn ? 'skipped' : 'todo'] = true;
            test.duration = 0;
            state.report.tests.push(test);
            state.reporter.test(test);
            return new Promise((resolve) => {

                setImmediate(resolve);
            });
        }

        // Before each

        try {
            await internals.executeDeps(befores, state);
        }
        catch (ex) {
            internals.failTest(test, state, skip, ex);
            state.report.errors.push(ex);
            return Promise.resolve();
        }

        // Unit

        const start = Date.now();
        try {
            test.context = Hoek.clone(state.currentContext);
            await internals.protect(test, state);
        }
        catch (ex) {
            state.report.failures++;
            test.err = ex;
            test.timeout = ex.timeout;
        }

        test.duration = Date.now() - start;

        state.report.tests.push(test);
        state.reporter.test(test);

        // After each

        try {
            await internals.executeDeps(afters, state);
        }
        catch (ex) {
            state.report.failures++;
            state.report.errors.push(ex);
        }

        return Promise.resolve();
    };

    for (const test of experiment.tests) {
        await execute(test);
    }

    return Promise.resolve();
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


internals.createItemTimeout = (item, ms, finish) => {

    return setTimeout(() => {

        const error = new Error(`Timed out (${ms}ms) - ${item.title}`);
        error.timeout = true;
        finish(error, 'timeout');
    }, ms);
};


internals.protect = function (item, state) {

    let isFirst = true;
    let timeoutId;
    let countBefore = -1;
    let failedWithUnhandledRejection = false;
    let failedWithUncaughtException = false;

    if (state.options.assert && state.options.assert.count) {
        countBefore = state.options.assert.count();
    }

    return new Promise((resolve, reject) => {

        const flags = { notes: [], context: item.context || state.currentContext };
        flags.note = (note) => {

            flags.notes.push(note);
        };

        const willcall = new WillCall();
        flags.mustCall = willcall.expect.bind(willcall);

        const finish = async function (err, cause) {

            clearTimeout(timeoutId);
            timeoutId = null;

            item.notes = (item.notes || []).concat(flags.notes);

            process.removeListener('unhandledRejection', promiseRejectionHandler);
            process.removeListener('uncaughtException', processUncaughtExceptionHandler);

            if (cause && (err instanceof Error === false)) {
                const data = err;
                err = new Error(`Non Error object received or caught (${cause})`);
                err.data = data;
            }

            // covered by test/cli_error/failure.js
            /* $lab:coverage:off$ */
            if (failedWithUnhandledRejection || failedWithUncaughtException) {
                return reject(err);
            }
            /* $lab:coverage:off$ */

            if (state.options.assert && state.options.assert.count) {
                item.assertions = state.options.assert.count() - countBefore;
            }

            if (flags.onCleanup) {
                // covered by test/cli_oncleanup/throws.js
                /* $lab:coverage:off$ */
                const onCleanupError = (err) => {

                    return reject(err);
                };

                /* $lab:coverage:on$ */
                process.once('uncaughtException', onCleanupError);

                try {
                    await flags.onCleanup();
                }
                catch (ex) {
                    return reject(ex);
                }

                process.removeListener('uncaughtException', onCleanupError);
            }

            if (item.options.plan !== undefined) {
                if (item.options.plan !== item.assertions) {
                    const planMessage = (item.assertions === undefined)
                        ? `Expected ${item.options.plan} assertions, but no assertion library found`
                        : `Expected ${item.options.plan} assertions, but found ${item.assertions}`;
                    if (err && !/^Expected (at least )?\d+ assertions/.test(err.message)) {
                        err.message = planMessage + ': ' + err.message;
                    }
                    else {
                        err = new Error(planMessage);
                    }
                }
            }
            else if (item.path &&   // Only check the plan threshold for actual tests (ie. ignore befores and afters)
                state.options['default-plan-threshold'] &&
                (item.assertions === undefined ||
                item.assertions < state.options['default-plan-threshold'])) {
                const planMessage = (item.assertions === undefined)
                    ? `Expected at least ${state.options['default-plan-threshold']} assertions, but no assertion library found`
                    : `Expected at least ${state.options['default-plan-threshold']} assertions, but found ${item.assertions}`;
                if (err && !/^Expected (at least )?\d+ assertions/.test(err.message)) {
                    err.message = planMessage + ': ' + err.message;
                }
                else {
                    err = new Error(planMessage);
                }
            }

            if (!isFirst) {
                const message = `Thrown error received in test "${item.title}" (${cause})`;
                err = new Error(message);
            }

            isFirst = false;

            const callResults = willcall.check();
            if (callResults.length) {
                const callResult = callResults[0];
                err = new Error(`Expected ${callResult.name} to be executed ${callResult.expected}` +
                            `time(s) but was executed ${callResult.actual} time(s)`);
                err.stack = callResult.stack;
            }

            item.context = null;

            return err ? reject(err) : resolve();
        };

        const ms = item.options.timeout !== undefined ? item.options.timeout : state.options.timeout;

        // covered by test/cli_error/failure.js
        /* $lab:coverage:off$ */
        const promiseRejectionHandler = function (err) {

            if (flags.onUnhandledRejection) {
                flags.onUnhandledRejection(err);
                return;
            }

            failedWithUnhandledRejection = true;
            finish(err, 'unhandledRejection');
        };

        process.on('unhandledRejection', promiseRejectionHandler);

        const processUncaughtExceptionHandler = function (err) {

            if (flags.onUncaughtException) {
                try {
                    flags.onUncaughtException(err);
                    return;
                }
                catch (errInErrorhandling) {
                    err = errInErrorhandling;
                }
            }

            failedWithUncaughtException = true;
            finish(err, 'uncaughtException');
        };

        /* $lab:coverage:on$ */
        process.on('uncaughtException', processUncaughtExceptionHandler);

        setImmediate(async () => {

            if (ms) {
                timeoutId = internals.createItemTimeout(item, ms, finish);
            }

            try {
                await item.fn.call(null, flags);
                finish();
            }
            catch (ex) {
                return finish(ex, 'unit test');
            }
        });
    });
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

        internals.fail(experiment.experiments, state, skip || experiment.options.skip, err);
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
