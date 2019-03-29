'use strict';

const Fs = require('fs');
const Path = require('path');

const Eslint = require('eslint');
const Hoek = require('@hapi/hoek');


const internals = {};


exports.lint = function () {

    const configuration = {
        ignore: true
    };

    const options = process.argv[2] ? JSON.parse(process.argv[2]) : undefined;

    if (!Fs.existsSync('.eslintrc.js') &&
        !Fs.existsSync('.eslintrc.yaml') &&
        !Fs.existsSync('.eslintrc.yml') &&
        !Fs.existsSync('.eslintrc.json') &&
        !Fs.existsSync('.eslintrc')) {
        configuration.configFile = Path.join(__dirname, '.eslintrc.js');
    }

    if (options) {
        Hoek.merge(configuration, options, true, false);
    }

    let results;
    try {
        const engine = new Eslint.CLIEngine(configuration);
        results = engine.executeOnFiles(['.']);
    }
    catch (ex) {
        results = {
            results: [{ messages: [ex] }]
        };
    }


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
