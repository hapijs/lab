// Load modules

var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = new Lab();


lab.experiment('math', function () {

    lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });

    lab.after(function (done) {

        // Run once after any tests
        done();
    });

    lab.afterEach(function (done) {

        // Run after every single test
        done();
    });
});
