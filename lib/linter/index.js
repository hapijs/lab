'use strict';

const Fs = require('fs');
const Path = require('path');

const Eslint = require('eslint');
const Hoek = require('@hapi/hoek');


const internals = {};


exports.lint = async function () {

    const configuration = {
        ignore: true
    };

    const options = process.argv[2] ? JSON.parse(process.argv[2]) : undefined;

    if (!Fs.existsSync('eslint.config.js') &&
        !Fs.existsSync('eslint.config.cjs') && // Needed for projects with "type": "module"
        !Fs.existsSync('eslint.config.mjs')) {
        configuration.overrideConfigFile = Path.join(__dirname, '.eslintrc.js');
    }

    if (options) {
        Hoek.merge(configuration, options, true, false);
    }

    if (!configuration.extensions) {
        const extensions = ['js', 'cjs', 'mjs'];

        if (configuration.typescript) {
            extensions.push('ts');
        }

        configuration.baseConfig = configuration.baseConfig || [];
        configuration.baseConfig.unshift({
            files: [`**/*.{${extensions.join(',')}}`],
        });
    }

    if (configuration.typescript) {
        delete configuration.typescript;
    }

    if (configuration.ignores) {
        configuration.baseConfig = configuration.baseConfig || [];
        configuration.baseConfig.unshift({
            ignores: configuration.ignores
        });
        delete configuration.ignores;
    }

    let results;
    try {
        const eslint = new Eslint.ESLint(configuration);
        results = await eslint.lintFiles(['.']);
    }
    catch (ex) {
        results = [{ messages: [ex] }];
    }

    return results.map((result) => {

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

const main = async () =>  {

    const results = await exports.lint();
    process.send(results);
};

main();
