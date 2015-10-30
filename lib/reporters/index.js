'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const Mkdirp = require('mkdirp');
// ('./multiple') loaded below


// Declare internals

const internals = {};


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
        const lintResults = lint.lint;

        for (let i = 0; i < lintResults.length; ++i) {

            const errors = lintResults[i].errors;

            for (let j = 0; j < errors.length; ++j) {
                if (errors[j].severity === status && --threshold <= 0) {
                    return true;
                }
            }
        }
    }

    return false;
};


exports.generate = function (options) {

    const Proto = internals.protos[options.reporter] || internals.requireReporter(options.reporter);
    const reporter = new Proto(options);

    if (!Array.isArray(options.reporter)) {
        let dest;
        if (typeof options.output === 'string') {
            Mkdirp.sync(Path.dirname(options.output));
            dest = Fs.createWriteStream(options.output);
        }
        else {
            dest = options.output;
        }

        let output = '';

        reporter.report = function (text) {

            output += text;
            if (dest) {
                dest.write(text);
            }
        };

        reporter.finalize = function (notebook, callback) {

            reporter.end(notebook);

            const finalize = function () {

                const code = ((notebook.errors && notebook.errors.length) ||                                                    // Before/after/exceptions
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
