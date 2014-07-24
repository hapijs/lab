// Load modules

var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();


lab.experiment('math', function () {

    lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(3);
        done();
    });
});
