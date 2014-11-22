// Load modules

var _Lab = require('../../test_runner');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var after = lab.after;
var describe = lab.describe;
var it = lab.it;


describe('Test CLI throws', function () {

    after(function (done) {

        throw new Error('throwing after');
    });

    it('handles thrown error', function (done) {

        done();
    });
});

