var Lab = require('../lib');

var suite = Lab.experiment;
var test = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

suite('math', function () {

    test('returns true when 1 + 1 equals 2', function (done) {

        expect(1+1).to.equal(2);
        done();
    });
});
