// Load modules

var _Lab = require('../../test_runner');
var Code = require('code');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script({ cli: { ids: [2] } });
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Test CLI Not Only', function () {

    it('should not run', function (done) {

        throw new Error();
    });

    it('should run', function (done) {

        done();
    });
});
