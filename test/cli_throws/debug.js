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


describe('Test CLI domain error debug', () => {

    after(() => {

    });

    it('throws badly', () => {

        setImmediate(() => {
            // See timing in runner's internals.protect():
            // we want to land error after this test completes but before the
            // whole test suite completes, in particular before after() completes.
            setImmediate(() => {

                throw new Error('throwing later');
            });
        });

        return Promise.resolve();
    });
});
