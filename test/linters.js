'use strict';

// Load modules

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

    it('should lint files in a folder', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, (err, result) => {

            expect(result).to.include('lint');

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            const checkedFile = eslintResults[0];
            expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
            expect(checkedFile.errors).to.deep.include([
                { line: 13, severity: 'ERROR', message: 'semi - Missing semicolon.' },
                { line: 14, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
            ]);

            done();
        });
    });

    it('should use local configuration files', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'with_config');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, (err, result) => {

            expect(result).to.include('lint');

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            const checkedFile = eslintResults[0];
            expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
            expect(checkedFile.errors).to.deep.include([
                { line: 14, severity: 'ERROR', message: 'eol-last - Newline required at end of file but not found.' }]);
            expect(checkedFile.errors).to.not.deep.include({ line: 8, severity: 'ERROR', message: 'no-unused-vars - internals is defined but never used' });
            done();
        });
    });

    it('displays success message if no issues found', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'clean');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, (err, result) => {

            expect(result.lint).to.exist();

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            const checkedFile = eslintResults[0];
            expect(checkedFile.errors.length).to.equal(0);

            done();
        });
    });

    it('allows err to be shadowed', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'shadow');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, (err, result) => {

            expect(result.lint).to.exist();

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            const checkedFile = eslintResults[0];
            expect(checkedFile.errors.length).to.equal(0);

            done();
        });
    });

    it('doesn\'t allow res to be shadowed', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'shadow-res');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, (err, result) => {

            expect(result.lint).to.exist();

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            const checkedFile = eslintResults[0];
            expect(checkedFile.errors.length).to.equal(1);

            done();
        });
    });

    it('should pass options and not find any files', (done) => {

        const lintOptions = JSON.stringify({ extensions: ['.jsx'] });
        const path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'eslint', 'lint-options': lintOptions }, (err, result) => {

            expect(result).to.include('lint');

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(0);

            done();
        });
    });
});

describe('Linters - jslint', () => {

    it('should lint files in a folder', (done) => {

        const path = Path.join(__dirname, 'lint', 'jslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'jslint' }, (err, result) => {

            expect(err).not.to.exist();
            expect(result).to.include('lint');

            const jslintResults = result.lint;
            expect(jslintResults).to.have.length(1);

            const checkedFile = jslintResults[0];
            expect(checkedFile).to.include({ filename: 'fail.js' });
            expect(checkedFile.errors).to.deep.include([
                { line: 12, severity: 'ERROR', message: 'Use spaces, not tabs.' },
                { line: 13, severity: 'ERROR', message: 'Expected \';\' and instead saw \'}\'.' },
                { line: 13, severity: 'ERROR', message: 'Stopping.' }
            ]);

            done();
        });
    });

    it('should use local configuration files', (done) => {

        const path = Path.join(__dirname, 'lint', 'jslint', 'with_config');
        Linters.lint({ lintingPath: path, linter: 'jslint' }, (err, result) => {

            expect(err).not.to.exist();
            expect(result).to.include('lint');

            const jslintResults = result.lint;
            expect(jslintResults).to.have.length(1);

            const checkedFile = jslintResults[0];
            expect(checkedFile).to.include({ filename: 'fail.js' });
            expect(checkedFile.errors).to.deep.include([
                { line: 7, severity: 'ERROR', message: 'Unused \'internals\'.' },
                { line: 13, severity: 'ERROR', message: 'Unused \'myObject\'.' }
            ]);
            expect(checkedFile.errors).to.not.deep.include({ line: 14, severity: 'ERROR', message: 'Unexpected \'eval\'.' });
            done();
        });
    });

    it('displays success message if no issues found', (done) => {

        const path = Path.join(__dirname, 'lint', 'jslint', 'clean');
        Linters.lint({ lintingPath: path, linter: 'jslint' }, (err, result) => {

            expect(err).not.to.exist();
            expect(result.lint).to.exist();

            const jslintResults = result.lint;
            expect(jslintResults).to.have.length(1);

            const checkedFile = jslintResults[0];
            expect(checkedFile.errors.length).to.equal(0);

            done();
        });
    });

    it('should pass options and not find any files', (done) => {

        const lintOptions = JSON.stringify({ argv: { remain: ['**/*.jsx'] } });
        const path = Path.join(__dirname, 'lint', 'jslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'jslint', 'lint-options': lintOptions }, (err, result) => {

            expect(err).not.to.exist();
            expect(result).to.include('lint');

            const jslintResults = result.lint;
            expect(jslintResults).to.have.length(0);

            done();
        });
    });
});
