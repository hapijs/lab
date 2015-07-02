// Load modules

var Fs = require('fs');
var Path = require('path');
var Mkdirp = require('mkdirp');
// ('./multiple') loaded below


// Declare internals

var internals = {};


internals.protos = {
    clover: require('./clover'),
    console: require('./console'),
    html: require('./html'),
    json: require('./json'),
    junit: require('./junit'),
    lcov: require('./lcov'),
    tap: require('./tap')
};

internals.requireReporter = function (reporter) {

    if (Array.isArray(reporter)) {
        return require('./multiple');
    }

    if (reporter[0] === '.') {
        return require(Path.join(process.cwd(), reporter));
    }

    return require(reporter);
};

internals.isOverLintStatus = function (lint, threshold, status) {

    if (threshold >= 0) {
        var lintResults = lint.lint;

        for (var l = 0, ll = lintResults.length; l < ll; ++l) {

            var errors = lintResults[l].errors;

            for (var e = 0, el = errors.length; e < el; ++e) {
                if (errors[e].severity === status && --threshold <= 0) {
                    return true;
                }
            }
        }
    }

    return false;
};

exports.generate = function (options) {

    var Proto = internals.protos[options.reporter] || internals.requireReporter(options.reporter);
    var reporter = new Proto(options);

    if (!Array.isArray(options.reporter)) {
        var dest;
        if (typeof options.output === 'string') {
            Mkdirp.sync(Path.dirname(options.output));
            dest = Fs.createWriteStream(options.output);
        }
        else {
            dest = options.output;
        }

        var output = '';

        reporter.report = function (text) {

            output += text;
            if (dest) {
                dest.write(text);
            }
        };

        reporter.finalize = function (notebook, callback) {

            reporter.end(notebook);

            var finalize = function () {

                var code = ((notebook.errors && notebook.errors.length) ||                                                    // Before/after/exceptions
                            options.coverage && options.threshold && notebook.coverage.percent < options.threshold) ||        // Missing coverage
                            notebook.failures ||                                                                              // Tests failed
                            (notebook.leaks && notebook.leaks.length) ||                                                      // Global leaked
                            (options.lint &&
                                (internals.isOverLintStatus(notebook.lint, options['lint-errors-threshold'], 'ERROR') ||      // Linting errors
                                internals.isOverLintStatus(notebook.lint, options['lint-warnings-threshold'], 'WARNING')      // Linting warnings
                            )) ? 1 : 0;

                if (callback) {
                    return callback(null, code, output);
                }

                process.exit(code);
            };

            if (!dest ||
                dest === process.stdout) {

                return finalize();
            }

            dest.end(finalize);
        };
    }

    return reporter;
};
