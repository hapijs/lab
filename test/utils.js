'use strict';

const Code = require('@hapi/code');
const _Lab = require('../test_runner');
const Utils = require('../lib/utils');


const internals = {};


const lab = exports.lab = _Lab.script();
const { describe, it } = lab;
const { expect } = Code;


describe('Utils', () => {

    describe('position()', () => {

        it('ignores invalid stack', () => {

            expect(Utils.position({ stack: '' })).to.equal({});
        });
    });
});
