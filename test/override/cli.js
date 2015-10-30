'use strict';

// Load modules

const _Lab = require('../../test_runner');
const Code = require('code');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script({ cli: { ids: [2] } });
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Test CLI Not Only', () => {

    it('should not run', (done) => {

        throw new Error();
    });

    it('should run', (done) => {

        done();
    });
});
