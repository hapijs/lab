// Load modules

var Path = require('path');
var Hoek = require('hoek');
var Reporters = require('./index');

// Declare internals

var internals = {};

exports = module.exports = internals.Reporter = function (options) {

    internals.reporters = [];

    options.reporter.forEach(function (reporter, index) {

        var reporterOptions = Hoek.clone(options);
        reporterOptions.reporter = reporter;

        if (options.output[index] === 'stdout') {
            options.output[index] = process.stdout;
        }

        reporterOptions.output = options.output[index] || options.output;

        var reporterKey = reporterOptions.reporter;
        var reporterIndex = 2;
        while (internals.reporters.hasOwnProperty(reporterKey)) {
            reporterKey = reporterOptions.reporter + reporterIndex;
            reporterIndex++;
        }

        internals.reporters[reporterKey] = Reporters.generate(reporterOptions);
    });
    this.settings = options;
};


internals.Reporter.prototype.start = function (notebook) {

    for (var key in internals.reporters) {
        internals.reporters[key].start(notebook);
    }
};


internals.Reporter.prototype.test = function (test) {

    for (var key in internals.reporters) {
        internals.reporters[key].test(test);
    }
};


internals.Reporter.prototype.end = function (notebook) {

    for (var key in internals.reporters) {
        internals.reporters[key].end(notebook);
    }
};

internals.Reporter.prototype.report = function (text) {

    for (var key in internals.reporters) {
        internals.reporterr[key].report(text);
    }
};

internals.Reporter.prototype.finalize = function (notebook, callback) {

    internals.finalize = { err: false, code: [], output: [], count: 0 };

    for (var key in internals.reporters) {
        internals.reporters[key].finalize(notebook, this.finalizeSingle(key, callback));
    }
};

internals.Reporter.prototype.finalizeSingle = function (key, callback) {

    return function (err, code, output) {

        internals.finalize.count++;
        internals.finalize.err = internals.finalize.err || err;
        internals.finalize.code[key] = code;
        internals.finalize.output[key] = output;

        if (internals.finalize.count === Object.keys(internals.reporters).length) {
            callback(internals.finalize.err, internals.finalize.code, internals.finalize.output);
        }
    };
};
