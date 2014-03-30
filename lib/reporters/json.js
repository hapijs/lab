// Load modules


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    var tests = {};
    notebook.tests.forEach(function (test) {

        path = test.path.join('/');
        tests[path] = tests[path] || [];
        tests[path].push({
            title: test.relativeTitle,
            err: (test.err ? test.err.message || true : false),
            duration: test.duration
        });
    });

    var report = {
        tests: tests,
        duration: notebook.ms,
        leaks: notebook.leaks
    };

    if (notebook.coverage) {
        report.coverage = notebook.coverage
    }

    return JSON.stringify(report, null, 2);
};