// Load modules

var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = new Lab();
var suite = lab.experiment.bind(lab);
var test = lab.test.bind(lab);
var before = lab.before.bind(lab);
var after = lab.after.bind(lab);
var expect = Lab.expect;


suite('math', function () {

    test('returns true when 1 + 1 equals 2', function (done) {

        expect(1+1).to.equal(2);
        done();
    });
});
