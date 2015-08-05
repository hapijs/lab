// Load modules

var _Lab = require('../../../test_runner');
var Include = require('../include/include');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = _Lab.assertions.expect;


describe('Test CLI', function () {

    it('returns the specified value', function (done) {

        var result = Include.method('test');
        expect(result).to.equal('test');
        done();
    });
});
