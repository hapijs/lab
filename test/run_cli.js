'use strict';

const ChildProcess = require('child_process');
const Path = require('path');

// Declare internals

const internals = {
    labPath: Path.join(__dirname, '..', 'bin', '_lab')
};

module.exports = (args, callback, root) => {

    const childEnv = Object.assign({}, process.env);
    delete childEnv.NODE_ENV;
    const cli = ChildProcess.spawn('node', [].concat(internals.labPath, args), { env: childEnv, cwd : root || '.' });
    let output = '';
    let errorOutput = '';
    let combinedOutput = '';

    cli.stdout.on('data', (data) => {

        output += data;
        combinedOutput += data;
    });

    cli.stderr.on('data', (data) => {

        errorOutput += data;
        combinedOutput += data;
    });

    cli.once('close', (code, signal) => {

        if (signal) {
            callback(new Error('Unexpected signal: ' + signal));
        }
        callback(null, { output, errorOutput, combinedOutput, code, signal });
    });
};
