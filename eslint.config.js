'use strict';

const HapiPlugin = require('@hapi/eslint-plugin');

module.exports = [
    {
        ignores: [
            'node_modules/',
            'test_runner/',
            'test/coverage/',
            'test/cli/',
            'test/cli_*/',
            'test/lint/',
            'test/override/',
            'test/plan/',
            'test/transform/'
        ]
    },
    ...HapiPlugin.configs.module
];
