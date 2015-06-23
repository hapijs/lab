// Load modules

var Path = require('path');
var Reporters = require('./index');
var Hoek = require('hoek');

// Declare internals

var internals = {};

exports = module.exports = internals.Reporter = function (options) {

    internals.reporters = [];

    options.reporter.forEach(function(reporter) {

        var reporterOptions = Hoek.clone(options);
        reporterOptions.reporter = reporter;
        internals.reporters.push(Reporters.generate(reporterOptions));
    });

    this.settings = options;
};


internals.Reporter.prototype.start = function (notebook) {

    internals.reporters.forEach(function(reporter) {

        reporter.start(notebook);
    });
};


internals.Reporter.prototype.test = function (test) {

    internals.reporters.forEach(function(reporter) {

        reporter.test(test);
    });
};


internals.Reporter.prototype.end = function (notebook) {

    internals.reporters.forEach(function(reporter) {

        reporter.end(notebook);
    });
};
