'use strict';

// Load modules

const Code = require('@hapi/code');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


process.stdout.isTTY = true;
process.env.FORCE_COLOR = 'true';

describe('Test CLI', () => {

    it('adds two numbers together', () => {

        expect(1 + 1).to.equal(2);
    });

    it('subtracts two numbers', () => {

        expect(2 - 2).to.equal(0);
    });
});
