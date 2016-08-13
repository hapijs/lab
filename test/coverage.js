'use strict';

// Load modules

const Path = require('path');
const Module = require('module');
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

    it('measures coverage a file with test in the name', (done) => {

        const Test = require('./coverage/test-folder/test-name.js');
        Test.method();

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/test-folder'), coverageExclude: ['test', 'node_modules'] });
        expect(cov.percent).to.equal(100);
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

        expect(missedLines).to.include([
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

        expect(missedLines).to.include([
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

    it('bypasses marked code and reports misses correctly', (done) => {

        const Test = require('./coverage/bypass-misses');
        Test.method(1);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass-misses') });
        expect(Math.floor(cov.percent)).to.equal(93);
        expect(cov.sloc).to.equal(15);
        expect(cov.misses).to.equal(1);
        expect(cov.hits).to.equal(14);
        done();
    });

    it('ignores non-matching files', (done) => {

        require('./coverage/exclude/ignore');

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

    it('retains original value of conditional result with comma operator', (done) => {

        const Test = require('./coverage/conditional2');
        const value = 4711;
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
        expect(Test.method()).to.equal([1, 0]);

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

        expect(missedChunks).to.have.length(1).and.to.equal([{ source: 'j < 1', miss: 'true' }]);

        done();
    });

    it('should measure missing coverage on single-line functions correctly', (done) => {

        const Test = require('./coverage/single-line-functions');
        const results = [];
        for (let i = 1; i <= 10; ++i) {
            results.push(Test[`method${i}`](3, 4));
        }

        results.push(Test.method11(5, 10));
        results.push(Test.method11(0, 10));
        results.push(Test.method11Partial(5, 10));

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/single-line-functions') });
        const source = cov.files[0].source;
        const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
        expect(results).to.equal([7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 5, 10, 5]);
        expect(missedLines).to.equal(['12', '15', '21', '27', '30', '33', '39', '46', '50', '53', '56']);
        done();
    });

    it('should measure missing coverage on trailing function declarations correctly', (done) => {

        const Test = require('./coverage/trailing-function-declarations');
        const result = Test.method(3, 4);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/trailing-function-declarations') });
        const source = cov.files[0].source;
        const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
        expect(result).to.equal(7);
        expect(missedLines).to.equal(['19', '22']);
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

            expect(sorted).to.equal(['/a/b', '/a/c', '/a/b/a', '/a/b/c', '/a/c/b']);
            done();
        });
    });

    describe('Clear require cache', () => {

        it('does not reset file coverage', (done) => {

            const cacheBackup = require.cache; // backup require cache
            const filename = Path.resolve(__dirname, './coverage/basic.js');
            let file = require('./coverage/basic'); //eslint-disable-line no-unused-vars
            const fileCovBefore = global.__$$labCov.files[filename];
            require.cache = Module._cache = {}; // clear require cache before additional require
            file = require('./coverage/basic');
            require.cache = Module._cache = cacheBackup; // restore require cache

            const fileCovAfter = global.__$$labCov.files[filename];
            expect(fileCovAfter).to.equal(fileCovBefore);
            done();
        });
    });
});
