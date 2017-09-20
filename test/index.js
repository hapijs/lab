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

    it('creates a script and executes', async () => {

        let a = 0;
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.before(() => {

                ++a;
            });

            script.test('value of a', () => {

                expect(a).to.equal(1);
            });

            script.after(() => {

                ++a;
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(a).to.equal(2);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.tests[0].id).to.equal(1);
        expect(notebook.failures).to.equal(0);
    });

    it('creates a script and executes (BDD)', async () => {

        let a = 0;
        const script = Lab.script({ schedule: false });
        script.describe('test', () => {

            script.before(() => {

                ++a;
            });

            script.it('value of a', () => {

                expect(a).to.equal(1);
            });

            script.after(() => {

                ++a;
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(a).to.equal(2);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('creates a script and executes (TDD)', async () => {

        let a = 0;
        const script = Lab.script({ schedule: false });
        script.suite('test', () => {

            script.before(() => {

                ++a;
            });

            script.test('value of a', () => {

                expect(a).to.equal(1);
            });

            script.after(() => {

                ++a;
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(a).to.equal(2);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('executes beforeEach and afterEach', async () => {

        let a = 0;
        let b = 0;
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.before(() => {

                ++a;
            });

            script.beforeEach(() => {

                ++b;
            });

            script.test('value of a', () => {

                expect(a).to.equal(1);
                expect(b).to.equal(1);
            });

            script.test('value of b', () => {

                expect(a).to.equal(1);
                expect(b).to.equal(3);
            });

            script.after(() => {

                ++a;
            });

            script.afterEach(() => {

                ++b;
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(a).to.equal(2);
        expect(b).to.equal(4);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.failures).to.equal(0);
    });

    it('executes multiple pre/post processors', async () => {

        let a = 0;
        let b = 0;
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.before(() => {

                ++a;
            });

            script.before(() => {

                ++a;
            });

            script.beforeEach(() => {

                ++b;
            });

            script.beforeEach(() => {

                ++b;
            });

            script.test('value of a', () => {

                expect(a).to.equal(2);
                expect(b).to.equal(2);
            });

            script.test('value of b', () => {

                expect(a).to.equal(2);
                expect(b).to.equal(6);
            });

            script.after(() => {

                ++a;
            });

            script.after(() => {

                ++a;
            });

            script.afterEach(() => {

                ++b;
            });

            script.afterEach(() => {

                ++b;
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(a).to.equal(4);
        expect(b).to.equal(8);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.failures).to.equal(0);
    });

    it('reports errors', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.test('works', () => {

                expect(0).to.equal(1);
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
    });

    it('multiple experiments', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment('test2', () => {

            script.test('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].id).to.equal(1);
        expect(notebook.tests[1].id).to.equal(2);
        expect(notebook.failures).to.equal(0);
    });

    it('nested experiments', async (done) => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', () => {});

            script.experiment('test2', () => {

                script.test('b', () => {});
            });

            script.test('c', () => {});

            script.experiment('test3', () => {

                script.test('d', () => {});
            });

            script.test('e', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(5);
        expect(notebook.tests[0].id).to.equal(1);
        expect(notebook.tests[1].id).to.equal(2);
        expect(notebook.failures).to.equal(0);
    });

    it('skips experiment', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment('test2', { skip: true }, () => {

            script.test('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.not.exist();
        expect(notebook.tests[1].skipped).to.equal(true);
        expect(notebook.failures).to.equal(0);
    });

    it('skips experiment using helper (2 args)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment.skip('test2', () => {

            script.test('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.not.exist();
        expect(notebook.tests[1].skipped).to.equal(true);
        expect(notebook.failures).to.equal(0);
    });

    it('skips experiment using helper (3 args)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment.skip('test2', {}, () => {

            script.test('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.not.exist();
        expect(notebook.tests[1].skipped).to.equal(true);
        expect(notebook.failures).to.equal(0);
    });

    it('runs only one experiment (only first)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', { only: true }, () => {

            script.test('works', () => {});
        });

        script.experiment('test2', () => {

            script.test('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.not.exist();
        expect(notebook.tests[1].skipped).to.equal(true);
        expect(notebook.failures).to.equal(0);
    });

    it('runs only one experiment (only not first)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment('test2', { only: true }, () => {

            script.test('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.equal(true);
        expect(notebook.tests[1].skipped).to.not.exist();
        expect(notebook.failures).to.equal(0);
    });

    it('runs only one experiment using helper (2 args)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment.only('test2', () => {

            script.test('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.equal(true);
        expect(notebook.tests[1].skipped).to.not.exist();
        expect(notebook.failures).to.equal(0);
    });

    it('runs only one experiment using helper (3 args)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment.only('test2', {}, () => {

            script.test('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.equal(true);
        expect(notebook.tests[1].skipped).to.not.exist();
        expect(notebook.failures).to.equal(0);
    });

    it('skips test', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment('test2', () => {

            script.test('works', { skip: true }, () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.not.exist();
        expect(notebook.tests[1].skipped).to.equal(true);
        expect(notebook.failures).to.equal(0);
    });

    it('skips test using helper (2 args)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment('test2', () => {

            script.test.skip('works', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.not.exist();
        expect(notebook.tests[1].skipped).to.equal(true);
        expect(notebook.failures).to.equal(0);
    });

    it('skips test using helper (3 args)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('works', () => {});
        });

        script.experiment('test2', () => {

            script.test.skip('works', {}, () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.not.exist();
        expect(notebook.tests[1].skipped).to.equal(true);
        expect(notebook.failures).to.equal(0);
    });

    it('runs only one test (only first)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', { only: true }, () => {});

            script.test('b', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.not.exist();
        expect(notebook.tests[1].skipped).to.equal(true);
        expect(notebook.failures).to.equal(0);
    });

    it('runs only one test (only not first)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', () => {});

            script.test('b', { only: true }, () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.equal(true);
        expect(notebook.tests[1].skipped).to.not.exist();
        expect(notebook.failures).to.equal(0);
    });

    it('runs only one test using helper (2 args)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', () => {});

            script.test.only('b', () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.equal(true);
        expect(notebook.tests[1].skipped).to.not.exist();
        expect(notebook.failures).to.equal(0);
    });

    it('runs only one test using helper (3 args)', async () => {

        const script = Lab.script({ schedule: false });
        script.experiment('test1', () => {

            script.test('a', () => {});

            script.test.only('b', {}, () => {});
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests[0].skipped).to.equal(true);
        expect(notebook.tests[1].skipped).to.not.exist();
        expect(notebook.failures).to.equal(0);
    });

    it('schedules automatic execution of scripts', async () => {

        let executed = 0;
        const script = Lab.script({ output: false });
        script.experiment('test', () => {

            script.test('works', () => {

                return new Promise((resolve) => {

                    process.nextTick(() => {

                        ++executed;
                        resolve();
                    });
                });
            });
        });

        return new Promise((resolve) => {

            setTimeout(() => {

                expect(executed).to.equal(1);
                resolve();
            }, 50);
        });
    });

    it('should not throw on tests without a function', () => {

        const script = Lab.script({ schedule: false });

        expect(() => {

            script.test('a');
        }).not.to.throw();
    });

    it('should not throw on tests with a function without arguments', () => {

        const script = Lab.script({ schedule: false });

        expect(() => {

            script.test('a', () => {});
        }).not.to.throw();
    });

    ['before', 'beforeEach', 'after', 'afterEach'].forEach((fnName) => {

        it(`should throw on "${fnName}" without a function`, () => {

            const script = Lab.script({ schedule: false });

            expect(() => {

                script[fnName]();
            }).to.throw(`${fnName} in "script" requires a function argument`);
        });

        it(`should not throw on "${fnName}" with a function without arguments`, () => {

            const script = Lab.script({ schedule: false });

            expect(() => {

                script[fnName](() => {});
            }).not.to.throw();
        });
    });

    it('code is the default assertion library', async () => {

        const script = Lab.script({ schedule: false });

        script.experiment('experiment', () => {

            script.test('test', { plan: 1 }, () => {

                Lab.expect(1 + 1).to.equal(2);
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.tests[0].assertions).to.equal(1);
        expect(notebook.failures).to.equal(0);
    });

    it('exposes code on the script', () => {

        const script = Lab.script({ schedule: false });

        expect(script.expect).to.be.a.function();
        expect(script.fail).to.be.a.function();
    });

    it('does not expose code on the script if assert false', () => {

        const assertions = Lab.assertions;
        Lab.assertions = null;
        const script = Lab.script({ schedule: false });
        Lab.assertions = assertions;
        expect(script.expect).not.to.exist();
        expect(script.fail).not.to.exist();
    });
});
