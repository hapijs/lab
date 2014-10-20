// Load modules

var Code = require('code');
var _Lab = require('../test_runner');
var Utils = require('../lib/utils');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Utils', function () {

    it('merges options', function (done) {

        var parent = {
            a: 1,
            b: 2
        };

        var child = {
            b: 3,
            c: 4
        };

        var merged = Utils.mergeOptions(parent, child);
        expect(merged).to.deep.equal({ a: 1, b: 3, c: 4 });
        done();
    });

    it('merges options (no child)', function (done) {

        var parent = {
            a: 1,
            b: 2
        };

        var merged = Utils.mergeOptions(parent, null);
        expect(merged).to.deep.equal({ a: 1, b: 2 });
        done();
    });

    it('merges options (no parent)', function (done) {

        var child = {
            b: 3,
            c: 4
        };

        var merged = Utils.mergeOptions(null, child);
        expect(merged).to.deep.equal({ b: 3, c: 4 });
        done();
    });

    it('ignores parent options', function (done) {

        var parent = {
            a: 1,
            b: 2,
            e: 5,
            f: 6
        };

        var child = {
            b: 3,
            c: 4
        };

        var merged = Utils.mergeOptions(parent, child, ['e', 'f']);
        expect(merged).to.deep.equal({ a: 1, b: 3, c: 4 });
        done();
    });

    it('copy child keys onto parent', function (done) {

        var parent = {
            a: 1,
            b: 2,
            e: 5,
            f: 6
        };

        var child = {
            b: 3,
            c: 4
        };

        Utils.applyOptions(parent, child);
        expect(parent).to.deep.equal({ a: 1, b: 3, c: 4, e: 5, f: 6 });
        done();
    });
});
