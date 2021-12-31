'use strict';

const Path = require('path');

const Code = require('@hapi/code');
const _Lab = require('../test_runner');
const RunCli = require('./run_cli');


const internals = {
    cwd: process.cwd()
};


const { describe, it, afterEach } = exports.lab = _Lab.script();
const expect = Code.expect;


describe('TypeScript', () => {

    afterEach(() => process.chdir(internals.cwd));

    it('supports TypeScript', async () => {

        process.chdir(Path.join(__dirname, 'cli_typescript'));
        const result = await RunCli(['simple.ts', '-m', '2000', '--typescript']);
        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2 tests complete');
    });

    it('handles errors', async () => {

        process.chdir(Path.join(__dirname, 'cli_typescript'));
        const result = await RunCli(['error.ts', '-m', '2000', '--typescript']);
        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('error.ts:10:26');
    });
});
