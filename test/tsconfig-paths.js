'use strict';

const Fs = require('fs');
const Path = require('path');

const Code = require('@hapi/code');
const _Lab = require('../test_runner');
const RunCli = require('./run_cli');
const Typescript = require('../lib/modules/typescript');


const internals = {
    cwd: process.cwd()
};


const { describe, it, afterEach } = exports.lab = _Lab.script();
const expect = Code.expect;

const cwd = Path.join(__dirname, 'cli_tsconfig_paths');

const commands = (file, ...extra) => [file, '-m', '2000', '--typescript', '--dep', 'tsconfig-paths/register', ...extra];

describe('TypeScript Paths', () => {

    afterEach(() => process.chdir(internals.cwd));

    it('supports TypeScript', async () => {

        process.chdir(cwd);

        const result = await RunCli(commands('simple.ts'), cwd);
        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2 tests complete');
    });

    it('handles errors', async () => {

        process.chdir(cwd);
        const result = await RunCli(commands('error.ts'), cwd);
        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('error.ts:10:26');
    });

    it('supports coverage', async () => {

        process.chdir(cwd);
        const result = await RunCli(commands('simple.ts', '-t', '100'), cwd);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2 tests complete');
        expect(result.output).to.contain('Coverage: 100.00%');
    });

    describe('transform', () => {

        it('generates embedded sourcemap with sourcesContent', () => {

            const smre = /\/\/\#\s*sourceMappingURL=data:application\/json[^,]+base64,(.*)\r?\n?$/;
            const path = Path.join(__dirname, 'cli_tsconfig_paths', 'simple.ts');
            const transformed = Typescript.extensions[0].transform(Fs.readFileSync(path, { encoding: 'utf8' }), path);
            const matches = smre.exec(transformed);
            expect(matches).to.exist();
            const sourcemap = JSON.parse(Buffer.from(matches[1], 'base64').toString());
            expect(sourcemap.sources).to.equal(['simple.ts']);
            expect(sourcemap.sourcesContent).to.exist();
            expect(sourcemap.sourcesContent).to.have.length(1);
        });
    });
});
