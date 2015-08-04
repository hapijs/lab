// Load modules

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


describe('Lab', function () {

    it('creates a script and executes', function (done) {

        var a = 0;
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.before(function (testDone) {

                ++a;
                testDone();
            });

            script.test('value of a', function (testDone) {

                expect(a).to.equal(1);
                testDone();
            });

            script.after(function (testDone) {

                ++a;
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(a).to.equal(2);
            expect(notebook.tests).to.have.length(1);
            expect(notebook.tests[0].id).to.equal(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('creates a script and executes (BDD)', function (done) {

        var a = 0;
        var script = Lab.script({ schedule: false });
        script.describe('test', function () {

            script.before(function (testDone) {

                ++a;
                testDone();
            });

            script.it('value of a', function (testDone) {

                expect(a).to.equal(1);
                testDone();
            });

            script.after(function (testDone) {

                ++a;
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(a).to.equal(2);
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('creates a script and executes (TDD)', function (done) {

        var a = 0;
        var script = Lab.script({ schedule: false });
        script.suite('test', function () {

            script.before(function (testDone) {

                ++a;
                testDone();
            });

            script.test('value of a', function (testDone) {

                expect(a).to.equal(1);
                testDone();
            });

            script.after(function (testDone) {

                ++a;
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(a).to.equal(2);
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('executes beforeEach and afterEach', function (done) {

        var a = 0;
        var b = 0;
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.before(function (testDone) {

                ++a;
                testDone();
            });

            script.beforeEach(function (testDone) {

                ++b;
                testDone();
            });

            script.test('value of a', function (testDone) {

                expect(a).to.equal(1);
                expect(b).to.equal(1);
                testDone();
            });

            script.test('value of b', function (testDone) {

                expect(a).to.equal(1);
                expect(b).to.equal(3);
                testDone();
            });

            script.after(function (testDone) {

                ++a;
                testDone();
            });

            script.afterEach(function (testDone) {

                ++b;
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(a).to.equal(2);
            expect(b).to.equal(4);
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('executes multiple pre/post processors', function (done) {

        var a = 0;
        var b = 0;
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.before(function (testDone) {

                ++a;
                testDone();
            });

            script.before(function (testDone) {

                ++a;
                testDone();
            });

            script.beforeEach(function (testDone) {

                ++b;
                testDone();
            });

            script.beforeEach(function (testDone) {

                ++b;
                testDone();
            });

            script.test('value of a', function (testDone) {

                expect(a).to.equal(2);
                expect(b).to.equal(2);
                testDone();
            });

            script.test('value of b', function (testDone) {

                expect(a).to.equal(2);
                expect(b).to.equal(6);
                testDone();
            });

            script.after(function (testDone) {

                ++a;
                testDone();
            });

            script.after(function (testDone) {

                ++a;
                testDone();
            });

            script.afterEach(function (testDone) {

                ++b;
                testDone();
            });

            script.afterEach(function (testDone) {

                ++b;
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(a).to.equal(4);
            expect(b).to.equal(8);
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('reports errors', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('works', function (testDone) {

                expect(0).to.equal(1);
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(1);
            done();
        });
    });

    it('multiple experiments', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment('test2', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].id).to.equal(1);
            expect(notebook.tests[1].id).to.equal(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('nested experiments', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('a', function (testDone) {

                testDone();
            });

            script.experiment('test2', function () {

                script.test('b', function (testDone) {

                    testDone();
                });
            });

            script.test('c', function (testDone) {

                testDone();
            });

            script.experiment('test3', function () {

                script.test('d', function (testDone) {

                    testDone();
                });
            });

            script.test('e', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(5);
            expect(notebook.tests[0].id).to.equal(1);
            expect(notebook.tests[1].id).to.equal(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips experiment', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment('test2', { skip: true }, function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips experiment using helper (2 args)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment.skip('test2', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips experiment using helper (3 args)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment.skip('test2', {}, function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one experiment (only first)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', { only: true }, function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment('test2', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one experiment (only not first)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment('test2', { only: true }, function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one experiment using helper (2 args)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment.only('test2', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one experiment using helper (3 args)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment.only('test2', {}, function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips test', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment('test2', function () {

            script.test('works', { skip: true }, function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips test using helper (2 args)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment('test2', function () {

            script.test.skip('works', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips test using helper (3 args)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        script.experiment('test2', function () {

            script.test.skip('works', {}, function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one test (only first)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('a', { only: true }, function (testDone) {

                testDone();
            });

            script.test('b', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one test (only not first)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('a', function (testDone) {

                testDone();
            });

            script.test('b', { only: true }, function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one test using helper (2 args)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('a', function (testDone) {

                testDone();
            });

            script.test.only('b', function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one test using helper (3 args)', function (done) {

        var script = Lab.script({ schedule: false });
        script.experiment('test1', function () {

            script.test('a', function (testDone) {

                testDone();
            });

            script.test.only('b', {}, function (testDone) {

                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('schedules automatic execution', { parallel: false }, function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (testDone) {

                testDone();
            });
        });

        var orig = process.exit;
        process.exit = function (code) {

            process.exit = orig;
            expect(code).to.equal(0);
            done();
        };
    });

    it('throws on invalid functions', function (done) {

        var script = Lab.script();

        expect(function () {

            script.test('a');
        }).not.to.throw();

        expect(function () {

            script.test('a', function () {});
        }).to.throw('Function for test "a" should take exactly one argument');

        ['before', 'beforeEach', 'after', 'afterEach'].forEach(function (fn) {

            expect(function () {

                script.experiment('exp', function () {

                    script[fn]();
                });
            }).to.throw('Function for ' + fn + ' in "exp" should take exactly one argument');

            expect(function () {

                script.experiment('exp', function () {

                    script[fn](function () {});
                });
            }).to.throw('Function for ' + fn + ' in "exp" should take exactly one argument');
        });

        Lab.execute(script, null, null, function (err, notebook) {

            done();
        });
    });
});
