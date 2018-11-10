'use strict';

module.exports = {
    extends: require.resolve('eslint-config-hapi'),
    parserOptions: {
        loc: true,
        comment: true,
        range: true,
        ecmaFeatures: {
            experimentalObjectRestSpread: true
        },
        ecmaVersion: 9
    }
};
