// Load modules

var Path = require('path');
var _Lab = require('../test_runner');
var Linters = require('../lib/lint');


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = _Lab.expect;

describe('Linters', function () {

    it('should error on unknown linter', function (done) {

        expect(function () {

            Linters.lint({ lint: 'dummy', lintingPath: process.cwd() });
        }).to.throw('unknown');
        done();
    });

    it('should accept linters as an array', function (done) {

        var errors = Linters.lint({ lint: ['eslint'], lintingPath: Path.join(__dirname, 'lint', 'eslint', 'basic') });
        expect(errors).to.have.property('eslint');
        done();
    });

    describe('ESLint', function () {

        it('should lint files in a folder', function (done) {

            var path = Path.join(__dirname, 'lint', 'eslint', 'basic');
            var result = Linters.lint({ lint: 'eslint', lintingPath: path });
            expect(result).to.have.property('eslint');

            var eslintResults = result.eslint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile).to.have.property('filename', 'fail.js');
            expect(checkedFile.errors).to.deep.include.members([
                { line: 6, severity: 'WARNING', message: 'no-unused-vars internals is defined but never used' },
                { line: 12, severity: 'WARNING', message: 'eol-last Newline required at end of file but not found.' }
            ]);

            done();
        });

        it('should use local configuration files', function (done) {

            var path = Path.join(__dirname, 'lint', 'eslint', 'with_config');
            var result = Linters.lint({ lint: 'eslint', lintingPath: path });
            expect(result).to.have.property('eslint');

            var eslintResults = result.eslint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile).to.have.property('filename', 'fail.js');
            expect(checkedFile.errors).to.deep.include.members([
                { line: 12, severity: 'ERROR', message: 'eol-last Newline required at end of file but not found.' }
            ]).and.to.not.deep.include.members([
                { line: 6, severity: 'ERROR', message: 'no-unused-vars internals is defined but never used' }
            ]);
            done();
        });
    });
});