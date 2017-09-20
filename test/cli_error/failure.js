'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Test CLI', () => {

    it('handles return rejection', () => {

        return Promise.reject(new Error('fail'));
    });

    it('handles return rejection in next tick', () => {

        return new Promise(() => {

            setImmediate(() => {

                Promise.reject(new Error('rejection'));
            });
        });
    });

    it('handles throw in next tick', () => {

        return new Promise(() => {

            setImmediate(() => {

                throw new Error('throw');
            });
        });
    });
});
