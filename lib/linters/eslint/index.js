// Load modules

var Fs = require('fs');
var Path = require('path');
var Eslint = require('eslint');

// Declare internals

var internals = {
};

exports.lint = function (settings) {

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

    var engine = new Eslint.CLIEngine(configuration);
    var results = engine.executeOnFiles(['.']);

    return results.results.map(function (result) {

        return {
            filename: result.filePath,
            errors: result.messages.map(function (error) {

                return {
                    line: error.line,
                    severity: error.severity === 1 ? 'WARNING' : 'ERROR',
                    message: error.ruleId + ' - ' + error.message
                };
            })
        };
    });
};
