var Fs = require('fs');
var Path = require('path');
var Eslint = require('eslint');
var Hoek = require('hoek');

// Declare internals

var internals = {};


exports.lint = function () {

    var configuration = {
        ignore: true,
        useEslintrc: true
    };

    var options = process.argv[2] ? JSON.parse(process.argv[2]) : undefined;

    if (!Fs.existsSync('.eslintrc')) {
        configuration.configFile = Path.join(__dirname, '.eslintrc');
    }

    if (!Fs.existsSync('.eslintignore')) {
        configuration.ignorePath = Path.join(__dirname, '.eslintignore');
    }

    if (options) {
        Hoek.merge(configuration, options, true, false);
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

process.send(exports.lint());
