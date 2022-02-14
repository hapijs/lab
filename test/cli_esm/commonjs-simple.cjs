'use strict';

// Load modules

const Code = require('@hapi/code');
const _Lab = require('../../test_runner');

const Api = require('./commonjs-api.cjs');

// Declare internals

const internals = {};

// Test shortcuts

const { describe, it } = exports.lab = _Lab.script();
const expect = Code.expect;

describe('Test CLI', () => {

    it('adds two numbers together', () => {

        expect(Api.add(1, 1)).to.equal(2);
    });

    it('subtracts two numbers', () => {

        expect(Api.add(2, -2)).to.equal(0);
    });
});
