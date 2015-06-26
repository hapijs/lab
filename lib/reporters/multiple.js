// Load modules

var Path = require('path');
var Reporters = require('./index');
var Hoek = require('hoek');

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
        internals.reporters.push(Reporters.generate(reporterOptions));
    });
    this.settings = options;
};


internals.Reporter.prototype.start = function (notebook) {

    internals.reporters.forEach(function (reporter) {

        reporter.start(notebook);
    });
};


internals.Reporter.prototype.test = function (test) {

    internals.reporters.forEach(function (reporter) {

        reporter.test(test);
    });
};


internals.Reporter.prototype.end = function (notebook) {

    internals.reporters.forEach(function (reporter) {

        reporter.end(notebook);
    });
};

internals.Reporter.prototype.report = function (text) {

    internals.reporters.forEach(function (reporter) {

        reporter.report(text);
    });
};

internals.Reporter.prototype.finalize = function (notebook, callback) {

    internals.finalize = { err: false, code: [], output: [], count: 0 };

    internals.reporters.forEach(function (reporter) {

        reporter.finalize(notebook, function (err, code, output) {

            internals.finalize.count++;
            internals.finalize.err = internals.finalize.err || err;
            internals.finalize.code.concat(code);
            internals.finalize.output.concat(output);

            if (internals.finalize.count === internals.reporters.length) {
                callback(internals.finalize.err, internals.finalize.code, internals.finalize.output);
            }
        });
    });
};

