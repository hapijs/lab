// Load modules

var Coverage = require('./coverage');
var Console = require('./console');


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    options.dest = {};

    if (options.silence) {
        emitter.on('test', function (test) {

            if (test.err) {
                console.log('Tests failed.\n');
                process.exit(1);
            }
        });
    }
    else {
        Console(emitter, options);
    }

    Coverage(emitter, options);

    emitter.on('end', function (notebook) {

        var coverage = options.dest.cov.coverage;
        console.log('Coverage: ' + coverage.toFixed(2) + '%');
        if (coverage < options.threshold || isNaN(coverage)) {

            internals.consoleCoverage(options.dest.cov);
            console.log('Code coverage below threshold: ' + coverage.toFixed(2) + ' < ' + options.threshold);
            process.exit(1);
        }

        console.log('Coverage succeeded');
    });
};


internals.consoleCoverage = function (coverage) {

    console.log('');
    coverage.files.forEach(function (file) {

        var missingLines = [];
        Object.keys(file.source).forEach(function (lineNumber) {

            var line = file.source[lineNumber];
            if (line.miss) {
                missingLines.push(lineNumber);
            }
        });

        if (missingLines.length) {
            console.log(file.filename + ' missing coverage on line(s): ' + missingLines.join(', '));
        }
    });
};
