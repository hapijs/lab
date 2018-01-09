'use strict';

module.exports = {
    extends: require.resolve('eslint-config-hapi'),
    parserOptions: {
        ecmaVersion: 8,
        ecmaFeatures: {
            experimentalObjectRestSpread: true
        }
    }
};
