// Load modules

var _Lab = require('../../test_runner');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var after = lab.after;
var describe = lab.describe;
var it = lab.it;


describe('Test CLI domain error debug', function () {

    after(function (done) {

        done();
    });

    it('throws badly', function (done) {

        setTimeout(function () {

            throw new Error('throwing later');
        }, 0);

        done();
    });
});

