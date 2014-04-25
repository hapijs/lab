var Lab = require('../lib');

Lab.experiment('calculator', function () {

    Lab.before(function (done) {

        console.log('before');
        done();
    });

    Lab.beforeEach(function (done) {

        console.log('beforeEach');
        done();
    });

    Lab.afterEach(function (done) {

        console.log('afterEach');
        done();
    });

    Lab.test('returns true when zero', function (done) {

        console.log('test zero');
        Lab.expect(0).to.equal(0);
        done();
    });

    Lab.experiment('addition', function () {

        Lab.test('returns true when 1 + 1 equals 2', function (done) {

            console.log('test 1+1');
            Lab.expect(1+1).to.equal(2);
            done();
        });

        Lab.test('returns true when 2 + 2 equals 4', function (done) {

            console.log('test 2+2');
            Lab.expect(2+2).to.equal(4);
            done();
        });
    });

    Lab.experiment('subtract', function () {

        Lab.test('returns true when 1 - 1 equals 0', function (done) {

            console.log('test 1-1');
            Lab.expect(1-1).to.equal(0);
            done();
        });

        Lab.test('returns true when 2 - 1 equals 1', function (done) {

            console.log('test 2-1');
            Lab.expect(2-1).to.equal(1);
            done();
        });

    });
});
