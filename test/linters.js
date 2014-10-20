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
        var result = Linters.lint({ lintingPath: path });
        expect(result.eslint).to.exist();

        var eslintResults = result.eslint;
        expect(eslintResults).to.have.length(1);

        var checkedFile = eslintResults[0];
        expect(checkedFile.filename).to.equal('fail.js');
        expect(checkedFile.errors).to.deep.include([
            { line: 11, severity: 'ERROR', message: 'semi - Missing semicolon.' },
            { line: 12, severity: 'WARNING', message: 'eol-last - Newline required at end of file but not found.' }
        ]);

        done();
    });

    it('should use local configuration files', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'with_config');
        var result = Linters.lint({ lintingPath: path });
        expect(result.eslint).to.exist();

        var eslintResults = result.eslint;
        expect(eslintResults).to.have.length(1);

        var checkedFile = eslintResults[0];
        expect(checkedFile.filename).to.equal('fail.js');
        expect(checkedFile.errors).to.deep.include({ line: 12, severity: 'ERROR', message: 'eol-last - Newline required at end of file but not found.' });
        expect(checkedFile.errors).to.not.deep.include({ line: 6, severity: 'ERROR', message: 'no-unused-vars - internals is defined but never used' });
        done();
    });

    it('displays success message if no issues found', function (done) {

        var path = Path.join(__dirname, 'lint', 'eslint', 'clean');
        var result = Linters.lint({ lintingPath: path });
        expect(result.eslint).to.exist();

        var eslintResults = result.eslint;
        expect(eslintResults).to.have.length(1);

        var checkedFile = eslintResults[0];
        expect(checkedFile.errors.length).to.equal(0);

        done();
    });
});
