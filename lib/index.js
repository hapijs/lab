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


exports.experiment = function (title, fn) {

    var prev = internals.current;

    internals.current = {};
    exports.experiments.push(internals.current);
    
    internals.titles.push(title);    
    fn();
    internals.titles.pop();
    internals.current = prev;
};


exports.before = function (fn) {

    internals.current.befores = internals.current.befores || [];
    internals.current.befores.push(fn);
};


exports.after = function (fn) {

    internals.current.afters = internals.current.afters || [];
    internals.current.afters.push(fn);
};


exports.test = function (title, fn) {

    var test = {
        title: internals.titles.join(' ') + ' ' + title,
        fn: fn
    };

    internals.current.tests = internals.current.tests || [];
    internals.current.tests.push(test);
};


exports.expect = Chai.expect;

