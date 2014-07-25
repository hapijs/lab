// Load modules

var Path = require('path');
var Stream = require('stream');
var NodeUtil = require('util');
var _Lab = require('../test_runner');
var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = _Lab.expect;


describe('Reporters', function () {

    describe('console', function () {

        it('generates a report', function (done) {

            var script = Lab.script();
            script.experiment('test', function () {

                script.test('works', function (finished) {

                    Lab.expect(true).to.equal(true);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'console', output: false, level: 0 }, function (err, code, output) {

                expect(err).to.not.exist;
                expect(code).to.equal(0);
                expect(output).to.match(/^Test duration\: \d+ ms\n\n\u001b\[32m1 tests complete\u001b\[0m\n\n\u001b\[32m No global variable leaks detected\.\u001b\[0m\n\n$/);
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

            Lab.report(script, { reporter: 'console', output: false, level: 0 }, function (err, code, output) {

                expect(err).to.not.exist;
                expect(code).to.equal(1);
                expect(output).to.contain('expected true to equal false');
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
                });
            });

            Lab.report(script, { reporter: 'json', output: false, level: 0 }, function (err, code, output) {

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
                done();
            });
        });

        it('generates a report with coverage', function (done) {

            var options = { global: '__$$testCovJson' };
            Lab.coverage.instrument(options);
            var Test = require('../coverage-test/json');

            var script = Lab.script({ schedule: false });
            script.experiment('test', function () {

                script.test('value of a', function (finished) {

                    Lab.expect(Test.method(1)).to.equal(1);
                    finished();
                });
            });

            Lab.report(script, { reporter: 'json', output: false, level: 0, coverage: true, coverageGlobal: '__$$testCovJson' }, function (err, code, output) {

                var result = JSON.parse(output);
                expect(result.coverage.percent).to.equal(100);
                delete global.__$$testCovJson;
                done();
            });
        });
    });

    describe('tap', function () {

        var Recorder = function () {

            Stream.Writable.call(this);

            this.content = '';
        };

        NodeUtil.inherits(Recorder, Stream.Writable);

        Recorder.prototype._write = function (chunk, encoding, next) {

            this.content += chunk.toString();
            next();
        };

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

            var recorder = new Recorder();
            Lab.report(script, { reporter: 'tap', output: recorder, level: 0 }, function (err, code, output) {

                expect(err).to.not.exist;
                expect(code).to.equal(1);
                expect(output).to.equal('');
                var result = recorder.content.replace(/  .*\n/g, '<trace>');
                expect(result).to.equal('1..0\nok 1 (1) test works\nok 2 SKIP (2) test skip\nok 3 TODO (3) test todo\nnot ok 4 (4) test fails\n<trace><trace><trace><trace><trace><trace><trace><trace><trace>not ok 5 (5) test fails with non-error\n# tests 4\n# pass 1\n# fail 2\n# skipped 1\n# todo 1\n');
                done();
            });
        });
    });
});
