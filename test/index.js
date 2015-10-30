'use strict';

// Load modules

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


describe('Lab', () => {

    it('creates a script and executes', (done) => {

        let a = 0;
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.before((testDone) => {

                ++a;
                testDone();
            });

            script.test('value of a', (testDone) => {

                expect(a).to.equal(1);
                testDone();
            });

            script.after((testDone) => {

                ++a;
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(a).to.equal(2);
            expect(notebook.tests).to.have.length(1);
            expect(notebook.tests[0].id).to.equal(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('creates a script and executes (BDD)', (done) => {

        let a = 0;
        const script = Lab.script({ schedule: false });
        script.describe('test', () => {

            script.before((testDone) => {

                ++a;
                testDone();
            });

            script.it('value of a', (testDone) => {

                expect(a).to.equal(1);
                testDone();
            });

            script.after((testDone) => {

                ++a;
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(a).to.equal(2);
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('creates a script and executes (TDD)', (done) => {

        let a = 0;
        const script = Lab.script({ schedule: false });
        script.suite('test', () => {

            script.before((testDone) => {

                ++a;
                testDone();
            });

            script.test('value of a', (testDone) => {

                expect(a).to.equal(1);
                testDone();
            });

            script.after((testDone) => {

                ++a;
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(a).to.equal(2);
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('executes beforeEach and afterEach', (done) => {

        let a = 0;
        let b = 0;
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.before((testDone) => {

                ++a;
                testDone();
            });

            script.beforeEach((testDone) => {

                ++b;
                testDone();
            });

            script.test('value of a', (testDone) => {

                expect(a).to.equal(1);
                expect(b).to.equal(1);
                testDone();
            });

            script.test('value of b', (testDone) => {

                expect(a).to.equal(1);
                expect(b).to.equal(3);
                testDone();
            });

            script.after((testDone) => {

                ++a;
                testDone();
            });

            script.afterEach((testDone) => {

                ++b;
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(a).to.equal(2);
            expect(b).to.equal(4);
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('executes multiple pre/post processors', (done) => {

        let a = 0;
        let b = 0;
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.before((testDone) => {

                ++a;
                testDone();
            });

            script.before((testDone) => {

                ++a;
                testDone();
            });

            script.beforeEach((testDone) => {

                ++b;
                testDone();
            });

            script.beforeEach((testDone) => {

                ++b;
                testDone();
            });

            script.test('value of a', (testDone) => {

                expect(a).to.equal(2);
                expect(b).to.equal(2);
                testDone();
            });

            script.test('value of b', (testDone) => {

                expect(a).to.equal(2);
                expect(b).to.equal(6);
                testDone();
            });

            script.after((testDone) => {

                ++a;
                testDone();
            });

            script.after((testDone) => {

                ++a;
                testDone();
            });

            script.afterEach((testDone) => {

                ++b;
                testDone();
            });

            script.afterEach((testDone) => {

                ++b;
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(a).to.equal(4);
            expect(b).to.equal(8);
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('reports errors', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.test('works', (testDone) => {

                expect(0).to.equal(1);
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(1);
            done();
        });
    });

    it('multiple experiments', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment('test2', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].id).to.equal(1);
            expect(notebook.tests[1].id).to.equal(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('nested experiments', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', (testDone) => {

                testDone();
            });

            script.experiment('test2', () => {

                script.test('b', (testDone) => {

                    testDone();
                });
            });

            script.test('c', (testDone) => {

                testDone();
            });

            script.experiment('test3', () => {

                script.test('d', (testDone) => {

                    testDone();
                });
            });

            script.test('e', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(5);
            expect(notebook.tests[0].id).to.equal(1);
            expect(notebook.tests[1].id).to.equal(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips experiment', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment('test2', { skip: true }, () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips experiment using helper (2 args)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment.skip('test2', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips experiment using helper (3 args)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment.skip('test2', {}, () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one experiment (only first)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', { only: true }, () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment('test2', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one experiment (only not first)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment('test2', { only: true }, () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one experiment using helper (2 args)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment.only('test2', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one experiment using helper (3 args)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment.only('test2', {}, () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips test', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment('test2', () => {

            script.test('works', { skip: true }, (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips test using helper (2 args)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment('test2', () => {

            script.test.skip('works', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips test using helper (3 args)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        script.experiment('test2', () => {

            script.test.skip('works', {}, (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one test (only first)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', { only: true }, (testDone) => {

                testDone();
            });

            script.test('b', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.not.exist();
            expect(notebook.tests[1].skipped).to.equal(true);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one test (only not first)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', (testDone) => {

                testDone();
            });

            script.test('b', { only: true }, (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one test using helper (2 args)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', (testDone) => {

                testDone();
            });

            script.test.only('b', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('runs only one test using helper (3 args)', (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', (testDone) => {

                testDone();
            });

            script.test.only('b', {}, (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests[0].skipped).to.equal(true);
            expect(notebook.tests[1].skipped).to.not.exist();
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('schedules automatic execution', { parallel: false }, (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', (testDone) => {

                testDone();
            });
        });

        const orig = process.exit;
        process.exit = function (code) {

            process.exit = orig;
            expect(code).to.equal(0);
            done();
        };
    });

    it('throws on invalid functions', (done) => {

        const script = Lab.script();

        expect(() => {

            script.test('a');
        }).not.to.throw();

        expect(() => {

            script.test('a', () => {});
        }).to.throw('Function for test "a" should take exactly one argument');

        ['before', 'beforeEach', 'after', 'afterEach'].forEach((fn) => {

            expect(() => {

                script.experiment('exp', () => {

                    script[fn]();
                });
            }).to.throw('Function for ' + fn + ' in "exp" should take exactly one argument');

            expect(() => {

                script.experiment('exp', () => {

                    script[fn](() => {});
                });
            }).to.throw('Function for ' + fn + ' in "exp" should take exactly one argument');
        });

        Lab.execute(script, null, null, (err, notebook) => {

            done();
        });
    });
});
