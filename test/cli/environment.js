// Load modules

var Code = require('code');
var _Lab = require('../../test_runner');


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;

var env = process.env.NODE_ENV;

describe('Test CLI', function () {

    it('Node Environment defaults to test', function (done) {

        if (process.argv[3] && process.argv[3].indexOf('-e') >= 0) {
            expect(env).to.equal('lab');
        }
        else {
            expect(env).to.equal('test');
        }

        done();
    });
});
