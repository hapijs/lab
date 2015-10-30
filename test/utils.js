'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../test_runner');
const Utils = require('../lib/utils');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Utils', () => {

    it('merges options', (done) => {

        const parent = {
            a: 1,
            b: 2
        };

        const child = {
            b: 3,
            c: 4
        };

        const merged = Utils.mergeOptions(parent, child);
        expect(merged).to.deep.equal({ a: 1, b: 3, c: 4 });
        done();
    });

    it('merges options (no child)', (done) => {

        const parent = {
            a: 1,
            b: 2
        };

        const merged = Utils.mergeOptions(parent, null);
        expect(merged).to.deep.equal({ a: 1, b: 2 });
        done();
    });

    it('merges options (no parent)', (done) => {

        const child = {
            b: 3,
            c: 4
        };

        const merged = Utils.mergeOptions(null, child);
        expect(merged).to.deep.equal({ b: 3, c: 4 });
        done();
    });

    it('ignores parent options', (done) => {

        const parent = {
            a: 1,
            b: 2,
            e: 5,
            f: 6
        };

        const child = {
            b: 3,
            c: 4
        };

        const merged = Utils.mergeOptions(parent, child, ['e', 'f']);
        expect(merged).to.deep.equal({ a: 1, b: 3, c: 4 });
        done();
    });

    it('copy child keys onto parent', (done) => {

        const parent = {
            a: 1,
            b: 2,
            e: 5,
            f: 6
        };

        const child = {
            b: 3,
            c: 4
        };

        Utils.applyOptions(parent, child);
        expect(parent).to.deep.equal({ a: 1, b: 3, c: 4, e: 5, f: 6 });
        done();
    });
});
