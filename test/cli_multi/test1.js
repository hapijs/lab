'use strict';

// Load modules

const Code = require('@hapi/code');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const before = lab.before;
const after = lab.after;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('test1', () => {

    before(() => {

        return new Promise((resolve) => {

            process.nextTick(resolve);
        });
    });

    it('should add numbers', () => {

        return new Promise((resolve) => {

            process.nextTick(() => {

                expect(1 + 1).to.equal(2);
                resolve();
            });
        });
    });

    after(() => {

        return new Promise((resolve) => {

            process.nextTick(resolve);
        });
    });
});
