'use strict';

// Load modules

const Crypto = require('crypto');
const Fs = require('fs');
const Os = require('os');
const Path = require('path');
const Stream = require('stream');
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

    it('outputs to a stream', async () => {

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

            script.test('works', () => {});
        });

        const recorder = new Recorder();
        const { code, output } = await Lab.report(script, { output: recorder });
        expect(code).to.equal(0);
        expect(output).to.equal(recorder.content);
    });

    it('outputs to a file', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', () => {});
        });

        const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));
        const { code, output } = await Lab.report(script, { output: filename });
        expect(code).to.equal(0);
        expect(output).to.equal(Fs.readFileSync(filename).toString());
        Fs.unlinkSync(filename);
    });

    it('outputs to a file in a directory', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', () => {});
        });

        const randomname = [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-');
        const folder = Path.join(Os.tmpdir(), randomname);
        const filename = Path.join(folder, randomname);
        const { code, output } = await Lab.report(script, { output: filename });

        expect(code).to.equal(0);
        expect(output).to.equal(Fs.readFileSync(filename).toString());
        Fs.unlinkSync(filename);
        Fs.rmdirSync(folder);
    });

    it('outputs to a file with output is passed as an array and reporter is an array', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', () => {});
        });

        const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(7).toString('hex')].join('-'));
        const { code, output } = await Lab.report(script, { reporter: ['console'], output: [filename] });

        expect(code).to.equal(0);
        expect(output).to.equal(Fs.readFileSync(filename).toString());
        Fs.unlinkSync(filename);
    });

    it('exits with error code when leak detected', async () => {

        const reporter = Reporters.generate({ reporter: 'console' });
        const notebook = {
            tests: [],
            coverage: {
                percent: 30,
                files: []
            },
            leaks: ['something']
        };

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(1);
    });

    it('exits with error code when coverage threshold is not met', async () => {

        const reporter = Reporters.generate({ reporter: 'console', coverage: true, threshold: 50 });
        const notebook = {
            tests: [],
            coverage: {
                percent: 30,
                files: []
            }
        };

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(1);
    });

    it('exits with success code when coverage threshold is met', async () => {

        const reporter = Reporters.generate({ reporter: 'console', coverage: true, threshold: 50 });
        const notebook = {
            tests: [],
            coverage: {
                percent: 60,
                files: []
            }
        };

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(0);
    });

    it('exits with error code when linting error threshold is met', async () => {

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

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(1);
    });

    it('exits with error code when linting error threshold is met and threshold is 0', async () => {

        const reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-errors-threshold': 0 });
        const notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(1);
    });

    it('exits with success code when linting error threshold is not met', async () => {

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

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(0);
    });

    it('exits with error code when linting warning threshold is met', async () => {

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

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(1);
    });

    it('exits with error code when linting warning threshold is met and threshold is 0', async () => {

        const reporter = Reporters.generate({ reporter: 'console', lint: true, 'lint-warnings-threshold': 0 });
        const notebook = {
            tests: [],
            lint: {
                lint: [
                    { errors: [{ severity: 'WARNING' }, { severity: 'ERROR' }] }
                ]
            }
        };

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(1);
    });

    it('exits with success code when linting warning threshold is not met', async () => {

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

        const { code } = await reporter.finalize(notebook);
        expect(code).to.equal(0);
    });

    it('includes the used seed for shuffle in the output', async () => {

        const reporter = Reporters.generate({ reporter: 'console' });
        const notebook = {
            tests: [],
            seed: 1234,
            shuffle: true
        };

        const { output } = await reporter.finalize(notebook);
        expect(output).to.contain('1234');
        expect(output).to.contain('seed');
    });

    it('does not include the seed if shuffle was not active', async () => {

        const reporter = Reporters.generate({ reporter: 'console' });
        const notebook = {
            tests: [],
            seed: 1234
        };

        const { output } = await reporter.finalize(notebook);
        expect(output).to.not.contain('1234');
        expect(output).to.not.contain('seed');
    });

    describe('console', () => {

        it('generates a report', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {});
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', output: false });
            expect(code).to.equal(0);
            expect(output).to.contain('1 tests complete');
            expect(output).to.contain('Test duration:');
            expect(output).to.contain('No global variable leaks detected');
        });

        it('generate a report with stable diff of actual/expected objects of a failed test', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect({ a: 1, b: 2, c: 3, d: 4, e: 66 }).to.equal({ a: 1, e: 5, b: 2, c: 3, d: 4 });
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('"e": 665');
            expect(output).to.contain('1 of 1 tests failed');
            expect(output).to.contain('Test duration:');
            expect(output).to.contain('No global variable leaks detected');
        });

        it('counts "todo" tests as skipped', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(true).to.equal(true);
                });

                script.test.skip('a skipped test', () => {

                    throw new Error('Should not be called');
                });

                script.test('a todo test');
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', output: false });
            expect(code).to.equal(0);
            expect(output).to.contain([
                '1 tests complete',
                '2 skipped'
            ]);
        });

        it('generates a report with errors', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(true).to.equal(false);
                });
            });

            global.x1 = true;
            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false });

            delete global.x1;
            expect(code).to.equal(1);
            const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
            expect(result).to.contain('Expected true to equal specified value');
            expect(result).to.contain('1 of 1 tests failed');
            expect(result).to.contain('The following leaks were detected:x1');
        });

        it('generates a report with multi-line diff', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(['a', 'b']).to.equal(['a', 'c']);
                });
            });

            global.x1 = true;
            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false });

            delete global.x1;
            expect(code).to.equal(1);
            expect(output).to.contain('The following leaks were detected:x1');
            expect(output).to.contain('Expected');
        });

        it('generates a report with caught error', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(() => {

                        throw new Error('boom');
                    }).to.not.throw();
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('Failed tests:');
            expect(output).to.contain('1) test works:');
            expect(output).to.contain('Error: boom');
            expect(output).to.contain('at ');
            expect(output).to.contain('1 of 1 tests failed');
        });

        it('generates a report with caught error (multiline)', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    throw new Error('boom\nbam');
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('Failed tests:');
            expect(output).to.contain('1) test works:');
            expect(output).to.contain('boom\nbam');
            expect(output).to.contain('at script.test');
            expect(output).to.contain('1 of 1 tests failed');
        });

        it('generates a report with caught error (message not part of stack)', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    function OtherError() { // eslint-disable-line func-style

                        this.message = 'Amsg';
                        Error.captureStackTrace(this);
                        // Read .stack to trigger stack generation
                        this.oldstack = '' + this.stack;
                    }

                    OtherError.prototype = Object.create(Error.prototype);
                    OtherError.prototype.name = 'OtherError';
                    const error = new OtherError();
                    error.message = 'Bmsg';
                    throw error;
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('Failed tests:');
            expect(output).to.contain('1) test works:');
            expect(output).to.contain('Bmsg');
            expect(output).to.contain('Amsg');
            expect(output).to.contain('at script.test');
            expect(output).to.contain('1 of 1 tests failed');
        });

        it('generates a report with caught error (data plain)', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('fails', () => {

                    const error = new Error('boom');
                    error.data = 'abc';
                    throw error;
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false, assert: false });

            expect(code).to.equal(1);
            expect(output).to.contain('1 of 1 tests failed');
            expect(output).to.contain('Failed tests');
            expect(output).to.contain('Additional error data:');
            expect(output).to.contain('abc');
        });

        it('generates a report with caught error (data array)', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('fails', () => {

                    const error = new Error('boom');
                    error.data = [1, 2, 3];
                    throw error;
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false, assert: false });
            expect(code).to.equal(1);
            expect(output).to.contain('1 of 1 tests failed');
            expect(output).to.contain('Failed tests');
            expect(output).to.contain('Additional error data:');
            expect(output).to.contain('[1,2,3]');
        });

        it('generates a report with caught error (data object)', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    const error = new Error('boom');
                    error.data = { a: 1 };
                    throw error;
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, leaks: false, output: false });
            expect(code).to.equal(1);
            const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
            expect(result).to.contain('Failed tests:\n\n  1)');
            expect(result).to.contain('Additional error data:\n          a: 1\n\n\n1 of 1 tests failed\nTest duration:');
        });

        it('generates a report with plain Error', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('fails', () => {

                    throw new Error('Error Message');
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false });
            expect(code).to.equal(1);
            expect(output).to.contain('Failed tests:');
            expect(output).to.contain('1) test fails:');
            expect(output).to.contain('1 of 1 tests failed');
        });

        describe('timeouts', () => {

            it('generates a report with timeout', async () => {

                const script = Lab.script();
                script.experiment('test', () => {

                    script.test('works', () => {

                        return new Promise(() => {});
                    });
                });

                const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, timeout: 1, output: false, assert: false });
                expect(code).to.equal(1);
                const result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      Timed out \(\d+ms\) - test works\n\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
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

                it('generates a report with timeout on ' + test.type, async () => {

                    const script = Lab.script();
                    script.experiment('test', () => {

                        script[test.type](() => {

                            return new Promise(() => {});
                        });
                        script.test('works', () => {});
                    });

                    const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, 'context-timeout': 1, output: false });
                    expect(code).to.equal(1);
                    expect(output).to.contain(test.expect);
                });

                it('doesn\'t generates a report with timeout on ' + test.type, async () => {

                    const script = Lab.script();
                    script.experiment('test', () => {

                        script[test.type](() => {

                            return new Promise((resolve) => {

                                setTimeout(resolve, 500);
                            });
                        });

                        script.test('works', () => {});
                    });

                    const { code } = await Lab.report(script, { reporter: 'console', colors: false, 'context-timeout': 1000, output: false });
                    expect(code).to.equal(0);
                });

                it('generates a report with inline timeout on ' + test.type, async () => {

                    const script = Lab.script();
                    script.experiment('test', () => {

                        script[test.type]({ timeout: 1 }, () => {

                            return new Promise(() => {});
                        });
                        script.test('works', () => {});
                    });

                    const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, output: false });
                    expect(code).to.equal(1);
                    expect(output).to.contain(test.expect);
                });
            });
        });

        it('generates a report with all notes displayed', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', (flags) => {

                    flags.note('This is a sweet feature');
                    flags.note('Here is another note');
                });
            });

            const { output } = await Lab.report(script, { reporter: 'console', progress: 0, output: false });
            expect(output).to.contain('This is a sweet feature');
            expect(output).to.contain('Here is another note');
        });

        it('generates a report without progress', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {});
            });

            const { output } = await Lab.report(script, { reporter: 'console', progress: 0, output: false, assert: false });
            expect(output).to.match(/^\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
        });

        it('generates a report with verbose progress', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {});
            });

            const { output } = await Lab.report(script, { reporter: 'console', progress: 2, output: false, assert: false });
            expect(output).to.match(/^test\n  \u001b\[32m[✔√]\u001b\[0m \u001b\[92m1\) works \(\d+ ms\)\u001b\[0m\n\n\n\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
        });

        it('generates a report with verbose progress with experiments with same named tests', async () => {

            const script = Lab.script();
            script.experiment('experiment', () => {

                script.experiment('sub experiment', () => {

                    script.experiment('sub sub experiment', () => {

                        script.test('works', () => {});
                    });
                });

                script.experiment('sub experiment', () => {

                    script.experiment('sub sub experiment', () => {

                        script.test('works', () => {});
                    });
                });

                script.experiment('sub experiment', () => {

                    script.experiment('sub sub experiment 1', () => {

                        script.experiment('sub sub sub experiment', () => {

                            script.test('works', () => {});
                        });
                    });

                    script.experiment('sub sub experiment', () => {

                        script.experiment('sub sub sub experiment', () => {

                            script.test('works', () => {});
                        });
                    });
                });
            });

            const { output } = await Lab.report(script, { reporter: 'console', progress: 2, output: false });
            expect(output).to.contain('4) works');
        });

        it('generates a report with verbose progress with the same test name and no wrapper experiment', async () => {

            const script = Lab.script();
            script.test('works', () => {});
            script.test('works', () => {});

            const { output } = await Lab.report(script, { reporter: 'console', progress: 2, output: false });
            expect(output).to.contain('1) works');
            expect(output).to.contain('2) works');
        });

        it('generates a report with verbose progress and assertions count per test', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {});
            });

            const { output } = await Lab.report(script, { reporter: 'console', progress: 2, assert: Code, output: false });
            expect(output).to.match(/^test\n  \u001b\[32m[✔√]\u001b\[0m \u001b\[92m1\) works \(\d+ ms and \d+ assertions\)\u001b\[0m\n\n\n\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\nAssertions count\: \d+ \(verbosity\: \d+\.\d+\)\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
        });

        it('generates a report with verbose progress that displays well on windows', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {});
            });

            const oldPlatform = process.platform;
            Object.defineProperty(process, 'platform', { writable: true, value: 'win32' });

            const { output } = await Lab.report(script, { reporter: 'console', progress: 2, output: false });

            process.platform = oldPlatform;
            expect(output).to.contain('\u221A');
        });

        it('generates a report without skipped and todo tests', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(true).to.equal(true);
                });

                script.test.skip('a skipped test', () => {

                    throw new Error('Should not be called');
                });

                script.test('a todo test');
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', 'silent-skips': true, output: false });
            expect(code).to.equal(0);
            expect(output).to.contain([
                '  .\n',
                '1 tests complete',
                '2 skipped'
            ]);
        });

        it('generates a verbose report without skipped and todo tests', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(true).to.equal(true);
                });

                script.test.skip('a skipped test', () => {

                    throw new Error('Should not be called');
                });

                script.test('a todo test');
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', progress: 2, 'silent-skips': true, output: false });
            expect(code).to.equal(0);
            expect(output).to.not.contain('a skipped test');
            expect(output).to.not.contain('a todo test');
            expect(output).to.contain([
                '1 tests complete',
                '2 skipped'
            ]);
        });

        it('generates a coverage report (verbose)', async () => {

            const Test = require('./coverage/console');
            const Full = require('./coverage/console-full');

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(1, 2, 3);
                    Full.method(1);

                });

                script.test('diff', () => {

                    expect('abcd').to.equal('cdfg');
                });
            });

            const { output } = await Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/console'), output: false });
            expect(output).to.contain('Coverage: 68.42% (6/19)');
            expect(output).to.contain('test/coverage/console.js missing coverage on line(s): 14, 17-19, 22, 23');
            expect(output).to.not.contain('console-full');
        });

        it('reports 100% coverage', async () => {

            const reporter = Reporters.generate({ reporter: 'console', coverage: true });
            const notebook = {
                tests: [],
                coverage: {
                    percent: 100,
                    files: []
                }
            };

            const { output } = await reporter.finalize(notebook);
            expect(output).to.contain('Coverage: 100.00%');
        });

        it('reports correct lines with sourcemaps enabled', async () => {

            const Test = require('./coverage/sourcemaps-external');

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(false);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-external'), sourcemaps: true, output: false });
            expect(output).to.contain('test/coverage/sourcemaps-external.js missing coverage from file(s):');
            expect(output).to.contain('while.js on line(s): 13, 14');
        });

        it('doesn\'t report lines on a fully covered file with sourcemaps enabled', async () => {

            const Test = require('./coverage/sourcemaps-covered');

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(false);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/'), sourcemaps: true, output: false });
            expect(output).to.not.contain('sourcemaps-covered');
        });

        it('generates a report with multi-line progress', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                const works = function () {

                    expect(true).to.equal(true);

                };

                const fails = function () {

                    expect(true).to.equal(false);

                };

                const skips = function () {


                };

                for (let i = 0; i < 30; ++i) {
                    script.test('works', works);
                    script.test('fails', fails);
                    script.test('skips', { skip: true }, skips);
                }
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x\n  -.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-.x-');
        });

        it('generates a report with verbose progress', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {});

                script.test('fails', () => {

                    return Promise.reject('boom');
                });

                script.test('skips', { skip: true }, () => {});
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, progress: 2, output: false, assert: false });
            expect(code).to.equal(1);
            expect(output).to.match(/test\n  [✔√] 1\) works \(\d+ ms\)\n  [✖×] 2\) fails\n  \- 3\) skips \(\d+ ms\)\n/);
        });

        it('excludes colors when terminal does not support', { parallel: false }, async () => {

            delete require.cache[require.resolve('supports-color')];
            const orig = {
                isTTY: process.stdout.isTTY,
                env: process.env
            };
            process.stdout.isTTY = false;
            process.env = {};

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(true).to.equal(true);
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', output: false, assert: false });

            process.stdout.isTTY = orig.isTTY;
            process.env = orig.env;
            expect(code).to.equal(0);
            expect(output).to.match(/^\n  \n  \.\n\n1 tests complete\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
        });

        it('displays custom error messages in expect', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(true, 'Not working right').to.equal(false);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false });
            const result = output.replace(/at.*\.js\:\d+\:\d+\)?/g, 'at <trace>');
            expect(result).to.contain('Not working right: Expected true to equal specified value');
            expect(result).to.contain('1 of 1 tests failed');
        });

        it('displays session errors if there in an error in "before"', async () => {

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.before(() => {

                    return Promise.reject(new Error('there was an error in the before function'));
                });

                script.test('works', () => {

                    expect(true).to.equal(true);
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('There were 1 test script error(s).');
            expect(output).to.contain('there was an error in the before function');
        });

        it('displays session errors if there in an error in "afterEach"', async () => {

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.afterEach(() => {

                    return Promise.reject(new Error('there was an error in the afterEach function'));
                });

                script.test('works', () => {

                    expect(true).to.equal(true);
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'console', colors: false, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('There were 1 test script error(s).');
            expect(output).to.contain('there was an error in the afterEach function');
        });

        it('generates a report with linting enabled', async () => {

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

            const { output } = await reporter.finalize(notebook);
            expect(output).to.contain('missing ;');
        });

        it('displays a success message for lint when no issues found', async () => {

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

            const { output } = await reporter.finalize(notebook);
            expect(output).to.contain('No issues');
        });

        it('displays a success message for lint when errors are null', async () => {

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

            const { output } = await reporter.finalize(notebook);
            expect(output).to.contain('No issues');
        });

        it('reports with circular JSON', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

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

            const { output } = await Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false });
            expect(output).to.contain('Failed tests:');
            expect(output).to.contain('[Circular ~]');
            expect(output).to.contain('Fail');
        });

        it('reports with undefined values', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

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

            const { output } = await Lab.report(script, { reporter: 'console', colors: false, output: false, assert: false });
            expect(output).to.contain('Failed tests:');
            expect(output).to.contain('1 of 1 tests failed');
            expect(output).to.contain('Fail');
        });
    });

    describe('json', { timeout: 10000 }, () => {

        it('generates a report', async () => {

            const script = Lab.script();
            script.experiment('group', () => {

                script.test('works', () => {

                    expect(true).to.equal(true);
                });

                script.test('fails', () => {

                    expect(true).to.equal(false);
                });

                script.test('fails with non-error', () => {

                    return Promise.reject('boom');
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'json', lint: true, linter: 'eslint', output: false });

            const result = JSON.parse(output);
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
        });

        it('generates a report with errors', async () => {

            const script = Lab.script();
            script.experiment('group', () => {

                script.test('works', () => {

                    expect(true).to.equal(true);
                });

                script.after(() => {

                    throw new Error('failed');
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'json', output: false });
            const result = JSON.parse(output);
            expect(code).to.equal(1);
            expect(result.errors).to.have.length(1);
            expect(result.errors[0].message).to.equal('failed');
        });

        it('generates a report with coverage', async () => {

            const Test = require('./coverage/json');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('value of a', () => {

                    expect(Test.method(1)).to.equal(1);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'json', coverage: true, coveragePath: Path.join(__dirname, './coverage/json'), output: false });
            const result = JSON.parse(output);
            expect(result.coverage.percent).to.equal(100);
        });
    });

    describe('html', () => {

        it('generates a coverage report', async () => {

            const Test = require('./coverage/html');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(1, 2, 3);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html'), output: false });
            expect(output).to.contain('<div class="stats medium">');
            expect(output).to.contain('66.67%');
            delete global.__$$testCovHtml;
        });

        it('generates a coverage report with original source from external sourcemaps', async () => {

            const Test = require('./coverage/sourcemaps-external');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(false);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-external'), sourcemaps: true, output: false });
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
        });

        it('generates a coverage report for TypeScript notebook with missing source', async () => {

            const SourceMapSupport = require('source-map-support');

            SourceMapSupport.install({
                retrieveSourceMap: (path) => {

                    if (path === 'src/test.ts') {
                        return { map: require('./coverage/ts-notebook-map.json') };
                    }
                }
            });

            const Notebook = require('./coverage/ts-notebook.json');

            const reporter = Reporters.generate({ reporter: 'html' });

            const { output } = await reporter.finalize(Notebook);
            expect(output).to.contain('class="percentage">66.67%');
            delete global.__$$testCovHtml;
        });

        it('generates a coverage report with original source from inline sourcemaps', async () => {

            const Test = require('./coverage/sourcemaps-inline');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(false);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-inline'), sourcemaps: true, output: false });
            expect(output, 'original filename not included').to.contains('<h2 id="while.js">while.js');
            expect(output, 'generated filename link not included').to.contains('transformed to <a href="#test/coverage/sourcemaps-inline.js">test/coverage/sourcemaps-inline.js)</a>');
            expect(output, 'original comment not included').to.contains('<td class="source">// Declare internals</td>');
            expect(output, 'original chunks not properly handled').to.contains([
                '<tr id="while.js__13" class="chunks">',
                '<td class="source"><div>    while ( </div><div class="miss false" data-tooltip>value ) {</div></td>']);
            delete global.__$$testCovHtml;
        });


        it('generates a coverage report with concatenated original sources', async () => {

            const Test = require('./coverage/sourcemaps-multiple');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(false);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/sourcemaps-multiple'), sourcemaps: true, output: false });
            expect(output, '1st original filename not included').to.contains('<h2 id="file1.js">file1.js');
            expect(output, '2nd original filename not included').to.contains('<h2 id="file2.js">file2.js');
            expect(output, '3rd original filename not included').to.contains('<h2 id="file3.js">file3.js');
            expect(output, 'generated filename link not included').to.contains('transformed to <a href="#test/coverage/sourcemaps-multiple.js">test/coverage/sourcemaps-multiple.js)</a>');
            delete global.__$$testCovHtml;
        });

        it('generates a coverage report with linting enabled and multiple files', async () => {

            const Test1 = require('./coverage/html-lint/html-lint.1');
            const Test2 = require('./coverage/html-lint/html-lint.2');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', () => {

                    Test1.method(1, 2, 3);
                });

                script.test('something', () => {

                    Test2.method(1, 2, 3);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html-lint/'), lint: true, linter: 'eslint', lintingPath: Path.join(__dirname, './coverage/html-lint'), output: false });
            expect(output)
                .to.contain('<div class="stats medium">')
                .and.to.contain('semi - Missing semicolon')
                .and.to.contain('Use &#x27;&#x3d;&#x3d;&#x3d;&#x27; to compare with null')
                .and.to.contain('<span class="lint-errors low">11</span>')
                .and.to.contain('<span class="lint-warnings low">1</span>')
                .and.to.contain('<li class="lint-entry">L13 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 spaces')
                .and.to.contain('<li class="lint-entry">L14 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 spaces')
                .and.to.contain('<li class="lint-entry">L15 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 8 spaces')
                .and.to.contain('<li class="lint-entry">L18 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 8 spaces')
                .and.to.contain('<li class="lint-entry">L21 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 spaces')
                .and.to.contain('<li class="lint-entry">L21 - <span class="level-WARNING">WARNING</span> - no-eq-null - Use &#x27;&#x3d;&#x3d;&#x3d;&#x27; to compare with null')
                .and.to.contain('<li class="lint-entry">L21 - <span class="level-ERROR">ERROR</span> - eqeqeq - Expected &#x27;&#x3d;&#x3d;&#x3d;&#x27; and instead saw &#x27;&#x3d;&#x3d;&#x27;.</li>')
                .and.to.contain('<li class="lint-entry">L21 - <span class="level-ERROR">ERROR</span> - semi - Missing semicolon.</li>')
                .and.to.contain('<li class="lint-entry">L23 - <span class="level-ERROR">ERROR</span> - indent - Expected indentation of 4 spaces');
            delete global.__$$testCovHtml;
        });

        it('generates a coverage report with linting enabled with thresholds', async () => {

            const Test1 = require('./coverage/html-lint/html-lint.1');
            const Test2 = require('./coverage/html-lint/html-lint.2');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', () => {

                    Test1.method(1, 2, 3);
                });

                script.test('something', () => {

                    Test2.method(1, 2, 3);
                });
            });

            const { output } = await Lab.report(script, { reporter: 'html', coverage: true, coveragePath: Path.join(__dirname, './coverage/html-lint/'), lint: true, linter: 'eslint', lintingPath: Path.join(__dirname, './coverage/html-lint'), 'lint-errors-threshold': 2, 'lint-warnings-threshold': 2, output: false });
            expect(output)
                .to.contain('<span class="lint-errors low">11</span>')
                .and.to.contain('<span class="lint-warnings medium">1</span>');

            delete global.__$$testCovHtml;
        });

        it('generates a report with test script errors', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.before(() => {

                    return new Promise(() => {});
                });
                script.test('works', () => {});
            });

            const { code, output } = await Lab.report(script, { reporter: 'html', 'context-timeout': 1, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('Timed out &#x28;1ms&#x29; - Before test');
        });

        it('generates a report with test script errors that are not Error', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.before(() => {

                    return Promise.reject('abc');
                });

                script.test('works', () => {});
            });

            const { code, output } = await Lab.report(script, { reporter: 'html', 'context-timeout': 1, output: false });
            expect(code).to.equal(1);
            expect(output).to.contain('Non Error object received or caught');
        });

        it('tags file percentile based on levels', async () => {

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

            const { output } = await reporter.finalize(notebook);
            expect(output).to.contain('<span class="cov terrible">10</span>');
            expect(output).to.contain('<span class="cov terrible">10.12</span>');
            expect(output).to.contain('<span class="cov high">76</span>');
            expect(output).to.contain('<span class="cov low">26</span>');
        });

        it('tags total percentile (terrible)', async () => {

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

            const { output } = await reporter.finalize(notebook);
            expect(output).to.contain('<span class="cov terrible">10</span>');
        });

        it('tags total percentile (high)', async () => {

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

            const { output } = await reporter.finalize(notebook);
            expect(output).to.contain('<span class="cov high">80</span>');
        });

        it('includes test run data', async () => {

            const Test = require('./coverage/html');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.describe('lab', () => {

                    script.test('something', () => {

                        Test.method(1, 2, 3);
                    });

                    script.test('something else', () => {

                        Test.method(1, 2, 3);
                    });
                });
            });

            const { output } = await Lab.report(script, { reporter: 'html', coveragePath: Path.join(__dirname, './coverage/html'), output: false });
            expect(output).to.contain('Test Report');
            expect(output).to.contain('test-title');
            delete global.__$$testCovHtml;
        });
    });

    describe('tap', () => {

        it('generates a report', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(true).to.equal(true);
                });

                script.test('skip', { skip: true }, () => {});

                script.test('todo');

                script.test('fails', () => {

                    expect(true).to.equal(false);
                });

                script.test('fails with non-error', () => {

                    return Promise.reject('boom');
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'tap', output: false });
            expect(code).to.equal(1);
            const result = output.replace(/      .*\n/g, '      <trace>\n');
            expect(result).to.match(/^TAP version 13\n1..5\nok 1 \(1\) test works\n  ---\n  duration_ms: \d+\n  ...\nok 2 # SKIP \(2\) test skip\nok 3 # TODO \(3\) test todo\nnot ok 4 \(4\) test fails\n  ---\n  duration_ms: \d+\n  stack: |-\n    Expected true to equal specified value\n(?:      <trace>\n)+  ...\nnot ok 5 \(5\) test fails with non-error\n  ---\n  duration_ms: \d+\n  ...\n# tests 4\n# pass 1\n# fail 2\n# skipped 1\n# todo 1\n$/);
        });
    });

    describe('junit', () => {

        it('generates a report', async () => {

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {

                    expect(true).to.equal(true);
                });

                script.test('skip', { skip: true }, () => {});

                script.test('todo');

                script.test('fails', () => {

                    expect(true).to.equal(false);
                });

                script.test('fails with non-error', () => {

                    return Promise.reject('boom');
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'junit', output: false });
            expect(code).to.equal(1);
            expect(output).to.contain([
                'tests="5"',
                'errors="0"',
                'skipped="2"',
                'failures="2"',
                '<failure message="Expected true to equal specified value: false" type="Error">'
            ]);
        });
    });

    describe('lcov', () => {

        it('generates a lcov report', async () => {

            const Test = require('./coverage/html');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(1, 2, 3);
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'lcov', coverage: true, output: false });
            expect(code).to.equal(0);
            expect(output).to.contain(Path.join('coverage', 'html.js'));
            expect(output).to.contain('DA:1,1');                    // Check that line is marked as covered
            expect(output).to.contain('LF:12');                     // Total Lines
            expect(output).to.contain('LH:8');                      // Lines Hit
            expect(output).to.contain('end_of_record');
        });

        it('runs without coverage but doesn\'t generate output', async () => {

            const Test = require('./coverage/html');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.test('something', () => {

                    Test.method(1, 2, 3);
                });
            });

            const { code, output } = await Lab.report(script, { reporter: 'lcov', coverage: false, output: false });
            expect(code).to.equal(0);
            expect(output).to.be.empty();
        });
    });

    describe('clover', () => {

        it('generates a report', async () => {

            const Test = require('./coverage/clover');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.describe('lab', () => {

                    script.test('something', () => {

                        Test.method(1, 2, 3);
                    });

                    script.test('something else', () => {

                        Test.method(1, 2, 3);
                    });
                });
            });

            const { output } = await Lab.report(script, { reporter: 'clover', coverage: true, coveragePath: Path.join(__dirname, './coverage/clover'), output: false });
            expect(output).to.contain('clover.test.coverage');
            expect(output).to.contain('<line num="11" count="1" type="stmt"/>');
            delete global.__$$testCovHtml;
        });

        it('correctly defaults a package root name', async () => {

            const reporter = Reporters.generate({ reporter: 'clover', coveragePath: null });

            expect(reporter.settings.packageRoot).to.equal('root');

            const Test = require('./coverage/clover');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.describe('lab', () => {

                    script.test('something', () => {

                        Test.method(1, 2, 3);
                    });

                    script.test('something else', () => {

                        Test.method(1, 2, 3);
                    });
                });
            });

            const origCwd = process.cwd();
            process.chdir(Path.join(__dirname, './coverage/'));

            const { output } = await Lab.report(script, { reporter: 'clover', coverage: true, coveragePath: Path.join(__dirname, './coverage/clover'), output: false });
            expect(output).to.not.contain('clover.test.coverage');
            expect(output).to.contain('<coverage generated=');
            delete global.__$$testCovHtml;
            process.chdir(origCwd);
        });

        it('correctly determines a package root name', () => {

            const reporter = Reporters.generate({ reporter: 'clover', coveragePath: Path.join(__dirname, './somepath') });
            expect(reporter.settings.packageRoot).to.equal('somepath');
        });

        it('results in an empty generation', async () => {

            const Test = require('./coverage/clover');

            const script = Lab.script({ schedule: false });
            script.experiment('test', () => {

                script.describe('lab', () => {

                    script.test('something', () => {

                        Test.method(1, 2, 3);
                    });

                    script.test('something else', () => {

                        Test.method(1, 2, 3);
                    });
                });
            });

            const { output } = await Lab.report(script, { reporter: 'clover', coverage: false, coveragePath: Path.join(__dirname, './coverage/clover'), output: false });
            expect(output).to.not.contain('clover.test.coverage');
            expect(output).to.contain('<coverage generated=');
            delete global.__$$testCovHtml;
        });

        it('should generate a report with multiple files', () => {

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
        });
    });

    describe('multiple reporters', () => {

        it('with multiple outputs are supported', async () => {

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

                script.test('works', () => {});
            });

            const recorder = new Recorder();
            const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));

            const { code, output } = await Lab.report(script, { reporter: ['lcov', 'console'], output: [filename, recorder], coverage: true });
            expect(code.lcov).to.equal(0);
            expect(code.console).to.equal(0);
            expect(output.lcov).to.equal(Fs.readFileSync(filename).toString());
            expect(output.console).to.equal(recorder.content);
            Fs.unlinkSync(filename);
        });

        it('has correct exit code when test fails', async () => {

            const Recorder = function () {

                Stream.Writable.call(this);

                this.content = '';
            };

            Hoek.inherits(Recorder, Stream.Writable);

            Recorder.prototype._write = function (chunk, encoding, next) {

                this.content += chunk.toString();
                next();
            };

            const Test = require('./coverage/basic');

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('succeeds', () => {

                    Test.method(true);
                });

                script.test('fails', () => {

                    return Promise.reject('error');
                });
            });

            const consoleRecorder = new Recorder();
            const htmlRecorder = new Recorder();
            const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));

            const { code, output } = await Lab.report(script, { reporter: ['lcov', 'html', 'console'], output: [filename, htmlRecorder, consoleRecorder], coverage: true, coveragePath: Path.join(__dirname, './coverage/basic.js') });
            expect(code.console).to.equal(1);
            expect(code.lcov).to.equal(1);
            expect(code.html).to.equal(1);
            expect(output.lcov).to.equal(Fs.readFileSync(filename).toString());
            expect(output.html).to.equal(htmlRecorder.content);
            expect(consoleRecorder.content).to.contain('Coverage: 100.00%');

            Fs.unlinkSync(filename);
        });

        it('can run a single reporter', async () => {

            const Recorder = function () {

                Stream.Writable.call(this);

                this.content = '';
            };

            Hoek.inherits(Recorder, Stream.Writable);

            Recorder.prototype._write = function (chunk, encoding, next) {

                this.content += chunk.toString();
                next();
            };

            const Test = require('./coverage/basic');

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('succeeds', () => {

                    Test.method(true);
                });
            });

            const consoleRecorder = new Recorder();

            const { code, output } = await Lab.report(script, { reporter: ['console'], output: [consoleRecorder], verbose: true, coverage: true, coveragePath: Path.join(__dirname, './coverage/basic.js') });
            expect(code).to.equal(0);
            expect(consoleRecorder.content).to.contain('Coverage: 100.00%');
            expect(consoleRecorder.content).to.equal(output);
        });

        it('that are duplicates with multiple outputs are supported', async () => {

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

                script.test('works', () => {});
            });

            const recorder = new Recorder();
            const filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));

            const { code, output } = await Lab.report(script, { reporter: ['console', 'console'], output: [filename, recorder], coverage: true });

            expect(code.console).to.equal(0);
            expect(code.console2).to.equal(0);
            expect(output.console).to.equal(Fs.readFileSync(filename).toString());
            expect(output.console2).to.equal(recorder.content);
            Fs.unlinkSync(filename);
        });
    });

    describe('custom reporters', () => {

        it('requires a custom reporter relatively if starts with .', async () => {

            const reporter = './node_modules/lab-event-reporter/index.js';

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {});
            });

            const { code } = await Lab.report(script, { reporter, output: false });
            expect(code).to.equal(0);
        });

        it('requires a custom reporter from node_modules if not starting with .', async () => {

            const reporter = 'lab-event-reporter';

            const script = Lab.script();
            script.experiment('test', () => {

                script.test('works', () => {});
            });

            const { code } = await Lab.report(script, { reporter, output: false });
            expect(code).to.equal(0);
        });
    });
});
