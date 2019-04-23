'use strict';

module.exports = {
    extends: require.resolve('@hapi/eslint-config-hapi'),
    parserOptions: {
        loc: true,
        comment: true,
        range: true,
        ecmaVersion: 2019
    }
};
