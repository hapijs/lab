// Load modules

var Fs = require('fs');
var Path = require('path');
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

    // synchronously lint
    Nodejslint.runMain({
        edition: 'latest',
        argv: {
            remain: ['**/*.js']
        },
        collector: true
    }, function (err, report) {
        var formatted = report.map(formatFile);

        process.send(formatted);
    });
};

exports.lint();
