'use strict';

// Load modules

const _Lab = require('../../../test_runner');
const Include = require('../include/include');

// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = _Lab.assertions.expect;


describe('Test CLI', () => {

    it('returns the specified value', (done) => {

        const result = Include.method('test');
        expect(result).to.equal('test');
        done();
    });
});
