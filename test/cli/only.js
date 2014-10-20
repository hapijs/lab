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


describe('Test CLI Not Only', function () {

    it('should not run', function (done) {

        throw new Error();
    });
});


describe.only('Test CLI Only', function () {

    it('should run', function (done) {

        done();
    });
});
