'use strict';

// Load modules

const ChildProcess = require('child_process');


// Declare internals

const internals = {
    linters: {
        eslint: __dirname + '/linters/eslint/index.js',
        jslint: __dirname + '/linters/jslint/index.js'
    }
};


exports.lint = function (settings, callback) {

    const child = ChildProcess.fork(internals.linters[settings.linter],
                                  settings['lint-options'] ? [settings['lint-options']] : [],
                                  { cwd: settings.lintingPath });
    child.once('message', (message) => {

        child.kill();

        const result = { lint: message, totalErrors: 0, totalWarnings: 0 };

        result.lint.forEach((lint) => {

            let errors = 0;
            let warnings = 0;

            lint.errors.forEach((err) => {

                if (err.severity === 'ERROR') {
                    errors++;
                }
                else {
                    warnings++;
                }
            });

            lint.totalErrors = errors;
            lint.totalWarnings = warnings;
            result.totalErrors += errors;
            result.totalWarnings += warnings;
        });

        result.total = result.totalErrors + result.totalWarnings;

        return callback(null, result);
    });
};
