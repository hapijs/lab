// Load modules

var Code = require('code');
var _Lab = require('../../test_runner');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Test CLI Exports', function () {

    it('adds two numbers together', function (done) {

        expect(1 + 1).to.equal(2);
        done();
    });
});
