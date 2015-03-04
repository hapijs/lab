// Load modules

var Fs = require('fs');
var Path = require('path');
var Mkdirp = require('mkdirp');

// Declare internals

var internals = {};


internals.protos = {
    clover: require('./clover'),
    console: require('./console'),
    html: require('./html'),
    json: require('./json'),
    junit: require('./junit'),
    lcov: require('./lcov'),
    tap: require('./tap')
};

internals.requireReporter = function (reporter) {

    if (reporter[0] === '.') {
        return require(Path.join(process.cwd(), reporter));
    }

    return require(reporter);
};

exports.generate = function (options) {

    var Proto = internals.protos[options.reporter] || internals.requireReporter(options.reporter);
    var reporter = new Proto(options);

    var dest;
    if (typeof options.output === 'string') {
        Mkdirp.sync(Path.dirname(options.output));
        dest = Fs.createWriteStream(options.output);
    }
    else {
        dest = options.output;
    }

    var output = '';

    reporter.report = function (text) {

        output += text;
        if (dest) {
            dest.write(text);
        }
    };

    reporter.finalize = function (notebook, callback) {

        reporter.end(notebook);

        var finalize = function () {

            var code = ((notebook.errors && notebook.errors.length) ||                                                  // Before/after/exceptions
                        options.coverage && options.threshold && notebook.coverage.percent < options.threshold) ||      // Missing coverage
                        notebook.failures ||                                                                            // Tests failed
                        (notebook.leaks && notebook.leaks.length) ? 1 : 0;                                              // Global leaked

            if (callback) {
                return callback(null, code, output);
            }

            process.exit(code);
        };

        if (!dest ||
            dest === process.stdout) {

            return finalize();
        }

        dest.end(finalize);
    };

    return reporter;
};
