'use strict';

// Load modules

const Fs = require('fs');
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

    it('computes sloc without comments', () => {

        const Test = require('./coverage/sloc');
        Test.method(1);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sloc') });
        expect(cov.percent).to.equal(100);
    });

    it('computes sloc on script that has no comments', () => {

        const Test = require('./coverage/nocomment');
        Test.method(1);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/nocomment') });
        expect(cov.percent).to.equal(100);
    });

    it('instruments and measures coverage', () => {

        const Test = require('./coverage/basic');
        Test.method(1);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/basic') });
        expect(cov.percent).to.equal(100);
    });

    it('measures coverage on an empty return statement', () => {

        const Test = require('./coverage/return');
        Test.method();

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/return') });
        expect(cov.percent).to.equal(100);
    });

    it('identifies lines with partial coverage', () => {

        const Test = require('./coverage/partial');
        Test.method(1, 2, 3);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/partial') });
        expect(Math.floor(cov.percent)).to.equal(61);
        expect(cov.sloc).to.equal(49);
        expect(cov.misses).to.equal(19);
        expect(cov.hits).to.equal(30);
    });

    it('measures coverage of a file with test in the name', () => {

        const Test = require('./coverage/test-folder/test-name.js');
        Test.method();

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/test-folder'), coverageExclude: ['test', 'node_modules'] });
        expect(cov.percent).to.equal(100);
    });

    it('can exclude individual files by name', () => {

        const Test = require('./coverage/test-folder/test-name.js');
        Test.method();

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/test-folder'), coverageExclude: ['test', 'node_modules', 'test-name.js'] });
        expect(cov.percent).to.equal(0);
    });

    it('logs to stderr when coverageExclude file has fs.stat issue', () => {

        const Test = require('./coverage/test-folder/test-name.js');
        Test.method();

        const origStatSync = Fs.statSync;
        const origErrorLog = console.error;

        Fs.statSync = () => {

            const err = new Error();
            err.code = 'BOOM';
            throw err;
        };

        console.error = (data) => {

            expect(data.code).to.equal('BOOM');
        };

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/test-folder'), coverageExclude: ['test', 'node_modules', 'test-name.js'] });
        Fs.statSync = origStatSync;
        console.error = origErrorLog;
        expect(cov.percent).to.equal(100);
    });

    it('identifies lines with partial coverage when having external sourcemap', () => {

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
                    lineNumber,
                    originalLineNumber: line.originalLine
                });
            }
        });

        expect(missedLines).to.include([
            { filename: 'while.js', lineNumber: '4', originalLineNumber: 13 },
            { filename: 'while.js', lineNumber: '5', originalLineNumber: 14 }
        ]);
    });

    it('identifies lines with partial coverage when having inline sourcemap', () => {

        const Test = require('./coverage/sourcemaps-inline');
        Test.method(false);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sourcemaps-inline'), sourcemaps: true });

        const source = cov.files[0].source;
        const missedLines = [];
        const missedChunks = [];
        Object.keys(source).forEach((lineNumber) => {

            const line = source[lineNumber];
            if (line.miss) {
                missedLines.push({
                    filename: line.originalFilename,
                    lineNumber,
                    originalLineNumber: line.originalLine
                });
                if (line.chunks) {
                    line.chunks.forEach((chunk) => {

                        if (chunk.miss) {
                            missedChunks.push({
                                filename: chunk.originalFilename,
                                lineNumber,
                                originalLineNumber: chunk.originalLine,
                                originalColumn: chunk.originalColumn
                            });
                        }
                    });
                }
            }
        });

        expect(missedLines).to.include([
            { filename: 'while.js', lineNumber: '3', originalLineNumber: 11 }
        ]);
        expect(missedChunks).to.include([
            { filename: 'while.js', lineNumber: '3', originalLineNumber: 13, originalColumn: 12  }
        ]);
    });

    it('bypasses marked code', () => {

        const Test = require('./coverage/bypass');
        Test.method(1, 2, 3);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass') });
        expect(Math.floor(cov.percent)).to.equal(100);
        expect(cov.sloc).to.equal(12);
        expect(cov.misses).to.equal(0);
        expect(cov.hits).to.equal(12);
    });

    it('bypasses marked code and reports misses correctly', () => {

        const Test = require('./coverage/bypass-misses');
        Test.method(1);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass-misses') });
        expect(Math.floor(cov.percent)).to.equal(92);
        expect(cov.sloc).to.equal(13);
        expect(cov.misses).to.equal(1);
        expect(cov.hits).to.equal(12);
    });

    it('ignores non-matching files', () => {

        require('./coverage/exclude/ignore');

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/exclude/ignore') });
        expect(Math.floor(cov.percent)).to.equal(0);
        expect(cov.files).to.have.length(0);
    });

    it('measures missing while statement coverage', () => {

        const Test = require('./coverage/while');
        Test.method(false);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/while') });
        expect(cov.percent).to.be.lessThan(100);
    });

    it('measures when errors are thrown', () => {

        const Test = require('./coverage/throws');

        const fn = function () {

            Test.method(true);
            Test.method(false);
        };

        expect(fn).to.throw(Error);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/throws') });
        expect(cov.percent).to.equal(100);
    });

    it('retains original value of conditional result', () => {

        const Test = require('./coverage/conditional');
        const value = { a: 1 };
        expect(Test.method(value)).to.equal(value);
    });

    it('retains original value of conditional result with comma operator', () => {

        const Test = require('./coverage/conditional2');
        const value = 4711;
        expect(Test.method(value)).to.equal(value);
    });

    it('should not change use strict instructions', () => {

        const Test = require('./coverage/use-strict.js');
        expect(Test.method.toString()).to.not.contain('13'); // This is the line of the inner use strict

        const testFile = Path.join(__dirname, 'coverage/use-strict.js').replace(/\\/g, '/');
        expect(Test.singleLine.toString()).to.contain('"use strict"; global.__$$labCov._line(\'' + testFile + '\',19);return value;');

        expect(Test.shouldFail).to.throw('unknownvar is not defined');
    });

    it('should work with loop labels', () => {

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

        expect(missedChunks).to.have.length(1).and.to.equal([{ source: 'j < 1', miss: 'true', column: 22 }]);
    });

    it('should measure missing coverage on single-line functions correctly', () => {

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
    });

    it('should measure missing coverage on trailing function declarations correctly', () => {

        const Test = require('./coverage/trailing-function-declarations');
        const result = Test.method(3, 4);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/trailing-function-declarations') });
        const source = cov.files[0].source;
        const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
        expect(result).to.equal(7);
        expect(missedLines).to.equal(['19', '22']);
    });

    it('should measure coverage on conditional value', () => {

        const Test = require('./coverage/conditional-value');
        expect(Test.method(false)).to.equal(false);
        expect(Test.method(true, 1, 0)).to.equal(1);
        expect(Test.method(true, 0, 1)).to.equal(1);
        expect(Test.method(true, 0, 0)).to.equal(0);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/conditional-value') });
        const source = cov.files[0].source;
        const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
        expect(missedLines).to.be.empty();
    });

    describe('#analyze', () => {

        it('sorts file paths in report', () => {

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
        });
    });

    describe('Clear require cache', () => {

        it('does not reset file coverage', () => {

            const cacheBackup = require.cache; // backup require cache
            const filename = Path.resolve(__dirname, './coverage/basic.js');
            let file = require('./coverage/basic'); //eslint-disable-line no-unused-vars
            const fileCovBefore = global.__$$labCov.files[filename];
            require.cache = Module._cache = {}; // clear require cache before additional require
            file = require('./coverage/basic');
            require.cache = Module._cache = cacheBackup; // restore require cache

            const fileCovAfter = global.__$$labCov.files[filename];
            expect(fileCovAfter).to.equal(fileCovBefore);
        });
    });
});
