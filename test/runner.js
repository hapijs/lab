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

// save references to timer globals

var setTimeout = global.setTimeout;
var clearTimeout = global.clearTimeout;
var setImmediate = global.setImmediate;

describe('Runner', function () {

    it('sets environment', { parallel: false }, function (done) {

        var orig = process.env.NODE_ENV;

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (testDone) {

                expect(process.env.NODE_ENV).to.equal('lab');
                process.env.NODE_ENV = orig;
                testDone();
            });
        });

        Lab.execute(script, { environment: 'lab' }, null, function (err, notebook) {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('won\'t set the environment when passing null', { parallel: false }, function (done) {

        var orig = process.env.NODE_ENV;

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (testDone) {

                expect(process.env.NODE_ENV).to.equal(orig);
                process.env.NODE_ENV = orig;
                testDone();
            });
        });

        Lab.execute(script, { environment: null }, null, function (err, notebook) {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('the environment defaults to test', { parallel: false }, function (done) {

        var orig = process.env.NODE_ENV;

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (testDone) {

                expect(process.env.NODE_ENV).to.equal('test');
                process.env.NODE_ENV = orig;
                testDone();
            });
        });

        Lab.execute(script, {}, null, function (err, notebook) {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('filters on ids', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                testDone();
            });

            script.test('2', function (testDone) {

                throw new Error();
            });

            script.test('3', function (testDone) {

                testDone();
            });

            script.test('4', function (testDone) {

                throw new Error();
            });
        });

        var filterFirstIds = function (next) {

            Lab.execute(script, { ids: [1, 3] }, null, function (err, notebook) {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(0);
                next();
            });
        };

        var filterLastIds = function (next) {

            Lab.execute(script, { ids: [2, 4] }, null, function (err, notebook) {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(2);
                next();
            });
        };

        filterFirstIds(function () {

            filterLastIds(done);
        });
    });

    it('filters on grep', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                testDone();
            });

            script.test('a', function (testDone) {

                throw new Error();
            });

            script.test('3', function (testDone) {

                testDone();
            });

            script.test('b', function (testDone) {

                throw new Error();
            });
        });

        var filterDigit = function (next) {

            Lab.execute(script, { grep: '\\d' }, null, function (err, notebook) {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(0);
                next();
            });
        };

        var filterAlpha = function (next) {

            Lab.execute(script, { grep: '[ab]' }, null, function (err, notebook) {

                expect(err).not.to.exist();
                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(2);
                next();
            });
        };

        filterDigit(function () {

            filterAlpha(done);
        });
    });

    it('dry run', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                testDone();
            });

            script.test('a', function (testDone) {

                throw new Error();
            });

            script.test('3', function (testDone) {

                testDone();
            });

            script.test('b', function (testDone) {

                throw new Error();
            });
        });

        Lab.execute(script, { dry: true }, null, function (err, notebook) {

            expect(err).not.to.exist();
            expect(notebook.tests).to.have.length(4);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('debug domain error', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('a', function (testDone) {

                setImmediate(function () {

                    throw new Error('throwing stack later');
                });

                testDone();
            });
        });

        Lab.execute(script, { debug: true }, null, function (err, notebook) {

            expect(err).not.to.exist();
            expect(notebook.errors.length).to.greaterThan(0);
            done();
        });
    });

    it('skips tests on failed before', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.before(function (testDone) {

                steps.push('before');
                testDone(new Error('oops'));
            });

            script.test('works', function (testDone) {

                steps.push('test');
                testDone();
            });

            script.test('skips', { skip: true }, function (testDone) {

                steps.push('test');
                testDone();
            });

            script.test('todo');

            script.experiment('inner', { skip: true }, function () {

                script.test('works', function (testDone) {

                    steps.push('test');
                    testDone();
                });

                script.experiment('inner', function () {

                    script.test('works', function (testDone) {

                        steps.push('test');
                        testDone();
                    });
                });
            });

            script.experiment('inner2', function () {

                script.test('works', { skip: true }, function (testDone) {

                    steps.push('test');
                    testDone();
                });
            });

            script.after(function (testDone) {

                steps.push('after');
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests[0].err).to.equal('\'before\' action failed');
            expect(steps).to.deep.equal(['before']);
            done();
        });
    });

    it('skips tests on failed beforeEach', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.beforeEach(function (testDone) {

                steps.push('before');
                testDone(new Error('oops'));
            });

            script.test('works', function (testDone) {

                steps.push('test');
                testDone();
            });

            script.afterEach(function (testDone) {

                steps.push('after');
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests[0].err).to.equal('\'before each\' action failed');
            expect(steps).to.deep.equal(['before']);
            done();
        });
    });

    it('runs afterEaches in nested experiments from inside, out (by experiments)', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.beforeEach(function (testDone) {

                steps.push('outer beforeEach');
                testDone();
            });

            script.afterEach(function (testDone) {

                steps.push('outer afterEach 1');
                testDone();
            });

            script.test('first works', function (testDone) {

                steps.push('first test');
                testDone();
            });

            script.experiment('inner test', function () {

                script.beforeEach(function (testDone) {

                    steps.push('inner beforeEach');
                    testDone();
                });

                script.afterEach(function (testDone) {

                    steps.push('inner afterEach 1');
                    testDone();
                });

                script.test('works', function (testDone) {

                    steps.push('second test');
                    testDone();
                });

                script.afterEach(function (testDone) {

                    steps.push('inner afterEach 2');
                    testDone();
                });
            });

            script.afterEach(function (testDone) {

                steps.push('outer afterEach 2');
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

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

    it('executes in parallel', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                setTimeout(function () {

                    steps.push('1');
                    testDone();
                }, 5);
            });

            script.test('2', function (testDone) {

                steps.push('2');
                testDone();
            });
        });

        Lab.execute(script, { parallel: true }, null, function (err, notebook) {

            expect(err).not.to.exist();
            expect(steps).to.deep.equal(['2', '1']);
            done();
        });
    });

    it('executes in parallel with exceptions', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('1', { parallel: false }, function (testDone) {

                setTimeout(function () {

                    steps.push('1');
                    testDone();
                }, 5);
            });

            script.test('2', function (testDone) {

                steps.push('2');
                testDone();
            });
        });

        Lab.execute(script, { parallel: true }, null, function (err, notebook) {

            expect(err).not.to.exist();
            expect(steps).to.deep.equal(['1', '2']);
            done();
        });
    });

    it('executes in parallel (individuals)', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('1', { parallel: true }, function (testDone) {

                setTimeout(function () {

                    steps.push('1');
                    testDone();
                }, 5);
            });

            script.test('2', { parallel: true }, function (testDone) {

                steps.push('2');
                testDone();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(err).not.to.exist();
            expect(steps).to.deep.equal(['2', '1']);
            done();
        });
    });

    it('reports double done()', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                testDone();
                testDone();
            });
        });

        Lab.report(script, { output: false }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            done();
        });
    });

    it('uses provided linter', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                testDone();
            });
        });

        Lab.report(script, { output: false, lint: true, linter: 'eslint', lintingPath: 'test/lint' }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain(['eslint/', 'semi']);
            done();
        });
    });

    it('extends report with assertions library support', function (done) {

        var script = Lab.script();
        var assertions = Code;
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                assertions.expect(true).to.be.true();
                testDone();
            });
        });

        Lab.report(script, { output: false, assert: assertions }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            expect(output).to.match(/Assertions count: \d+/);
            done();
        });
    });

    it('extends report with assertions library support (incomplete assertions)', function (done) {

        var script = Lab.script();
        var assertions = Code;
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                assertions.expect(true).to.be.true;
                testDone();
            });
        });

        Lab.report(script, { output: false, assert: assertions }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.match(/Assertions count: \d+/);
            expect(output).to.contain('Incomplete assertion at');
            done();
        });
    });

    it('extends report with assertions library support (incompatible)', function (done) {

        var script = Lab.script();
        var assertions = Code;
        script.experiment('test', function () {

            script.test('1', function (testDone) {

                assertions.expect(true).to.be.true();
                testDone();
            });
        });

        Lab.report(script, { output: false, assert: {} }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(0);
            expect(output).to.not.match(/Assertions count: \d+/);
            done();
        });
    });

    it('reports errors with shared event emitters', function (done) {

        var script = Lab.script();
        var EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', function () {

            var shared;
            script.beforeEach(function (testDone) {

                shared = new EventEmitter();
                shared.on('whatever', function () {

                    this.emit('something');
                });
                testDone();
            });

            script.test('1', function (testDone) {

                shared.on('something', function () {

                    throw new Error('assertion failed !');
                });
                shared.emit('whatever');
            });
        });

        Lab.report(script, { output: false, assert: {} }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('1 of 1 tests failed');
            expect(output).to.contain('Multiple callbacks or thrown errors received in test "Before each shared test"');
            expect(output).to.contain('assertion failed !');
            done();
        });
    });

    it('reports errors with shared event emitters and nested experiments', function (done) {

        var script = Lab.script();
        var EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', function () {

            var shared;
            script.beforeEach(function (testDone) {

                shared = new EventEmitter();
                shared.on('whatever', function () {

                    this.emit('something');
                });
                testDone();
            });

            script.test('1', function (testDone) {

                shared.on('something', function () {

                    throw new Error('assertion failed !');
                });
                shared.emit('whatever');
            });

            script.experiment('nested test', function () {

                script.test('2', function (testDone) {

                    shared.on('something', function () {

                        throw new Error('assertion failed !');
                    });
                    shared.emit('whatever');
                });
            });
        });

        Lab.report(script, { output: false, assert: {} }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('2 of 2 tests failed');
            expect(output.match(/Multiple callbacks or thrown errors received in test "Before each shared test"/g)).to.have.length(4);
            expect(output.match(/assertion failed !/g)).to.have.length(4);
            done();
        });
    });

    it('reports errors with shared event emitters and nested experiments with a single deep failure', function (done) {

        var script = Lab.script();
        var EventEmitter = require('events').EventEmitter;

        script.experiment('shared test', function () {

            var shared;
            script.beforeEach(function (testDone) {

                shared = new EventEmitter();
                shared.on('whatever', function () {

                    this.emit('something');
                });
                testDone();
            });

            script.test('1', function (testDone) {

                shared.on('something', function () {

                    testDone();
                });
                shared.emit('whatever');
            });

            script.experiment('nested test', function () {

                script.test('2', function (testDone) {

                    shared.on('something', function () {

                        throw new Error('assertion failed !');
                    });
                    shared.emit('whatever');
                });
            });
        });

        Lab.report(script, { output: false, assert: {} }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('1 of 2 tests failed');
            expect(output.match(/Multiple callbacks or thrown errors received in test "Before each shared test"/g)).to.have.length(2);
            expect(output.match(/assertion failed !/g)).to.have.length(2);
            done();
        });
    });

    it('reports errors with shared event emitters in parallel', function (done) {

        var script = Lab.script();
        var EventEmitter = require('events').EventEmitter;

        script.experiment('parallel shared test', { parallel: true }, function () {

            var shared;
            script.beforeEach(function (testDone) {

                shared = new EventEmitter();
                shared.on('foo', function () {

                    this.emit('bar');
                });
                shared.on('beep', function () {

                    this.emit('boop');
                });

                setTimeout(testDone, 100);

                // done();
            });

            script.test('1', function (testDone) {

                shared.on('bar', function () {

                    throw new Error('foo failed !');
                });

                setTimeout(function () {

                    shared.emit('foo');
                }, 50);
            });

            script.test('2', function (testDone) {

                shared.on('boop', function () {

                    throw new Error('beep failed !');
                });

                setTimeout(function () {

                    shared.emit('beep');
                }, 100);
            });
        });

        Lab.report(script, { output: false, assert: {} }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('2 of 2 tests failed');
            expect(output.match(/Multiple callbacks or thrown errors received in test "Before each parallel shared test"/g)).to.have.length(4);
            expect(output.match(/foo failed/g).length).to.equal(3);
            done();
        });
    });

    it('reports errors with shared event emitters in parallel', function (done) {

        var script = Lab.script();
        var EventEmitter = require('events').EventEmitter;

        script.experiment('parallel shared test', { parallel: true }, function () {

            var shared;
            script.beforeEach(function (testDone) {

                shared = new EventEmitter();
                shared.on('foo', function () {

                    this.emit('bar');
                });
                shared.on('beep', function () {

                    this.emit('boop');
                });

                setTimeout(testDone, 100);

                // done();
            });

            script.test('1', function (testDone) {

                shared.on('bar', function () {

                    throw new Error('foo failed !');
                });

                setTimeout(function () {

                    shared.emit('foo');
                }, 50);
            });

            script.test('2', function (testDone) {

                shared.on('boop', function () {

                    throw new Error('beep failed !');
                });

                setTimeout(function () {

                    shared.emit('beep');
                }, 100);
            });

            script.experiment('parallel shared test', function () {

                script.test('3', function (testDone) {

                    shared.on('bar', function () {

                        throw new Error('foo failed !');
                    });

                    setTimeout(function () {

                        shared.emit('foo');
                    }, 100);
                });

                script.test('4', function (testDone) {

                    shared.on('boop', function () {

                        throw new Error('beep failed !');
                    });

                    setTimeout(function () {

                        shared.emit('beep');
                    }, 50);
                });
            });
        });

        Lab.report(script, { output: false, assert: {} }, function (err, code, output) {

            expect(err).not.to.exist();
            expect(code).to.equal(1);
            expect(output).to.contain('4 of 4 tests failed');
            expect(output.match(/Multiple callbacks or thrown errors received in test "Before each parallel shared test"/g)).to.have.length(8);
            expect(output.match(/foo failed/g).length).to.equal(3);
            expect(output.match(/beep failed/g).length).to.equal(3);
            done();
        });
    });

    describe('global timeout functions', function () {

        // We can't poison global.Date because the normal implementation of
        // global.setTimeout uses it [1] so if the runnable.js keeps a copy of
        // global.setTimeout (like it's supposed to), that will blow up.
        // [1]: https://github.com/joyent/node/blob/7fc835afe362ebd30a0dbec81d3360bd24525222/lib/timers.js#L74
        var overrideGlobals = function (testDone) {

            var fn = function () {};
            global.setTimeout = fn;
            global.clearTimeout = fn;
            global.setImmediate = fn;
            testDone();
        };

        var resetGlobals = function (testDone) {

            global.setTimeout = setTimeout;
            global.clearTimeout = clearTimeout;
            global.setImmediate = setImmediate;
            testDone();
        };

        it('setImmediate still functions correctly', function (done) {

            var script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', function () {

                script.test('1', function (testDone) {

                    setImmediate(testDone);
                });
            });

            Lab.report(script, { output: false }, function (err, code, output) {

                expect(err).not.to.exist();
                expect(code).to.equal(0);
                done();
            });
        });

        it('test timeouts still function correctly', function (done) {

            var script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', function () {

                script.test('timeout', { timeout: 5 }, function (testDone) {

                    testDone();
                });
            });

            var now = Date.now();
            Lab.execute(script, null, null, function (err, notebook) {

                expect(err).not.to.exist();
                expect(Date.now() - now).to.be.below(100);
                done();
            });
        });

        it('setTimeout still functions correctly', function (done) {

            var script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', { timeout: 5 }, function () {

                script.test('timeout', { timeout: 0 }, function (testDone) {

                    setTimeout(function () {

                        testDone();
                    }, 10);
                });
            });

            var now = Date.now();
            Lab.execute(script, null, null, function (err, notebook) {

                expect(err).not.to.exist();
                expect(Date.now() - now).to.be.above(9);
                done();
            });
        });
    });
});
