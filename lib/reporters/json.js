'use strict';

// Load modules


// Declare internals

const internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    const tests = {};
    notebook.tests.forEach((test) => {

        const path = test.path.join('/');
        tests[path] = tests[path] || [];
        tests[path].push({
            title: test.relativeTitle,
            err: (test.err ? test.err.message : false),
            duration: test.duration
        });
    });

    const report = {
        tests,
        duration: notebook.ms,
        leaks: notebook.leaks
    };

    if (notebook.errors.length) {
        report.errors = notebook.errors;
    }

    if (notebook.coverage) {
        report.coverage = notebook.coverage;
    }

    if (notebook.lint && notebook.lint.lint) {
        report.lint = notebook.lint.lint;
    }

    this.report(JSON.stringify(report, null, 2));
};
