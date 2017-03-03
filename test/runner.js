'use strict';

// Load modules

const Code = require('code');
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

    it('sets environment', { parallel: false }, (done) => {

        const orig = process.env.NODE_ENV;

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', (testDone) => {

                expect(process.env.NODE_ENV).to.equal('lab');
                process.env.NODE_ENV = orig;
                testDone();
            });
        });

        Lab.execute(script, { environment: 'lab' }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('won\'t set the environment when passing null', { parallel: false }, (done) => {

        const orig = process.env.NODE_ENV;

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', (testDone) => {

                expect(process.env.NODE_ENV).to.equal(orig);
                process.env.NODE_ENV = orig;
                testDone();
            });
        });

        Lab.execute(script, { environment: null }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('the environment defaults to test', { parallel: false }, (done) => {

        const orig = process.env.NODE_ENV;

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('works', (testDone) => {

                expect(process.env.NODE_ENV).to.equal('test');
                process.env.NODE_ENV = orig;
                testDone();
            });
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('calls cleanup function', (done) => {

        const script = Lab.script();

        let flag = false;
        script.test('a', (done, onCleanup) => {

            onCleanup((next) => {

                flag = true;
                return next();
            });

            done();
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            expect(flag).to.be.true();
            done();
        });
    });

    it('should fail test that neither takes a callback nor returns anything', (done) => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {});

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(1);
            expect(notebook.tests[0].err.toString()).to.contain('Function for "a" should either take a callback argument or return a promise');
            done();
        });
    });

    it('should fail test that neither takes a callback nor returns a valid promise', (done) => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            return { not: 'a promise' };
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(1);
            expect(notebook.tests[0].err.toString()).to.contain('Function for "a" should either take a callback argument or return a promise');
            done();
        });
    });

    it('should fail test that returns a rejected promise', (done) => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            return Promise.reject(new Error('A reason why this test failed'));
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(1);
            expect(notebook.tests[0].err.toString()).to.contain('A reason why this test failed');
            done();
        });
    });

    it('should fail test that calls the callback with an error', (done) => {

        const script = Lab.script({ schedule: false });

        script.test('a', (done) => {

            done(new Error('A reason why this test failed'));
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(1);
            expect(notebook.tests[0].err.toString()).to.contain('A reason why this test failed');
            done();
        });
    });

    it('should not fail test that returns a resolved promise', (done) => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            return Promise.resolve();
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('should not fail test that calls the callback without an error', (done) => {

        const script = Lab.script({ schedule: false });

        script.test('a', (done) => {

            done();
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('should break out of the test promise chain before starting the next test', (done) => {

        const script = Lab.script({ schedule: false });

        script.test('a', () => {

            return Promise.reject(new Error('A reason why this test failed'));
        });

        script.test('b', (done) => {

            throw new Error('A different reason why this test failed');
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(2);
            expect(notebook.tests[0].err.toString()).to.contain('A reason why this test failed');
            expect(notebook.tests[1].err.toString()).to.contain('A different reason why this test failed');
            done();
        });
    });


    ['before', 'beforeEach', 'after', 'afterEach'].forEach((fnName) => {

        it(`should fail "${fnName}" that neither takes a callback nor returns anything`, (done) => {

            const script = Lab.script({ schedule: false });
            script.describe('a test group', () => {

                script.test('a', (done) => done());

                script[fnName](() => {});
            });


            Lab.execute(script, {}, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(1);
                expect(notebook.errors[0].message).to.contain('should either take a callback argument or return a promise');
                done();
            });
        });

        it(`should fail "${fnName}" that neither takes a callback nor returns a valid promise`, (done) => {

            const script = Lab.script({ schedule: false });
            script.describe('a test group', () => {

                script.test('a', (done) => done());

                script[fnName](() => {

                    return { not: 'a promise' };
                });
            });


            Lab.execute(script, {}, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.errors[0].message).to.contain('should either take a callback argument or return a promise');
                done();
            });
        });

        it(`should fail "${fnName}" that returns a rejected promise`, (done) => {

            const script = Lab.script({ schedule: false });
            script.describe('a test group', () => {

                script.test('a', (done) => done());

                script[fnName](() => {

                    return Promise.reject(new Error('A reason why this test failed'));
                });
            });


            Lab.execute(script, {}, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.errors[0].message).to.contain('A reason why this test failed');
                done();
            });
        });

        it(`should fail "${fnName}" that calls the callback with an error`, (done) => {

            const script = Lab.script({ schedule: false });
            script.describe('a test group', () => {

                script.test('a', (done) => done());

                script[fnName]((done) => {

                    done(new Error('A reason why this test failed'));
                });
            });


            Lab.execute(script, {}, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.errors[0].message).to.contain('A reason why this test failed');
                done();
            });
        });

        it(`should not fail "${fnName}" that returns a resolved promise`, (done) => {

            const script = Lab.script({ schedule: false });
            script.describe('a test group', () => {

                script.test('a', (done) => done());

                script[fnName](() => {

                    return Promise.resolve();
                });
            });

            Lab.execute(script, {}, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(1);
                expect(notebook.failures).to.equal(0);
                expect(notebook.errors.length).to.equal(0);
                done();
            });
        });

        it(`should not fail "${fnName}" calls the callback without an error`, (done) => {

            const script = Lab.script({ schedule: false });
            script.describe('a test group', () => {

                script.test('a', (done) => done());

                script[fnName]((done) => {

                    done();
                });
            });

            Lab.execute(script, {}, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(1);
                expect(notebook.failures).to.equal(0);
                expect(notebook.errors.length).to.equal(0);
                done();
            });
        });
    });

    it('filters on ids', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                testDone();
            });

            script.test('2', (testDone) => {

                throw new Error();
            });

            script.test('3', (testDone) => {

                testDone();
            });

            script.test('4', (testDone) => {

                throw new Error();
            });
        });

        const filterFirstIds = function (next) {

            Lab.execute(script, { ids: [1, 3] }, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(0);
                next();
            });
        };

        const filterLastIds = function (next) {

            Lab.execute(script, { ids: [2, 4] }, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(2);
                next();
            });
        };

        filterFirstIds(() => {

            filterLastIds(done);
        });
    });

    it('filters on grep', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                testDone();
            });

            script.test('a', (testDone) => {

                throw new Error();
            });

            script.test('3', (testDone) => {

                testDone();
            });

            script.test('b', (testDone) => {

                throw new Error();
            });
        });

        const filterDigit = function (next) {

            Lab.execute(script, { grep: '\\d' }, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(0);
                next();
            });
        };

        const filterAlpha = function (next) {

            Lab.execute(script, { grep: '[ab]' }, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(2);
                next();
            });
        };

        filterDigit(() => {

            filterAlpha(done);
        });
    });

    it('skips tests not in "only" experiment', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment.only('subexperiment', () => {

                script.test('s1', (testDone) => {

                    testDone();
                });

                script.test('s2', (testDone) => {

                    testDone();
                });
            });

            script.test('a', (testDone) => {

                throw new Error();
            });

            script.test('b', (testDone) => {

                throw new Error();
            });
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(4);
            expect(notebook.tests.filter((test) => test.skipped)).to.have.length(2);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips everything except the "only" test', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('subexperiment', () => {

                script.test('s1', (testDone) => {

                    throw new Error();
                });

                script.test('s2', (testDone) => {

                    throw new Error();
                });
            });

            script.test.only('a', (testDone) => {

                testDone();
            });

            script.test('b', (testDone) => {

                throw new Error();
            });
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(4);
            expect(notebook.tests.filter((test) => test.skipped)).to.have.length(3);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });


    it('skips everything except the "only" test when executing multiple scripts', (done) => {

        const script1 = Lab.script();
        script1.experiment('test', () => {

            script1.experiment('subexperiment', () => {

                script1.test('s1', (testDone) => {

                    throw new Error();
                });

                script1.test('s2', (testDone) => {

                    throw new Error();
                });
            });

            script1.test.only('a', (testDone) => {

                testDone();
            });

            script1.test('b', (testDone) => {

                throw new Error();
            });
        });
        const script2 = Lab.script();
        script2.experiment('test2', () => {

            script2.test('x1', (testDone) => {

                throw new Error();
            });
        });

        Lab.execute([script1, script2], {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(5);
            expect(notebook.tests.filter((test) => test.skipped)).to.have.length(4);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('reports an error if there is more than one "only", even accross multiple scripts', (done) => {

        const script1 = Lab.script();
        script1.experiment('test', () => {

            script1.experiment('subexperiment', () => {

                script1.test('s1', (testDone) => {

                    throw new Error();
                });

                script1.test('s2', (testDone) => {

                    throw new Error();
                });
            });

            script1.test.only('a', (testDone) => {

                testDone();
            });

            script1.test('b', (testDone) => {

                throw new Error();
            });
        });
        const script2 = Lab.script();
        script2.experiment.only('test2', () => {

            script2.test('x1', (testDone) => {

                throw new Error();
            });
        });

        Lab.execute([script1, script2], {}, null, (err, notebook) => {

            expect(err).to.exist();
            expect(err.message).to.contain([
                'Multiple tests are marked as "only":',
                'Test: test a',
                'Experiment: test2'
            ]);
            done();
        });
    });

    it('skips before function in non-run experiment', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment.skip('subexperiment1', () => {

                script.before((beforeDone) => {

                    throw new Error();
                });

                script.test('s1', (testDone) => testDone());
            });

            script.experiment('subexperiment2', () => {

                script.before((beforeDone) => beforeDone());

                script.test('s1', (testDone) => testDone());
            });
        });

        Lab.execute(script, {}, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(2);
            expect(notebook.tests.filter((test) => test.skipped)).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips before function when not run through index', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('subexperiment1', () => {

                script.before((beforeDone) => {

                    throw new Error();
                });

                script.test('s1', (testDone) => testDone());
            });

            script.experiment('subexperiment2', () => {

                script.before((beforeDone) => beforeDone());

                script.test('s1', (testDone) => testDone());
            });
        });

        Lab.execute(script, { ids: [2] }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips before function when not run through index and in sub experiment', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.experiment('subexperiment1', () => {

                script.before((beforeDone) => {

                    throw new Error();
                });

                script.experiment('sub sub experiment1', () => {

                    script.before((beforeDone) => {

                        throw new Error();
                    });

                    script.test('s1', (testDone) => testDone());
                });
            });

            script.experiment('subexperiment2', () => {

                script.experiment('sub subexperiment2', () => {

                    script.before((beforeDone) => beforeDone());

                    script.test('s1', (testDone) => testDone());
                });
            });
        });

        Lab.execute(script, { ids: [2] }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('bail will terminate on the first test failure', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                testDone();
            });

            script.test('2', (testDone) => {

                throw new Error('bailing');
            });

            script.test('3', (testDone) => {

                testDone();
            });
        });

        Lab.execute(script, { bail: true }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(3);
            expect(notebook.failures).to.equal(1);
            expect(notebook.tests[1].err.message).to.contain('bailing');
            expect(notebook.tests[2].skipped).to.be.true();
            done();
        });
    });

    it('dry run won\'t execute tests', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                testDone();
            });

            script.test('a', (testDone) => {

                throw new Error();
            });

            script.test('3', (testDone) => {

                testDone();
            });

            script.test('b', (testDone) => {

                throw new Error();
            });
        });

        Lab.execute(script, { dry: true }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(4);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('debug domain error', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('a', (testDone) => {

                setImmediate(() => {

                    throw new Error('throwing stack later');
                });

                testDone();
            });
        });

        Lab.execute(script, { debug: true }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.errors.length).to.greaterThan(0);
            done();
        });
    });

    it('shuffle will randomize scripts', (done) => {

        const script1 = Lab.script();
        script1.experiment('test1', () => {

            script1.test('1', (testDone) => {

                testDone();
            });
        });

        const script2 = Lab.script();
        script2.experiment('test2', () => {

            script2.test('2', (testDone) => {

                testDone();
            });
        });

        const script3 = Lab.script();
        script3.experiment('test3', () => {

            script3.test('3', (testDone) => {

                testDone();
            });
        });

        const script4 = Lab.script();
        script4.experiment('test4', () => {

            script4.test('4', (testDone) => {

                testDone();
            });
        });

        const script5 = Lab.script();
        script5.experiment('test5', () => {

            script5.test('5', (testDone) => {

                testDone();
            });
        });

        const scripts = [script1, script2, script3, script4, script5];
        Lab.execute(scripts, { dry: true, shuffle: true, seed: 0.3 }, null, (err, notebook1) => {

            expect(err).not.to.exist();
            Lab.execute(scripts, { dry: true, shuffle: true, seed: 0.7 }, null, (err, notebook2) => {

                expect(err).not.to.exist();
                expect(notebook1.tests).to.not.equal(notebook2.tests);
                done();
            });
        });
    });

    it('shuffle allows to set a seed to use to re-use order of a previous test run', (done) => {

        const script1 = Lab.script();
        script1.experiment('test1', () => {

            script1.test('1', (testDone) => {

                testDone();
            });
        });

        const script2 = Lab.script();
        script2.experiment('test2', () => {

            script2.test('2', (testDone) => {

                testDone();
            });
        });

        const script3 = Lab.script();
        script3.experiment('test3', () => {

            script3.test('3', (testDone) => {

                testDone();
            });
        });

        const script4 = Lab.script();
        script4.experiment('test4', () => {

            script4.test('4', (testDone) => {

                testDone();
            });
        });

        const script5 = Lab.script();
        script5.experiment('test5', () => {

            script5.test('5', (testDone) => {

                testDone();
            });
        });

        const scripts = [script1, script2, script3, script4, script5];
        Lab.execute(scripts, { dry: true, shuffle: true, seed: 1234 }, null, (err, notebook1) => {

            expect(err).not.to.exist();
            Lab.execute(scripts, { dry: true, shuffle: true, seed: 1234 }, null, (err, notebook2) => {

                expect(err).not.to.exist();
                expect(notebook1.tests).to.equal(notebook2.tests);
                done();
            });
        });
    });

    it('skips tests on failed before', (done) => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.before((testDone) => {

                steps.push('before');
                testDone(new Error('oops'));
            });

            script.test('works', (testDone) => {

                steps.push('test');
                testDone();
            });

            script.test('skips', { skip: true }, (testDone) => {

                steps.push('test');
                testDone();
            });

            script.test('todo');

            script.experiment('inner', { skip: true }, () => {

                script.test('works', (testDone) => {

                    steps.push('test');
                    testDone();
                });

                script.experiment('inner', () => {

                    script.test('works', (testDone) => {

                        steps.push('test');
                        testDone();
                    });
                });
            });

            script.experiment('inner2', () => {

                script.test('works', { skip: true }, (testDone) => {

                    steps.push('test');
                    testDone();
                });
            });

            script.after((testDone) => {

                steps.push('after');
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(err).to.not.exist();
            expect(notebook.tests[0].err).to.equal('\'before\' action failed');
            expect(steps).to.equal(['before']);
            done();
        });
    });

    it('skips tests on failed beforeEach', (done) => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.beforeEach((testDone) => {

                steps.push('before');
                testDone(new Error('oops'));
            });

            script.test('works', (testDone) => {

                steps.push('test');
                testDone();
            });

            script.afterEach((testDone) => {

                steps.push('after');
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(err).to.not.exist();
            expect(notebook.tests[0].err).to.equal('\'before each\' action failed');
            expect(steps).to.equal(['before']);
            done();
        });
    });

    it('runs afterEaches in nested experiments from inside, out (by experiments)', (done) => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.beforeEach((testDone) => {

                steps.push('outer beforeEach');
                testDone();
            });

            script.afterEach((testDone) => {

                steps.push('outer afterEach 1');
                testDone();
            });

            script.test('first works', (testDone) => {

                steps.push('first test');
                testDone();
            });

            script.experiment('inner test', () => {

                script.beforeEach((testDone) => {

                    steps.push('inner beforeEach');
                    testDone();
                });

                script.afterEach((testDone) => {

                    steps.push('inner afterEach 1');
                    testDone();
                });

                script.test('works', (testDone) => {

                    steps.push('second test');
                    testDone();
                });

                script.afterEach((testDone) => {

                    steps.push('inner afterEach 2');
                    testDone();
                });
            });

            script.afterEach((testDone) => {

                steps.push('outer afterEach 2');
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(err).not.to.exist();
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
            done();
        });
    });

    it('executes in parallel', (done) => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                setTimeout(() => {

                    steps.push('1');
                    testDone();
                }, 5);
            });

            script.test('2', (testDone) => {

                steps.push('2');
                testDone();
            });
        });

        Lab.execute(script, { parallel: true }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(steps).to.equal(['2', '1']);
            done();
        });
    });

    it('executes in parallel with exceptions', (done) => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.test('1', { parallel: false }, (testDone) => {

                setTimeout(() => {

                    steps.push('1');
                    testDone();
                }, 5);
            });

            script.test('2', (testDone) => {

                steps.push('2');
                testDone();
            });
        });

        Lab.execute(script, { parallel: true }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(steps).to.equal(['1', '2']);
            done();
        });
    });

    it('executes in parallel (individuals)', (done) => {

        const steps = [];
        const script = Lab.script({ schedule: false });
        script.experiment('test', () => {

            script.test('1', { parallel: true }, (testDone) => {

                setTimeout(() => {

                    steps.push('1');
                    testDone();
                }, 5);
            });

            script.test('2', { parallel: true }, (testDone) => {

                steps.push('2');
                testDone();
            });
        });

        Lab.execute(script, null, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(steps).to.equal(['2', '1']);
            done();
        });
    });

    it('reports double done()', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                testDone();
                testDone();
            });
        });

        Lab.report(script, { output: false }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('reports the used seed', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                testDone();
            });
        });

        Lab.report(script, { output: false, seed: 1234, shuffle: true }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            expect(output).to.contain('1234');
            done();
        });
    });

    it('uses provided linter', (done) => {

        const script = Lab.script();
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                testDone();
            });
        });

        Lab.report(script, { output: false, lint: true, linter: 'eslint', lintingPath: 'test/lint' }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain(['eslint' + Path.sep, 'semi']);
            done();
        });
    });

    it('extends report with assertions library support', (done) => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                assertions.expect(true).to.be.true();
                testDone();
            });
        });

        Lab.report(script, { output: false, assert: assertions }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            expect(output).to.match(/Assertions count: \d+/);
            done();
        });
    });

    it('extends report with assertions library support (planned assertions)', (done) => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 1 }, (testDone) => {

                assertions.expect(true).to.be.true();
                testDone();
            });
        });

        Lab.report(script, { output: false, assert: assertions }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            expect(output).to.match(/Assertions count: \d+/);
            expect(output).to.not.match(/Expected \d+ assertions, but found \d+/);
            done();
        });
    });

    it('extends report with assertions library support (planned assertions error)', (done) => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 2 }, (testDone) => {

                assertions.expect(true).to.be.true();
                testDone();
            });
        });

        Lab.report(script, { output: false, assert: assertions }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.match(/Assertions count: \d+/);
            expect(output).to.match(/Expected \d+ assertions, but found \d+/);
            done();
        });
    });

    it('extends report with assertions library support (planned assertions error with existing error)', (done) => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 2 }, (testDone) => {

                assertions.expect(true).to.be.true();
                testDone(new Error('My Error'));
            });
        });

        Lab.report(script, { output: false, assert: assertions }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.match(/My Error/);
            expect(output).to.match(/Assertions count: \d+/);
            expect(output).to.match(/Expected \d+ assertions, but found \d+/);
            done();
        });
    });

    it('extends report with planned assertions and missing assertion library', (done) => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', { plan: 1 }, (testDone) => {

                assertions.expect(true).to.be.true();
                testDone();
            });
        });

        Lab.report(script, { output: false }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('Expected 1 assertions, but no assertion library found');
            done();
        });
    });

    it('extends report with assertions library support (incomplete assertions)', (done) => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                assertions.expect(true).to.be.true;
                testDone();
            });
        });

        Lab.report(script, { output: false, assert: assertions }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.match(/Assertions count: \d+/);
            expect(output).to.contain('Incomplete assertion at');
            done();
        });
    });

    it('extends report with assertions library support (incompatible)', (done) => {

        const script = Lab.script();
        const assertions = Code;
        script.experiment('test', () => {

            script.test('1', (testDone) => {

                assertions.expect(true).to.be.true();
                testDone();
            });
        });

        Lab.report(script, { output: false, assert: {} }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            expect(output).to.not.match(/Assertions count: \d+/);
            done();
        });
    });

    it('reports errors with shared event emitters', (done) => {

        const script = Lab.script();
        const EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', () => {

            let shared;
            script.beforeEach((testDone) => {

                shared = new EventEmitter();
                const onWhatever = function () {

                    this.emit('something');
                };

                shared.on('whatever', onWhatever);
                testDone();
            });

            script.test('1', (testDone) => {

                shared.on('something', () => {

                    throw new Error('assertion failed !');
                });
                shared.emit('whatever');
            });
        });

        Lab.report(script, { output: false, assert: {} }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('1 of 1 tests failed');
            expect(output).to.contain('Multiple callbacks or thrown errors received in test "Before each shared test"');
            expect(output).to.contain('assertion failed !');
            done();
        });
    });

    it('reports errors with shared event emitters and nested experiments', (done) => {

        const script = Lab.script();
        const EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', () => {

            let shared;
            script.beforeEach((testDone) => {

                shared = new EventEmitter();
                const onWhatever = function () {

                    this.emit('something');
                };

                shared.on('whatever', onWhatever);
                testDone();
            });

            script.test('1', (testDone) => {

                shared.on('something', () => {

                    throw new Error('assertion failed !');
                });
                shared.emit('whatever');
            });

            script.experiment('nested test', () => {

                script.test('2', (testDone) => {

                    shared.on('something', () => {

                        throw new Error('assertion failed !');
                    });
                    shared.emit('whatever');
                });
            });
        });

        Lab.report(script, { output: false, assert: {} }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('2 of 2 tests failed');
            expect(output.match(/Multiple callbacks or thrown errors received in test "Before each shared test"/g)).to.have.length(4);
            expect(output.match(/assertion failed !/g)).to.have.length(4);
            done();
        });
    });

    it('reports errors with shared event emitters and nested experiments with a single deep failure', (done) => {

        const script = Lab.script();
        const EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', () => {

            let shared;
            script.beforeEach((testDone) => {

                shared = new EventEmitter();
                const onWhatever = function () {

                    this.emit('something');
                };

                shared.on('whatever', onWhatever);
                testDone();
            });

            script.test('1', (testDone) => {

                shared.on('something', () => {

                    testDone();
                });
                shared.emit('whatever');
            });

            script.experiment('nested test', () => {

                script.test('2', (testDone) => {

                    shared.on('something', () => {

                        throw new Error('assertion failed !');
                    });
                    shared.emit('whatever');
                });
            });
        });

        Lab.report(script, { output: false, assert: {} }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('1 of 2 tests failed');
            expect(output.match(/Multiple callbacks or thrown errors received in test "Before each shared test"/g)).to.have.length(2);
            expect(output.match(/assertion failed !/g)).to.have.length(2);
            done();
        });
    });

    it('reports errors with shared event emitters in parallel', (done) => {

        const script = Lab.script();
        const EventEmitter = require('events').EventEmitter;

        script.experiment('parallel shared test', { parallel: true }, () => {

            let shared;
            script.beforeEach((testDone) => {

                shared = new EventEmitter();
                const onFoo = function () {

                    this.emit('bar');
                };

                shared.on('foo', onFoo);

                const onBeep = function () {

                    this.emit('boop');
                };

                shared.on('beep', onBeep);

                setTimeout(testDone, 100);

                // done();
            });

            script.test('1', (testDone) => {

                shared.on('bar', () => {

                    throw new Error('foo failed !');
                });

                setTimeout(() => {

                    shared.emit('foo');
                }, 50);
            });

            script.test('2', (testDone) => {

                shared.on('boop', () => {

                    throw new Error('beep failed !');
                });

                setTimeout(() => {

                    shared.emit('beep');
                }, 100);
            });
        });

        Lab.report(script, { output: false, assert: {} }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('2 of 2 tests failed');
            expect(output.match(/Multiple callbacks or thrown errors received in test "Before each parallel shared test"/g)).to.have.length(4);
            expect(output.match(/foo failed/g).length).to.equal(3);
            done();
        });
    });

    it('reports errors with shared event emitters in parallel', (done) => {

        const script = Lab.script();
        const EventEmitter = require('events').EventEmitter;

        script.experiment('parallel shared test', { parallel: true }, () => {

            let shared;
            script.beforeEach((testDone) => {

                shared = new EventEmitter();
                const onFoo = function () {

                    this.emit('bar');
                };

                shared.on('foo', onFoo);

                const onBeep = function () {

                    this.emit('boop');
                };

                shared.on('beep', onBeep);

                setTimeout(testDone, 100);

                // done();
            });

            script.test('1', (testDone) => {

                shared.on('bar', () => {

                    throw new Error('foo failed !');
                });

                setTimeout(() => {

                    shared.emit('foo');
                }, 50);
            });

            script.test('2', (testDone) => {

                shared.on('boop', () => {

                    throw new Error('beep failed !');
                });

                setTimeout(() => {

                    shared.emit('beep');
                }, 100);
            });

            script.experiment('parallel shared test', () => {

                script.test('3', (testDone) => {

                    shared.on('bar', () => {

                        throw new Error('foo failed !');
                    });

                    setTimeout(() => {

                        shared.emit('foo');
                    }, 100);
                });

                script.test('4', (testDone) => {

                    shared.on('boop', () => {

                        throw new Error('beep failed !');
                    });

                    setTimeout(() => {

                        shared.emit('beep');
                    }, 50);
                });
            });
        });

        Lab.report(script, { output: false, assert: {} }, (err, code, output) => {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('4 of 4 tests failed');
            expect(output.match(/Multiple callbacks or thrown errors received in test "Before each parallel shared test"/g)).to.have.length(8);
            expect(output.match(/foo failed/g).length).to.equal(3);
            expect(output.match(/beep failed/g).length).to.equal(3);
            done();
        });
    });

    describe('global timeout functions', () => {

        // We can't poison global.Date because the normal implementation of
        // global.setTimeout uses it [1] so if the runnable.js keeps a copy of
        // global.setTimeout (like it's supposed to), that will blow up.
        // [1]: https://github.com/joyent/node/blob/7fc835afe362ebd30a0dbec81d3360bd24525222/lib/timers.js#L74
        const overrideGlobals = function (testDone) {

            const fn = function () {};
            global.setTimeout = fn;
            global.clearTimeout = fn;
            global.setImmediate = fn;
            testDone();
        };

        const resetGlobals = function (testDone) {

            global.setTimeout = setTimeout;
            global.clearTimeout = clearTimeout;
            global.setImmediate = setImmediate;
            testDone();
        };

        it('setImmediate still functions correctly', (done) => {

            const script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', () => {

                script.test('1', (testDone) => {

                    setImmediate(testDone);
                });
            });

            Lab.report(script, { output: false }, (err, code, output) => {

                expect(err).not.to.exist();
                expect(code).to.equal(0);
                done();
            });
        });

        it('test timeouts still function correctly', (done) => {

            const script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', () => {

                script.test('timeout', { timeout: 5 }, (testDone) => {

                    testDone();
                });
            });

            const now = Date.now();
            Lab.execute(script, null, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(Date.now() - now).to.be.below(100);
                done();
            });
        });

        it('setTimeout still functions correctly', (done) => {

            const script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', { timeout: 5 }, () => {

                script.test('timeout', { timeout: 0 }, (testDone) => {

                    setTimeout(() => {

                        testDone();
                    }, 10);
                });
            });

            const now = Date.now();
            Lab.execute(script, null, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(Date.now() - now).to.be.above(9);
                done();
            });
        });

        it('setTimeout still functions correctly with non-integer timeout', (done) => {

            const script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', { timeout: 5 }, () => {

                script.test('timeout', { timeout: 'a' }, (testDone) => {

                    setTimeout(() => {

                        testDone();
                    }, 10);
                });
            });

            Lab.execute(script, null, null, (err, notebook) => {

                expect(err).not.to.exist();
                expect(notebook.failures).to.equal(1);
                done();
            });
        });
    });

    it('fails with an unhandled Promise rejection if the specified flag is set', (done) => {

        const script = Lab.script();
        script.test('handles a Promise rejection', (done) => {

            Promise.reject(new Error('Rejection!'));
            setImmediate(done);
        });

        Lab.execute(script, { rejections: true }, null, (err, notebook) => {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(1);
            expect(notebook.tests[0].err.toString()).to.contain('Rejection!');
            done();
        });

    });
});
