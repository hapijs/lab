'use strict';

const Hoek = require('@hapi/hoek');

const Modules = require('./modules');
const Runner = require('./runner');


const internals = {};


exports.report = Runner.report;

exports.execute = Runner.execute;

exports.assertions = null;                                              // Set by the -a command line option

// Inject modules (with lazy loading)

for (const module of ['coverage', 'leaks', 'types']) {
    Object.defineProperty(exports, module, Object.getOwnPropertyDescriptor(Modules, module));
}


/*
    experiment('Utilities', () => {

        experiment('isEven()', () => {

            test('returns true on even values', () => {

            });
        });
    });
*/


exports.script = function (options) {

    options = options || {};

    global._labScriptRun = true;                                        // Compared by CLI to detect missing exports.lab

    const script = {
        _current: {
            experiments: [],
            tests: [],
            options: {},
            title: 'script'
        },
        _titles: [],
        _path: [],
        _count: 0,
        _executed: false,
        _onlyNodes: [],
        _cli: options.cli,
        _setOnly: function (experiment, test, path) {

            this._onlyNodes.push({ experiment, test, path });
        }
    };

    script._root = script._current;

    script.experiment = internals.experiment.bind(script);
    script.experiment.skip = internals.skip(script, 'experiment');
    script.experiment.only = internals.only(script, 'experiment');
    script.describe = script.experiment;
    script.suite = script.experiment;

    script.test = internals.test.bind(script);
    script.test.skip = internals.skip(script, 'test');
    script.test.only = internals.only(script, 'test');
    script.it = script.test;

    script.before = internals.before.bind(script);
    script.beforeEach = internals.beforeEach.bind(script);
    script.after = internals.after.bind(script);
    script.afterEach = internals.afterEach.bind(script);

    if (exports.assertions) {
        script.expect = exports.assertions.expect;
        script.fail = exports.assertions.fail;
    }

    if (options.schedule !== false) {                   // Defaults to true
        setImmediate(() => {

            if (!script._executed) {
                Runner.report(script, options);         // Schedule automatic execution when used without the CLI
            }
        });
    }

    return script;
};


internals.experiment = function (title, options, fn) {

    if (typeof options === 'function') {
        fn = options;
        options = {};
    }

    const settings = internals.mergeOptions(this._current.options, options);

    const child = {
        title,
        parent: this._current,
        experiments: [],
        tests: [],
        options: settings
    };

    this._current.experiments.push(child);
    this._current = child;

    this._titles.push(title);
    this._path = this._titles.concat();                      // Clone

    if (settings.only) {
        this._setOnly(child, null, this._path);
    }

    // ensure the function we have been given is not a generator function
    if (fn.constructor.name === 'GeneratorFunction') {
        throw new Error(`Function for experiment '${title}' cannot be a generator.`);
    }

    const returnValue = fn.call(null); // eslint-disable-line no-useless-call
    // ensure that calls to experiment/describe are synchronous
    if (typeof Hoek.reach(returnValue, 'then') === 'function') {
        throw new Error(`Function for experiment '${title}' must be a synchronous function.`);
    }

    this._titles.pop();
    this._path = this._titles.concat();                      // Clone

    this._current = child.parent;
};


internals.before = function (options, fn) {

    if (typeof options === 'function') {
        fn = options;
        options = {};
    }

    Hoek.assert(fn, `before in "${this._current.title}" requires a function argument`);

    const before = {
        title: 'Before ' + this._titles.join(' '),
        fn,
        options
    };

    this._current.befores = this._current.befores || [];
    this._current.befores.push(before);
};


internals.after = function (options, fn) {

    if (typeof options === 'function') {
        fn = options;
        options = {};
    }

    Hoek.assert(fn, `after in "${this._current.title}" requires a function argument`);

    const after = {
        title: 'After ' + this._titles.join(' '),
        fn,
        options
    };

    this._current.afters = this._current.afters || [];
    this._current.afters.push(after);
};


internals.beforeEach = function (options, fn) {

    if (typeof options === 'function') {
        fn = options;
        options = {};
    }

    Hoek.assert(fn, `beforeEach in "${this._current.title}" requires a function argument`);

    const beforeEach = {
        title: 'Before each ' + this._titles.join(' '),
        fn,
        options
    };

    this._current.beforeEaches = this._current.beforeEaches || [];
    this._current.beforeEaches.push(beforeEach);
};


internals.afterEach = function (options, fn) {

    if (typeof options === 'function') {
        fn = options;
        options = {};
    }

    Hoek.assert(fn, `afterEach in "${this._current.title}" requires a function argument`);

    const afterEach = {
        title: 'After each ' + this._titles.join(' '),
        fn,
        options
    };

    this._current.afterEaches = this._current.afterEaches || [];
    this._current.afterEaches.push(afterEach);
};


internals.test = function (title, options, fn) {

    if (typeof options === 'function') {
        fn = options;
        options = {};
    }

    const settings = internals.mergeOptions(this._current.options, options);

    const test = {
        path: this._path,
        title: this._titles.concat(title).join(' '),
        relativeTitle: title,
        fn,
        options: settings
    };

    if (settings.only) {
        this._setOnly(this._current, test, this._path);
    }

    this._current.tests.push(test);
};


internals.skip = function (script, type) {

    return function (title, options, fn) {

        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        script[type](title, Object.assign({ skip: true }, options), fn);
    };
};


internals.only = function (script, type) {

    return function (title, options, fn) {

        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        script[type](title, Object.assign({ only: true }, options), fn);
    };
};


internals.mergeOptions = function (parent, child) {

    const options = Object.assign({}, parent, child);
    options.only = child && child.only;
    return options;
};
