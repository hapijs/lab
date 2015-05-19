// Load modules

var Path = require('path');
var Code = require('code');
var _Lab = require('../test_runner');
var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Coverage', function () {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, 'coverage'), coverageExclude: 'exclude' });

    it('instruments and measures coverage', function (done) {

        var Test = require('./coverage/basic');
        Test.method(1);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/basic') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('measures coverage on an empty return statement', function (done) {

        var Test = require('./coverage/return');
        Test.method();

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/return') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('identifies lines with partial coverage', function (done) {

        var Test = require('./coverage/partial');
        Test.method(1, 2, 3);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/partial') });
        expect(Math.floor(cov.percent)).to.equal(59);
        expect(cov.sloc).to.equal(47);
        expect(cov.misses).to.equal(19);
        expect(cov.hits).to.equal(28);
        done();
    });

    it('identifies lines with partial coverage when having external sourcemap', function (done) {

        var Test = require('./coverage/sourcemaps-external');
        Test.method(false);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sourcemaps-external'), sourcemaps: true });

        var source = cov.files[0].source;
        var missedLines = [];
        Object.keys(source).forEach(function (lineNumber) {

            var line = source[lineNumber];
            if (line.miss) {
                missedLines.push({
                    filename: line.originalFilename,
                    lineNumber: lineNumber,
                    originalLineNumber: line.originalLine
                });
            }
        });

        expect(missedLines).to.deep.include([
            { filename: 'test/coverage/while.js', lineNumber: '5', originalLineNumber: 11 },
            { filename: 'test/coverage/while.js', lineNumber: '6', originalLineNumber: 12 }
        ]);

        done();
    });

    it('identifies lines with partial coverage when having inline sourcemap', function (done) {

        var Test = require('./coverage/sourcemaps-inline');
        Test.method(false);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sourcemaps-inline'), sourcemaps: true });

        var source = cov.files[0].source;
        var missedLines = [];
        Object.keys(source).forEach(function (lineNumber) {

            var line = source[lineNumber];
            if (line.miss) {
                missedLines.push({
                    filename: line.originalFilename,
                    lineNumber: lineNumber,
                    originalLineNumber: line.originalLine
                });
            }
        });

        expect(missedLines).to.deep.include([
            { filename: './while.js', lineNumber: '5', originalLineNumber: 11 },
            { filename: './while.js', lineNumber: '6', originalLineNumber: 12 }
        ]);

        done();
    });

    it('bypasses marked code', function (done) {

        var Test = require('./coverage/bypass');
        Test.method(1, 2, 3);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass') });
        expect(Math.floor(cov.percent)).to.equal(100);
        expect(cov.sloc).to.equal(15);
        expect(cov.misses).to.equal(0);
        expect(cov.hits).to.equal(15);
        done();
    });

    it('ignores non-matching files', function (done) {

        var Test = require('./coverage/exclude/ignore');

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/exclude/ignore') });
        expect(Math.floor(cov.percent)).to.equal(0);
        expect(cov.files).to.have.length(0);
        done();
    });

    it('measures missing while statement coverage', function (done) {

        var Test = require('./coverage/while');
        Test.method(false);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/while') });
        expect(cov.percent).to.be.lessThan(100);
        done();
    });

    it('measures when errors are thrown', function (done) {

        var Test = require('./coverage/throws');

        var fn = function () {

            Test.method(true);
            Test.method(false);
        };

        expect(fn).to.throw(Error);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/throws') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('retains original value of conditional result', function (done) {

        var Test = require('./coverage/conditional');
        var value = { a: 1 };
        expect(Test.method(value)).to.equal(value);
        done();
    });

    it('should not change use strict instructions', function (done) {

        var Test = require('./coverage/use-strict.js');
        expect(Test.method.toString()).to.not.contain('13'); // This is the line of the inner use strict

        var testFile = Path.join(__dirname, 'coverage/use-strict.js');
        expect(Test.singleLine.toString()).to.contain('"use strict"; global.__$$labCov._line(\'' + testFile + '\',19);return value;');

        expect(Test.shouldFail).to.throw('unknownvar is not defined');

        done();
    });

    it('should work with loop labels', function (done) {

        var Test = require('./coverage/loop-labels.js');
        expect(Test.method()).to.deep.equal([1, 0]);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/loop-labels') });
        var source = cov.files[0].source;
        var missedChunks = [];
        Object.keys(source).forEach(function (lineNumber) {

            var line = source[lineNumber];
            if (line.miss) {
                missedChunks.push.apply(missedChunks, line.chunks.filter(function (chunk) {

                    return !!chunk.miss;
                }));
            }
        });

        expect(missedChunks).to.have.length(1).and.to.deep.equal([{ source: 'j < 1', miss: 'true' }]);

        done();
    });

    describe('#analyze', function () {

        it('sorts file paths in report', function (done) {

            var files = global.__$$labCov.files;
            var paths = ['/a/b', '/a/b/c', '/a/c/b', '/a/c', '/a/b/c', '/a/b/a'];
            paths.forEach(function (path) {

                files[path] = { source: [] };
            });

            var cov = Lab.coverage.analyze({ coveragePath: '/a' });
            var sorted = cov.files.map(function (file) {

                return file.filename;
            });

            expect(sorted).to.deep.equal(['/a/b', '/a/c', '/a/b/a', '/a/b/c', '/a/c/b']);
            done();
        });
    });
});
