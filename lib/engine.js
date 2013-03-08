// Load modules

var Util = require('util');
var Events = require('events');
var Domain = require('domain');
var Async = require('async');


// Declare internals

var internals = {};


/*
    Events:

    - `start`       execution started
    - `end`         execution complete
    - `test`        (test) test execution started
    - `test end`    (test) test completed
    - `hook`        (hook) hook execution started
    - `pass`        (test) test passed
    - `fail`        (test, err) test failed
*/


module.exports = internals.Engine = function () {

    Events.EventEmitter.call(this);

    return this;
};

Util.inherits(internals.Engine, Events.EventEmitter);


internals.Engine.prototype.run = function (root, callback) {

    var self = this;

    // Collect all experiments

    var experiments = [];

    var nextExperiment = function (parent) {

        if (!parent.total()) {
            return;
        }

        parent.experiments.forEach(function (child) {

            experiments.push(child);
            nextExperiment(child);
        });
    };

    nextExperiment(root);

    // Listen to end

    this.failures = 0;
    this.emit('start');

    // Experiments

    Async.forEachSeries(experiments, function (experiment, nextExperiment) {

        // Befores

        Async.forEachSeries(experiment.befores, function (beforeFunc, next) {

            beforeFunc.call(experiment.context, next);
        },
        function (err) {

            // Tests

            Async.forEachSeries(experiment.tests, function (test, next) {

                // Unit

                self.emit('test', test);

                var domain = Domain.createDomain();

                var isDone = false;
                var once = function () {

                    if (isDone) {
                        return;
                    }

                    isDone = true;
                    domain.exit();

                    self.emit('test end', test);
                    next();
                };

                domain.on('error', function (err) {

                    console.log('lab: ' + err.message);
                    domain.dispose();

                    ++self.failures;
                    test.state = 'failed';
                    test.err = err;
                    self.emit('fail', test, err);

                    once();
                });

                domain.enter();

                process.nextTick(function () {

                    test.fn.call(test.context, function () {

                        domain.exit();

                        test.state = 'passed';
                        self.emit('pass', test);

                        once();
                    });
                });
            },
            function (err) {

                // Afters

                Async.forEachSeries(experiment.afters, function (afterFunc, next) {

                    afterFunc.call(experiment.context, next);
                },
                function (err) {

                    nextExperiment();
                });
            });
        });
    },
    function (err) {

        self.emit('end');
        callback(self.failures);
    });
};

/*process.on('uncaughtException', function (err) {

    console.log(err.stack);
    console.log(err);
    process.exit(1);
});*/


/*
internals.Runnable.prototype.run = function (callback) {

    var self = this;

    var start = new Date();

    if (this.context) {
        this.context.test = this;
    }

    var isFinished;
    var done = function (err) {

        if (self.timedOut) {
            return;
        }

        if (isFinished) {
            return multiple(err);
        }

        self.clearTimeout();
        self.duration = new Date() - start;
        isFinished = true;
        callback(err);
    };

    this.timer = setTimeout(function () {

        done(new Error('timeout of ' + self._timeout + 'ms exceeded'));
        self.timedOut = true;
    }, this._timeout);

    var isEmitted = false;
    function multiple(err) {

        if (isEmitted) {
            return;
        }

        isEmitted = true;
        self.emit('error', err || new Error('done() called multiple times'));
    }

    this.callback = done;    // for .resetTimeout()
    this.fn.call(this.context, done);
};

*/