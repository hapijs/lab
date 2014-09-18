// Load modules
var Hoek = require('hoek');

// Declare internals

var internals = {
    linters: {
        eslint: require('./linters/eslint')
    }
};

exports.lint = function (settings) {

    var errors = {};
    var linters = Array.isArray(settings.lint) ? settings.lint : [settings.lint];
    var cwd = process.cwd();
    process.chdir(settings.lintingPath);

    linters.forEach(function (linterName) {

        var linter = internals.linters[linterName];
        Hoek.assert(linter, 'Linter ' + linterName + ' is unknown.');
        errors[linterName] = linter.lint(settings);
    });

    process.chdir(cwd);

    return errors;
};
