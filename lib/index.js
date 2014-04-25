// Load modules

var Chai = require('chai');


// Declare internals

var internals = {};


// Export Chai

Chai.config.includeStack = true;                                     // Show the stack where where the issue occurs
exports.expect = Chai.expect;
exports.assert = Chai.assert;


// Schedule automatic execution when used without the CLI

process.nextTick(function () {

    require('./execute').execute(true);
});


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

internals.current = { options: {} };
internals.titles = [];
internals.path = [];

exports.root = [internals.current];
exports.count = 0;


exports.experiment = exports.describe = function (title /*, options, fn */) {

    var options = arguments.length === 3 ? arguments[1] : {};
    var fn = arguments.length === 3 ? arguments[2] : arguments[1];

    var child = {
        parent: internals.current,
        options: internals.mergeOptions(internals.current.options, options)
    };

    internals.current.experiments = internals.current.experiments || [];
    internals.current.experiments.push(child);
    internals.current = child;

    internals.titles.push(title);
    internals.path = internals.titles.concat();                      // Clone

    fn.call(null);

    internals.titles.pop();
    internals.path = internals.titles.concat();                      // Clone

    internals.current = child.parent;
};


exports.before = function (fn) {

    var before = {
        title: 'Before ' + internals.titles.join(' '),
        fn: fn
    };
    
    internals.current.befores = internals.current.befores || [];
    internals.current.befores.push(before);
};


exports.after = function (fn) {

    var after = {
        title: 'After ' + internals.titles.join(' '),
        fn: fn
    };

    internals.current.afters = internals.current.afters || [];
    internals.current.afters.push(after);
};


exports.beforeEach = function (fn) {

    var beforeEach = {
        title: 'Before each ' + internals.titles.join(' '),
        fn: fn
    };

    internals.current.beforeEaches = internals.current.beforeEaches || [];
    internals.current.beforeEaches.push(beforeEach);
};


exports.afterEach = function (fn) {

    var afterEach = {
        title: 'After each ' + internals.titles.join(' '),
        fn: fn
    };

    internals.current.afterEaches = internals.current.afterEaches || [];
    internals.current.afterEaches.push(afterEach);
};


exports.test = exports.it = function (title /*, options, fn */) {
    
    var options = arguments.length === 3 ? arguments[1] : {};
    var fn = arguments.length === 3 ? arguments[2] : arguments[1];

    var test = {
        id: ++(exports.count),
        path: internals.path,
        title: internals.titles.join(' ') + ' ' + title,
        relativeTitle: title,
        fn: fn,
        options: internals.mergeOptions(internals.current.options, options)
    };

    internals.current.tests = internals.current.tests || [];
    internals.current.tests.push(test);
};


internals.mergeOptions = function (parent, child) {

    var options = {};
    Object.keys(parent || {}).forEach(function (key) {

        options[key] = parent[key];
    });

    Object.keys(child).forEach(function (key) {

        options[key] = child[key];
    });

    return options;
};
