// Load modules

var Fs = require('fs');
var Path = require('path');
var Hoek = require('hoek');
var Nodejslint = require('jslint');


// Declare internals

var internals = {};

var formatErrors = function (error) {

    return {
        line: error.line,
        severity: 'ERROR',
        message: error.reason
    };
};

var formatFile = function (file) {

    return {
        filename: file[0],
        errors: file[1].map(formatErrors)
    };
};

exports.lint = function () {

    var configuration = {
        edition: 'latest',
        argv: {
            remain: ['**/*.js']
        },
        collector: true
    };

    var options = process.argv[2] ? JSON.parse(process.argv[2]) : undefined;

    if (options) {
        Hoek.merge(configuration, options, true, false);
    }

    // synchronously lint
    Nodejslint.runMain(configuration, function (err, report) {

        var formatted = report.map(formatFile);
        process.send(formatted);
    });
};

exports.lint();
