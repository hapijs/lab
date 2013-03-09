// Load modules

var Path = require('path');
var Fs = require('fs');
var Optimist = require('optimist');
var Util = require('util');
var Events = require('events');
var Domain = require('domain');
var Async = require('async');
var Reporter = require('./reporter');
var Lab = require('./');


// Declare internals

var internals = {};


exports.execute = function () {

    var argv = Optimist.usage('Usage: $0 [-c] [-r reporter]')
        .default('r', 'console')
        .argv;

    module.paths.push(process.cwd());
    module.paths.push(Path.join(process.cwd(), 'node_modules'));

    if (argv.c) {
        require('blanket');
    }

    Error.stackTraceLimit = Infinity;

    var files = [];
    if (!argv._.length) {
        argv._.push('test');
    }

    argv._.forEach(function (arg) {

        files = files.concat(internals.lookupFiles(arg));
    });

    files = files.map(function (path) {

        return Path.resolve(path);
    });

    if (files.length) {
        files.forEach(function (file) {

            file = Path.resolve(file);
            require(file);
        });
    }

    var engine = new internals.Engine();
    var reporter = new (Reporter[argv.r] || require(argv.r))(engine);

    return engine.run(Lab.root, process.exit);
};


/*
    Events:

    test        - (test, failed, err)   test results
    end         - (ms)                  execution complete
*/


internals.Engine = function () {

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

    var startTime = Date.now();
    Async.forEachSeries(experiments, function (experiment, nextExperiment) {

        // Befores

        Async.forEachSeries(experiment.befores, function (beforeFunc, next) {

            beforeFunc.call(experiment.context, next);
        },
        function (err) {

            // Tests

            Async.forEachSeries(experiment.tests, function (test, next) {

                // Unit

                var domain = Domain.createDomain();

                var isDone = false;
                var once = function (err) {

                    if (isDone) {
                        throw new Error('Callback called twice in test: ' + test.title);
                    }

                    isDone = true;
                    domain.exit();

                    if (test.timeoutId) {
                        clearTimeout(test.timeoutId);
                        test.timeoutId = 0;
                    }
                    
                    if (err) {
                        ++self.failures;
                        test.err = err;
                    }
                    
                    self.emit('test', test, err);
                    next();
                };

                domain.on('error', function (err) {

                    domain.dispose();
                    once(err);
                });

                domain.enter();

                process.nextTick(function () {
                    
                    test.timeoutId = setTimeout(function () {

                        test.timeoutId = 0;
                        test.timeout = true;
                        throw new Error('Test timed out');
                    }, 2000);

                    test.fn.call(test.context, function () {

                        domain.exit();
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

        self.emit('end', Date.now() - startTime);
        callback(self.failures);
    });
};


internals.lookupFiles = function (path) {

    var files = [];

    var stat = Fs.statSync(path);
    if (stat.isFile()) {
        return path;
    }

    Fs.readdirSync(path).forEach(function (file) {

        file = Path.join(path, file);
        var stat = Fs.statSync(file);
        if (stat.isDirectory()) {
            files = files.concat(internals.lookupFiles(file));
            return;
        }

        if (stat.isFile() &&
            /\.(js)$/.test(file) &&
            Path.basename(file)[0] !== '.') {

            files.push(file);
        }
    });

    return files;
};


