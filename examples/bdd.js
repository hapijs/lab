var Lab = require('../lib');

var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

describe('math', function () {

    it('returns true when 1 + 1 equals 2', function (done) {

        expect(1+1).to.equal(2);
        done();
    });
});
