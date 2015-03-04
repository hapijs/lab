// Load modules

var ChildProcess = require('child_process');


// Declare internals

var internals = {
    linters: {
        eslint: __dirname + '/linters/eslint/index.js',
        jslint: __dirname + '/linters/jslint/index.js'
    }
};


exports.lint = function (settings, callback) {

    var child = ChildProcess.fork(internals.linters[settings.linter],
                                  settings['lint-options'] ? [ settings['lint-options'] ] : [],
                                  { cwd: settings.lintingPath });
    child.once('message', function (message) {
        child.kill();
        return callback(null, { lint: message });
    });
};
