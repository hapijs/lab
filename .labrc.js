'use strict';

const Somever = require('@hapi/somever');

module.exports = {
    'coverage-predicate': [
        process.platform,
        Somever.match(process.version, '>=14') && 'has-nullish'
    ]
};
