// Load modules

var _Lab = require('../../test_runner');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = _Lab.assertions.expect;


describe('Test CLI', function () {

    it('adds two numbers together', function (done) {

        expect(1 + 1).to.equal(2);
        done();
    });
});
