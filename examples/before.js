var Lab = require('../lib');

Lab.experiment('math', function () {

    Lab.before(function (done) {

        // Run once before any tests
        done();
    });

    Lab.beforeEach(function (done) {

        // Run before every single test
        done();
    });

    Lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
