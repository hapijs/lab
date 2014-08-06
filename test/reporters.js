// Load modules

var Crypto = require('crypto');
var Fs = require('fs');
var Os = require('os');
var Path = require('path');
var Stream = require('stream');
var Tty = require('tty');
var NodeUtil = require('util');
var _Lab = require('../test_runner');
var Lab = require('../');
var Reporters = require('../lib/reporters');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = _Lab.expect;


describe('Reporter', function () {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, './coverage/'), coverageExclude: 'exclude' });

    it('outputs to a stream', function (done) {

        var Recorder = function () {

            Stream.Writable.call(this);

            this.content = '';
        };

        NodeUtil.inherits(Recorder, Stream.Writable);

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

            expect(err).to.not.exist;
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

            expect(err).to.not.exist;
            expect(code).to.equal(0);
            expect(output).to.equal(Fs.readFileSync(filename).toString());
            Fs.unlinkSync(filename);
            done();
        });
    });

    it('exists with error code when leak detected', function (done) {

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

            expect(code).to.equal(1);
            done();
        });
    });

    it('exists with error code when coverage threshold is not met', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', coverage: true, threshold: 50 });
        var notebook = {
            tests: [],
            coverage: {
                percent: 30,
                files: []
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(code).to.equal(1);
            done();
        });
    });

    it('exists with success code when coverage threshold is met', function (done) {

        var reporter = Reporters.generate({ reporter: 'console', coverage: true, threshold: 50 });
        var notebook = {
            tests: [],
            coverage: {
                percent: 60,
                files: []
            }
        };

        reporter.finalize(notebook, function (err, code, output) {

            expect(code).to.equal(0);
            done();
        });
    });

    describe('console', function () {

        it('generates a report', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    Lab.expect(true).to.equal(true);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console' }, function (err, code, output) {

                expect(err).to.not.exist;
                expect(code).to.equal(0);
                expect(output).to.match(/^\n  \n  .\n\n\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
                done();
            });
        });

        it('generates a report with errors', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    Lab.expect(true).to.equal(false);
                    finished();
                });
            });

            global.x1 = true;
            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                delete global.x1;
                expect(err).to.not.exist;
                expect(code).to.equal(1);
                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      falsetrue\n\n      expected true to equal false\n\n      at <trace>\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\nThe following leaks were detected:x1\n\n$/);
                done();
            });
        });

        it('generates a report with multiline diff', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    Lab.expect(['a', 'b']).to.deep.equal(['a', 'c']);
                    finished();
                });
            });

            global.x1 = true;
            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                delete global.x1;
                expect(err).to.not.exist;
                expect(code).to.equal(1);
                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      \[\n        \"a\",\n        \"cb\"\n      \]\n\n      expected \[ 'a', 'b' \] to deeply equal \[ 'a', 'c' \]\n\n      at <trace>\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\nThe following leaks were detected:x1\n\n$/);
                done();
            });
        });

        it('generates a report with caught error', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    Lab.expect(function () {

                        throw new Error('boom');
                    }).to.not.throw();

                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false, leaks: false }, function (err, code, output) {
                expect(err).to.not.exist;
                expect(code).to.equal(1);
                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      AssertionError: expected \[Function\] to not throw an error but 'Error: boom' was thrown\n\n      at <trace>\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\n\n$/);
                done();
            });
        });

        it('generates a report with plain Error', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    throw new Error('Error Message');
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).to.not.exist;
                expect(code).to.equal(1);
                var result = output.replace(/at .+\:\d+\:\d+\)?/g, 'at <trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      Error: Error Message\n\n      at <trace>\n      at <trace>\n      at <trace>\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('generates a report with timeout', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) { });
            });

            Lab.report(script, { reporter: 'console', colors: false, timeout: 1 }, function (err, code, output) {

                expect(err).to.not.exist;
                expect(code).to.equal(1);
                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      Error: Timed out \(\d+ms\)\n\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
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

                expect(output).to.match(/^test\n  \u001b\[32m✔\u001b\[0m \u001b\[90m1\) works \(\d+ ms\)\u001b\[0m\n\n\n\u001b\[32m1 tests complete\u001b\[0m\nTest duration: \d+ ms\n\u001b\[32mNo global variable leaks detected\u001b\[0m\n\n$/);
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

                    Lab.expect('abcd').to.equal('cdfg');
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', coverage: true, coveragePath: Path.join(__dirname, './coverage/console') }, function (err, code, output) {

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

                expect(output).to.contain('Coverage: 100.00%');
                done();
            });
        });

        it('generates a report with multi-line progress', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                for (var i = 0; i < 30; ++i) {
                    script.test('works', function (finished) {

                        Lab.expect(true).to.equal(true);
                        finished();
                    });

                    script.test('fails', function (finished) {

                        Lab.expect(true).to.equal(false);
                        finished();
                    });

                    script.test('skips', { skip: true }, function (finished) {

                        finished();
                    });
                }
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                expect(err).to.not.exist;
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

                expect(err).to.not.exist;
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

                    Lab.expect(true).to.equal(true);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console' }, function (err, code, output) {

                expect(err).to.not.exist;
                expect(code).to.equal(0);
                expect(output).to.match(/^\n  \n  \.\n\n1 tests complete\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('displays custom error messages in expect', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    Lab.expect(true).to.equal(false, 'Not working right');
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');
                expect(result).to.match(/^\n  \n  x\n\nFailed tests:\n\n  1\) test works:\n\n      actual expected\n\n      falsetrue\n\n      Not working right: expected true to equal false\n\n      at <trace>\n\n\n1 of 1 tests failed\nTest duration: \d+ ms\nNo global variable leaks detected\n\n$/);
                done();
            });
        });

        it('displays session errors if there in an error in "before"', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.before(function (done) {

                    done(new Error('there was an error in the before function'));
                });

                script.test('works', function (finished) {
                    Lab.expect(true).to.equal(true, 'Working right');
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');

                expect(code).to.equal(1);
                expect(result).to.contain('There were 1 session error(s).');
                expect(result).to.contain('there was an error in the before function');
                done();
            });
        });

        it('displays session errors if there in an error in "afterEach"', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.afterEach(function (done) {

                    done(new Error('there was an error in the afterEach function'));
                });

                script.test('works', function (finished) {
                    Lab.expect(true).to.equal(true, 'Working right');
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', colors: false }, function (err, code, output) {

                var result = output.replace(/\/[\/\w]+\.js\:\d+\:\d+/g, '<trace>');

                expect(code).to.equal(1);
                expect(result).to.contain('There were 2 session error(s).');
                expect(result).to.contain('there was an error in the afterEach function');
                done();
            });
        });

    });

    describe('json', function () {

        it('generates a report', function (done) {

            var script = Lab.script();
            script.experiment('group', function () {

                script.test('works', function (finished) {

                    Lab.expect(true).to.equal(true);
                    finished();
                });

                script.test('fails', function (finished) {

                    Lab.expect(true).to.equal(false);
                    finished();
                });

                script.test('fails with non-error', function (finished) {

                    finished('boom');
                    finished('kaboom');
                });
            });

            Lab.report(script, { reporter: 'json' }, function (err, code, output) {

                var result = JSON.parse(output);
                expect(err).to.not.exist;
                expect(code).to.equal(1);
                expect(result.tests.group.length).to.equal(3);
                expect(result.tests.group[0].title).to.equal('works');
                expect(result.tests.group[0].err).to.equal(false);
                expect(result.tests.group[1].title).to.equal('fails');
                expect(result.tests.group[1].err).to.equal('expected true to equal false');
                expect(result.tests.group[2].title).to.equal('fails with non-error');
                expect(result.tests.group[2].err).to.equal(true);
                expect(result.leaks.length).to.equal(0);
                expect(result.duration).to.exist;
                expect(result.errors).to.have.length(1);
                done();
            });
        });

        it('generates a report with coverage', function (done) {

            var Test = require('./coverage/json');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('value of a', function (finished) {

                    Lab.expect(Test.method(1)).to.equal(1);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'json', coverage: true, coveragePath: Path.join(__dirname, './coverage/json') }, function (err, code, output) {

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

                expect(output).to.contain('<div class="stats medium">');
                expect(output).to.contain('<span class="cov medium">69.23</span>');
                delete global.__$$testCovHtml;
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

                expect(output).to.contain('<span class="cov high">80</span>');
                done();
            });
        });
    });

    describe('tap', function () {

        it('generates a report', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    Lab.expect(true).to.equal(true);
                    finished();
                });

                script.test('skip', { skip: true }, function (finished) {

                    finished();
                });

                script.test('todo');

                script.test('fails', function (finished) {

                    Lab.expect(true).to.equal(false);
                    finished();
                });

                script.test('fails with non-error', function (finished) {

                    finished('boom');
                });
            });

            Lab.report(script, { reporter: 'tap' }, function (err, code, output) {

                expect(err).to.not.exist;
                expect(code).to.equal(1);
                var result = output.replace(/  .*\n/g, '<trace>');
                expect(result).to.equal('1..5\nok 1 (1) test works\nok 2 SKIP (2) test skip\nok 3 TODO (3) test todo\nnot ok 4 (4) test fails\n<trace><trace><trace><trace><trace><trace>not ok 5 (5) test fails with non-error\n# tests 4\n# pass 1\n# fail 2\n# skipped 1\n# todo 1\n');
                done();
            });
        });
    });
});
