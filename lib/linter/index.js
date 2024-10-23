'use strict';

const Fs = require('fs');

const Eslint = require('eslint');
const Hoek = require('@hapi/hoek');


const internals = {};


exports.lint = async function () {

    const configuration = {
        ignore: true
    };

    const options = process.argv[2] ? JSON.parse(process.argv[2]) : undefined;

    let usingDefault = false;

    if (!Fs.existsSync('eslint.config.js') &&
        !Fs.existsSync('eslint.config.cjs') &&
        !Fs.existsSync('eslint.config.mjs') &&
        !Fs.existsSync('eslint.config.ts') &&
        !Fs.existsSync('eslint.config.mts') &&
        !Fs.existsSync('eslint.config.cts')) {
        // No configuration file found, using the default one
        usingDefault = true;
        configuration.baseConfig = require('./.eslintrc.js');
        configuration.overrideConfigFile = true;
    }

    if (options) {
        Hoek.merge(configuration, options, true, false);
    }

    // Only the default configuration should be altered, otherwise the user's configuration should be used as is
    if (usingDefault) {
        if (!configuration.extensions) {
            const extensions = ['js', 'cjs', 'mjs'];

            if (configuration.typescript) {
                extensions.push('ts');
            }

            configuration.baseConfig.unshift({
                files: extensions.map((ext) => `**/*.${ext}`)
            });
        }

        if (configuration.ignores) {
            configuration.baseConfig.unshift({
                ignores: configuration.ignores
            });
        }
    }

    delete configuration.extensions;
    delete configuration.typescript;
    delete configuration.ignores;


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

            if (err.messageTemplate === 'all-matched-files-ignored') {
                return {
                    severity: 'ERROR',
                    message: err.message
                };
            }

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
