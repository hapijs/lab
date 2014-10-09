// Load modules

var Eslint = require('./linters/eslint');

// Declare internals

var internals = {};


exports.lint = function (settings) {

    var errors = {};
    var cwd = process.cwd();
    process.chdir(settings.lintingPath);

    errors.eslint = Eslint.lint(settings);

    process.chdir(cwd);

    return errors;
};
