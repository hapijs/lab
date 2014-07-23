// Load modules

var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = new Lab();
var describe = lab.describe.bind(lab);
var it = lab.it.bind(lab);
var before = lab.before.bind(lab);
var after = lab.after.bind(lab);
var expect = Lab.expect;


describe('math', function () {

    it('returns true when 1 + 1 equals 2', function (done) {

        expect(1+1).to.equal(2);
        done();
    });
});
