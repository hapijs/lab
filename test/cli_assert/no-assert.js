'use strict';

// Load modules

const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;


describe('Test CLI', () => {

    it('assertions property doesn\'t exist', (done) => {

        _Lab.expect(_Lab.assertions).to.not.exist();
        done();
    });
});
