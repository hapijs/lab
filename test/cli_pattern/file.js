'use strict';

// Load modules

const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = _Lab.assertions.expect;


describe('Test CLI', () => {

    it('adds two numbers together', () => {

        expect(1 + 1).to.equal(2);
    });
});
