// Load modules

var ChildProcess = require('child_process');


// Declare internals

var internals = {};


exports.lint = function (settings, callback) {

    var cwd = process.cwd();
    process.chdir(settings.lintingPath);

    var child = ChildProcess.fork(__dirname + '/linters/eslint/index.js');
    child.on('message', function (message) {

        process.chdir(cwd);
        child.kill();
        return callback(null, { eslint: message });
    });
};
