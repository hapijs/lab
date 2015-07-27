// Load modules

var Path = require('path');
var Hoek = require('hoek');
var Reporters = require('./index');


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    var self = this;
    self._reporters = [];

    options.reporter.forEach(function (reporter, index) {

        var reporterOptions = Hoek.clone(options);
        reporterOptions.reporter = reporter;

        if (options.output[index] === 'stdout') {
            options.output[index] = process.stdout;
        }

        reporterOptions.output = options.output[index] || options.output;

        var reporterKey = reporterOptions.reporter;
        var reporterIndex = 2;
        while (self._reporters.hasOwnProperty(reporterKey)) {
            reporterKey = reporterOptions.reporter + reporterIndex;
            reporterIndex++;
        }

        self._reporters[reporterKey] = Reporters.generate(reporterOptions);
    });
    this.settings = options;
};


internals.Reporter.prototype.start = function (notebook) {

    for (var key in this._reporters) {
        this._reporters[key].start(notebook);
    }
};


internals.Reporter.prototype.test = function (test) {

    for (var key in this._reporters) {
        this._reporters[key].test(test);
    }
};


internals.Reporter.prototype.end = function (notebook) {

    for (var key in this._reporters) {
        this._reporters[key].end(notebook);
    }
};


internals.Reporter.prototype.report = function (text) {

    for (var key in this._reporters) {
        this._reporters[key].report(text);
    }
};


internals.Reporter.prototype.finalize = function (notebook, callback) {

    this._results = { err: false, code: [], output: [], count: 0 };

    for (var key in this._reporters) {
        this._reporters[key].finalize(notebook, this.finalizeSingle(key, callback));
    }
};


internals.Reporter.prototype.finalizeSingle = function (key, callback) {

    var self = this;

    return function (err, code, output) {

        self._results.count++;
        self._results.err = self._results.err || err;
        self._results.code[key] = code;
        self._results.output[key] = output;
        self._results.processCode = self._results.processCode || code;

        if (self._results.count === Object.keys(self._reporters).length) {
            if (callback) {
                return callback(self._results.err, self._results.code, self._results.output);
            }

            process.exit(self._results.processCode);
        }
    };
};
