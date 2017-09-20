'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Test Plan', () => {

    it('adds two numbers together', { plan: 1 }, () => {

        expect(1 + 1).to.equal(2);
    });

    it('subtracts two numbers', { plan: 2 }, () => {

        expect(2 - 2).to.equal(0);
        expect(4 - 4).to.equal(0);
    });

    it('multiplies numbers', { plan: 1 }, () => {

        expect(2 * 2).to.equal(4);
        expect(4 * 4).to.equal(16);
    });
});
