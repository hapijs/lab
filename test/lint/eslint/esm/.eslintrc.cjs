'use strict';

module.exports = {
    parserOptions: {
        sourceType: 'module'
    },
    overrides: [
        {
            files: ['*.cjs'],
            parserOptions: { sourceType: 'script' }
        }
    ]
};
