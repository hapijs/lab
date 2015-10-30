'use strict';

// Load modules

const Path = require('path');
const Code = require('code');
const _Lab = require('../test_runner');
const Lab = require('../');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Coverage', () => {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, 'coverage'), coverageExclude: 'exclude' });

    it('instruments and measures coverage', (done) => {

        const Test = require('./coverage/basic');
        Test.method(1);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/basic') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('measures coverage on an empty return statement', (done) => {

        const Test = require('./coverage/return');
        Test.method();

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/return') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('identifies lines with partial coverage', (done) => {

        const Test = require('./coverage/partial');
        Test.method(1, 2, 3);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/partial') });
        expect(Math.floor(cov.percent)).to.equal(63);
        expect(cov.sloc).to.equal(52);
        expect(cov.misses).to.equal(19);
        expect(cov.hits).to.equal(33);
        done();
    });

    it('identifies lines with partial coverage when having external sourcemap', (done) => {

        const Test = require('./coverage/sourcemaps-external');
        Test.method(false);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sourcemaps-external'), sourcemaps: true });

        const source = cov.files[0].source;
        const missedLines = [];
        Object.keys(source).forEach((lineNumber) => {

            const line = source[lineNumber];
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

    it('identifies lines with partial coverage when having inline sourcemap', (done) => {

        const Test = require('./coverage/sourcemaps-inline');
        Test.method(false);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sourcemaps-inline'), sourcemaps: true });

        const source = cov.files[0].source;
        const missedLines = [];
        Object.keys(source).forEach((lineNumber) => {

            const line = source[lineNumber];
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

    it('bypasses marked code', (done) => {

        const Test = require('./coverage/bypass');
        Test.method(1, 2, 3);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass') });
        expect(Math.floor(cov.percent)).to.equal(100);
        expect(cov.sloc).to.equal(16);
        expect(cov.misses).to.equal(0);
        expect(cov.hits).to.equal(16);
        done();
    });

    it('ignores non-matching files', (done) => {

        const Test = require('./coverage/exclude/ignore');

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/exclude/ignore') });
        expect(Math.floor(cov.percent)).to.equal(0);
        expect(cov.files).to.have.length(0);
        done();
    });

    it('measures missing while statement coverage', (done) => {

        const Test = require('./coverage/while');
        Test.method(false);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/while') });
        expect(cov.percent).to.be.lessThan(100);
        done();
    });

    it('measures when errors are thrown', (done) => {

        const Test = require('./coverage/throws');

        const fn = function () {

            Test.method(true);
            Test.method(false);
        };

        expect(fn).to.throw(Error);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/throws') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('retains original value of conditional result', (done) => {

        const Test = require('./coverage/conditional');
        const value = { a: 1 };
        expect(Test.method(value)).to.equal(value);
        done();
    });

    it('should not change use strict instructions', (done) => {

        const Test = require('./coverage/use-strict.js');
        expect(Test.method.toString()).to.not.contain('13'); // This is the line of the inner use strict

        const testFile = Path.join(__dirname, 'coverage/use-strict.js');
        expect(Test.singleLine.toString()).to.contain('"use strict"; global.__$$labCov._line(\'' + testFile + '\',19);return value;');

        expect(Test.shouldFail).to.throw('unknownvar is not defined');

        done();
    });

    it('should work with loop labels', (done) => {

        const Test = require('./coverage/loop-labels.js');
        expect(Test.method()).to.deep.equal([1, 0]);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/loop-labels') });
        const source = cov.files[0].source;
        const missedChunks = [];
        Object.keys(source).forEach((lineNumber) => {

            const line = source[lineNumber];
            if (line.miss) {
                missedChunks.push.apply(missedChunks, line.chunks.filter((chunk) => {

                    return !!chunk.miss;
                }));
            }
        });

        expect(missedChunks).to.have.length(1).and.to.deep.equal([{ source: 'j < 1', miss: 'true' }]);

        done();
    });

    describe('#analyze', () => {

        it('sorts file paths in report', (done) => {

            const files = global.__$$labCov.files;
            const paths = ['/a/b', '/a/b/c', '/a/c/b', '/a/c', '/a/b/c', '/a/b/a'];
            paths.forEach((path) => {

                files[path] = { source: [] };
            });

            const cov = Lab.coverage.analyze({ coveragePath: '/a' });
            const sorted = cov.files.map((file) => {

                return file.filename;
            });

            expect(sorted).to.deep.equal(['/a/b', '/a/c', '/a/b/a', '/a/b/c', '/a/c/b']);
            done();
        });
    });
});
