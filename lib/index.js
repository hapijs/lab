// Load modules

var Chai = require('chai');
var Experiment = require('./experiment');


// Declare internals

var internals = {};


/*
    experiment('Array', function (){

        experiment('#indexOf()', function () {

            test('should return -1 when not present', function (done) {

            });
 
            test('should return the index when present', function (done) {

            });
        });
    });
 */


exports.root = new Experiment('', {});              // Root experiment
internals.experiments = [exports.root];             // Singleton experiments collection, [0] is the active experiment


exports.before = function (fn) {

    internals.experiments[0].before(fn);
};


exports.after = function (fn) {

    internals.experiments[0].after(fn);
};


exports.experiment = exports.describe = function (title, fn) {

    // Create new experiment

    var experiment = new Experiment(title, internals.experiments[0].context);
    experiment.parent = internals.experiments[0];
    title = experiment.fullTitle();
    internals.experiments[0].experiment(experiment);

    // Add to collection

    internals.experiments.unshift(experiment);
    fn.call(experiment);
    internals.experiments.shift();
};


exports.test = exports.it = function (title, fn) {

    internals.experiments[0].test(title, fn);
};


exports.expect = Chai.expect;



