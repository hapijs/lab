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


describe('Test CLI 2', function () {

    it('adds multiplies numbers together', function (done) {

        expect(5 * 5).to.equal(25);
        done();
    });

    it('divides two numbers', function (done) {

        expect(25 / 5).to.equal(5);
        done();
    });
});
