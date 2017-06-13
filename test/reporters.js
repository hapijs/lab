'use strict';

// Load modules

const Crypto = require('crypto');
const Fs = require('fs');
const Os = require('os');
const Path = require('path');
const Stream = require('stream');
const Tty = require('tty');
const Code = require('code');
const Hoek = require('hoek');
const _Lab = require('../test_runner');
const Lab = require('../');
const Reporters = require('../lib/reporters');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Reporter', () => {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, './coverage/'), coverageExclude: 'exclude' });

    it('outputs to a stream', (done) => {

        const Recorder = function () {

            Stream.Writable.call(this);

            this.content = '';
        };

        Hoek.inherits(Recorder, Stream.Writable);

        Recorder.prototype._write = function (chunk, encoding, next) {

            this.content += chunk.toString();
            next();
        };

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', (finished) => {

                finished();
            });
        });

        const recorder = new Recorder();
        Lab.report(script, { output: recorder }, (err, code, output) => {

            expect(err).to.not.exist();
            expect(code).to.equal(0);
            expect(output).to.equal(recorder.content);
            done();
        });
    });

    it('outputs to a file', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', (finished) => {

                finished();
            });
        });

        const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));
        Lab.report(script, { output: filename }, (err, code, output) => {

            expect(err).to.not.exist();
            expect(code).to.equal(0);
            expect(output).to.equal(Fs.readFileSync(filename).toString());
            Fs.unlinkSync(filename);
            done();
        });
    });

    it('outputs to a file in a directory', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', (finished) => {

                finished();
            });
        });

        const randomname = [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-');
        const folder = Path.join(Os.tmpdir(), randomname);
        const filename = Path.join(folder, randomname);
        Lab.report(script, { output: filename }, (err, code, output) => {

            expect(err).to.not.exist();
            expect(code).to.equal(0);
            expect(output).to.equal(Fs.readFileSync(filename).toString());
            Fs.unlinkSync(filename);
            Fs.rmdirSync(folder);
            done();
        });
    });

    it('outputs to a file with output is passed as an array and reporter is an array', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', (finished) => {

                finished();
            });
        });

        const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(7).toString('hex')].join('-'));
        Lab.report(script, { reporter: ['console'], output: [filename] }, (err, code, output) => {

            expect(err).to.not.exist();
            expect(code).to.equal(0);
            expect(output).to.equal(Fs.readFileSync(filename).toString());
            Fs.unlinkSync(filename);
            done();
        });
    });

    it('exits with error code when leak detected', (done) => {

        const reporter = Reporters.generate({ reporter: 'console' });
        const notebook = {
            tests: [],
            coverage: {
                percent: 30,
                files: []
            },
            leaks: ['something']
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with error code when coverage threshold is not met', (done) => {

        const reporter = Reporters.generate({ reporter: 'console', coverage: true, threshold: 50 });
        const notebook = {
            tests: [],
            coverage: {
                percent: 30,
                files: []
            }
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with success code when coverage threshold is met', (done) => {

        const reporter = Reporters.generate({ reporter: 'console', coverage: true, threshold: 50 });
        const notebook = {
            tests: [],
            coverage: {
                percent: 60,
                files: []
            }
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            done();
        });
    });

    it('exits with error code when linting error threshold is met', (done) => {

        const reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-errors-threshold': 5 });
        const notebook = {
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

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with error code when linting error threshold is met and threshold is 0', (done) => {

        const reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-errors-threshold': 0 });
        const notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with success code when linting error threshold is not met', (done) => {

        const reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-errors-threshold': 5 });
        const notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] },
                    { errors: [{ severity: 'ERROR' }, { severity: 'ERROR' }] },
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            done();
        });
    });

    it('exits with error code when linting warning threshold is met', (done) => {

        const reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-warnings-threshold': 5 });
        const notebook = {
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

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with error code when linting warning threshold is met and threshold is 0', (done) => {

        const reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-warnings-threshold': 0 });
        const notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('exits with success code when linting warning threshold is not met', (done) => {

        const reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-warnings-threshold': 5 });
        const notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'ERROR' }, { severity: 'WARNING' }] },
                    { errors: [{ severity: 'WARNING' }, { severity: 'WARNING' }] },
                    { errors: [{ severity: 'ERROR' }, { severity: 'WARNING' }] }
                ]
            }
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            done();
        });
    });

    it('includes the used seed for shuffle in the output', (done) => {

        const reporter = Reporters.generate({ reporter: 'console' });
        const notebook = {
            tests: [],
            seed: 1234,
            shuffle: true
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(output).to.contain('1234');
            expect(output).to.contain('seed');
            expect(err).not.to.exist();
            done();
        });
    });

    it('does not include the seed if shuffle was not active', (done) => {

        const reporter = Reporters.generate({ reporter: 'console' });
        const notebook = {
            tests: [],
            seed: 1234
        };

        reporter.finalize(notebook, (err, code, output) => {

            expect(output).to.not.contain('1234');
            expect(output).to.not.contain('seed');
            expect(err).not.to.exist();
            done();
        });
    });

    describe('console', () => {

        it('generates a report', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.contain('1 tests complete');
                expect(output).to.contain('Test duration:');
                expect(output).to.contain('No global variable leaks detected');
                done();
            });
        });
        it('generate a report with stable diff of actual/expected objects of a failed test', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect({ a: 1, b:2, c:3, d:4, e:66 }).to.equal({ a: 1, e:5, b:2, c:3, d:4 });
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.contain('"e": 665');
                expect(output).to.contain('1 of 1 tests failed');
                expect(output).to.contain('Test duration:');
                expect(output).to.contain('No global variable leaks detected');
                done();
            });
        });

        it('counts "todo" tests as skipped', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test.skip('a skipped test', (done) => {

                    done(new Error('Should not be called'));
                });

                script.test('a todo test');
            });

            Lab.report(script, { reporter: 'console', output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.contain([
                    '1 tests complete',
                    '2 skipped'
                ]);
                done();
            });
        });

        it('generates a report with errors', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(false);
                    finished();
                });
            });

            global.x1 = true;
            Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false }, (err, code, output) => {

                delete global.x1;
                expect(err).to.not.exist();
                expect(code).to.equal(1);
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      truefalse\n\n      Expected true to equal specified value: false\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nThe following leaks were detected:x1\n\n$/);
                done();
            });
        });

        it('generates a report with multi-line diff', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(['a', 'b']).to.equal(['a', 'c']);
                    finished();
                });
            });

            global.x1 = true;
            Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false }, (err, code, output) => {

                delete global.x1;
                expect(err).to.not.exist();
                expect(code).to.equal(1);
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      \[\n        \"a\",\n        \"bc\"\n      \]\n\n      Expected \[ 'a', 'b' \] to equal specified value: \[ 'a', 'c' \]\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nThe following leaks were detected:x1\n\n$/);
                done();
            });
        });

        it('generates a report with caught error', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(() => {

                        throw new Error('boom');
                    }).to.not.throw();

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.contain('Failed tests:');
                expect(output).to.contain('1) test works:');
                expect(output).to.contain(' of 1 tests failed');
                done();
            });
        });

        it('generates a report with caught error (data plain)', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    const error = new Error('boom');
                    error.data = 'abc';
                    throw error;
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false, assert: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      boom\n\n/);
                expect(result).to.match(/Additional error data:\n      "abc"\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\n\n$/);
                done();
            });
        });

        it('generates a report with caught error (data array)', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    const error = new Error('boom');
                    error.data = [1, 2, 3];
                    throw error;
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false, assert: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      boom\n\n/);
                expect(result).to.match(/Additional error data:\n      \[1,2,3\]\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\n\n$/);
                done();
            });
        });

        it('generates a report with caught error (data object)', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    const error = new Error('boom');
                    error.data = { a: 1 };
                    throw error;
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.contain('Failed tests:\n\n  1)');
                expect(result).to.contain('Additional error data:\n          a: 1\n\n\n1 of 1 tests failed\nTest duration:');
                done();
            });
        });

        it('generates a report with plain Error', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('fails', (finished) => {

                    throw new Error('Error Message');
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test fails:\n\n      Error Message\n\n(?:      at <trace>\n)+(?:      at <trace>\n)+(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        describe('timeouts', () => {

            it('generates a report with timeout', (done) => {

                const script = Lab.script();
                script.experiment('test', () => {

                    script.test('works', (finished) => { });
                });

                Lab.report(script, { reporter: 'console', colors: false, timeout: 1, output: false, assert: false }, (err, code, output) => {

                    expect(err).to.not.exist();
                    expect(code).to.equal(1);
                    const result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');
                    expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      Timed out \(\d+ms\) - test works\n\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                    done();
                });
            });

            const tests = [
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

            tests.forEach((test) => {

                it('generates a report with timeout on ' + test.type, (done) => {

                    const script = Lab.script();
                    script.experiment('test', () => {

                        script[test.type]((finished) => { });
                        script.test('works', (finished) => {

                            finished();
                        });
                    });

                    Lab.report(script, { reporter: 'console', colors: false, 'context-timeout': 1, output: false }, (err, code, output) => {

                        expect(err).to.not.exist();
                        expect(code).to.equal(1);
                        expect(output).to.contain(test.expect);
                        done();
                    });
                });

                it('doesn\'t generates a report with timeout on ' + test.type, (done) => {

                    const script = Lab.script();
                    script.experiment('test', () => {

                        script[test.type]((finished) => {

                            setTimeout(finished, 500);
                        });

                        script.test('works', (finished) => {

                            finished();
                        });
                    });

                    Lab.report(script, { reporter: 'console', colors: false, 'context-timeout': 1000, output: false }, (err, code, output) => {

                        expect(err).to.not.exist();
                        expect(code).to.equal(0);
                        done();
                    });
                });

                it('generates a report with inline timeout on ' + test.type, (done) => {

                    const script = Lab.script();
                    script.experiment('test', () => {

                        script[test.type]({ timeout: 1 }, (finished) => { });
                        script.test('works', (finished) => {

                            finished();
                        });
                    });

                    Lab.report(script, { reporter: 'console', colors: false, output: false }, (err, code, output) => {

                        expect(err).to.not.exist();
                        expect(code).to.equal(1);
                        expect(output).to.contain(test.expect);
                        done();
                    });
                });
            });
        });

        it('generates a report with all notes displayed', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished.note('This is a sweet feature');
                    finished.note('Here is another note');
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', progress: 0, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('This is a sweet feature');
                expect(output).to.contain('Here is another note');
                done();
            });
        });

        it('generates a report without progress', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', progress: 0, output: false, assert: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.match(/^\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
                done();
            });
        });

        it('generates a report with verbose progress', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', progress: 2, output: false, assert: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.match(/^test\n  \u001b\[32m[✔√]\u001b\[0m \u001b\[92m1\) works \(\d+ ms\)\u001b\[0m\n\n\n\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
                done();
            });
        });

        it('generates a report with verbose progress with experiments with same named tests', (done) => {

            const script = Lab.script();
            script.experiment('experiment', () => {

                script.experiment('sub experiment', () => {

                    script.experiment('sub sub experiment', () => {

                        script.test('works', (finished) => finished());
                    });
                });

                script.experiment('sub experiment', () => {

                    script.experiment('sub sub experiment', () => {

                        script.test('works', (finished) => finished());
                    });
                });

                script.experiment('sub experiment', () => {

                    script.experiment('sub sub experiment 1', () => {

                        script.experiment('sub sub sub experiment', () => {

                            script.test('works', (finished) => finished());
                        });
                    });

                    script.experiment('sub sub experiment', () => {

                        script.experiment('sub sub sub experiment', () => {

                            script.test('works', (finished) => finished());
                        });
                    });
                });
            });

            Lab.report(script, { reporter: 'console', progress: 2, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('4) works');
                done();
            });
        });

        it('generates a report with verbose progress with the same test name and no wrapper experiment', (done) => {

            const script = Lab.script();
            script.test('works', (finished) => finished());
            script.test('works', (finished) => finished());

            Lab.report(script, { reporter: 'console', progress: 2, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('1) works');
                expect(output).to.contain('2) works');
                done();
            });
        });

        it('generates a report with verbose progress and assertions count per test', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(finished).to.exist();
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', progress: 2, assert: Code, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.match(/^test\n  \u001b\[32m[✔√]\u001b\[0m \u001b\[92m1\) works \(\d+ ms and \d+ assertions\)\u001b\[0m\n\n\n\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\nAssertions count\: \d+ \(verbosity\: \d+\.\d+\)\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
                done();
            });
        });

        it('generates a report with verbose progress that displays well on windows', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished();
                });
            });

            const oldPlatform = process.platform;
            Object.defineProperty(process, 'platform', { writable: true, value: 'win32' });

            Lab.report(script, { reporter: 'console', progress: 2, output: false }, (err, code, output) => {

                process.platform = oldPlatform;
                expect(err).not.to.exist();
                expect(output).to.contain('\u221A');

                done();
            });
        });

        it('generates a report without skipped and todo tests', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test.skip('a skipped test', (done) => {

                    done(new Error('Should not be called'));
                });

                script.test('a todo test');
            });

            Lab.report(script, { reporter: 'console', 'silent-skips': true, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.contain([
                    '  .\n',
                    '1 tests complete',
                    '2 skipped'
                ]);
                done();
            });
        });

        it('generates a verbose report without skipped and todo tests', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test.skip('a skipped test', (done) => {

                    done(new Error('Should not be called'));
                });

                script.test('a todo test');
            });

            Lab.report(script, { reporter: 'console', progress: 2, 'silent-skips': true, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.not.contain('a skipped test');
                expect(output).to.not.contain('a todo test');
                expect(output).to.contain([
                    '1 tests complete',
                    '2 skipped'
                ]);
                done();
            });
        });

        it('generates a coverage report (verbose)', (done) => {

            const Test = require('./coverage/console');
            const Full = require('./coverage/console-full');

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(1, 2, 3);
                    Full.method(1);
                    finished();
                });

                script.test('diff', (finished) => {

                    expect('abcd').to.equal('cdfg');
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/console'), output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('Coverage: 76.47% (4/17)');
                expect(output).to.contain('test/coverage/console.js missing coverage on line(s): 14, 17, 18, 21');
                expect(output).to.not.contain('console-full');
                done();
            });
        });

        it('reports 100% coverage', (done) => {

            const reporter = Reporters.generate({ reporter: 'console', coverage: true });
            const notebook = {
                tests: [],
                coverage: {
                    percent: 100,
                    files: []
                }
            };

            reporter.finalize(notebook, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('Coverage: 100.00%');
                done();
            });
        });

        it('reports correct lines with sourcemaps enabled', (done) => {

            const Test = require('./coverage/sourcemaps-external');

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-external'), sourcemaps: true, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('test/coverage/sourcemaps-external.js missing coverage from file(s):');
                expect(output).to.contain('while.js on line(s): 13, 14');
                done();
            });
        });

        it('doesn\'t report lines on a fully covered file with sourcemaps enabled', (done) => {

            const Test = require('./coverage/sourcemaps-covered');

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/'), sourcemaps: true, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.not.contain('sourcemaps-covered');
                done();
            });
        });

        it('generates a report with multi-line progress', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                const works = function (finished) {

                    expect(true).to.equal(true);
                    finished();
                };

                const fails = function (finished) {

                    expect(true).to.equal(false);
                    finished();
                };

                const skips = function (finished) {

                    finished();
                };

                for (let i = 0; i < 30; ++i) {
                    script.test('works', works);
                    script.test('fails', fails);
                    script.test('skips', { skip: true }, skips);
                }
            });

            Lab.report(script, { reporter: 'console', colors: false, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.contain('.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x\n  -.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-');
                done();
            });
        });

        it('generates a report with verbose progress', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished();
                });

                script.test('fails', (finished) => {

                    finished('boom');
                });

                script.test('skips', { skip: true }, (finished) => {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, progress: 2, output: false, assert: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.match(/test\n  [✔√] 1\) works \(\d+ ms\)\n  [✖×] 2\) fails\n  \- 3\) skips \(\d+ ms\)\n/);
                done();
            });
        });

        it('excludes colors when terminal does not support', { parallel: false }, (done) => {

            const orig = Tty.isatty;
            Tty.isatty = function () {

                Tty.isatty = orig;
                return false;
            };

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', output: false, assert: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.match(/^\n  \n  \.\n\n1 tests complete\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('displays custom error messages in expect', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true, 'Not working right').to.equal(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false }, (err, code, output) => {

                expect(err).not.to.exist();
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      truefalse\n\n      Not working right: Expected true to equal specified value: false\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('displays session errors if there in an error in "before"', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.before((testDone) => {

                    testDone(new Error('there was an error in the before function'));
                });

                script.test('works', (testDone) => {

                    expect(true).to.equal(true);
                    testDone();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, output: false }, (err, code, output) => {

                expect(err).not.to.exist();

                const result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');

                expect(code).to.equal(1);
                expect(result).to.contain('There were 1 test script error(s).');
                expect(result).to.contain('there was an error in the before function');
                done();
            });
        });

        it('displays session errors if there in an error in "afterEach"', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.afterEach((testDone) => {

                    testDone(new Error('there was an error in the afterEach function'));
                });

                script.test('works', (testDone) => {

                    expect(true).to.equal(true);
                    testDone();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, output: false }, (err, code, output) => {

                expect(err).not.to.exist();

                const result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');

                expect(code).to.equal(1);
                expect(result).to.contain('There were 1 test script error(s).');
                expect(result).to.contain('there was an error in the afterEach function');
                done();
            });
        });

        it('generates a report with linting enabled', (done) => {

            const reporter = Reporters.generate({ reporter: 'console', coverage: true });
            const notebook = {
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

            reporter.finalize(notebook, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('missing ;');
                done();
            });
        });

        it('displays a success message for lint when no issues found', (done) => {

            const reporter = Reporters.generate({ reporter: 'console', coverage: true });
            const notebook = {
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

            reporter.finalize(notebook, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('No issues');
                done();
            });
        });

        it('displays a success message for lint when errors are null', (done) => {

            const reporter = Reporters.generate({ reporter: 'console', coverage: true });
            const notebook = {
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

            reporter.finalize(notebook, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('No issues');
                done();
            });
        });

        it('reports with circular JSON', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    const err = new Error('Fail');
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

            Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false }, (err, code, output) => {

                expect(err).not.to.exist();
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      {\n        "a": 12,\n        "b": "\[Circular ~\]"\n      }\n\n      Fail\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('reports with undefined values', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    const err = new Error('Fail');
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

            Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false }, (err, code, output) => {

                expect(err).not.to.exist();
                const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      {\n\s+"a": 1,\n\s+"b": "\[undefined\]",\n\s+"c": "\[function \(\) \{((\\r)?\\n){2}\s+return 'foo';(\\r)?\\n\s+\}\]",\n\s+"d": "\[Infinity\]",\n\s+"e": "\[-Infinity\]"\n\s+}\n\n      Fail\n\n(?:      at <trace>\n)+\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });
    });

    describe('json', { timeout: 10000 }, () => {

        it('generates a report', (done) => {

            const script = Lab.script();
            script.experiment('group', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test('fails', (finished) => {

                    expect(true).to.equal(false);
                    finished();
                });

                script.test('fails with non-error', (finished) => {

                    finished('boom');
                });
            });

            Lab.report(script, { reporter: 'json', lint: true, linter: 'eslint', output: false }, (err, code, output) => {

                const result = JSON.parse(output);
                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(result.tests.group.length).to.equal(3);
                expect(result.tests.group[0].title).to.equal('works');
                expect(result.tests.group[0].err).to.equal(false);
                expect(result.tests.group[1].title).to.equal('fails');
                expect(result.tests.group[1].err).to.equal('Expected true to equal specified value: false');
                expect(result.tests.group[2].title).to.equal('fails with non-error');
                expect(result.tests.group[2].err).to.equal('Non Error object received or caught');
                expect(result.leaks.length).to.equal(0);
                expect(result.duration).to.exist();
                expect(result.lint.length).to.be.greaterThan(1);
                expect(result.lint[0].filename).to.exist();
                expect(result.lint[0].errors).to.exist();
                done();
            });
        });

        it('generates a report with errors', (done) => {

            const script = Lab.script();
            script.experiment('group', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });

                script.after((finished) => {

                    finished(new Error());
                });
            });

            Lab.report(script, { reporter: 'json', output: false }, (err, code, output) => {

                const result = JSON.parse(output);
                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(result.errors).to.have.length(1);
                done();
                done = function () {};
            });
        });

        it('generates a report with coverage', (done) => {

            const Test = require('./coverage/json');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('value of a', (finished) => {

                    expect(Test.method(1)).to.equal(1);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'json', coverage: true, coveragePath: Path.join(__dirname, './coverage/json'), output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                const result = JSON.parse(output);
                expect(result.coverage.percent).to.equal(100);
                done();
            });
        });
    });

    describe('html', () => {

        it('generates a coverage report', (done) => {

            const Test = require('./coverage/html');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html'), output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('<div class="stats medium">');
                expect(output).to.contain('<span class="cov medium">66.67</span>');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a coverage report with original source from external sourcemaps', (done) => {

            const Test = require('./coverage/sourcemaps-external');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-external'), sourcemaps: true, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output, 'original filename not included').to.contains('<h2 id="while.js">while.js');
                expect(output, 'generated filename link not included').to.contains('transformed to <a href="#test/coverage/sourcemaps-external.js">test/coverage/sourcemaps-external.js)</a>');
                expect(output, 'original comment not included').to.contains('<td class="source">// Declare internals</td>');
                expect(output, 'original chunks not properly handled').to.contains([
                    '<tr id="while.js__13" class="chunks">',
                    '<td class="source"><div>    while ( </div><div class="miss false" data-tooltip>value ) </div><div>{</div></td>']);
                expect(output, 'missed original line not included').to.contains([
                    '<tr id="while.js__14" class="miss">',
                    '<td class="source" data-tooltip>        value &#x3D; false;</td>']);
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a coverage report with original source from inline sourcemaps', (done) => {

            const Test = require('./coverage/sourcemaps-inline');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-inline'), sourcemaps: true, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output, 'original filename not included').to.contains('<h2 id="while.js">while.js');
                expect(output, 'generated filename link not included').to.contains('transformed to <a href="#test/coverage/sourcemaps-inline.js">test/coverage/sourcemaps-inline.js)</a>');
                expect(output, 'original comment not included').to.contains('<td class="source">// Declare internals</td>');
                expect(output, 'original chunks not properly handled').to.contains([
                    '<tr id="while.js__13" class="chunks">',
                    '<td class="source"><div>    while ( </div><div class="miss false" data-tooltip>value ) {</div></td>']);
                delete global.__$$testCovHtml;
                done();
            });
        });


        it('generates a coverage report with concatenated original sources', (done) => {

            const Test = require('./coverage/sourcemaps-multiple');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(false);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-multiple'), sourcemaps: true, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output, '1st original filename not included').to.contains('<h2 id="file1.js">file1.js');
                expect(output, '2nd original filename not included').to.contains('<h2 id="file2.js">file2.js');
                expect(output, '3rd original filename not included').to.contains('<h2 id="file3.js">file3.js');
                expect(output, 'generated filename link not included').to.contains('transformed to <a href="#test/coverage/sourcemaps-multiple.js">test/coverage/sourcemaps-multiple.js)</a>');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a coverage report with linting enabled and multiple files', (done) => {

            const Test1 = require('./coverage/html-lint/html-lint.1');
            const Test2 = require('./coverage/html-lint/html-lint.2');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test1.method(1, 2, 3);
                    finished();
                });

                script.test('something', (finished) => {

                    Test2.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html-lint/'), lint: true, linter: 'eslint', lintingPath: Path.join(__dirname, './coverage/html-lint'), output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output)
                    .to.contain('<div class="stats medium">')
                    .and.to.contain('semi - Missing semicolon')
                    .and.to.contain('<span class="warnings" data-tooltip="no-eq-null - Use &#8216;&#x3d;&#x3d;&#x3d;&#8217; to compare with &#8216;null&#8217;."></span>')
                    .and.to.contain('<span class="lint-errors low">11</span>')
                    .and.to.contain('<span class="lint-warnings low">1</span>')
                    .and.to.contain('<li class="lint-entry">L13 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 spaces')
                    .and.to.contain('<li class="lint-entry">L14 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 spaces')
                    .and.to.contain('<li class="lint-entry">L15 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 8 spaces')
                    .and.to.contain('<li class="lint-entry">L18 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 8 spaces')
                    .and.to.contain('<li class="lint-entry">L21 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 spaces')
                    .and.to.contain('<li class="lint-entry">L21 - <span class="level-WARNING">WARNING</span> - no-eq-null - Use &#8216;&#x3d;&#x3d;&#x3d;&#8217; to compare with &#8216;null&#8217;.</li>')
                    .and.to.contain('<li class="lint-entry">L21 - <span class="level-ERROR">ERROR</span> - eqeqeq - Expected &#x27;&#x3d;&#x3d;&#x3d;&#x27; and instead saw &#x27;&#x3d;&#x3d;&#x27;.</li>')
                    .and.to.contain('<li class="lint-entry">L21 - <span class="level-ERROR">ERROR</span> - semi - Missing semicolon.</li>')
                    .and.to.contain('<li class="lint-entry">L23 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 spaces');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a coverage report with linting enabled with thresholds', (done) => {

            const Test1 = require('./coverage/html-lint/html-lint.1');
            const Test2 = require('./coverage/html-lint/html-lint.2');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test1.method(1, 2, 3);
                    finished();
                });

                script.test('something', (finished) => {

                    Test2.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html-lint/'), lint: true, linter: 'eslint', lintingPath: Path.join(__dirname, './coverage/html-lint'), 'lint-errors-threshold': 2, 'lint-warnings-threshold': 2, output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output)
                    .to.contain('<span class="lint-errors low">11</span>')
                    .and.to.contain('<span class="lint-warnings medium">1</span>');

                delete global.__$$testCovHtml;
                done();
            });
        });

        it('generates a report with test script errors', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.before((finished) => { });
                script.test('works', (finished) => {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', 'context-timeout': 1, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output)
                    .to.contain('Timed out &#x28;1ms&#x29; - Before test')
                    .and.to.contain('at Timer.listOnTimeout');
                done();
            });
        });

        it('generates a report with test script errors that are not Error', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.before((finished) => {

                    throw 'abc';
                });

                script.test('works', (finished) => {

                    finished();
                });
            });

            Lab.report(script, { reporter: 'html', 'context-timeout': 1, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.contain('Non Error object received or caught');
                done();
            });
        });

        it('tags file percentile based on levels', (done) => {

            const reporter = Reporters.generate({ reporter: 'html' });
            const notebook = {
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

            reporter.finalize(notebook, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('<span class="cov terrible">10</span>');
                expect(output).to.contain('<span class="cov terrible">10.12</span>');
                expect(output).to.contain('<span class="cov high">76</span>');
                expect(output).to.contain('<span class="cov low">26</span>');
                done();
            });
        });

        it('tags total percentile (terrible)', (done) => {

            const reporter = Reporters.generate({ reporter: 'html' });
            const notebook = {
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

            reporter.finalize(notebook, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('<span class="cov terrible">10</span>');
                done();
            });
        });

        it('tags total percentile (high)', (done) => {

            const reporter = Reporters.generate({ reporter: 'html' });
            const notebook = {
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

            reporter.finalize(notebook, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('<span class="cov high">80</span>');
                done();
            });
        });

        it('includes test run data', (done) => {

            const Test = require('./coverage/html');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.describe('lab', () => {

                    script.test('something', (finished) => {

                        Test.method(1, 2, 3);
                        finished();
                    });

                    script.test('something else', (finished) => {

                        Test.method(1, 2, 3);
                        finished();
                    });
                });
            });

            Lab.report(script, { reporter: 'html', coveragePath: Path.join(__dirname, './coverage/html'), output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('Test Report');
                expect(output).to.contain('test-title');
                delete global.__$$testCovHtml;
                done();
            });
        });
    });

    describe('tap', () => {

        it('generates a report', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test('skip', { skip: true }, (finished) => {

                    finished();
                });

                script.test('todo');

                script.test('fails', (finished) => {

                    expect(true).to.equal(false);
                    finished();
                });

                script.test('fails with non-error', (finished) => {

                    finished('boom');
                });
            });

            Lab.report(script, { reporter: 'tap', output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                const result = output.replace(/      .*\n/g, '      <trace>\n');
                expect(result).to.match(/^TAP version 13\n1..5\nok 1 \(1\) test works\n  ---\n  duration_ms: \d+\n  ...\nok 2 # SKIP \(2\) test skip\nok 3 # TODO \(3\) test todo\nnot ok 4 \(4\) test fails\n  ---\n  duration_ms: \d+\n  stack: |-\n    Expected true to equal specified value\n(?:      <trace>\n)+  ...\nnot ok 5 \(5\) test fails with non-error\n  ---\n  duration_ms: \d+\n  ...\n# tests 4\n# pass 1\n# fail 2\n# skipped 1\n# todo 1\n$/);
                done();
            });
        });
    });

    describe('junit', () => {

        it('generates a report', (done) => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    expect(true).to.equal(true);
                    finished();
                });

                script.test('skip', { skip: true }, (finished) => {

                    finished();
                });

                script.test('todo');

                script.test('fails', (finished) => {

                    expect(true).to.equal(false);
                    finished();
                });

                script.test('fails with non-error', (finished) => {

                    finished('boom');
                });
            });

            Lab.report(script, { reporter: 'junit', output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(1);
                expect(output).to.contain([
                    'tests="5"',
                    'errors="0"',
                    'skipped="2"',
                    'failures="2"',
                    '<failure message="Expected true to equal specified value: false" type="Error">'
                ]);

                done();
            });
        });
    });

    describe('lcov', () => {

        it('generates a lcov report', (done) => {

            const Test = require('./coverage/html');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'lcov', coverage: true, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(0);

                expect(output).to.contain(Path.join('coverage', 'html.js'));
                expect(output).to.contain('DA:1,1');                    // Check that line is marked as covered
                expect(output).to.contain('LF:14');                     // Total Lines
                expect(output).to.contain('LH:10');                     // Lines Hit
                expect(output).to.contain('end_of_record');

                done();
            });
        });

        it('runs without coverage but doesn\'t generate output', (done) => {

            const Test = require('./coverage/html');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', (finished) => {

                    Test.method(1, 2, 3);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'lcov', coverage: false, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code).to.equal(0);
                expect(output).to.be.empty();

                done();
            });
        });
    });

    describe('clover', () => {

        it('generates a report', (done) => {

            const Test = require('./coverage/clover');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.describe('lab', () => {

                    script.test('something', (finished) => {

                        Test.method(1, 2, 3);
                        finished();
                    });

                    script.test('something else', (finished) => {

                        Test.method(1, 2, 3);
                        finished();
                    });
                });
            });

            Lab.report(script, { reporter: 'clover', coverage: true, coveragePath: Path.join(__dirname, './coverage/clover'), output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.contain('clover.test.coverage');
                expect(output).to.contain('<line num="11" count="1" type="stmt"/>');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('correctly defaults a package root name', (done) => {

            const reporter = Reporters.generate({ reporter: 'clover', coveragePath: null });

            expect(reporter.settings.packageRoot).to.equal('root');

            const Test = require('./coverage/clover');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.describe('lab', () => {

                    script.test('something', (finished) => {

                        Test.method(1, 2, 3);
                        finished();
                    });

                    script.test('something else', (finished) => {

                        Test.method(1, 2, 3);
                        finished();
                    });
                });
            });

            const origCwd = process.cwd();
            process.chdir(Path.join(__dirname, './coverage/'));

            Lab.report(script, { reporter: 'clover', coverage: true, coveragePath: Path.join(__dirname, './coverage/clover'), output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.not.contain('clover.test.coverage');
                expect(output).to.contain('<coverage generated=');
                delete global.__$$testCovHtml;
                process.chdir(origCwd);
                done();
            });
        });

        it('correctly determines a package root name', (done) => {

            const reporter = Reporters.generate({ reporter: 'clover', coveragePath: Path.join(__dirname, './somepath') });

            expect(reporter.settings.packageRoot).to.equal('somepath');
            done();
        });

        it('results in an empty generation', (done) => {

            const Test = require('./coverage/clover');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.describe('lab', () => {

                    script.test('something', (finished) => {

                        Test.method(1, 2, 3);
                        finished();
                    });

                    script.test('something else', (finished) => {

                        Test.method(1, 2, 3);
                        finished();
                    });
                });
            });

            Lab.report(script, { reporter: 'clover', coverage: false, coveragePath: Path.join(__dirname, './coverage/clover'), output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(output).to.not.contain('clover.test.coverage');
                expect(output).to.contain('<coverage generated=');
                delete global.__$$testCovHtml;
                done();
            });
        });

        it('should generate a report with multiple files', (done) => {

            let output = '';
            const reporter = Reporters.generate({ reporter: 'clover' });

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

    describe('multiple reporters', () => {

        it('with multiple outputs are supported', (done) => {

            const Recorder = function () {

                Stream.Writable.call(this);

                this.content = '';
            };

            Hoek.inherits(Recorder, Stream.Writable);

            Recorder.prototype._write = function (chunk, encoding, next) {

                this.content += chunk.toString();
                next();
            };

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished();
                });
            });

            const recorder = new Recorder();
            const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));

            Lab.report(script, { reporter: ['lcov', 'console'], output: [filename, recorder], coverage: true }, (err, code, output) => {

                expect(err).to.not.exist();
                expect(code.lcov).to.equal(0);
                expect(code.console).to.equal(0);
                expect(output.lcov).to.equal(Fs.readFileSync(filename).toString());
                expect(output.console).to.equal(recorder.content);
                Fs.unlinkSync(filename);
                done();
            });
        });


        it('that are duplicates with multiple outputs are supported', (done) => {

            const Recorder = function () {

                Stream.Writable.call(this);

                this.content = '';
            };

            Hoek.inherits(Recorder, Stream.Writable);

            Recorder.prototype._write = function (chunk, encoding, next) {

                this.content += chunk.toString();
                next();
            };

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished();
                });
            });

            const recorder = new Recorder();
            const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));

            Lab.report(script, { reporter: ['console', 'console'], output: [filename, recorder], coverage: true }, (err, code, output) => {

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

    describe('custom reporters', () => {

        it('requires a custom reporter relatively if starts with .', (done) => {

            const reporter = './node_modules/lab-event-reporter/index.js';

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished();
                });
            });

            Lab.report(script, { reporter, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('requires a custom reporter from node_modules if not starting with .', (done) => {

            const reporter = 'lab-event-reporter';

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (finished) => {

                    finished();
                });
            });

            Lab.report(script, { reporter, output: false }, (err, code, output) => {

                expect(err).to.not.exist();
                done();
            });
        });
    });
});
