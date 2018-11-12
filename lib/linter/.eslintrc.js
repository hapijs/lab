'use strict';

module.exports = {
    extends: require.resolve('eslint-config-hapi'),
    parserOptions: {
        loc: true,
        comment: true,
        range: true,
        ecmaVersion: 9
    }
};
