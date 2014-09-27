// Load modules

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

// save references to timer globals

var setTimeout = global.setTimeout;
var clearTimeout = global.clearTimeout;
var setImmediate = global.setImmediate;

describe('Runner', function () {

    it('sets environment', { parallel: false }, function (done) {

        var orig = process.env.NODE_ENV;

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (finished) {

                Lab.expect(process.env.NODE_ENV).to.equal('lab');
                process.env.NODE_ENV = orig;
                finished();
            });
        });

        Lab.execute(script, { environment: 'lab' }, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('won\'t set the environment when passing null', { parallel: false }, function (done) {

        var orig = process.env.NODE_ENV;

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (finished) {

                Lab.expect(process.env.NODE_ENV).to.equal(orig);
                process.env.NODE_ENV = orig;
                finished();
            });
        });

        Lab.execute(script, { environment: null }, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('the environment defaults to test', { parallel: false }, function (done) {

        var orig = process.env.NODE_ENV;

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('works', function (finished) {

                Lab.expect(process.env.NODE_ENV).to.equal('test');
                process.env.NODE_ENV = orig;
                finished();
            });
        });

        Lab.execute(script, {}, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(1);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('filters on ids', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (finished) {

                finished();
            });

            script.test('2', function (finished) {

                throw new Error();
                finished();
            });

            script.test('3', function (finished) {

                finished();
            });

            script.test('4', function (finished) {

                throw new Error();
                finished();
            });
        });

        Lab.execute(script, { ids: [1, 3] }, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(0);

            Lab.execute(script, { ids: [2, 4] }, null, function (err, notebook) {

                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(2);
                done();
            });
        });
    });

    it('filters on grep', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (finished) {

                finished();
            });

            script.test('a', function (finished) {

                throw new Error();
                finished();
            });

            script.test('3', function (finished) {

                finished();
            });

            script.test('b', function (finished) {

                throw new Error();
                finished();
            });
        });

        Lab.execute(script, { grep: '\\d' }, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(2);
            expect(notebook.failures).to.equal(0);

            Lab.execute(script, { grep: '[ab]' }, null, function (err, notebook) {

                expect(notebook.tests).to.have.length(2);
                expect(notebook.failures).to.equal(2);
                done();
            });
        });
    });

    it('dry run', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (finished) {

                finished();
            });

            script.test('a', function (finished) {

                throw new Error();
                finished();
            });

            script.test('3', function (finished) {

                finished();
            });

            script.test('b', function (finished) {

                throw new Error();
                finished();
            });
        });

        Lab.execute(script, { dry: true }, null, function (err, notebook) {

            expect(notebook.tests).to.have.length(4);
            expect(notebook.failures).to.equal(0);
            done();
        });
    });

    it('skips tests on failed before', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.before(function (finished) {

                steps.push('before');
                finished(new Error('oops'));
            });

            script.test('works', function (finished) {

                steps.push('test');
                finished();
            });

            script.test('skips', { skip: true }, function (finished) {

                steps.push('test');
                finished();
            });

            script.test('todo');

            script.experiment('inner', { skip: true }, function () {

                script.test('works', function (finished) {

                    steps.push('test');
                    finished();
                });

                script.experiment('inner', function () {

                    script.test('works', function (finished) {

                        steps.push('test');
                        finished();
                    });
                });
            });

            script.experiment('inner2', function () {

                script.test('works', { skip: true }, function (finished) {

                    steps.push('test');
                    finished();
                });
            });

            script.after(function (finished) {

                steps.push('after');
                finished();
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

            script.beforeEach(function (finished) {

                steps.push('before');
                finished(new Error('oops'));
            });

            script.test('works', function (finished) {

                steps.push('test');
                finished();
            });

            script.afterEach(function (finished) {

                steps.push('after');
                finished();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(notebook.tests[0].err).to.equal('\'before each\' action failed');
            expect(steps).to.deep.equal(['before']);
            done();
        });
    });

    it('executes in parallel', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('1', function (finished) {

                setTimeout(function () {

                    steps.push('1');
                    finished();
                }, 5);
            });

            script.test('2', function (finished) {

                steps.push('2');
                finished();
            });
        });

        Lab.execute(script, { parallel: true }, null, function (err, notebook) {

            expect(steps).to.deep.equal(['2', '1']);
            done();
        });
    });

    it('executes in parallel with exceptions', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('1', { parallel: false }, function (finished) {

                setTimeout(function () {

                    steps.push('1');
                    finished();
                }, 5);
            });

            script.test('2', function (finished) {

                steps.push('2');
                finished();
            });
        });

        Lab.execute(script, { parallel: true }, null, function (err, notebook) {

            expect(steps).to.deep.equal(['1', '2']);
            done();
        });
    });

    it('executes in parallel (individuals)', function (done) {

        var steps = [];
        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('1', { parallel: true }, function (finished) {

                setTimeout(function () {

                    steps.push('1');
                    finished();
                }, 5);
            });

            script.test('2', { parallel: true }, function (finished) {

                steps.push('2');
                finished();
            });
        });

        Lab.execute(script, null, null, function (err, notebook) {

            expect(steps).to.deep.equal(['2', '1']);
            done();
        });
    });

    it('reports double finish', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (finished) {

                finished();
                finished();
            });
        });

        Lab.report(script, { output: false }, function (err, code, output) {

            expect(code).to.equal(1);
            done();
        });
    });


    describe('global timeout functions', function () {

        // We can't poison global.Date because the normal implementation of
        // global.setTimeout uses it [1] so if the runnable.js keeps a copy of
        // global.setTimeout (like it's supposed to), that will blow up.
        // [1]: https://github.com/joyent/node/blob/7fc835afe362ebd30a0dbec81d3360bd24525222/lib/timers.js#L74
        var overrideGlobals = function (finished) {

            var fn = function () {};
            global.setTimeout = fn;
            global.clearTimeout = fn;
            global.setImmediate = fn;
            finished();
        };

        var resetGlobals = function (finished) {

            global.setTimeout = setTimeout;
            global.clearTimeout = clearTimeout;
            global.setImmediate = setImmediate;
            finished();
        };

        it('setImmediate still functions correctly', function (done) {

            var script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', function () {

                script.test('1', function (finished) {

                    setImmediate(finished);
                });
            });

            Lab.report(script, { output: false }, function (err, code, output) {

                expect(code).to.equal(0);
                done();
            });
        });

        it('test timeouts still function correctly', function (done) {

            var script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', function () {

                script.test('timeout', { timeout: 5 }, function (finished) {

                    finished();
                });
            });

            var now = Date.now();
            Lab.execute(script, null, null, function (err, notebook) {

                expect(Date.now() - now).to.be.below(100);
                done();
            });
        });

        it('setTimeout still functions correctly', function (done) {

            var script = Lab.script();
            script.before(overrideGlobals);

            script.after(resetGlobals);

            script.experiment('test', { timeout: 5 }, function () {

                script.test('timeout', { timeout: 0 }, function (finished) {

                    setTimeout(function () {

                        finished();
                    }, 10);
                });
            });

            var now = Date.now();
            Lab.execute(script, null, null, function (err, notebook) {

                expect(Date.now() - now).to.be.above(9);
                done();
            });
        });
    });

    it('notifies', function (done) {

        var script = Lab.script();
        script.experiment('test', function () {

            script.test('1', function (finished) {

                finished();
            });
        });

        Lab.report(script, { notify: true }, function (err, code, output) {
            expect(code).to.equal(0);
            Lab.report(script, { notify: false }, function (err, code, output) {
                expect(code).to.equal(0);
                done();
            });
        });
    });

});
