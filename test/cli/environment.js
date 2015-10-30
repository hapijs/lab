'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../../test_runner');


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const env = process.env.NODE_ENV;

describe('Test CLI', () => {

    it('Node Environment defaults to test', (done) => {

        if (process.argv[3] && process.argv[3].indexOf('-e') >= 0) {
            expect(env).to.equal('lab');
        }
        else {
            expect(env).to.equal('test');
        }

        done();
    });
});
