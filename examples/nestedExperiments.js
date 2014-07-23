// Load modules

var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = new Lab();


lab.experiment('calculator', function () {

    lab.before(function (done) {

        console.log('before');
        done();
    });

    lab.beforeEach(function (done) {

        console.log('beforeEach');
        done();
    });

    lab.afterEach(function (done) {

        console.log('afterEach');
        done();
    });

    lab.test('returns true when zero', function (done) {

        console.log('test zero');
        Lab.expect(0).to.equal(0);
        done();
    });

    lab.experiment('addition', function () {

        lab.test('returns true when 1 + 1 equals 2', function (done) {

            console.log('test 1+1');
            Lab.expect(1+1).to.equal(2);
            done();
        });

        lab.test('returns true when 2 + 2 equals 4', function (done) {

            console.log('test 2+2');
            Lab.expect(2+2).to.equal(4);
            done();
        });
    });

    lab.experiment('subtract', function () {

        lab.test('returns true when 1 - 1 equals 0', function (done) {

            console.log('test 1-1');
            Lab.expect(1-1).to.equal(0);
            done();
        });

        lab.test('returns true when 2 - 1 equals 1', function (done) {

            console.log('test 2-1');
            Lab.expect(2-1).to.equal(1);
            done();
        });

    });
});
