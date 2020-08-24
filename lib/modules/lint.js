'use strict';

const ChildProcess = require('child_process');
const Fs = require('fs');


const internals = {
    linter: __dirname + '/../linter/index.js'
};


exports.lint = function (settings) {

    return new Promise((resolve, reject) => {

        const linterPath = (settings.linter && settings.linter !== 'eslint') ? settings.linter : internals.linter;

        let linterOptions;

        try {
            linterOptions = JSON.parse(settings['lint-options'] || '{}');
        }
        catch (err) {
            return reject(new Error('lint-options could not be parsed'));
        }

        linterOptions.fix = settings['lint-fix'];

        const child = ChildProcess.fork(linterPath, [JSON.stringify(linterOptions)], { cwd: settings.lintingPath });
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

                if (lint.fix) {
                    Fs.writeFileSync(lint.filename, lint.fix.output);
                }
            });

            result.total = result.totalErrors + result.totalWarnings;

            return resolve(result);
        });
    });
};
