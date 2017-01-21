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


describe('Test CLI', () => {

    it('adds two numbers together', (done) => {

        expect(1 + 1).to.equal(2);
        done();
    });
});

// Used to finally kill process to stop inspector
setTimeout(() => {

    process.exit(0);
}, 1000);
