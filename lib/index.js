// Load modules

var Chai = require('chai');


// Declare internals

var internals = {};


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

exports.root = {}; // root wraps any top level elements
exports.experiments = [exports.root]; // preserve for backwards compatibility - deprecated
exports.index = {};

internals.id = 0;
internals.current = exports.root;
internals.titles = [];


Chai.config.includeStack = true;                                     // Show the stack where where the issue occurs


exports.experiment = exports.describe = function (title, fn) {

    var experiment = {
        parent: internals.current,
        path: internals.titles.join('/'),
        title: internals.titles.join(' ') + ' ' + title,
        relativeTitle: title
    };

    internals.current.experiments = internals.current.experiments || [];
    internals.current.experiments.push(experiment);
    exports.experiments.push(experiment);

    var prev = internals.current;
    internals.current = experiment;

    internals.titles.push(title);
    fn();
    internals.titles.pop();

    internals.current = prev;
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


exports.test = exports.it = function (title, fn) {

    var test = {
        parent: internals.current,
        id: ++internals.id,
        path: internals.titles.join('/'),
        title: internals.titles.join(' ') + ' ' + title,
        relativeTitle: title,
        fn: fn
    };

    internals.current.tests = internals.current.tests || [];
    internals.current.tests.push(test);

    exports.index[test.id] = test;
};


exports.expect = Chai.expect;


process.nextTick(function () {

    require('./execute').execute(true);             // For direct test execution with node, otherwise ignored
});
