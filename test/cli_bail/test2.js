'use strict';

// Load modules

const Code = require('code');
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


describe('test2', () => {

    before((done) => {

        process.nextTick(done);
    });

    it('should multiply numbers', (done) => {

        process.nextTick(() => {

            expect(1 * 1).to.equal(2);
            done();
        });
    });

    after((done) => {

        process.nextTick(done);
    });
});
