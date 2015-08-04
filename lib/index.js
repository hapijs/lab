// Load modules

var Hoek = require('hoek');
var Coverage = require('./coverage');
var Leaks = require('./leaks');
var Runner = require('./runner');
var Utils = require('./utils');


// Declare internals

var internals = {};


// Exports

exports.report = Runner.report;
exports.execute = Runner.execute;
exports.coverage = Coverage;
exports.leaks = Leaks;
exports.assertions = null;                                              // Set by the -a command line option


/*
    experiment('Utilities', function (){

        experiment('#isEven()', function () {

            test('returns true on even values', function (done) {

            });

            test('returns false on odd values', function (done) {

            });
        });
    });
 */


exports.script = function (options) {

    options = options || {};

    global._labScriptRun = true;                                        // Compared by CLI to detect missing exports.lab

    var script = {
        _current: {
            experiments: [],
            tests: [],
            options: {},
            only: {
                experiment: false,
                test: false
            }
        },
        _titles: [],
        _path: [],
        _count: 0,
        _executed: false,
        _cli: options.cli
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

    if (options.schedule !== false) {                   // Defaults to true
        setImmediate(function () {

            if (!script._executed) {
                Runner.report(script, options);         // Schedule automatic execution when used without the CLI
            }
        });
    }

    return script;
};


internals.experiment = function (title /*, options, fn */) {

    var options = arguments.length === 3 ? arguments[1] : {};
    var fn = arguments.length === 3 ? arguments[2] : arguments[1];

    var settings = Utils.mergeOptions(this._current.options, options, ['only']);

    if (settings.only) {
        Hoek.assert(!this._current.only.experiment, 'Cannot set multiple experiments at the same level as only');

        this._current.only.experiment = true;
        for (var i = 0, il = this._current.experiments.length; i < il; ++i) {
            this._current.experiments[i].options.skip = true;
        }
    }
    else if (this._current.only.experiment) {
        settings.skip = true;
    }

    var child = {
        title: title,
        parent: this._current,
        experiments: [],
        tests: [],
        options: settings,
        only: {
            experiment: false,
            test: false
        }
    };

    this._current.experiments.push(child);
    this._current = child;

    this._titles.push(title);
    this._path = this._titles.concat();                      // Clone

    fn.call(null);

    this._titles.pop();
    this._path = this._titles.concat();                      // Clone

    this._current = child.parent;
};


internals.before = function (/* options, */ fn) {

    var options = arguments.length === 2 ? arguments[0] : {};
    fn = arguments.length === 2 ? arguments[1] : fn;

    Hoek.assert(fn && fn.length === 1, 'Function for before in "' + this._current.title + '" should take exactly one argument');

    var before = {
        title: 'Before ' + this._titles.join(' '),
        fn: fn,
        options: options
    };

    this._current.befores = this._current.befores || [];
    this._current.befores.push(before);
};


internals.after = function (/* options, */ fn) {

    var options = arguments.length === 2 ? arguments[0] : {};
    fn = arguments.length === 2 ? arguments[1] : fn;

    Hoek.assert(fn && fn.length === 1, 'Function for after in "' + this._current.title + '" should take exactly one argument');

    var after = {
        title: 'After ' + this._titles.join(' '),
        fn: fn,
        options: options
    };

    this._current.afters = this._current.afters || [];
    this._current.afters.push(after);
};


internals.beforeEach = function (/* options, */ fn) {

    var options = arguments.length === 2 ? arguments[0] : {};
    fn = arguments.length === 2 ? arguments[1] : fn;

    Hoek.assert(fn && fn.length === 1, 'Function for beforeEach in "' + this._current.title + '" should take exactly one argument');

    var beforeEach = {
        title: 'Before each ' + this._titles.join(' '),
        fn: fn,
        options: options
    };

    this._current.beforeEaches = this._current.beforeEaches || [];
    this._current.beforeEaches.push(beforeEach);
};


internals.afterEach = function (/* options, */ fn) {

    var options = arguments.length === 2 ? arguments[0] : {};
    fn = arguments.length === 2 ? arguments[1] : fn;

    Hoek.assert(fn && fn.length === 1, 'Function for afterEach in "' + this._current.title + '" should take exactly one argument');

    var afterEach = {
        title: 'After each ' + this._titles.join(' '),
        fn: fn,
        options: options
    };

    this._current.afterEaches = this._current.afterEaches || [];
    this._current.afterEaches.push(afterEach);
};


internals.test = function (title /*, options, fn */) {

    var options = arguments.length === 3 ? arguments[1] : {};
    var fn = arguments.length === 3 ? arguments[2] : arguments[1];

    if (fn) {
        Hoek.assert(fn.length === 1, 'Function for test "' + title + '" should take exactly one argument');
    }

    var settings = Utils.mergeOptions(this._current.options, options, ['only']);

    if (settings.only) {
        Hoek.assert(!this._current.only.test, 'Cannot set multiple tests at the same level as only');

        this._current.only.test = true;
        for (var i = 0, il = this._current.tests.length; i < il; ++i) {
            this._current.tests[i].options.skip = true;
        }
    }
    else if (this._current.only.test) {
        settings.skip = true;
    }

    var test = {
        path: this._path,
        title: this._titles.join(' ') + ' ' + title,
        relativeTitle: title,
        fn: fn,
        options: settings
    };

    this._current.tests.push(test);
};


internals.skip = function (script, type) {

    return function (title /*, options, fn */) {

        var options = arguments.length === 3 ? arguments[1] : {};
        var fn = arguments.length === 3 ? arguments[2] : arguments[1];

        script[type](title, Utils.mergeOptions({ skip: true }, options), fn);
    };
};


internals.only = function (script, type) {

    return function (title /*, options, fn */) {

        var options = arguments.length === 3 ? arguments[1] : {};
        var fn = arguments.length === 3 ? arguments[2] : arguments[1];

        script[type](title, Utils.mergeOptions({ only: true }, options), fn);
    };
};
