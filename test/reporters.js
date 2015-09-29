// Load modules

var Crypto = require('crypto');
var Fs = require('fs');
var Os = require('os');
var Path = require('path');
var Stream = require('stream');
var Tty = require('tty');
var Code = require('code');
var Hoek = require('hoek');
var _Lab = require('../test_runner');
var Lab = require('../');
var Reporters = require('../lib/reporters');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Reporter', function () {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, './coverage/'), coverageExclude: 'exclude' });

    it('outputs to a stream', function (done) {

        var Recorder = function () {

            Stream.Writable.call(this);

            this.content = '';
        };

        Hoek.inherits(Recorder, Stream.Writable);

        Recorder.prototype._write = function (chunk, encoding, next) {

            this.content += chunk.toString();
            next();
        };

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (finished) {

                finished();
            });
        });

        var recorder = new Recorder();
        Lab.report(script, { output: recorder }, function (err, code, output) {

            expect(err).to.not.exist();
            expect(code).to.equal(0);
            expect(output).to.equal(recorder.content);
            done();
        });
    });

    it('outputs to a file', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (finished) {

                finished();
            });
        });

        var filename = Path.join(Os.tmpDir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));
        Lab.report(script, { output: filename }, function (err, code, output) {

            expect(err).to.not.exist();
            expect(code).to.equal(0);
            expect(output).to.equal(Fs.readFileSync(filename).toString());
            Fs.unlinkSync(filename);
            done();
        });
    });

    it('outputs to a file in a directory', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (finished) {

                finished();
            });
        });

        var randomname = [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-');
        var folder = Path.join(Os.tmpDir(), randomname);
        var filename = Path.join(folder, randomname);
        Lab.report(script, { output: filename }, function (err, code, output) {

            expect(err).to.not.exist();
            expect(code).to.equal(0);
            expect(output).to.equal(Fs.readFileSync(filename).toString());
            Fs.unlinkSync(filename);
            Fs.rmdirSync(folder);
            done();
        });
    });

    it('exits with error code when leak detected', function (done) {

        var reporter = Reporters.generate({ reporter: 'console' });
        var notebook = {
            tests: [],
            coverage: {
                percent: 30,
                files: []
            },
            leaks: ['something']
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with error code when coverage threshold is not met', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', coverage: true, threshold: 50 });
        var notebook = {
            tests: [],
            coverage: {
                percent: 30,
                files: []
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with success code when coverage threshold is met', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', coverage: true, threshold: 50 });
        var notebook = {
            tests: [],
            coverage: {
                percent: 60,
                files: []
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            done();
        });
    });

    it('exits with error code when linting error threshold is met', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-errors-threshold': 5 });
        var notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] },
                    { errors: [{ severity: 'ERROR' }, { severity: 'ERROR' }] },
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] },
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with error code when linting error threshold is met and threshold is 0', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-errors-threshold': 0 });
        var notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with success code when linting error threshold is not met', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-errors-threshold': 5 });
        var notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] },
                    { errors: [{ severity: 'ERROR' }, { severity: 'ERROR' }] },
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            done();
        });
    });

    it('exits with error code when linting warning threshold is met', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-warnings-threshold': 5 });
        var notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'ERROR' }, { severity: 'WARNING' }] },
                    { errors: [{ severity: 'WARNING' }, { severity: 'WARNING' }] },
                    { errors: [{ severity: 'ERROR' }, { severity: 'WARNING' }] },
                    { errors: [{ severity: 'ERROR' }, { severity: 'WARNING' }] }
                ]
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with error code when linting warning threshold is met and threshold is 0', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-warnings-threshold': 0 });
        var notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with success code when linting warning threshold is not met', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-warnings-threshold': 5 });
        var notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'ERROR' }, { severity: 'WARNING' }] },
                    { errors: [{ severity: 'WARNING' }, { severity: 'WARNING' }] },
                    { errors: [{ severity: 'ERROR' }, { severity: 'WARNING' }] }
                ]
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            done();
        });
    });

    describe('console', function () {

        it('generates a report', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    expect(true).to.equal(true);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console' }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.contain('1 tests complete');
                expect(output).to.contain('Test duration:');
                expect(output).to.contain('No global variable leaks detected');
                done();
            });
        });

        it('generates a report with errors', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    expect(true).to.equal(false);
                    finished();
                });
            });

            global.x1 = true;
            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                delete global.x1;
                expect(err).to.not.exist();
                expect(code).to.equal(1);
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      truefalse\n\n      Expected true to equal specified value\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nThe following leaks were detected:x1\n\n$/);
                done();
            });
        });

        it('generates a report with multi-line diff', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    expect(['a', 'b']).to.deep.equal(['a', 'c']);
                    finished();
                });
            });

            global.x1 = true;
            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                delete global.x1;
                expect(err).to.not.exist();
                expect(code).to.equal(1);
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      \[\n        \"a\",\n        \"bc\"\n      \]\n\n      Expected \[ 'a', 'b' \] to equal specified value\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nThe following leaks were detected:x1\n\n$/);
                done();
            });
        });

        it('generates a report with caught error', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    expect(function () {

                        throw new Error('boom');
                    }).to.not.throw();

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      Expected \[Function\] to not throw an error but got \[Error: boom\]\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\n\n$/);
                done();
            });
        });

        it('generates a report with caught error (data plain)', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    var error = new Error('boom');
                    error.data = 'abc';
                    throw error;
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      boom\n\n      at <trace>\n      at <trace>\n      at <trace>\n\n      Additional error data:\n      "abc"\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\n\n$/);
                done();
            });
        });

        it('generates a report with caught error (data array)', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    var error = new Error('boom');
                    error.data = [1, 2, 3];
                    throw error;
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      boom\n\n      at <trace>\n      at <trace>\n      at <trace>\n\n      Additional error data:\n      \[1,2,3\]\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\n\n$/);
                done();
            });
        });

        it('generates a report with caught error (data object)', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    var error = new Error('boom');
                    error.data = { a: 1 };
                    throw error;
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      boom\n\n      at <trace>\n      at <trace>\n      at <trace>\n\n      Additional error data:\n          a: 1\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\n\n$/);
                done();
            });
        });

        it('generates a report with plain Error', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('fails', function (finished) {

                    throw new Error('Error Message');
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test fails:\n\n      Error Message\n\n(?:      at <trace>\n)+(?:      at <trace>\n)+(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        describe('timeouts', function () {

            it('generates a report with timeout', function (done) {

                var script = Lab.script();
                script.experiment('test', function () {

                    script.test('works', function (finished) { });
                });

                Lab.report(script, { reporter: 'console', colors: false, timeout: 1 }, function (err, code, output) {

                    expect(err).to.not.exist();
                    expect(code).to.equal(1);
                    var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');
                    expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      Timed out \(\d+ms\) - test works\n\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                    done();
                });
            });

            var tests = [
                {
                    type: 'before',
                    expect: 'Timed out (1ms) - Before test'
                },
                {
                    type: 'after',
                    expect: 'Timed out (1ms) - After test'
                },
                {
                    type: 'beforeEach',
                    expect: 'Timed out (1ms) - Before each test'
                },
                {
                    type: 'afterEach',
                    expect: 'Timed out (1ms) - After each test'
                }
            ];

            tests.forEach(function (test) {

                it('generates a report with timeout on ' + test.type, function (done) {

                    var script = Lab.script();
                    script.experiment('test', function () {

                        script[test.type](function (finished) { });
                        script.test('works', function (finished) {

                            finished();
                        });
                    });

                    Lab.report(script, { reporter: 'console', colors: false, 'context-timeout': 1 }, function (err, code, output) {

                        expect(err).to.not.exist();
                        expect(code).to.equal(1);
                        expect(output).to.contain(test.expect);
                        done();
                    });
                });

                it('doesn\'t generates a report with timeout on ' + test.type, function (done) {

                    var script = Lab.script();
                    script.experiment('test', function () {

                        script[test.type](function (finished) {

                            setTimeout(finished, 500);
                        });

                        script.test('works', function (finished) {

                            finished();
                        });
                    });

                    Lab.report(script, { reporter: 'console', colors: false, 'context-timeout': 1000 }, function (err, code, output) {

                        expect(err).to.not.exist();
                        expect(code).to.equal(0);
                        done();
                    });
                });

                it('generates a report with inline timeout on ' + test.type, function (done) {

                    var script = Lab.script();
                    script.experiment('test', function () {

                        script[test.type]({ timeout: 1 }, function (finished) { });
                        script.test('works', function (finished) {

                            finished();
                        });
                    });

                    Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                        expect(err).to.not.exist();
                        expect(code).to.equal(1);
                        expect(output).to.contain(test.expect);
                        done();
                    });
                });
            });
        });

        it('generates a report without progress', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', progress: 0 }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.match(/^\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
                done();
            });
        });

        it('generates a report with verbose progress', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', progress: 2 }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.match(/^test\n  \u001b\[32m✔\u001b\[0m \u001b\[90m1\) works \(\d+ ms\)\u001b\[0m\n\n\n\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
                done();
            });
        });

        it('generates a report with verbose progress that displays well on windows', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    finished();
                });
            });

            var oldPlatform = process.platform;
            Object.defineProperty(process, 'platform', { writable: true, value: 'win32' });

            Lab.report(script, { reporter: 'console', progress: 2 }, function (err, code, output) {

                process.platform = oldPlatform;
                expect(err).not.to.exist();
                expect(output).to.contain('\u221A');

                done();
            });
        });

        it('generates a coverage report (verbose)', function (done) {

            var Test = require('./coverage/console');
            var Full = require('./coverage/console-full');

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test.method(1, 2, 3);
                    Full.method(1);
                    finished();
                });

                script.test('diff', function (finished) {

                    expect('abcd').to.equal('cdfg');
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/console') }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('Coverage: 78.95% (4/19)');
                expect(output).to.contain('test/coverage/console.js missing coverage on line(s): 12, 15, 16, 19');
                expect(output).to.not.contain('console-full');
                done();
            });
        });

        it('reports 100% coverage', function (done) {

            var reporter = Reporters.generate({ reporter: 'console', coverage: true });
            var notebook = {
                tests: [],
                coverage: {
                    percent: 100,
                    files: []
                }
            };

            reporter.finalize(notebook, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('Coverage: 100.00%');
                done();
            });
        });

        it('reports correct lines with sourcemaps enabled', function (done) {

            var Test = require('./coverage/sourcemaps-external');

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test.method(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-external'), sourcemaps: true }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('test/coverage/sourcemaps-external.js missing coverage from file(s):');
                expect(output).to.contain('test/coverage/while.js on line(s): 11, 12');
                done();
            });
        });

        it('doesn\'t report lines on a fully covered file with sourcemaps enabled', function (done) {

            var Test = require('./coverage/sourcemaps-covered');

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test.method(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/'), sourcemaps: true }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.not.contain('sourcemaps-covered');
                done();
            });
        });

        it('generates a report with multi-line progress', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                var works = function (finished) {

                    expect(true).to.equal(true);
                    finished();
                };

                var fails = function (finished) {

                    expect(true).to.equal(false);
                    finished();
                };

                var skips = function (finished) {

                    finished();
                };

                for (var i = 0; i < 30; ++i) {
                    script.test('works', works);
                    script.test('fails', fails);
                    script.test('skips', { skip: true }, skips);
                }
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.contain('.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x\n  -.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-');
                done();
            });
        });

        it('generates a report with verbose progress', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    finished();
                });

                script.test('fails', function (finished) {

                    finished('boom');
                });

                script.test('skips', { skip: true }, function (finished) {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, progress: 2 }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.match(/test\n  ✔ 1\) works \(\d+ ms\)\n  ✖2\) fails\n  \- 3\) skips \(\d+ ms\)\n/);
                done();
            });
        });

        it('excludes colors when terminal does not support', { parallel: false }, function (done) {

            var orig = Tty.isatty;
            Tty.isatty = function () {

                Tty.isatty = orig;
                return false;
            };

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    expect(true).to.equal(true);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console' }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.match(/^\n  \n  \.\n\n1 tests complete\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('displays custom error messages in expect', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    expect(true, 'Not working right').to.equal(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).not.to.exist();
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      truefalse\n\n      Not working right: Expected true to equal specified value\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('displays session errors if there in an error in "before"', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.before(function (testDone) {

                    testDone(new Error('there was an error in the before function'));
                });

                script.test('works', function (testDone) {

                    expect(true).to.equal(true);
                    testDone();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).not.to.exist();

                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');

                expect(code).to.equal(1);
                expect(result).to.contain('There were 1 test script error(s).');
                expect(result).to.contain('there was an error in the before function');
                done();
            });
        });

        it('displays session errors if there in an error in "afterEach"', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.afterEach(function (testDone) {

                    testDone('there was an error in the afterEach function');
                });

                script.test('works', function (testDone) {

                    expect(true).to.equal(true);
                    testDone();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).not.to.exist();

                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');

                expect(code).to.equal(1);
                expect(result).to.contain('There were 1 test script error(s).');
                expect(result).to.contain('there was an error in the afterEach function');
                done();
            });
        });

        it('generates a report with linting enabled', function (done) {

            var reporter = Reporters.generate({ reporter: 'console', coverage: true });
            var notebook = {
                tests: [],
                lint: {
                    'lint': [
                        {
                            filename: 'test.js',
                            errors: [
                                {
                                    severity: 'ERROR',
                                    line: 10,
                                    message: 'missing ;'
                                }
                            ]
                        }
                    ]
                }
            };

            reporter.finalize(notebook, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('missing ;');
                done();
            });
        });

        it('displays a success message for lint when no issues found', function (done) {

            var reporter = Reporters.generate({ reporter: 'console', coverage: true });
            var notebook = {
                tests: [],
                lint: {
                    'lint': [
                        {
                            filename: 'test.js',
                            errors: []
                        }
                    ]
                }
            };

            reporter.finalize(notebook, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('No issues');
                done();
            });
        });

        it('displays a success message for lint when errors are null', function (done) {

            var reporter = Reporters.generate({ reporter: 'console', coverage: true });
            var notebook = {
                tests: [],
                lint: {
                    'lint': [
                        {
                            filename: 'test.js',
                            errors: null
                        }
                    ]
                }
            };

            reporter.finalize(notebook, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('No issues');
                done();
            });
        });

        it('reports with circular JSON', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    var err = new Error('Fail');
                    err.actual = {
                        a: 1
                    };
                    err.actual.b = err.actual;
                    err.expected = {
                        a: 2
                    };
                    err.expected.b = err.expected;
                    throw err;
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).not.to.exist();
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      {\n        "a": 12,\n        "b": "\[Circular ~\]"\n      }\n\n      Fail\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('reports with undefined values', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    var err = new Error('Fail');
                    err.actual = { a: 1 };
                    err.expected = {
                        a: 1,
                        b: undefined,
                        c: function () {

                            return 'foo';
                        },
                        d: Infinity,
                        e: -Infinity
                    };
                    throw err;
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).not.to.exist();
                var result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      {\n\s+"a": 1,\n\s+"b": "\[undefined\]",\n\s+"c": "\[function \(\) \{\\n\\n\s+return 'foo';\\n\s+\}\]",\n\s+"d": "\[Infinity\]",\n\s+"e": "\[-Infinity\]"\n\s+}\n\n      Fail\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });
    });

    describe('json', function () {

        it('generates a report', function (done) {

            var script = Lab.script();
            script.experiment('group', function () {

                script.test('works', function (finished) {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test('fails', function (finished) {

                    expect(true).to.equal(false);
                    finished();
                });

                script.test('fails with non-error', function (finished) {

                    finished('boom');
                    finished('kaboom');
                });
            });

            Lab.report(script, { reporter: 'json', lint: true, linter: 'eslint' }, function (err, code, output) {

                var result = JSON.parse(output);
                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(result.tests.group.length).to.equal(3);
                expect(result.tests.group[0].title).to.equal('works');
                expect(result.tests.group[0].err).to.equal(false);
                expect(result.tests.group[1].title).to.equal('fails');
                expect(result.tests.group[1].err).to.equal('Expected true to equal specified value');
                expect(result.tests.group[2].title).to.equal('fails with non-error');
                expect(result.tests.group[2].err).to.equal(true);
                expect(result.leaks.length).to.equal(0);
                expect(result.duration).to.exist();
                expect(result.errors).to.have.length(1);
                expect(result.lint.length).to.be.greaterThan(1);
                expect(result.lint[0].filename).to.exist();
                expect(result.lint[0].errors).to.exist();
                done();
            });
        });

        it('generates a report with coverage', function (done) {

            var Test = require('./coverage/json');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('value of a', function (finished) {

                    expect(Test.method(1)).to.equal(1);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'json', coverage: true, coveragePath: Path.join(__dirname, './coverage/json') }, function (err, code, output) {

                expect(err).not.to.exist();
                var result = JSON.parse(output);
                expect(result.coverage.percent).to.equal(100);
                done();
            });
        });
    });

    describe('html', function () {

        it('generates a coverage report', function (done) {

            var Test = require('./coverage/html');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html') }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('<div class="stats medium">');
                expect(output).to.contain('<span class="cov medium">69.23</span>');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a coverage report including sourcemaps information', function (done) {

            var Test = require('./coverage/sourcemaps-external');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test.method(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-external'), sourcemaps: true }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain([
                    '<th>Original filename</th>',
                    '<th>Original line</th>',
                    '<td class="sourcemaps file" data-tooltip>test/coverage/sourcemaps-external.js</td>',
                    '<td class="sourcemaps line" data-tooltip>1</td>',
                    '<td class="sourcemaps line" data-tooltip>6</td>',
                    '<td class="sourcemaps line" data-tooltip>9</td>',
                    '<td class="sourcemaps line" data-tooltip>11</td>',
                    '<td class="sourcemaps line" data-tooltip>12</td>',
                    '<td class="sourcemaps line" data-tooltip>13</td>',
                    '<td class="sourcemaps line" data-tooltip>16</td>'
                ]);
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a coverage report with linting enabled and multiple files', function (done) {

            var Test1 = require('./coverage/html-lint/html-lint.1');
            var Test2 = require('./coverage/html-lint/html-lint.2');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test1.method(1, 2, 3);
                    finished();
                });

                script.test('something', function (finished) {

                    Test2.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html-lint/'), lint: true, linter: 'eslint', lintingPath: Path.join(__dirname, './coverage/html-lint') }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output)
                    .to.contain('<div class="stats medium">')
                    .and.to.contain('<span class="errors" data-tooltip="indent - Expected indentation of 4 space characters but found 0.&#xa;eqeqeq - Expected &#x27;&#x3d;&#x3d;&#x3d;&#x27; and instead saw &#x27;&#x3d;&#x3d;&#x27;.&#xa;semi - Missing semicolon."></span>')
                    .and.to.contain('<span class="warnings" data-tooltip="no-eq-null - Use &#8216;&#x3d;&#x3d;&#x3d;&#8217; to compare with &#8216;null&#8217;."></span>')
                    .and.to.contain('<span class="lint-errors low">8</span>')
                    .and.to.contain('<span class="lint-warnings low">1</span>')
                    .and.to.contain('<li class="lint-entry">L11 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 space characters but found 0.</li>')
                    .and.to.contain('<li class="lint-entry">L12 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 space characters but found 0.</li>')
                    .and.to.contain('<li class="lint-entry">L13 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 space characters but found 0.</li>')
                    .and.to.contain('<li class="lint-entry">L16 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 space characters but found 0.</li>')
                    .and.to.contain('<li class="lint-entry">L19 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 space characters but found 0.</li>')
                    .and.to.contain('<li class="lint-entry">L19 - <span class="level-WARNING">WARNING</span> - no-eq-null - Use &#8216;&#x3d;&#x3d;&#x3d;&#8217; to compare with &#8216;null&#8217;.</li>')
                    .and.to.contain('<li class="lint-entry">L19 - <span class="level-ERROR">ERROR</span> - eqeqeq - Expected &#x27;&#x3d;&#x3d;&#x3d;&#x27; and instead saw &#x27;&#x3d;&#x3d;&#x27;.</li>')
                    .and.to.contain('<li class="lint-entry">L19 - <span class="level-ERROR">ERROR</span> - semi - Missing semicolon.</li>')
                    .and.to.contain('<li class="lint-entry">L21 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 space characters but found 0.</li>');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a coverage report with linting enabled with thresholds', function (done) {

            var Test1 = require('./coverage/html-lint/html-lint.1');
            var Test2 = require('./coverage/html-lint/html-lint.2');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test1.method(1, 2, 3);
                    finished();
                });

                script.test('something', function (finished) {

                    Test2.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html-lint/'), lint: true, linter: 'eslint', lintingPath: Path.join(__dirname, './coverage/html-lint'), 'lint-errors-threshold': 2, 'lint-warnings-threshold': 2 }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output)
                    .to.contain('<span class="lint-errors low">8</span>')
                    .and.to.contain('<span class="lint-warnings medium">1</span>');

                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a report with test script errors', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.before(function (finished) { });
                script.test('works', function (finished) {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', 'context-timeout': 1 }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output)
                    .to.contain('Timed out &#x28;1ms&#x29; - Before test')
                    .and.to.contain('at Timer.listOnTimeout');
                done();
            });
        });

        it('generates a report with test script errors that are not Error', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.before(function (finished) { throw 'abc'; });
                script.test('works', function (finished) {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', 'context-timeout': 1 }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.contain('<div>abc</div>');
                done();
            });
        });

        it('tags file percentile based on levels', function (done) {

            var reporter = Reporters.generate({ reporter: 'html' });
            var notebook = {
                coverage: {
                    percent: 30,
                    files: [
                        {
                            filename: 'a',
                            percent: 10
                        },
                        {
                            filename: 'b',
                            percent: 10.1234
                        },
                        {
                            filename: 'c',
                            percent: 76
                        },
                        {
                            filename: 'd',
                            percent: 26
                        }
                    ]
                }
            };

            reporter.finalize(notebook, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('<span class="cov terrible">10</span>');
                expect(output).to.contain('<span class="cov terrible">10.12</span>');
                expect(output).to.contain('<span class="cov high">76</span>');
                expect(output).to.contain('<span class="cov low">26</span>');
                done();
            });
        });

        it('tags total percentile (terrible)', function (done) {

            var reporter = Reporters.generate({ reporter: 'html' });
            var notebook = {
                coverage: {
                    percent: 10,
                    files: [
                        {
                            filename: 'a',
                            percent: 10
                        }
                    ]
                }
            };

            reporter.finalize(notebook, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('<span class="cov terrible">10</span>');
                done();
            });
        });

        it('tags total percentile (high)', function (done) {

            var reporter = Reporters.generate({ reporter: 'html' });
            var notebook = {
                coverage: {
                    percent: 80,
                    files: [
                        {
                            filename: 'a',
                            percent: 80
                        }
                    ]
                }
            };

            reporter.finalize(notebook, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('<span class="cov high">80</span>');
                done();
            });
        });

        it('includes test run data', function (done) {

            var Test = require('./coverage/html');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.describe('lab', function () {

                    script.test('something', function (finished) {

                        Test.method(1, 2, 3);
                        finished();
                    });

                    script.test('something else', function (finished) {

                        Test.method(1, 2, 3);
                        finished();
                    });
                });
            });

            Lab.report(script, { reporter: 'html', coveragePath: Path.join(__dirname, './coverage/html') }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('Test Report');
                expect(output).to.contain('test-title');
                delete global.__$$testCovHtml;
                done();
            });
        });
    });

    describe('tap', function () {

        it('generates a report', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test('skip', { skip: true }, function (finished) {

                    finished();
                });

                script.test('todo');

                script.test('fails', function (finished) {

                    expect(true).to.equal(false);
                    finished();
                });

                script.test('fails with non-error', function (finished) {

                    finished('boom');
                });
            });

            Lab.report(script, { reporter: 'tap' }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                var result = output.replace(/      .*\n/g, '      <trace>\n');
                expect(result).to.match(/^TAP version 13\n1..5\nok 1 \(1\) test works\n  ---\n  duration_ms: \d+\n  ...\nok 2 # SKIP \(2\) test skip\nok 3 # TODO \(3\) test todo\nnot ok 4 \(4\) test fails\n  ---\n  duration_ms: \d+\n  stack: |-\n    Expected true to equal specified value\n(?:      <trace>\n)+  ...\nnot ok 5 \(5\) test fails with non-error\n  ---\n  duration_ms: \d+\n  ...\n# tests 4\n# pass 1\n# fail 2\n# skipped 1\n# todo 1\n$/);
                done();
            });
        });
    });

    describe('junit', function () {

        it('generates a report', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test('skip', { skip: true }, function (finished) {

                    finished();
                });

                script.test('todo');

                script.test('fails', function (finished) {

                    expect(true).to.equal(false);
                    finished();
                });

                script.test('fails with non-error', function (finished) {

                    finished('boom');
                });
            });

            Lab.report(script, { reporter: 'junit' }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.contain([
                    'tests="5"',
                    'errors="0"',
                    'skipped="2"',
                    'failures="2"',
                    '<failure message="Expected true to equal specified value" type="Error">'
                ]);

                done();
            });
        });
    });

    describe('lcov', function () {

        it('generates a lcov report', function (done) {

            var Test = require('./coverage/html');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'lcov', coverage: true }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(0);

                expect(output).to.contain('coverage/html.js');
                expect(output).to.contain('DA:1,1');                    // Check that line is marked as covered
                expect(output).to.contain('LF:13');                     // Total Lines
                expect(output).to.contain('LH:9');                      // Lines Hit
                expect(output).to.contain('end_of_record');

                done();
            });
        });

        it('runs without coverage but doesn\'t generate output', function (done) {

            var Test = require('./coverage/html');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('something', function (finished) {

                    Test.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'lcov', coverage: false }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.be.empty();

                done();
            });
        });
    });

    describe('clover', function () {

        it('generates a report', function (done) {

            var Test = require('./coverage/clover');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.describe('lab', function () {

                    script.test('something', function (finished) {

                        Test.method(1, 2, 3);
                        finished();
                    });

                    script.test('something else', function (finished) {

                        Test.method(1, 2, 3);
                        finished();
                    });
                });
            });

            Lab.report(script, { reporter: 'clover', coverage: true, coveragePath: Path.join(__dirname, './coverage/clover') }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.contain('clover.test.coverage');
                expect(output).to.contain('<line num="9" count="1" type="stmt"/>');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('correctly defaults a package root name', function (done) {

            var reporter = Reporters.generate({ reporter: 'clover', coveragePath: null });

            expect(reporter.settings.packageRoot).to.equal('root');

            var Test = require('./coverage/clover');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.describe('lab', function () {

                    script.test('something', function (finished) {

                        Test.method(1, 2, 3);
                        finished();
                    });

                    script.test('something else', function (finished) {

                        Test.method(1, 2, 3);
                        finished();
                    });
                });
            });

            var origCwd = process.cwd();
            process.chdir(Path.join(__dirname, './coverage/'));

            Lab.report(script, { reporter: 'clover', coverage: true, coveragePath: Path.join(__dirname, './coverage/clover') }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.not.contain('clover.test.coverage');
                expect(output).to.contain('<coverage generated=');
                delete global.__$$testCovHtml;
                process.chdir(origCwd);
                done();
            });
        });

        it('correctly determines a package root name', function (done) {

            var reporter = Reporters.generate({ reporter: 'clover', coveragePath: Path.join(__dirname, './somepath') });

            expect(reporter.settings.packageRoot).to.equal('somepath');
            done();
        });

        it('results in an empty generation', function (done) {

            var Test = require('./coverage/clover');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.describe('lab', function () {

                    script.test('something', function (finished) {

                        Test.method(1, 2, 3);
                        finished();
                    });

                    script.test('something else', function (finished) {

                        Test.method(1, 2, 3);
                        finished();
                    });
                });
            });

            Lab.report(script, { reporter: 'clover', coverage: false, coveragePath: Path.join(__dirname, './coverage/clover') }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(output).to.not.contain('clover.test.coverage');
                expect(output).to.contain('<coverage generated=');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('should generate a report with multiple files', function (done) {

            var output = '';
            var reporter = Reporters.generate({ reporter: 'clover' });

            reporter.report = function (text) {

                output += text;
            };

            reporter.end({
                coverage: {
                    files: [
                        { filename: 'fileA.js', hits: 0, misses: 0, sloc: 0 },
                        { filename: 'fileB.js', hits: 0, misses: 0, sloc: 0 }
                    ]
                }
            });

            expect(output).to.contain('<package name="root">');
            expect(output).to.contain('<file name="fileA.js"');
            expect(output).to.contain('<file name="fileB.js"');
            done();
        });
    });

    describe('multiple reporters', function () {

        it('with multiple outputs are supported', function (done) {

            var Recorder = function () {

                Stream.Writable.call(this);

                this.content = '';
            };

            Hoek.inherits(Recorder, Stream.Writable);

            Recorder.prototype._write = function (chunk, encoding, next) {

                this.content += chunk.toString();
                next();
            };

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    finished();
                });
            });

            var recorder = new Recorder();
            var filename = Path.join(Os.tmpDir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));

            Lab.report(script, { reporter: ['lcov', 'console'], output: [filename, recorder], coverage: true }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code.lcov).to.equal(0);
                expect(code.console).to.equal(0);
                expect(output.lcov).to.equal(Fs.readFileSync(filename).toString());
                expect(output.console).to.equal(recorder.content);
                Fs.unlinkSync(filename);
                done();
            });
        });


        it('that are duplicates with multiple outputs are supported', function (done) {

            var Recorder = function () {

                Stream.Writable.call(this);

                this.content = '';
            };

            Hoek.inherits(Recorder, Stream.Writable);

            Recorder.prototype._write = function (chunk, encoding, next) {

                this.content += chunk.toString();
                next();
            };

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    finished();
                });
            });

            var recorder = new Recorder();
            var filename = Path.join(Os.tmpDir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));

            Lab.report(script, { reporter: ['console', 'console'], output: [filename, recorder], coverage: true }, function (err, code, output) {

                expect(err).to.not.exist();
                expect(code.console).to.equal(0);
                expect(code.console2).to.equal(0);
                expect(output.console).to.equal(Fs.readFileSync(filename).toString());
                expect(output.console2).to.equal(recorder.content);
                Fs.unlinkSync(filename);
                done();
            });
        });
    });

    describe('custom reporters', function () {

        it('requires a custom reporter relatively if starts with .', function (done) {

            var reporter = './node_modules/lab-event-reporter/index.js';

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    finished();
                });
            });

            Lab.report(script, { reporter: reporter }, function (err, code, output) {

                expect(err).to.not.exist();
                done();
            });
        });

        it('requires a custom reporter from node_modules if not starting with .', function (done) {

            var reporter = 'lab-event-reporter';

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    finished();
                });
            });

            Lab.report(script, { reporter: reporter }, function (err, code, output) {

                expect(err).to.not.exist();
                done();
            });
        });
    });
});
