// Load modules

var Path = require('path');
var _Lab = require('../test_runner');
var Code = require('code');
var Linters = require('../lib/lint');


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Linters - eslint', function () {

    it('should lint files in a folder', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, function (err, result) {

            expect(result).to.include('lint');

            var eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
            expect(checkedFile.errors).to.deep.include([
                { line: 11, severity: 'ERROR', message: 'semi - Missing semicolon.' },
                { line: 12, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
            ]);

            done();
        });
    });

    it('should use local configuration files', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'with_config');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, function (err, result) {

            expect(result).to.include('lint');

            var eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile).to.include({ filename: Path.join(path, 'fail.js') });
            expect(checkedFile.errors).to.deep.include([
                { line: 12, severity: 'ERROR', message: 'eol-last - Newline required at end of file but not found.' }]);
            expect(checkedFile.errors).to.not.deep.include({ line: 6, severity: 'ERROR', message: 'no-unused-vars - internals is defined but never used' });
            done();
        });
    });

    it('displays success message if no issues found', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'clean');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, function (err, result) {

            expect(result.lint).to.exist();

            var eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile.errors.length).to.equal(0);

            done();
        });
    });

    it('allows err to be shadowed', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'shadow');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, function (err, result) {

            expect(result.lint).to.exist();

            var eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile.errors.length).to.equal(0);

            done();
        });
    });

    it('doesn\'t allow res to be shadowed', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'shadow-res');
        Linters.lint({ lintingPath: path, linter: 'eslint' }, function (err, result) {

            expect(result.lint).to.exist();

            var eslintResults = result.lint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile.errors.length).to.equal(1);

            done();
        });
    });

    it('should pass options and not find any files', function (done) {

        var lintOptions = JSON.stringify({ extensions: ['.jsx'] });
        var path = Path.join(__dirname, 'lint', 'eslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'eslint', 'lint-options': lintOptions }, function (err, result) {

            expect(result).to.include('lint');

            var eslintResults = result.lint;
            expect(eslintResults).to.have.length(0);

            done();
        });
    });
});

describe('Linters - jslint', function () {

    it('should lint files in a folder', function (done) {

        var path = Path.join(__dirname, 'lint', 'jslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'jslint' }, function (err, result) {

            expect(err).not.to.exist();
            expect(result).to.include('lint');

            var jslintResults = result.lint;
            expect(jslintResults).to.have.length(1);

            var checkedFile = jslintResults[0];
            expect(checkedFile).to.include({ filename: 'fail.js' });
            expect(checkedFile.errors).to.deep.include([
                { line: 10, severity: 'ERROR', message: 'Use spaces, not tabs.' },
                { line: 10, severity: 'ERROR', message: 'Expected \'use strict\' before \'return\'.' },
                { line: 11, severity: 'ERROR', message: 'Expected \';\' and instead saw \'}\'.' },
                { line: 11, severity: 'ERROR', message: 'Stopping.' }
            ]);

            done();
        });
    });

    it('should use local configuration files', function (done) {

        var path = Path.join(__dirname, 'lint', 'jslint', 'with_config');
        Linters.lint({ lintingPath: path, linter: 'jslint' }, function (err, result) {

            expect(err).not.to.exist();
            expect(result).to.include('lint');

            var jslintResults = result.lint;
            expect(jslintResults).to.have.length(1);

            var checkedFile = jslintResults[0];
            expect(checkedFile).to.include({ filename: 'fail.js' });
            expect(checkedFile.errors).to.deep.include([
                { line: 5, severity: 'ERROR', message: 'Unused \'internals\'.' },
                { line: 10, severity: 'ERROR', message: 'Expected \'use strict\' before \'var\'.' },
                { line: 11, severity: 'ERROR', message: 'Unused \'myObject\'.' }
            ]);
            expect(checkedFile.errors).to.not.deep.include({ line: 14, severity: 'ERROR', message: 'Unexpected \'eval\'.' });
            done();
        });
    });

    it('displays success message if no issues found', function (done) {

        var path = Path.join(__dirname, 'lint', 'jslint', 'clean');
        Linters.lint({ lintingPath: path, linter: 'jslint' }, function (err, result) {

            expect(err).not.to.exist();
            expect(result.lint).to.exist();

            var jslintResults = result.lint;
            expect(jslintResults).to.have.length(1);

            var checkedFile = jslintResults[0];
            expect(checkedFile.errors.length).to.equal(0);

            done();
        });
    });

    it('should pass options and not find any files', function (done) {

        var lintOptions = JSON.stringify({ argv: { remain: ['**/*.jsx'] } });
        var path = Path.join(__dirname, 'lint', 'jslint', 'basic');
        Linters.lint({ lintingPath: path, linter: 'jslint', 'lint-options': lintOptions }, function (err, result) {

            expect(err).not.to.exist();
            expect(result).to.include('lint');

            var jslintResults = result.lint;
            expect(jslintResults).to.have.length(0);

            done();
        });
    });
});
