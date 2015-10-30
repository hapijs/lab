'use strict';

// Load modules

const Hoek = require('hoek');
const Reporters = require('./index');


// Declare internals

const internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this._reporters = [];

    options.reporter.forEach((reporter, index) => {

        const reporterOptions = Hoek.clone(options);
        reporterOptions.reporter = reporter;

        if (options.output[index] === 'stdout') {
            options.output[index] = process.stdout;
        }

        reporterOptions.output = options.output[index] || options.output;

        let reporterKey = reporterOptions.reporter;
        let reporterIndex = 2;
        while (this._reporters.hasOwnProperty(reporterKey)) {
            reporterKey = reporterOptions.reporter + reporterIndex;
            reporterIndex++;
        }

        this._reporters[reporterKey] = Reporters.generate(reporterOptions);
    });
    this.settings = options;
};


internals.Reporter.prototype.start = function (notebook) {

    for (const key in this._reporters) {
        this._reporters[key].start(notebook);
    }
};


internals.Reporter.prototype.test = function (test) {

    for (const key in this._reporters) {
        this._reporters[key].test(test);
    }
};


internals.Reporter.prototype.end = function (notebook) {

    for (const key in this._reporters) {
        this._reporters[key].end(notebook);
    }
};


internals.Reporter.prototype.report = function (text) {

    for (const key in this._reporters) {
        this._reporters[key].report(text);
    }
};


internals.Reporter.prototype.finalize = function (notebook, callback) {

    this._results = { err: false, code: [], output: [], count: 0 };

    for (const key in this._reporters) {
        this._reporters[key].finalize(notebook, this.finalizeSingle(key, callback));
    }
};


internals.Reporter.prototype.finalizeSingle = function (key, callback) {

    return (err, code, output) => {

        this._results.count++;
        this._results.err = this._results.err || err;
        this._results.code[key] = code;
        this._results.output[key] = output;
        this._results.processCode = this._results.processCode || code;

        if (this._results.count === Object.keys(this._reporters).length) {
            if (callback) {
                return callback(this._results.err, this._results.code, this._results.output);
            }

            process.exit(this._results.processCode);
        }
    };
};
