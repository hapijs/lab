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


describe('Ignore', function () {

    it('ignores this test', function (done) {

        expect(true).to.equal(false);
        done();
    });
});
