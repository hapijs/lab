'use strict';

// Load modules

const Code = require('@hapi/code');
const Path = require('path');
const _Lab = require('../test_runner');
const Lab = require('../');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

// save references to timer globals

const setTimeout = global.setTimeout;
const clearTimeout = global.clearTimeout;
const setImmediate = global.setImmediate;

describe('Runner', () => {

    it('sets environment', async () => {

        const orig = process.env.NODE_ENV;

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', () => {

                expect(process.env.NODE_ENV).to.equal('lab');
                process.env.NODE_ENV = orig;
            });
        });

        const notebook = await Lab.execute(script, { environment: 'lab' }, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('won\'t set the environment when passing null', async () => {

        const orig = process.env.NODE_ENV;

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', () => {

                expect(process.env.NODE_ENV).to.equal(orig);
                process.env.NODE_ENV = orig;
            });
        });

        const notebook = await Lab.execute(script, { environment: null }, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('the environment defaults to test', async () => {

        const orig = process.env.NODE_ENV;

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', () => {

                expect(process.env.NODE_ENV).to.equal('test');
                process.env.NODE_ENV = orig;
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('calls cleanup function', async () => {

        const script = Lab.script();

        let flag = false;
        script.test('a', (flags) => {

            flags.onCleanup = () => {

                flag = true;
            };
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
        expect(flag).to.be.true();
    });

    it('calls failing cleanup function', async () => {

        const script = Lab.script();

        script.test('a', (flags) => {

            return new Promise((resolve) => {

                setImmediate(() => {

                    flags.onCleanup = () => {

                        return new Promise((innerResolve, reject) => {

                            setImmediate(() => {

                                reject(new Error('oops'));
                            });
                        });
                    };

                    setImmediate(resolve);
                });
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
    });

    it('calls failing cleanup function that throws', async () => {

        const script = Lab.script();

        script.test('a', (flags) => {

            return new Promise((resolve) => {

                setImmediate(() => {

                    flags.onCleanup = () => {

                        return new Promise((innerResolve, reject) => {

                            throw new Error('oops');
                        });
                    };

                    setImmediate(resolve);
                });
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
    });

    it('passes when mustCall function called correct times', async () => {

        const script = Lab.script();

        script.test('a', (flags) => {

            const noop = () => {};
            const wrapped1 = flags.mustCall(noop, 2);
            wrapped1();
            wrapped1();

            const wrapped2 = flags.mustCall(noop, 1);
            wrapped2();
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('fails when mustCall function not called correct times', async () => {

        const script = Lab.script();

        script.test('a', (flags) => {

            const noop = () => {};
            const wrapped1 = flags.mustCall(noop, 2);
            wrapped1();
            wrapped1();

            const wrapped2 = flags.mustCall(noop, 2);
            wrapped2();
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
        expect(notebook.tests[0].err.stack).to.contain(Path.normalize('test/runner.js'));
    });

    it('should fail test that returns a rejected promise', async () => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            return Promise.reject(new Error('A reason why this test failed'));
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
        expect(notebook.tests[0].err.toString()).to.contain('A reason why this test failed');
    });

    it('should fail test that returns a non-error response', async () => {

        const script = Lab.script({ schedule: false });

        script.test('a', async () => {

            await new Promise((resolve) => setTimeout(resolve, 10));
            throw undefined;
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
        expect(notebook.tests[0].err.toString()).to.contain('Error: Non Error object received or caught (unit test)');
    });

    it('should mark a test that isn\'t a function as a todo', async () => {

        const script = Lab.script({ schedule: false });

        script.test('a');

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.tests[0].todo).to.be.true();
    });

    it('should not fail test that returns a resolved promise', async () => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            return Promise.resolve();
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('should not fail test that returns a resolved promise with a value', async () => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            return Promise.resolve('a');
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('should not fail test that calls the callback without an error', async () => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {});

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('should break out of the test promise chain before starting the next test', async () => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            return Promise.reject(new Error('A reason why this test failed'));
        });

        script.test('b', () => {

            throw new Error('A different reason why this test failed');
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.failures).to.equal(2);
        expect(notebook.tests[0].err.toString()).to.contain('A reason why this test failed');
        expect(notebook.tests[1].err.toString()).to.contain('A different reason why this test failed');
    });

    it('should fail tests that throw a falsy value', async () => {

        for (const falsy of ['', null, undefined]) {

            const script = Lab.script({ schedule: false });

            script.test('a', () => {

                throw falsy;
            });

            const notebook = await Lab.execute(script, {}, null);
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures, 'When throwing ' + falsy).to.equal(1);
            expect(notebook.tests[0].err.toString()).to.contain('Non Error object received or caught (unit test)');
        }
    });

    it('should fail test when returning an empty rejected promise', async () => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            let rejectPromise;
            const promise = new Promise((_, reject) => {

                rejectPromise = reject;
            });
            setTimeout(rejectPromise, 10);

            return promise;
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
        expect(notebook.tests[0].err.toString()).to.contain('Non Error object received or caught (unit test)');
    });

    ['before', 'beforeEach', 'after', 'afterEach'].forEach((fnName) => {

        it(`should fail "${fnName}" that returns a rejected promise`, async () => {

            const script = Lab.script({ schedule: false });
            script.describe('a test group', () => {

                script.test('a', () => {});

                script[fnName](() => {

                    return Promise.reject(new Error('A reason why this test failed'));
                });
            });

            const notebook = await Lab.execute(script, {}, null);
            expect(notebook.failures).to.equal(1);
            expect(notebook.errors[0].message).to.contain('A reason why this test failed');
        });

        it(`should fail "${fnName}" that throw a falsy value`, async () => {

            for (const falsy of ['', null, undefined]) {

                const script = Lab.script({ schedule: false });

                script.describe('a test group', () => {

                    script.test('a', () => {});

                    script[fnName](() => {

                        throw falsy;
                    });
                });

                const notebook = await Lab.execute(script, {}, null);
                expect(notebook.failures, 'When throwing ' + falsy).to.equal(1);
                expect(notebook.errors[0].message).to.contain('Non Error object received or caught (unit test)');
            }
        });

        it(`should not fail "${fnName}" that returns a resolved promise`, async () => {

            const script = Lab.script({ schedule: false });
            script.describe('a test group', () => {

                script.test('a', () => {});

                script[fnName](() => {});
            });

            const notebook = await Lab.execute(script, {}, null);
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            expect(notebook.errors.length).to.equal(0);
        });
    });

    it('filters on ids', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', () => {});

            script.test('2', () => {

                throw new Error();
            });

            script.test('3', () => {});

            script.test('4', () => {

                throw new Error();
            });
        });

        const filterFirstIds = async function () {

            const notebook = await Lab.execute(script, { ids: [1, 3] }, null);
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(0);
        };

        const filterLastIds = async function () {

            const notebook = await Lab.execute(script, { ids: [2, 4] }, null);
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(2);
        };

        await filterFirstIds();
        await filterLastIds();
    });

    it('filters on grep', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', () => {});

            script.test('a', () => {

                throw new Error();
            });

            script.test('3', () => {});

            script.test('b', () => {

                throw new Error();
            });
        });

        const filterDigit = async function () {

            const notebook = await Lab.execute(script, { grep: '\\d' }, null);
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(0);
        };

        const filterAlpha = async function () {

            const notebook = await Lab.execute(script, { grep: '[ab]' }, null);
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(2);
        };

        await filterDigit();
        await filterAlpha();
    });

    it('skips tests not in "only" experiment', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment.only('subexperiment', () => {

                script.test('s1', () => {});

                script.test('s2', () => {});
            });

            script.test('a', () => {

                throw new Error();
            });

            script.test('b', () => {

                throw new Error();
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(4);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(2);
        expect(notebook.failures).to.equal(0);
    });

    it('skips everything except the "only" test', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('subexperiment', () => {

                script.test('s1', () => {

                    throw new Error();
                });

                script.test('s2', () => {

                    throw new Error();
                });
            });

            script.test.only('a', () => {});

            script.test('b', () => {

                throw new Error();
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(4);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(3);
        expect(notebook.failures).to.equal(0);
    });

    it('skips everything except the "only" test when executing multiple scripts', async () => {

        const script1 = Lab.script();
        script1.experiment('test', () => {

            script1.experiment('subexperiment', () => {

                script1.test('s1', () => {

                    throw new Error();
                });

                script1.test('s2', () => {

                    throw new Error();
                });
            });

            script1.test.only('a', () => {});

            script1.test('b', () => {

                throw new Error();
            });
        });
        const script2 = Lab.script();
        script2.experiment('test2', () => {

            script2.test('x1', () => {

                throw new Error();
            });
        });

        const notebook = await Lab.execute([script1, script2], {}, null);
        expect(notebook.tests).to.have.length(5);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(4);
        expect(notebook.failures).to.equal(0);
    });

    it('skips everything except "only" tests when multiple "only" tests are in the same experiment', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('subexperiment', () => {

                script.test('s1', () => {

                    throw new Error();
                });

                script.test.only('s2', () => {});

                script.test.only('s3', () => {});
            });

            script.test('a', () => {

                throw new Error();
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(4);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(2);
        expect(notebook.failures).to.equal(0);
    });

    it('skips everything except "only" tests when multiple "only" tests are deeply nested in the same experiment', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('level 2a', () => {

                script.experiment('level 3a', () => {

                    script.experiment('level 4a', () => {

                        script.test('test a', () => {

                            throw new Error();
                        });

                        script.test.only('test b', () => {});
                    });
                });
            });

            script.experiment('level 2b', () => {

                script.experiment('level 3b', () => {

                    script.experiment('level 4b', () => {

                        script.test('test a', () => {

                            throw new Error();
                        });

                        script.test.only('test b', () => {});
                    });
                });
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(4);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(2);
        expect(notebook.failures).to.equal(0);
    });

    it('skips everything except "only" tests when "only" tests are in different experiments', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('subexperiment1', () => {

                script.test('s1', () => {

                    throw new Error();
                });

                script.test.only('s2', () => {});
            });

            script.experiment('subexperiment2', () => {

                script.test('s1', () => {

                    throw new Error();
                });

                script.test.only('s2', () => {});

            });

            script.test('a', () => {

                throw new Error();
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(5);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(3);
        expect(notebook.failures).to.equal(0);
    });

    it('skips "only" tests when ancestor experiment is skipped', async () => {

        const script = Lab.script();
        script.experiment.skip('test', () => {

            script.experiment('subexperiment1', () => {

                script.test.only('s1', () => {

                    throw new Error();
                });
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('skips everything except "only" tests when "only" tests are in different scripts', async () => {

        const script1 = Lab.script();
        script1.experiment('test', () => {

            script1.experiment('subexperiment', () => {

                script1.test('s1', () => {

                    throw new Error();
                });

                script1.test('s2', () => {

                    throw new Error();
                });
            });

            script1.test.only('a', () => {});

            script1.test('b', () => {

                throw new Error();
            });
        });
        const script2 = Lab.script();
        script2.experiment('test2', () => {

            script2.test.only('x1', () => {});
        });

        const notebook = await Lab.execute([script1, script2] , {}, null);
        expect(notebook.tests).to.have.length(5);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(3);
        expect(notebook.failures).to.equal(0);
    });

    it('skips before function in non-run experiment', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment.skip('subexperiment1', () => {

                script.before(() => {

                    throw new Error();
                });

                script.test('s1', () => {});
            });

            script.experiment('subexperiment2', () => {

                script.before(() => {});

                script.test('s1', () => {});
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests).to.have.length(2);
        expect(notebook.tests.filter((test) => test.skipped)).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('skips before function when not run through index', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('subexperiment1', () => {

                script.before(() => {

                    throw new Error();
                });

                script.test('s1', () => {});
            });

            script.experiment('subexperiment2', () => {

                script.before(() => {});

                script.test('s1', () => {});
            });
        });

        const notebook = await Lab.execute(script, { ids: [2] }, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('skips before function when not run through index and in sub experiment', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('subexperiment1', () => {

                script.before(() => {

                    throw new Error();
                });

                script.experiment('sub sub experiment1', () => {

                    script.before(() => {

                        throw new Error();
                    });

                    script.test('s1', () => {});
                });
            });

            script.experiment('subexperiment2', () => {

                script.experiment('sub subexperiment2', () => {

                    script.before(() => {});

                    script.test('s1', () => {});
                });
            });
        });

        const notebook = await Lab.execute(script, { ids: [2] }, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(0);
    });

    it('bail will terminate on the first test failure', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', () => {});

            script.test('2', () => {

                throw new Error('bailing');
            });

            script.test('3', () => {});
        });

        const notebook = await Lab.execute(script, { bail: true }, null);
        expect(notebook.tests).to.have.length(3);
        expect(notebook.failures).to.equal(1);
        expect(notebook.tests[1].err.message).to.contain('bailing');
        expect(notebook.tests[2].skipped).to.be.true();
    });

    it('bail will terminate on the first test failure (skipping next befores)', async () => {

        const script = Lab.script();
        let beforeRan = false;
        script.experiment('root', () => {

            script.experiment('test', () => {

                script.test('1', () => {});

                script.test('2', () => {

                    throw new Error('bailing');
                });

                script.test('3', () => {});
            });

            script.experiment('test', () => {

                script.before(() => {

                    beforeRan = true;
                });

                script.test('1', () => {});
            });
        });

        const notebook = await Lab.execute(script, { bail: true }, null);
        expect(notebook.tests).to.have.length(4);
        expect(notebook.failures).to.equal(1);
        expect(notebook.tests[1].err.message).to.contain('bailing');
        expect(notebook.tests[2].skipped).to.be.true();
        expect(notebook.tests[3].skipped).to.be.true();
        expect(beforeRan).to.be.false();
    });

    it('bail will terminate on the first test failure (skipping sub-experiments)', async () => {

        const script = Lab.script();
        let beforeRan = false;
        script.experiment('test', () => {

            script.test('1', () => {});

            script.test('2', () => {

                throw new Error('bailing');
            });

            script.test('3', () => {});

            script.experiment('test', () => {

                script.before(() => {

                    beforeRan = true;
                });

                script.test('1', () => {});
            });
        });

        const notebook = await Lab.execute(script, { bail: true }, null);
        expect(notebook.tests).to.have.length(4);
        expect(notebook.failures).to.equal(1);
        expect(notebook.tests[1].err.message).to.contain('bailing');
        expect(notebook.tests[2].skipped).to.be.true();
        expect(notebook.tests[3].skipped).to.be.true();
        expect(beforeRan).to.be.false();
    });

    it('dry run won\'t execute tests', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', () => {});

            script.test('a', () => {

                throw new Error();
            });

            script.test('3', () => {});

            script.test('b', () => {

                throw new Error();
            });
        });

        const notebook = await Lab.execute(script, { dry: true }, null);
        expect(notebook.tests).to.have.length(4);
        expect(notebook.failures).to.equal(0);
    });

    it('shuffle will randomize scripts', async () => {

        const script1 = Lab.script();
        script1.experiment('test1', () => {

            script1.test('1', () => {});
        });

        const script2 = Lab.script();
        script2.experiment('test2', () => {

            script2.test('2', () => {});
        });

        const script3 = Lab.script();
        script3.experiment('test3', () => {

            script3.test('3', () => {});
        });

        const script4 = Lab.script();
        script4.experiment('test4', () => {

            script4.test('4', () => {});
        });

        const script5 = Lab.script();
        script5.experiment('test5', () => {

            script5.test('5', () => {});
        });

        const scripts = [script1, script2, script3, script4, script5];
        const notebook1 = await Lab.execute(scripts, { dry: true, shuffle: true, seed: 0.3 }, null);
        const notebook2 = await Lab.execute(scripts, { dry: true, shuffle: true, seed: 0.7 }, null);
        expect(notebook1.tests).to.not.equal(notebook2.tests);
    });

    it('shuffle allows to set a seed to use to re-use order of a previous test run', async () => {

        const script1 = Lab.script();
        script1.experiment('test1', () => {

            script1.test('1', () => {});
        });

        const script2 = Lab.script();
        script2.experiment('test2', () => {

            script2.test('2', () => {});
        });

        const script3 = Lab.script();
        script3.experiment('test3', () => {

            script3.test('3', () => {});
        });

        const script4 = Lab.script();
        script4.experiment('test4', () => {

            script4.test('4', () => {});
        });

        const script5 = Lab.script();
        script5.experiment('test5', () => {

            script5.test('5', () => {});
        });

        const scripts = [script1, script2, script3, script4, script5];
        const notebook1 = await Lab.execute(scripts, { dry: true, shuffle: true, seed: 1234 }, null);
        const notebook2 = await Lab.execute(scripts, { dry: true, shuffle: true, seed: 1234 }, null);
        expect(notebook1.tests).to.equal(notebook2.tests);
    });

    it('skips and fails tests on failed before', async () => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.before(() => {

                steps.push('before');
                return Promise.reject(new Error('oops'));
            });

            script.test('fails', () => {

                steps.push('test');
            });

            script.test('skips', { skip: true }, () => {

                steps.push('test');
            });

            script.test('todo');

            script.experiment('inner', { skip: true }, () => {

                script.test('skips', () => {

                    steps.push('test');
                });

                script.experiment('inner', () => {

                    script.test('skips', () => {

                        steps.push('test');
                    });
                });
            });

            script.experiment('inner2', () => {

                script.test('skips', { skip: true }, () => {

                    steps.push('test');
                });

                script.test('fails', () => {

                    steps.push('test');
                });

                script.experiment('inner3', () => {

                    script.test('fails', () => {

                        steps.push('test');
                    });
                });
            });

            script.after(() => {

                steps.push('after');
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests[0].err).to.equal('\'before\' action failed');
        expect(steps).to.equal(['before']);
        expect(notebook.failures).to.equal(3);
        notebook.tests.forEach((test) => {

            if (test.title.indexOf('fails') !== -1) {
                expect(test.err).to.exist();
                expect(test.err).to.contain('before');
            }
        });
    });

    it('skips tests on failed beforeEach', async () => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.beforeEach(() => {

                steps.push('before');
                return Promise.reject(new Error('oops'));
            });

            script.test('works', () => {

                steps.push('test');
            });

            script.afterEach(() => {

                steps.push('after');
            });
        });

        const notebook = await Lab.execute(script, null, null);
        expect(notebook.tests[0].err.message).to.contain('oops');
        expect(steps).to.equal(['before']);
    });

    it('runs afterEaches in nested experiments from inside, out (by experiments)', async () => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.beforeEach(() => {

                steps.push('outer beforeEach');
            });

            script.afterEach(() => {

                steps.push('outer afterEach 1');
            });

            script.test('first works', () => {

                steps.push('first test');
            });

            script.experiment('inner test', () => {

                script.beforeEach(() => {

                    steps.push('inner beforeEach');
                });

                script.afterEach(() => {

                    steps.push('inner afterEach 1');
                });

                script.test('works', () => {

                    steps.push('second test');
                });

                script.afterEach(() => {

                    steps.push('inner afterEach 2');
                });
            });

            script.afterEach(() => {

                steps.push('outer afterEach 2');
            });
        });

        await Lab.execute(script, null, null);
        expect(steps).to.equal([
            'outer beforeEach',
            'first test',
            'outer afterEach 1',
            'outer afterEach 2',
            'outer beforeEach',
            'inner beforeEach',
            'second test',
            'inner afterEach 1',
            'inner afterEach 2',
            'outer afterEach 1',
            'outer afterEach 2'
        ]);
    });

    it('reports the used seed', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', () => {});
        });

        const { code, output } = await Lab.report(script, { output: false, seed: 1234, shuffle: true });
        expect(code).to.equal(0);
        expect(output).to.contain('1234');
    });

    it('uses provided linter', async () => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', () => {});
        });

        const { code, output } = await Lab.report(script, { output: false, lint: true, linter: 'eslint', lintingPath: 'test/lint' });
        expect(code).to.equal(1);
        expect(output).to.contain(['eslint' + Path.sep, 'semi']);
    });

    it('extends report with assertions library support', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions });
        expect(code).to.equal(0);
        expect(output).to.match(/Assertions count: \d+/);
    });

    it('extends report with assertions library support (planned assertions)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 1 }, () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions });
        expect(code).to.equal(0);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.not.match(/Expected \d+ assertions, but found \d+/);
    });

    it('extends report with assertions library support (planned assertions error)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 2 }, () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions });
        expect(code).to.equal(1);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.match(/Expected \d+ assertions, but found \d+/);
    });

    it('extends report with assertions library support (planned assertions error with existing error)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 2 }, () => {

                assertions.expect(true).to.be.true();
                return Promise.reject(new Error('My Error'));
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions });
        expect(code).to.equal(1);
        expect(output).to.match(/My Error/);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.match(/Expected \d+ assertions, but found \d+/);
    });

    it('extends report with planned assertions and missing assertion library', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 1 }, () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: false });
        expect(code).to.equal(1);
        expect(output).to.contain('Expected 1 assertions, but no assertion library found');
    });

    it('extends report with assertions library support (default minimum planned assertions)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions, 'default-plan-threshold': 1 });
        expect(code).to.equal(0);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.not.match(/Expected at least \d+ assertions, but found \d+/);
    });

    it('extends report with assertions library support and test error (minimum planned assertions)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 2 }, () => {

                throw new Error('Expected 3 assertions');
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions });
        expect(code).to.equal(1);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.match(/Expected \d+ assertions/);
    });

    it('extends report with assertions library support and test error (default minimum planned assertions)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', () => {

                assertions.expect(true).to.be.true();
                throw new Error('Expected 3 assertions');
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions, 'default-plan-threshold': 2 });
        expect(code).to.equal(1);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.match(/Expected at least \d+ assertions/);
    });

    it('extends report with assertions library support (default minimum planned assertions)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.before(() => {});

            script.test('1', () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions, 'default-plan-threshold': 1 });
        expect(code).to.equal(0);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.not.match(/Expected at least \d+ assertions, but found \d+/);
    });

    it('extends report with assertions library support (local override and default minimum planned assertions error)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 2 }, () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions, 'default-plan-threshold': 1 });
        expect(code).to.equal(1);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.match(/Expected \d+ assertions, but found \d+/);
    });

    it('extends report with assertions library support (default minimum planned assertions error)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions, 'default-plan-threshold': 2 });
        expect(code).to.equal(1);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.match(/Expected at least \d+ assertions, but found \d+/);
    });

    it('extends report with assertions library support (planned assertions error with existing error)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', () => {

                assertions.expect(true).to.be.true();
                return Promise.reject(new Error('My Error'));
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions, 'default-plan-threshold': 2 });
        expect(code).to.equal(1);
        expect(output).to.match(/My Error/);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.match(/Expected at least \d+ assertions, but found \d+/);
    });

    it('extends report with planned assertions and missing assertion library', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: false, 'default-plan-threshold': 1 });
        expect(code).to.equal(1);
        expect(output).to.contain('Expected at least 1 assertions, but no assertion library found');
    });

    it('extends report with assertions library support (incompatible)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', () => {

                assertions.expect(true).to.be.true();
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: {} });
        expect(code).to.equal(0);
        expect(output).to.not.match(/Assertions count: \d+/);
    });

    it('extends report with assertions library support (incomplete assertions)', async () => {

        const script = Lab.script();
        const assertions = {
            count: () => 1,
            incomplete: () => ['line 42']
        };
        script.experiment('test', () => {

            script.test('1', () => {});
        });

        const { code, output } = await Lab.report(script, { output: false, assert: assertions });
        expect(code).to.equal(1);
        expect(output).to.match(/Assertions count: \d+/);
        expect(output).to.contain('Incomplete assertion at line 42');
    });

    it('reports errors with shared event emitters', async () => {

        const script = Lab.script();
        const EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', () => {

            let shared;
            script.beforeEach(() => {

                shared = new EventEmitter();
                const onWhatever = function () {

                    this.emit('something');
                };

                shared.on('whatever', onWhatever);
            });

            script.test('1', () => {

                shared.on('something', () => {

                    throw new Error('assertion failed !');
                });
                shared.emit('whatever');
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: false });
        expect(code).to.equal(1);
        expect(output).to.contain('1 of 1 tests failed');
        expect(output).to.contain('assertion failed !');
    });

    it('reports errors with shared event emitters and nested experiments', async () => {

        const script = Lab.script();
        const EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', () => {

            let shared;
            script.beforeEach(() => {

                shared = new EventEmitter();
                const onWhatever = function () {

                    this.emit('something');
                };

                shared.on('whatever', onWhatever);
            });

            script.test('1', () => {

                shared.on('something', () => {

                    throw new Error('assertion failed !');
                });
                shared.emit('whatever');
            });

            script.experiment('nested test', () => {

                script.test('2', () => {

                    shared.on('something', () => {

                        throw new Error('assertion failed !');
                    });
                    shared.emit('whatever');
                });
            });
        });

        const { code, output } = await Lab.report(script, { output: false, assert: false });
        expect(code).to.equal(1);
        expect(output).to.contain('2 of 2 tests failed');
        expect(output.match(/assertion failed !/g)).to.have.length(2);
    });

    it('reports errors with shared event emitters and nested experiments with a single deep failure', async () => {

        const script = Lab.script();
        const EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', () => {

            let shared;
            script.beforeEach(() => {

                shared = new EventEmitter();
                const onWhatever = function () {

                    this.emit('something');
                };

                shared.on('whatever', onWhatever);
            });

            script.test('1', () => {

                shared.on('something', () => {});
                shared.emit('whatever');
            });

            script.experiment('nested test', () => {

                script.test('2', () => {

                    shared.on('something', () => {

                        throw new Error('assertion failed !');
                    });
                    shared.emit('whatever');
                });
            });
        });

        const { code, output } = await  Lab.report(script, { output: false, assert: false });
        expect(code).to.equal(1);
        expect(output).to.contain('1 of 2 tests failed');
        expect(output.match(/assertion failed !/g)).to.have.length(1);
    });

    it('retries failing test (default)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            let count = 0;
            script.test('1', { retry: true }, () => {

                assertions.expect(++count === 5).to.be.true();
            });
        });

        const { code } = await Lab.report(script, { output: false, assert: assertions });
        expect(code).to.equal(0);
    });

    it('retries failing test (specific)', async () => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            let count = 0;
            script.test('1', { retry: 4 }, () => {

                assertions.expect(++count === 5).to.be.true();
            });
        });

        const { code } = await Lab.report(script, { output: false, assert: assertions });
        expect(code).to.equal(1);
    });

    describe('global timeout functions', () => {

        // We can't poison global.Date because the normal implementation of
        // global.setTimeout uses it [1] so if the runnable.js keeps a copy of
        // global.setTimeout (like it's supposed to), that will blow up.
        // [1]: https://github.com/joyent/node/blob/7fc835afe362ebd30a0dbec81d3360bd24525222/lib/timers.js#L74
        const overrideGlobals = function () {

            const fn = function () {};
            global.setTimeout = fn;
            global.clearTimeout = fn;
            global.setImmediate = fn;
        };

        const resetGlobals = function () {

            global.setTimeout = setTimeout;
            global.clearTimeout = clearTimeout;
            global.setImmediate = setImmediate;
        };

        it('setImmediate still functions correctly', async () => {

            const script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', () => {

                script.test('1', () => {

                    return new Promise((resolve) => {

                        setImmediate(resolve);
                    });
                });
            });

            const { code } = await Lab.report(script, { output: false, assert: false });
            expect(code).to.equal(0);
        });

        it('test timeouts still function correctly', async () => {

            const script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', () => {

                script.test('timeout', { timeout: 5 }, () => {});
            });

            const now = Date.now();
            await Lab.execute(script, null, null);
            expect(Date.now() - now).to.be.below(100);
        });

        it('setTimeout still functions correctly', async () => {

            const script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', { timeout: 5 }, () => {

                script.test('timeout', { timeout: 0 }, () => {

                    return new Promise((resolve) => {

                        setTimeout(resolve, 10);
                    });
                });
            });

            const now = Date.now();
            await Lab.execute(script, null, null);
            expect(Date.now() - now).to.be.above(8);
        });

        it('setTimeout still functions correctly with non-integer timeout', async () => {

            const script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', { timeout: 5 }, () => {

                script.test('timeout', { timeout: 'a' }, () => {

                    return new Promise((resolve) => {

                        setTimeout(resolve, 10);
                    });
                });
            });

            const notebook = await Lab.execute(script, null, null);
            expect(notebook.failures).to.equal(1);
        });
    });

    it('fails with a thrown error', async () => {

        const script = Lab.script({ schedule: false });
        script.test('handles a thrown error', () => {

            throw new Error('Rejection!');
        });

        const notebook = await Lab.execute(script, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
        expect(notebook.tests[0].err.toString()).to.contain('Rejection!');
    });

    it('handles multiple rejections', async () => {

        const script = Lab.script({ schedule: false });
        script.test('handles multiple Promise rejection', () => {

            return new Promise((resolve, reject) => {

                reject('first');
                reject('second');
            });
        });

        const notebook = await Lab.execute(script, null);
        expect(notebook.tests).to.have.length(1);
        expect(notebook.failures).to.equal(1);
    });

    it('passes shallow clones of context to tests', async () => {

        const script = Lab.script({ schedule: false });

        const testContext = {
            testData: { hello: 'there' }
        };

        const innerContext = {
            testData: { goodbye: 'you' },
            additionalData: { another: 'object' }
        };

        script.experiment('test', () => {

            script.before(({ context }) => {

                context.testData = testContext.testData;
            });

            script.test('has test context', ({ context }) => {

                expect(context,'has proper context').to.equal(testContext);
                expect(context,'is a shallow clone').to.not.shallow.equal(testContext);
                expect(context.testData,'is a reference').to.shallow.equal(testContext.testData);
                context.anotherProperty = { something: 'random' };
            });

            script.test('does not see changes to context from previous test', ({ context }) => {

                expect(context,'has proper context').to.equal(testContext);
                expect(context,'is a shallow clone').to.not.shallow.equal(testContext);
                expect(context.testData,'is a reference').to.shallow.equal(testContext.testData);
                expect(context.anotherProperty,'uses the original clone').to.not.exist();
            });

            script.experiment('inner test', () => {

                script.before(({ context }) => {

                    context.testData = innerContext.testData;
                    context.additionalData = innerContext.additionalData;
                });

                script.test('still has test context', ({ context }) => {

                    expect(context,'has proper context').to.equal(innerContext);
                    expect(context,'is a shallow clone').to.not.shallow.equal(innerContext);
                    expect(context.testData,'is a reference').to.shallow.equal(innerContext.testData);
                    expect(context.additionalData,'is a reference').to.shallow.equal(innerContext.additionalData);
                });

                script.after(({ context }) => {

                    context.addedAfter = { another: 'object' };
                });
            });

            script.test(({ context }) => {

                expect(context,'is a shallow clone').to.not.shallow.equal(innerContext);
                expect(context.testData,'is a reference').to.shallow.equal(innerContext.testData);
                expect(context.additionalData,'is a reference').to.shallow.equal(innerContext.additionalData);
                expect(context.addedAfter,'keeps references from after').to.equal({ another: 'object' });
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests.length,'has 4 tests').to.equal(4);
        expect(notebook.failures,'has 0 failures').to.equal(0);
    });

    it('nullifies test context on finish', async () => {

        const script = Lab.script({ schedule: false });

        const testContext = {
            testData: { hello: 'there' }
        };

        script.experiment('test', () => {

            script.beforeEach(({ context }) => {

                context.testData = testContext.testData;
            });

            script.test('has test context', ({ context }) => {

                expect(context,'has proper context').to.equal(testContext);
            });

            script.test('still has test context', ({ context }) => {

                expect(context,'has proper context').to.equal(testContext);
            });
        });

        const notebook = await Lab.execute(script, {}, null);
        expect(notebook.tests.length,'has 2 tests').to.equal(2);
        expect(notebook.failures,'has 0 failures').to.equal(0);

        const assertNulledContext = (test) => {

            expect(test.context,'nulled context').to.be.null();
        };

        notebook.tests.forEach(assertNulledContext);
    });
});
