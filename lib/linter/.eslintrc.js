'use strict';

module.exports = {
    parser: 'babel-eslint',
    extends: require.resolve('@hapi/eslint-config-hapi'),
    parserOptions: {
        loc: true,
        comment: true,
        range: true,
        ecmaVersion: 2020,
        sourceType: 'script'
    }
};
