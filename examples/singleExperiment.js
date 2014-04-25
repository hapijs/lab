var Lab = require('../lib');

Lab.experiment('math', function () {

    Lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
