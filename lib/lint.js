// Load modules

var ChildProcess = require('child_process');


// Declare internals

var internals = {};


exports.lint = function (settings, callback) {

    var child = ChildProcess.fork(__dirname + '/linters/eslint/index.js', { cwd: settings.lintingPath });
    child.once('message', function (message) {

        child.kill();
        return callback(null, { eslint: message });
    });
};
