'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Test CLI 3', () => {

    it('supports negative numbers', () => {

        expect(1 - 2).to.equal(-1);
    });

    it('supports infinity', () => {

        expect(Infinity + 1).to.equal(Infinity);
    });
});
