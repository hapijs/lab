'use strict';

// Load modules

const Hoek = require('hoek');
const Nodejslint = require('jslint');


// Declare internals

const internals = {};

const formatErrors = function (error) {

    return {
        line: error.line,
        severity: 'ERROR',
        message: error.message
    };
};

const formatFile = function (file) {

    return {
        filename: file[0],
        errors: file[1].map(formatErrors)
    };
};

exports.lint = function () {

    const configuration = {
        edition: 'latest',
        argv: {
            remain: ['**/*.js']
        },
        collector: true
    };

    const options = process.argv[2] ? JSON.parse(process.argv[2]) : undefined;

    if (options) {
        Hoek.merge(configuration, options, true, false);
    }

    // synchronously lint
    Nodejslint.runMain(configuration, (ignoreErr, report) => {

        const formatted = report.map(formatFile);
        process.send(formatted);
    });
};

exports.lint();
