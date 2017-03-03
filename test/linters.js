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

    it('should lint files in a folder', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, (err, result) => {

            expect(err).to.not.exist();
            expect(result).to.include('lint');

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            const checkedFile = eslintResults[0];
            expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
            expect(checkedFile.errors).to.include([
                { line: 13, severity: 'ERROR', message: 'semi - Missing semicolon.' },
                { line: 14, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
            ]);

            done();
        });
    });

    it('should default to eslint', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        Linters.lint({ lintingPath: path }, (err, result) => {

            expect(err).to.not.exist();
            expect(result).to.include('lint');

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            const checkedFile = eslintResults[0];
            expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
            expect(checkedFile.errors).to.include([
                { line: 13, severity: 'ERROR', message: 'semi - Missing semicolon.' },
                { line: 14, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
            ]);

            done();
        });
    });

    it('should use local configuration files', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'with_config');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, (err, result) => {

            expect(err).to.not.exist();
            expect(result).to.include('lint');

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            const checkedFile = eslintResults[0];
            expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
            expect(checkedFile.errors).to.include([
                { line: 14, severity: 'ERROR', message: 'eol-last - Newline required at end of file but not found.' }]);
            expect(checkedFile.errors).to.not.include({ line: 8, severity: 'ERROR', message: 'no-unused-vars - internals is defined but never used' });
            done();
        });
    });

    it('displays success message if no issues found', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'clean');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, (err, result) => {

            expect(err).to.not.exist();
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

            expect(err).to.not.exist();
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

            expect(err).to.not.exist();
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

            expect(err).to.not.exist();
            expect(result).to.include('lint');

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(0);

            done();
        });
    });

    it('should fix lint rules when --lint-fix used', (done, onCleanup) => {

        const originalWriteFileSync = Fs.writeFileSync;

        onCleanup((next) => {

            Fs.writeFileSync = originalWriteFileSync;
            next();
        });

        Fs.writeFileSync = (path, output) => {

            expect(path).to.endWith(Path.join('test', 'lint', 'eslint', 'fix', 'success.js'));
            expect(output).to.endWith('\n\n    return value;\n};\n');
        };

        const path = Path.join(__dirname, 'lint', 'eslint', 'fix');
        Linters.lint({ lintingPath: path, linter: 'eslint', 'lint-fix': true }, (err, result) => {

            expect(err).to.not.exist();
            expect(result).to.include('lint');

            const eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);
            expect(eslintResults[0]).to.include({
                totalErrors: 0,
                totalWarnings: 0
            });
            done();
        });
    });

    it('should error on malformed lint-options', (done) => {

        const path = Path.join(__dirname, 'lint', 'eslint', 'fix');

        const f = () => {

            Linters.lint({ lintingPath: path, linter: 'eslint', 'lint-options': '}' }, () => {});
        };

        expect(f).to.throw('lint-options could not be parsed');
        done();
    });
});

describe('Linters - custom', () => {

    it('can run custom linter', (done) => {

        const path = Path.join(__dirname, 'lint');
        Linters.lint({ lintingPath: path, linter: Path.join(__dirname, 'lint', 'custom') }, (err, result) => {

            expect(err).to.not.exist();
            expect(result).to.include('lint');

            const results = result.lint;
            expect(results).to.have.length(1);

            const checkedFile = results[0];
            expect(checkedFile.filename).to.equal('custom');
            expect(checkedFile.errors.length).to.equal(1);

            done();
        });
    });
});
