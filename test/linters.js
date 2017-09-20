'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const _Lab = require('../test_runner');
const Code = require('code');
const Linters = require('../lib/lint');


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Linters - eslint', () => {

    it('should lint files in a folder', async () => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        const result = await Linters.lint({ lintingPath: path, linter: 'eslint' });

        expect(result).to.include('lint');

        const eslintResults = result.lint;
        expect(eslintResults).to.have.length(1);

        const checkedFile = eslintResults[0];
        expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
        expect(checkedFile.errors).to.include([
            { line: 13, severity: 'ERROR', message: 'semi - Missing semicolon.' },
            { line: 14, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
        ]);
    });

    it('should default to eslint', async () => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        const result = await Linters.lint({ lintingPath: path });

        expect(result).to.include('lint');

        const eslintResults = result.lint;
        expect(eslintResults).to.have.length(1);

        const checkedFile = eslintResults[0];
        expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
        expect(checkedFile.errors).to.include([
            { line: 13, severity: 'ERROR', message: 'semi - Missing semicolon.' },
            { line: 14, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
        ]);
    });

    it('should use local configuration files', async () => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'with_config');
        const result = await Linters.lint({ lintingPath: path, linter: 'eslint' });

        expect(result).to.include('lint');

        const eslintResults = result.lint;
        expect(eslintResults).to.have.length(1);

        const checkedFile = eslintResults[0];
        expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
        expect(checkedFile.errors).to.include([
            { line: 14, severity: 'ERROR', message: 'eol-last - Newline required at end of file but not found.' }]);
        expect(checkedFile.errors).to.not.include({ line: 8, severity: 'ERROR', message: 'no-unused-vars - internals is defined but never used' });
    });

    it('displays success message if no issues found', async () => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'clean');
        const result = await Linters.lint({ lintingPath: path, linter: 'eslint' });

        expect(result.lint).to.exist();

        const eslintResults = result.lint;
        expect(eslintResults).to.have.length(1);

        const checkedFile = eslintResults[0];
        expect(checkedFile.errors.length).to.equal(0);
    });

    it('allows err to be shadowed', async () => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'shadow');
        const result = await Linters.lint({ lintingPath: path, linter: 'eslint' });

        expect(result.lint).to.exist();

        const eslintResults = result.lint;
        expect(eslintResults).to.have.length(1);

        const checkedFile = eslintResults[0];
        expect(checkedFile.errors.length).to.equal(0);
    });

    it('doesn\'t allow res to be shadowed', async () => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'shadow-res');
        const result = await Linters.lint({ lintingPath: path, linter: 'eslint' });

        expect(result.lint).to.exist();

        const eslintResults = result.lint;
        expect(eslintResults).to.have.length(1);

        const checkedFile = eslintResults[0];
        expect(checkedFile.errors.length).to.equal(1);
    });

    it('should pass options and not find any files', async () => {

        const lintOptions = JSON.stringify({ extensions: ['.jsx'] });
        const path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        const result = await Linters.lint({ lintingPath: path, linter: 'eslint', 'lint-options': lintOptions });

        expect(result).to.include('lint');

        const eslintResults = result.lint;
        expect(eslintResults).to.have.length(0);
    });

    it('should fix lint rules when --lint-fix used', async (flags) => {

        const originalWriteFileSync = Fs.writeFileSync;

        flags.onCleanup = () => {

            Fs.writeFileSync = originalWriteFileSync;
        };

        Fs.writeFileSync = (path, output) => {

            expect(path).to.endWith(Path.join('test', 'lint', 'eslint', 'fix', 'success.js'));
            expect(output).to.endWith('\n\n    return value;\n};\n');
        };

        const path = Path.join(__dirname, 'lint', 'eslint', 'fix');
        const result = await Linters.lint({ lintingPath: path, linter: 'eslint', 'lint-fix': true });

        expect(result).to.include('lint');

        const eslintResults = result.lint;
        expect(eslintResults).to.have.length(1);
        expect(eslintResults[0]).to.include({
            totalErrors: 0,
            totalWarnings: 0
        });
    });

    it('should error on malformed lint-options', async () => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'fix');

        try {
            await Linters.lint({ lintingPath: path, linter: 'eslint', 'lint-options': '}' });
        }
        catch (ex) {
            expect(ex.message).to.equal('lint-options could not be parsed');
        }
    });
});

describe('Linters - custom', () => {

    it('can run custom linter', async () => {

        const path = Path.join(__dirname, 'lint');
        const result = await Linters.lint({ lintingPath: path, linter: Path.join(__dirname, 'lint', 'custom') });

        expect(result).to.include('lint');

        const results = result.lint;
        expect(results).to.have.length(1);

        const checkedFile = results[0];
        expect(checkedFile.filename).to.equal('custom');
        expect(checkedFile.errors.length).to.equal(1);
    });
});
