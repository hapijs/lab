'use strict';

const HapiPlugin = require('@hapi/eslint-plugin');

module.exports = [
    ...HapiPlugin.configs.module,
    {
        languageOptions: {
            parserOptions: {
                sourceType: 'module'
            }
        }
    },
    {
        files: ['*.cjs'],
        languageOptions: {
            parserOptions: {
                sourceType: 'script'
            }
        }
    }
];
