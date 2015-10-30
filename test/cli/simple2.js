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


describe('Test CLI 2', () => {

    it('adds multiplies numbers together', (done) => {

        expect(5 * 5).to.equal(25);
        done();
    });

    it('divides two numbers', (done) => {

        expect(25 / 5).to.equal(5);
        done();
    });
});
