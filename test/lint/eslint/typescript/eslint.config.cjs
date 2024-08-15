'use strict';

const HapiPlugin = require('@hapi/eslint-plugin');
const TsESLint = require('typescript-eslint');

module.exports = TsESLint.config(
    {
        files: ['**/*.ts']
    },
    ...HapiPlugin.configs.module,
    TsESLint.configs.base
);
