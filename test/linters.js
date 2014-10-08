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

    it('should lint files in a folder', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'basic');
<<<<<<< HEAD
        Linters.lint({ lintingPath: path }, function (err, result) {
=======
        var result = Linters.lint({ lintingPath: path });
        expect(result.eslint).to.exist();
>>>>>>> fee8d10eea52edd20dfe92aa5199c629cca21131

            expect(result).to.have.property('eslint');

<<<<<<< HEAD
            var eslintResults = result.eslint;
            expect(eslintResults).to.have.length(1);
=======
        var checkedFile = eslintResults[0];
        expect(checkedFile.filename).to.equal('fail.js');
        expect(checkedFile.errors).to.deep.include([
            { line: 11, severity: 'ERROR', message: 'semi - Missing semicolon.' },
            { line: 12, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
        ]);
>>>>>>> fee8d10eea52edd20dfe92aa5199c629cca21131

            var checkedFile = eslintResults[0];
            expect(checkedFile).to.have.property('filename', 'fail.js');
            expect(checkedFile.errors).to.deep.include.members([
                { line: 11, severity: 'ERROR', message: 'semi - Missing semicolon.' },
                { line: 12, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
            ]);

            done();
        });
    });

    it('should use local configuration files', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'with_config');
<<<<<<< HEAD
        Linters.lint({ lintingPath: path }, function (err, result) {

            expect(result).to.have.property('eslint');

            var eslintResults = result.eslint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile).to.have.property('filename', 'fail.js');
            expect(checkedFile.errors).to.deep.include.members([
                { line: 12, severity: 'ERROR', message: 'eol-last - Newline required at end of file but not found.' }
            ]).and.to.not.deep.include.members([
                    { line: 6, severity: 'ERROR', message: 'no-unused-vars - internals is defined but never used' }
                ]);
            done();
        });
=======
        var result = Linters.lint({ lintingPath: path });
        expect(result.eslint).to.exist();

        var eslintResults = result.eslint;
        expect(eslintResults).to.have.length(1);

        var checkedFile = eslintResults[0];
        expect(checkedFile.filename).to.equal('fail.js');
        expect(checkedFile.errors).to.deep.include({ line: 12, severity: 'ERROR', message: 'eol-last - Newline required at end of file but not found.' });
        expect(checkedFile.errors).to.not.deep.include({ line: 6, severity: 'ERROR', message: 'no-unused-vars - internals is defined but never used' });
        done();
>>>>>>> fee8d10eea52edd20dfe92aa5199c629cca21131
    });

    it('displays success message if no issues found', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'clean');
<<<<<<< HEAD
        Linters.lint({ lintingPath: path }, function (err, result) {

            expect(result).to.have.property('eslint');
=======
        var result = Linters.lint({ lintingPath: path });
        expect(result.eslint).to.exist();
>>>>>>> fee8d10eea52edd20dfe92aa5199c629cca21131

            var eslintResults = result.eslint;
            expect(eslintResults).to.have.length(1);

            var checkedFile = eslintResults[0];
            expect(checkedFile.errors.length).to.equal(0);

            done();
        });
    });
});
