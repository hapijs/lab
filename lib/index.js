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


internals.current = {};
internals.titles = [];
exports.experiments = [internals.current];
Chai.Assertion.includeStack = true;                                     // Show the stack where where the issue occurs


exports.experiment = exports.describe = function (title, fn) {

    var prev = internals.current;

    internals.current = {};
    exports.experiments.push(internals.current);

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


exports.test = exports.it = function (title, fn) {

    var test = {
        path: internals.titles.join('/'),
        title: internals.titles.join(' ') + ' ' + title,
        relativeTitle: title,
        fn: fn
    };

    internals.current.tests = internals.current.tests || [];
    internals.current.tests.push(test);
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


exports.expect = Chai.expect;


process.nextTick(function () {

    require('./execute').execute(true);             // For direct test execution with node, otherwise ignored
});
