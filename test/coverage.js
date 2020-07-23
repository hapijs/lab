'use strict';

const Fs = require('fs');
const Module = require('module');
const Os = require('os');
const Path = require('path');

const Code = require('@hapi/code');
const _Lab = require('../test_runner');
const Lab = require('../');
const SupportsColor = require('supports-color');


const internals = {
    transform: [
        {
            ext: '.inl', transform: function (content, filename) {

                if (Buffer.isBuffer(content)) {
                    content = content.toString();
                }

                return content.concat(Os.EOL).concat('//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndoaWxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGFBRUE7QUFHQTtBQUVBLEtBQU0sV0FBWSxFQUFsQixDQUdBLFFBQVEsTUFBUixDQUFpQixTQUFVLEtBQVYsQ0FBaUIsQ0FFOUIsTUFBUSxLQUFSLENBQWdCLENBQ1osTUFBUSxLQUFSLENBQ0gsQ0FFRCxNQUFPLE1BQVAsQ0FDSCxDQVBEIiwiZmlsZSI6InNvdXJjZW1hcHMtaW5saW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vLyBMb2FkIG1vZHVsZXNcblxuXG4vLyBEZWNsYXJlIGludGVybmFsc1xuXG5jb25zdCBpbnRlcm5hbHMgPSB7fTtcblxuXG5leHBvcnRzLm1ldGhvZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gICAgd2hpbGUgKCB2YWx1ZSApIHtcbiAgICAgICAgdmFsdWUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuIl19').concat(Os.EOL);
            }
        },
        { ext: '.js', transform: null }
    ]
};


const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Coverage', () => {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, 'coverage'), coverageExclude: 'exclude' });

    it('computes sloc without comments', async () => {

        const Test = require('./coverage/sloc');

        Test.method(1);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sloc') });
        expect(cov.percent).to.equal(100);
    });

    it('computes sloc without comments on transformed file', async () => {

        const Test = require('./coverage/transformed');

        Test.method(1);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/transformed') });
        expect(cov.percent).to.equal(100);
    });

    it('computes sloc on script that has no comments', async () => {

        const Test = require('./coverage/nocomment');

        Test.method(1);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/nocomment') });
        expect(cov.percent).to.equal(100);
    });

    it('instruments and measures coverage', async () => {

        const Test = require('./coverage/basic');

        Test.method(1);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/basic') });
        expect(cov.percent).to.equal(100);
    });

    it('measures coverage on an empty return statement', async () => {

        const Test = require('./coverage/return');

        Test.method();

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/return') });
        expect(cov.percent).to.equal(100);
    });

    it('identifies lines with partial coverage', async () => {

        const Test = require('./coverage/partial');

        Test.method(1, 2, 3);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/partial') });
        expect(Math.floor(cov.percent)).to.equal(61);
        expect(cov.sloc).to.equal(49);
        expect(cov.misses).to.equal(19);
        expect(cov.hits).to.equal(30);
    });

    it('measures coverage of a file with test in the name', async () => {

        const Test = require('./coverage/test-folder/test-name.js');

        Test.method();

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/test-folder'), coverageExclude: ['test', 'node_modules'] });
        expect(cov.percent).to.equal(100);
    });

    it('can exclude individual files by name', async () => {

        const Test = require('./coverage/test-folder/test-name.js');

        Test.method();

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/test-folder'), coverageExclude: ['test', 'node_modules', 'test-name.js'] });
        expect(cov.percent).to.equal(0);
    });

    it('handles comma operator', async () => {

        const Test = require('./coverage/comma');

        expect(Test.method1(1)).to.equal(1);
        expect(Test.method2(1)(2)).to.equal(2);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/comma') });
        expect(cov.percent).to.equal(100);
    });

    it('logs to stderr when coverageExclude file has fs.stat issue', async () => {

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

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/test-folder'), coverageExclude: ['test', 'node_modules', 'test-name.js'] });
        Fs.statSync = origStatSync;
        console.error = origErrorLog;
        expect(cov.percent).to.equal(100);
    });

    it('identifies lines with partial coverage when having external sourcemap', async () => {

        const Test = require('./coverage/sourcemaps-external');

        Test.method(false);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sourcemaps-external'), sourcemaps: true });

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

    it('identifies lines with partial coverage when having inline sourcemap', async () => {

        const Test = require('./coverage/sourcemaps-inline');

        Test.method(false);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sourcemaps-inline'), sourcemaps: true });

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
            { filename: 'while.js', lineNumber: '3', originalLineNumber: 13, originalColumn: 12 }
        ]);
    });

    it('bypasses marked code', async () => {

        const Test = require('./coverage/bypass');

        Test.method(1, 2, 3);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass') });
        expect(Math.floor(cov.percent)).to.equal(100);
        expect(cov.sloc).to.equal(12);
        expect(cov.misses).to.equal(0);
        expect(cov.hits).to.equal(12);
    });

    it('ignores marked code', async () => {

        const Test = require('./coverage/ignore');

        Test.method();

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/ignore') });
        expect(Math.floor(cov.percent)).to.equal(100);
        expect(cov.sloc).to.equal(5);
        expect(cov.misses).to.equal(0);
        expect(cov.hits).to.equal(5);
    });

    it('bypasses marked code and reports misses correctly', async () => {

        const Test = require('./coverage/bypass-misses');

        Test.method(1);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass-misses') });
        expect(Math.floor(cov.percent)).to.equal(92);
        expect(cov.sloc).to.equal(13);
        expect(cov.misses).to.equal(1);
        expect(cov.hits).to.equal(12);
    });

    it('uses a stack to bypass marked code', async () => {

        const Test = require('./coverage/bypass-stack');

        expect(Test.getIsSet()).to.be.a.function();

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass-stack') });
        expect(Math.floor(cov.percent)).to.equal(100);
        expect(cov.sloc).to.equal(22);
        expect(cov.misses).to.equal(0);
        expect(cov.hits).to.equal(22);
    });

    it('uses a stack to bypass marked code and reports misses correctly', async () => {

        const Test = require('./coverage/bypass-stack-alt');

        expect(Test.getIsSet(Test.withTypes)).to.equal('isSet-shim');

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass-stack') });
        expect(Math.floor(cov.percent)).to.equal(100);
        expect(cov.sloc).to.equal(40);
        expect(cov.misses).to.equal(0);
        expect(cov.hits).to.equal(40);
    });

    it('asserts that bypass marked code does not violate the stack bounds', async () => {

        expect(() => require('./coverage/bypass-empty-stack')).to.throw(/stack/);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass-empty-stack') });
        expect(cov.sloc).to.equal(0);
    });

    it('ignores non-matching files', async () => {

        require('./coverage/exclude/ignore');

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/exclude/ignore') });
        expect(Math.floor(cov.percent)).to.equal(0);
        expect(cov.files).to.have.length(0);
    });

    it('measures missing while statement coverage', async () => {

        const Test = require('./coverage/while');

        Test.method(false);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/while') });
        expect(cov.percent).to.be.lessThan(100);
    });

    it('measures when errors are thrown', async () => {

        const Test = require('./coverage/throws');

        const fn = function () {

            Test.method(true);
            Test.method(false);
        };

        expect(fn).to.throw(Error);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/throws') });
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

    it('should work with loop labels', async () => {

        const Test = require('./coverage/loop-labels.js');

        expect(Test.method()).to.equal([1, 0]);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/loop-labels') });
        const source = cov.files[0].source;
        const missedChunks = [];
        Object.keys(source).forEach((lineNumber) => {

            const line = source[lineNumber];
            if (line.miss) {
                // eslint-disable-next-line prefer-spread
                missedChunks.push.apply(missedChunks, line.chunks.filter((chunk) => {

                    return !!chunk.miss;
                }));
            }
        });

        expect(missedChunks).to.have.length(1).and.to.equal([{ source: 'j < 1', miss: 'true', column: 22 }]);
    });

    it('should work with switch statements', async () => {

        const Test = require('./coverage/switch.js');

        expect(Test.method(1)).to.equal(1);
        expect(Test.method()).to.equal(2);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/switch') });
        const source = cov.files[0].source;
        const missedChunks = [];
        Object.keys(source).forEach((lineNumber) => {

            const line = source[lineNumber];
            if (line.miss) {
                // eslint-disable-next-line prefer-spread
                missedChunks.push.apply(missedChunks, line.chunks.filter((chunk) => {

                    return !!chunk.miss;
                }));
            }
        });

        expect(missedChunks).to.have.length(0);
    });

    it('should measure missing coverage on single-line functions correctly', async () => {

        const Test = require('./coverage/single-line-functions');

        const results = [];
        for (let i = 1; i <= 10; ++i) {
            results.push(Test[`method${i}`](3, 4));
        }

        results.push(Test.method11(5, 10));
        results.push(Test.method11(0, 10));
        results.push(Test.method11Partial(5, 10));

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/single-line-functions') });
        const source = cov.files[0].source;
        const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
        expect(results).to.equal([7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 5, 10, 5]);
        expect(missedLines).to.equal(['12', '15', '21', '27', '30', '33', '39', '46', '50', '53', '56']);
    });

    it('should measure missing coverage on trailing function declarations correctly', async () => {

        const Test = require('./coverage/trailing-function-declarations');

        const result = Test.method(3, 4);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/trailing-function-declarations') });
        const source = cov.files[0].source;
        const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
        expect(result).to.equal(7);
        expect(missedLines).to.equal(['19', '22']);
    });

    it('should measure coverage on conditional value', async () => {

        const Test = require('./coverage/conditional-value');

        expect(Test.method(false)).to.equal(false);
        expect(Test.method(true, 1, 0)).to.equal(1);
        expect(Test.method(true, 0, 1)).to.equal(1);
        expect(Test.method(true, 0, 0)).to.equal(0);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/conditional-value') });
        const source = cov.files[0].source;
        const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
        expect(missedLines).to.be.empty();
    });

    it('should measure missing coverage on conditional value', async () => {

        const Test = require('./coverage/conditional-value2');

        expect(Test.method(false, false, false)).to.equal(false);
        expect(Test.method(true, false, false)).to.equal(true);
        expect(Test.method(false, true, false)).to.equal(true);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/conditional-value2') });
        const source = cov.files[0].source;
        const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
        expect(missedLines).to.equal(['7']);
    });

    describe('analyze()', () => {

        it('sorts file paths in report', async () => {

            const files = global.__$$labCov.files;
            const paths = ['/a/b', '/a/b/c', '/a/c/b', '/a/c', '/a/b/c', '/a/b/a'];
            paths.forEach((path) => {

                files[path] = { source: [] };
            });

            const cov = await Lab.coverage.analyze({ coveragePath: '/a' });
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
            let file = require('./coverage/basic');

            const fileCovBefore = global.__$$labCov.files[filename];
            require.cache = Module._cache = {}; // clear require cache before additional require
            file = require('./coverage/basic'); //eslint-disable-line no-unused-vars
            require.cache = Module._cache = cacheBackup; // restore require cache

            const fileCovAfter = global.__$$labCov.files[filename];
            expect(fileCovAfter).to.equal(fileCovBefore);
        });
    });

    describe('coverage-all option', () => {

        it('reports coverage for all matching files', async () => {

            const Test = require('./coverage/coverage-all/covered');

            expect(Test.method(true)).to.equal(true);

            const cov = await Lab.coverage.analyze({
                'coverage-all': true,
                coveragePath: Path.join(__dirname, 'coverage/coverage-all'),
                coveragePattern: /\.(js)$/
            });
            expect(cov.percent).to.equal(70);

            expect(cov.files).to.have.length(2);

            const filename = cov.files[1].filename;
            expect(filename).to.equal('test/coverage/coverage-all/nested-folder/uncovered.js');

            const source = cov.files[1].source;
            const missedLines = Object.keys(source).filter((lineNumber) => source[lineNumber].miss);
            expect(missedLines).to.equal(['8', '11', '13']);
        });

        it('reports coverage when the path is a single file', async () => {

            const Test = require('./coverage/coverage-all/covered');

            expect(Test.method(true)).to.equal(true);

            const cov = await Lab.coverage.analyze({ 'coverage-all': true, coveragePath: Path.join(__dirname, 'coverage/coverage-all/covered.js') });

            expect(cov.files).to.have.length(1);
            expect(cov.percent).to.equal(100);
        });

        it('respects the coverage-flat option', async () => {

            const Test = require('./coverage/coverage-all/covered');

            expect(Test.method(true)).to.equal(true);

            const cov = await Lab.coverage.analyze({
                'coverage-all': true,
                'coverage-flat': true,
                coveragePath: Path.join(__dirname, 'coverage/coverage-all'),
                coveragePattern: /\.(js)$/
            });

            expect(cov.files).to.have.length(1);
            expect(cov.percent).to.equal(100);
        });
    });

    describe('coverage-module option', () => {

        it('reports external coverage', async () => {

            const coveragePath = Path.join(__dirname, 'coverage/module');
            Lab.coverage.instrument({ coveragePath, 'coverage-module': ['@hapi/lab-external-module-test'] });

            require(coveragePath);

            const cov = await Lab.coverage.analyze({ coveragePath });

            expect(cov.percent).to.equal(100);
            expect(cov.externals).to.equal(2);
            expect(cov.files[0].externals).to.equal([
                {
                    line: 9,
                    message: 'Checker missing tests for 2, 3',
                    source: 'Ext',
                    severity: 'error'
                },
                {
                    line: 12,
                    message: 'Checker missing tests for 3',
                    source: 'Ext',
                    severity: 'warning'
                }
            ]);

            const script = Lab.script();
            const { output, code } = await Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, 'coverage'), 'coverage-module': ['@hapi/lab-external-module-test'], output: false });
            expect(code).to.equal(1);
            expect(output).to.contain(internals.colors('External coverage:\u001b[90m\n' +
                'test/coverage/module.js:\u001b[0m\u001b[90m\n' +
                '\tExt:\u001b[0m\u001b[31m\n' +
                '\t\tLine 9: Checker missing tests for 2, 3\u001b[0m\u001b[33m\n' +
                '\t\tLine 12: Checker missing tests for 3\u001b[0m\n' +
                '\n'));
        });
    });
});

describe('Coverage via Transform API', () => {

    lab.before(() => {

        internals.js = require.extensions['.js'];
        internals.inl = require.extensions['.inl'];

        Lab.coverage.instrument({ coveragePath: Path.join(__dirname, 'coverage'), coverageExclude: 'exclude', transform: internals.transform });
    });

    lab.after(() => {

        require.extensions['.js'] = internals.js;
        require.extensions['.inl'] = internals.inl;
    });

    it('identifies lines with partial coverage when having inline sourcemap', async () => {

        const Test = require('./coverage/sourcemaps-transformed');

        Test.method(false);

        const cov = await Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/sourcemaps-transformed'), sourcemaps: true });

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
            { filename: 'while.js', lineNumber: '3', originalLineNumber: 13, originalColumn: 12 }
        ]);
    });
});


internals.colors = function (string) {

    if (SupportsColor.stdout) {
        return string;
    }

    return string.replace(/\u001b\[\d+m/g, '');
};
