'use strict';

const Hoek = require('@hapi/hoek');

const Reporters = require('./index');


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


internals.Reporter.prototype.finalize = async function (notebook) {

    this._results = { err: false, code: 0, output: [], count: 0 };

    for (const key in this._reporters) {
        this._results.count++;
        try {
            const { code, output } = await this._reporters[key].finalize(notebook);
            this._results.code = this._results.code || code;
            this._results.output[key] = output;
        }
        catch (ex) {
            this._results.err = this._results.err || ex;
        }
    }

    if (this._results.err) {
        return Promise.reject(this._results.err);
    }

    return Promise.resolve({ code: this._results.code, output: this._results.output });
};
