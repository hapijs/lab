// Load modules

var Code = require('code');
var _Lab = require('../../../test_runner');
var Test = require('../basic-transform');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;

describe('Test a transformed file', function () {

    it('that adds 2 to input', function (done) {

        expect(Test.method(1)).to.equal(3);
        done();
    });
});
