'use strict';

const ChildProcess = require('child_process');
const Path = require('path');

// Declare internals

const internals = {
    labPath: Path.join(__dirname, '..', 'bin', '_lab')
};

module.exports = (args, root) => {

    const childEnv = Object.assign({}, process.env);
    delete childEnv.NODE_ENV;
    delete childEnv.FORCE_COLOR;
    const cli = ChildProcess.spawn('node', [].concat(internals.labPath, args), { env: childEnv, cwd: root || '.' });
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

    return new Promise((resolve, reject) => {

        cli.once('close', (code, signal) => {

            if (signal) {
                return reject(new Error('Unexpected signal: ' + signal));
            }

            resolve({ output, errorOutput, combinedOutput, code, signal });
        });
    });
};
