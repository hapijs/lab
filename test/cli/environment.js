// Load modules

var _Lab = require('../../test_runner');


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = _Lab.expect;

var env = process.env.NODE_ENV;

describe('Test CLI', function () {

    it('Node Environment defaults to test', function (done) {

        expect(env).to.equal('test');
        done();
    });
});
