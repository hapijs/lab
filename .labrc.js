'use strict';

const Somever = require('@hapi/somever');

module.exports = {
    'coverage-predicates': {
        win32: process.platform === 'win32',
        'has-nullish': Somever.match(process.version, '>=14')
    }
};
