'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const Eslint = require('eslint');
const Hoek = require('hoek');

// Declare internals

const internals = {};


exports.lint = function () {

    const configuration = {
        ignore: true,
        useEslintrc: true
    };

    const options = process.argv[2] ? JSON.parse(process.argv[2]) : undefined;

    if (!Fs.existsSync('.eslintrc.js') &&
        !Fs.existsSync('.eslintrc.yaml') &&
        !Fs.existsSync('.eslintrc.yml') &&
        !Fs.existsSync('.eslintrc.json') &&
        !Fs.existsSync('.eslintrc')) {
        configuration.configFile = Path.join(__dirname, '.eslintrc.js');
    }

    if (!Fs.existsSync('.eslintignore')) {
        configuration.ignorePath = Path.join(__dirname, '.eslintignore');
    }

    if (options) {
        Hoek.merge(configuration, options, true, false);
    }

    const engine = new Eslint.CLIEngine(configuration);
    const results = engine.executeOnFiles(['.']);

    return results.results.map((result) => {

        const transformed = {
            filename: result.filePath
        };

        if (result.hasOwnProperty('output')) {
            transformed.fix = {
                output: result.output
            };
        }

        transformed.errors = result.messages.map((err) => {

            return {
                line: err.line,
                severity: err.severity === 1 ? 'WARNING' : 'ERROR',
                message: err.ruleId + ' - ' + err.message
            };
        });

        return transformed;
    });
};

process.send(exports.lint());
