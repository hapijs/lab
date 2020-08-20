'use strict';

const Path = require('path');

const Code = require('@hapi/code');
const _Lab = require('../test_runner');
const Lab = require('..');
const SupportsColor = require('supports-color');


const internals = {
    cwd: process.cwd()
};


const { describe, it, afterEach } = exports.lab = _Lab.script();
const expect = Code.expect;


describe('Types', () => {

    afterEach(() => process.chdir(internals.cwd));

    it('errors on missing types property in package.json', async () => {

        process.chdir(Path.join(__dirname, 'types', 'missing_types'));
        const errors = await Lab.types.validate();
        expect(errors).to.equal([
            { filename: 'package.json', message: 'File missing "types" property' }
        ]);
    });

    it('errors on missing types definition file', async () => {

        process.chdir(Path.join(__dirname, 'types', 'missing_def'));
        const errors = await Lab.types.validate();
        expect(errors).to.equal([
            { filename: 'missing_file.d.ts', message: 'Cannot find types file' }
        ]);
    });

    it('errors on types definition file missing from package.json files', async () => {

        process.chdir(Path.join(__dirname, 'types', 'missing_in_files'));
        const errors = await Lab.types.validate();
        expect(errors).to.equal([
            { filename: 'package.json', message: 'Types file is not covered by "files" property' }
        ]);
    });

    it('errors on types definition file missing from package.json files', async () => {

        process.chdir(Path.join(__dirname, 'types', 'missing_tests'));
        const errors = await Lab.types.validate();
        expect(errors).to.equal([
            { filename: 'lib/index.d.ts', message: 'Cannot find tests for types file' }
        ]);
    });

    it('identifies errors', async () => {

        const stripDetails = function (info) {

            info.message = info.message.split('\n')[0];
            return info;
        };

        process.chdir(Path.join(__dirname, 'types', 'errors'));
        const errors = await Lab.types.validate();
        expect(errors.map(stripDetails)).to.only.contain([
            {
                filename: 'test/index.ts',
                message: 'No overload matches this call.',
                line: 3,
                column: 0
            },
            {
                filename: 'test/index.ts',
                message: 'No overload matches this call.',
                line: 4,
                column: 0
            },
            {
                filename: 'test/nested.ts',
                message: 'No overload matches this call.',
                line: 8,
                column: 0
            },
            {
                filename: 'test/nested.ts',
                message: 'No overload matches this call.',
                line: 8,
                column: 42
            },
            {
                filename: 'test/other.ts',
                message: 'No overload matches this call.',
                line: 3,
                column: 4
            },
            {
                filename: 'test/syntax.ts',
                message: `')' expected.`,
                line: 8,
                column: 26
            },
            {
                filename: 'test/syntax.ts',
                message: `',' expected.`,
                line: 9,
                column: 21
            },
            {
                filename: 'test/syntax.ts',
                line: 8,
                column: 0,
                message: 'Expected an error'
            },
            {
                filename: 'test/syntax.ts',
                line: 9,
                column: 0,
                message: 'Expected an error'
            },
            {
                filename: 'test/value.ts',
                line: 9,
                column: 0,
                message: 'Expected an error'
            },
            {
                filename: 'test/value.ts',
                line: 17,
                column: 8,
                message: 'Expected an error'
            }
        ]);
    });

    it('errors on missing lib', async () => {

        process.chdir(Path.join(__dirname, 'types', 'missing_lib'));
        const errors = await Lab.types.validate();
        expect(errors).to.equal([
            {
                column: 24,
                filename: 'lib/index.d.ts',
                line: 1,
                message: 'Cannot find name \'Document\'.'
            },
            {
                column: 12,
                filename: 'test/index.ts',
                line: 8,
                message: 'Cannot find name \'Document\'.'
            }
        ]);
    });

    it('load triple-slash-reference', async () => {

        process.chdir(Path.join(__dirname, 'types', 'triple_lib'));
        const errors = await Lab.types.validate();
        expect(errors).to.equal([]);
    });

    it('supports top level await', async () => {

        process.chdir(Path.join(__dirname, 'types', 'await'));
        const errors = await Lab.types.validate();
        expect(errors).to.equal([]);
    });

    describe('expect.error()', () => {

        it('validates error assertions', async () => {

            process.chdir(Path.join(__dirname, 'types', 'expect_error'));
            const errors = await Lab.types.validate();
            expect(errors).to.equal([
                {
                    column: 0,
                    filename: 'test/index.ts',
                    line: 9,
                    message: 'Expected an error'
                }
            ]);
        });
    });

    describe('expect.type()', () => {

        it('validates error assertions', async () => {

            process.chdir(Path.join(__dirname, 'types', 'expect_type'));
            const errors = await Lab.types.validate();
            expect(errors).to.equal([
                {
                    column: 20,
                    filename: 'test/index.ts',
                    line: 16,
                    message: 'Argument of type \'number\' is not assignable to parameter of type \'string\'.'
                }
            ]);
        });
    });

    describe('console reporter', () => {

        it('reports errors (no line)', async () => {

            process.chdir(Path.join(__dirname, 'types', 'missing_types'));
            const script = Lab.script();
            const { output, code } = await Lab.report(script, { output: false, types: true }, null);
            expect(code).to.equal(1);
            expect(output).to.contain('package.json: ');
        });

        it('reports errors (with line)', async () => {

            process.chdir(Path.join(__dirname, 'types', 'expect_error'));
            const script = Lab.script();
            const { output, code } = await Lab.report(script, { output: false, types: true, 'types-test': 'test/index.ts' }, null);
            expect(code).to.equal(1);
            expect(output).to.contain('test/index.ts:9:0: ');
        });

        it('reports no issues', async () => {

            process.chdir(Path.join(__dirname, 'types', 'valid'));
            const script = Lab.script();
            const { output, code } = await Lab.report(script, { output: false, types: true }, null);
            expect(code).to.equal(0);
            expect(output).to.contain('No issues');
        });

        it('reports no issues with skipped execution', async () => {

            process.chdir(Path.join(__dirname, 'types', 'skip'));
            const script = Lab.script();
            const { output, code } = await Lab.report(script, { output: false, types: true }, null);
            expect(code).to.equal(0);
            expect(output).to.contain('No issues');
        });

        it('reports execution errors', async () => {

            process.chdir(Path.join(__dirname, 'types', 'broken'));
            const script = Lab.script();
            const { output, code } = await Lab.report(script, { output: false, types: true }, null);
            expect(code).to.equal(1);
            expect(output).to.contain(internals.colors('index.ts:6:15: \u001b[0m\u001b[31mBad argument'));
        });
    });
});


internals.colors = function (string) {

    if (SupportsColor.stdout) {
        return string;
    }

    return string.replace(/\u001b\[\d+m/g, '');
};
