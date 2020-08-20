'use strict';

module.exports = {
    parser: 'babel-eslint',
    extends: 'plugin:@hapi/hapi/recommended',
    parserOptions: {
        loc: true,
        comment: true,
        range: true,
        ecmaVersion: 2020,
        sourceType: 'script'
    }
};
