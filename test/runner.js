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

    it('dry run', (done) => {

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

            expect(notebook.tests[0].err).to.equal('\'before\' action failed');
            expect(steps).to.deep.equal(['before']);
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

            expect(notebook.tests[0].err).to.equal('\'before each\' action failed');
            expect(steps).to.deep.equal(['before']);
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
            expect(steps).to.deep.equal([
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
            expect(steps).to.deep.equal(['2', '1']);
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
            expect(steps).to.deep.equal(['1', '2']);
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
            expect(steps).to.deep.equal(['2', '1']);
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
            expect(output).to.contain(['eslint/', 'semi']);
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
    });
});
