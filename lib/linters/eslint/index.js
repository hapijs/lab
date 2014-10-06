// Load modules

var Fs = require('fs');
var Path = require('path');

// Declare internals

var internals = {
};

exports.lint = function (settings) {

    var eslint = require('eslint');

    var configuration = {
        ignore: true,
        useEslintrc: true
    };

    if (!Fs.existsSync('.eslintrc')) {
        configuration.configFile = Path.join(__dirname, '.eslintrc');
    }

    if (!Fs.existsSync('.eslintignore')) {
        configuration.ignorePath = Path.join(__dirname, '.eslintignore');
    }

    var engine = new eslint.CLIEngine(configuration);
    var results = engine.executeOnFiles(['.']);

    return results.results.map(function (result) {

        return {
            filename: result.filePath,
            errors: result.messages.map(function (error) {

                return {
                    line: error.line,
                    severity: error.severity === 1 ? 'WARNING' : 'ERROR',
                    message: error.ruleId + ' ' + error.message
                }
            })
        };
    });
};