// Load modules

var Chai = require('chai');
var Coverage = require('./coverage');
var Leaks = require('./leaks');
var Runner = require('./runner');
var Utils = require('./utils');


// Declare internals

var internals = {};


// Exports

Chai.config.includeStack = true;                                     // Show the stack where where the issue occurs

exports.expect = Chai.expect;
exports.assert = Chai.assert;

exports.report = Runner.report;
exports.execute = Runner.execute;
exports.coverage = Coverage;
exports.leaks = Leaks;


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

    var script = {
        _current: {
            options: {}
        },
        _titles: [],
        _path: [],
        _count: 0,
        _executed: false
    };

    script._root = script._current;
    
    script.experiment = internals.experiment.bind(script);
    script.describe = script.experiment;
    script.suite = script.experiment;

    script.test = internals.test.bind(script);
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

    var child = {
        title: title,
        parent: this._current,
        options: Utils.mergeOptions(this._current.options, options)
    };

    this._current.experiments = this._current.experiments || [];
    this._current.experiments.push(child);
    this._current = child;

    this._titles.push(title);
    this._path = this._titles.concat();                      // Clone

    fn.call(null);

    this._titles.pop();
    this._path = this._titles.concat();                      // Clone

    this._current = child.parent;
};


internals.before = function (fn) {

    var before = {
        title: 'Before ' + this._titles.join(' '),
        fn: fn
    };
    
    this._current.befores = this._current.befores || [];
    this._current.befores.push(before);
};


internals.after = function (fn) {

    var after = {
        title: 'After ' + this._titles.join(' '),
        fn: fn
    };

    this._current.afters = this._current.afters || [];
    this._current.afters.push(after);
};


internals.beforeEach = function (fn) {

    var beforeEach = {
        title: 'Before each ' + this._titles.join(' '),
        fn: fn
    };

    this._current.beforeEaches = this._current.beforeEaches || [];
    this._current.beforeEaches.push(beforeEach);
};


internals.afterEach = function (fn) {

    var afterEach = {
        title: 'After each ' + this._titles.join(' '),
        fn: fn
    };

    this._current.afterEaches = this._current.afterEaches || [];
    this._current.afterEaches.push(afterEach);
};


internals.test = function (title /*, options, fn */) {
    
    var options = arguments.length === 3 ? arguments[1] : {};
    var fn = arguments.length === 3 ? arguments[2] : arguments[1];

    var test = {
        path: this._path,
        title: this._titles.join(' ') + ' ' + title,
        relativeTitle: title,
        fn: fn,
        options: Utils.mergeOptions(this._current.options, options)
    };

    this._current.tests = this._current.tests || [];
    this._current.tests.push(test);
};
