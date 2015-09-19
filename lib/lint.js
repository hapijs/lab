// Load modules

var ChildProcess = require('child_process');


// Declare internals

var internals = {
    linters: {
        eslint: __dirname + '/linters/eslint/index.js',
        jslint: __dirname + '/linters/jslint/index.js'
    }
};


exports.lint = function (settings, callback) {

    var child = ChildProcess.fork(internals.linters[settings.linter],
                                  settings['lint-options'] ? [settings['lint-options']] : [],
                                  { cwd: settings.lintingPath });
    child.once('message', function (message) {

        child.kill();

        var result = { lint: message, totalErrors: 0, totalWarnings: 0 };

        result.lint.forEach(function (lint) {

            var errors = 0;
            var warnings = 0;

            lint.errors.forEach(function (e) {

                if (e.severity === 'ERROR') {
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
