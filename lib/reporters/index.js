'use strict';

const Fs = require('fs');
const Path = require('path');

// ('./multiple') loaded below


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

    if (Array.isArray(options.reporter) && options.reporter.length === 1) {
        options.reporter = options.reporter[0];
    }

    if (Array.isArray(options.output) && options.output.length === 1) {
        options.output = options.output[0];
    }

    const Proto = internals.protos[options.reporter] || internals.requireReporter(options.reporter);
    const reporter = new Proto(options);

    if (!Array.isArray(options.reporter)) {
        let dest;
        if (typeof options.output === 'string') {
            Fs.mkdirSync(Path.dirname(options.output), { recursive: true });
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

        reporter.finalize = async function (notebook) {

            await reporter.end(notebook);

            return new Promise((resolve) => {

                const finalize = () => {

                    if (((notebook.errors && notebook.errors.length) ||                                                         // Before/after/exceptions
                        options.coverage && options.threshold && notebook.coverage.percent < options.threshold) ||              // Missing coverage
                        options.coverage && options['coverage-module'] && notebook.coverage.externals ||                        // Missing external coverage
                        notebook.failures ||                                                                                    // Tests failed
                        (notebook.leaks && notebook.leaks.length) ||                                                            // Global leaked
                        (notebook.types && notebook.types.length) ||                                                            // Types definition
                        (options.lint &&
                            (internals.isOverLintStatus(notebook.lint, options['lint-errors-threshold'], 'ERROR') ||            // Linting errors
                                internals.isOverLintStatus(notebook.lint, options['lint-warnings-threshold'], 'WARNING')))) {   // Linting warnings

                        return resolve({ code: 1, output });
                    }

                    return resolve({ code: 0, output });
                };

                if (!dest ||
                    dest === process.stdout) {

                    return finalize();
                }

                dest.end(finalize);
            });
        };
    }

    return reporter;
};
