// Load modules

var Chai = require('chai');
var Runner = require('./runner');
var Utils = require('./utils');


// Declare internals

var internals = {};


// Export Chai

Chai.config.includeStack = true;                                     // Show the stack where where the issue occurs


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


exports = module.exports = internals.Lab = function () {

    var self = this;

    this.current = { options: {} };
    this.titles = [];
    this.path = [];
    this.root = this.current;
    this.count = 0;

    setImmediate(function () {                      // Schedule automatic execution when used without the CLI

        Runner.execute([self.root]);
    });
};


internals.Lab.expect = Chai.expect;
internals.Lab.assert = Chai.assert;


internals.Lab.prototype.experiment = internals.Lab.prototype.describe = function (title /*, options, fn */) {

    var options = arguments.length === 3 ? arguments[1] : {};
    var fn = arguments.length === 3 ? arguments[2] : arguments[1];

    var child = {
        parent: this.current,
        options: Utils.mergeOptions(this.current.options, options)
    };

    this.current.experiments = this.current.experiments || [];
    this.current.experiments.push(child);
    this.current = child;

    this.titles.push(title);
    this.path = this.titles.concat();                      // Clone

    fn.call(null);

    this.titles.pop();
    this.path = this.titles.concat();                      // Clone

    this.current = child.parent;
};


internals.Lab.prototype.before = function (fn) {

    var before = {
        title: 'Before ' + this.titles.join(' '),
        fn: fn
    };
    
    this.current.befores = this.current.befores || [];
    this.current.befores.push(before);
};


internals.Lab.prototype.after = function (fn) {

    var after = {
        title: 'After ' + this.titles.join(' '),
        fn: fn
    };

    this.current.afters = this.current.afters || [];
    this.current.afters.push(after);
};


internals.Lab.prototype.beforeEach = function (fn) {

    var beforeEach = {
        title: 'Before each ' + this.titles.join(' '),
        fn: fn
    };

    this.current.beforeEaches = this.current.beforeEaches || [];
    this.current.beforeEaches.push(beforeEach);
};


internals.Lab.prototype.afterEach = function (fn) {

    var afterEach = {
        title: 'After each ' + this.titles.join(' '),
        fn: fn
    };

    this.current.afterEaches = this.current.afterEaches || [];
    this.current.afterEaches.push(afterEach);
};


internals.Lab.prototype.test = internals.Lab.prototype.it = function (title /*, options, fn */) {
    
    var options = arguments.length === 3 ? arguments[1] : {};
    var fn = arguments.length === 3 ? arguments[2] : arguments[1];

    var test = {
        path: this.path,
        title: this.titles.join(' ') + ' ' + title,
        relativeTitle: title,
        fn: fn,
        options: Utils.mergeOptions(this.current.options, options)
    };

    this.current.tests = this.current.tests || [];
    this.current.tests.push(test);
};
