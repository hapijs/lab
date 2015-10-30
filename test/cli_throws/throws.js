'use strict';

// Load modules

const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const after = lab.after;
const describe = lab.describe;
const it = lab.it;


describe('Test CLI throws', () => {

    after((done) => {

        throw new Error('throwing after');
    });

    it('handles thrown error', (done) => {

        done();
    });
});

