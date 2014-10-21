// Load modules

var Code = require('code');
var _Lab = require('../../../test_runner');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Test CLI 3', function () {

    it('supports negative numbers', function (done) {

        expect(1 - 2).to.equal(-1);
        done();
    });

    it('supports infinity', function (done) {

        expect(Infinity + 1).to.equal(Infinity);
        done();
    });
});
