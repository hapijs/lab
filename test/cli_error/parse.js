'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../../test_runner');
const ParseInvalid = require('./parse_invalid');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

describe('Test CLI', () => {

    it('handles return rejection', () => {

        ParseInvalid();
    });
});
