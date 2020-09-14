'use strict';

// Load modules

const Hoek = require('@hapi/hoek');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;


describe('Test CLI', () => {

    it('does not crash lab', async () => {

        await Hoek.wait(1);

        process.nextTick(() => {

            throw new Error('fail');
        });
    });

    it('has another test', async () => {});
});
