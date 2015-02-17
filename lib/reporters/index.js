// Load modules

var Fs = require('fs');


// Declare internals

var internals = {};


internals.protos = {
    clover: require('./clover'),
    console: require('./console'),
    html: require('./html'),
    json: require('./json'),
    junit: require('./junit'),
    lcov: require('./lcov'),
    tap: require('./tap'),
    external: null
};


exports.generate = function (options) {

    var Proto = internals.protos.external !== null ? internals.protos.external : internals.protos[options.reporter];
    var reporter = new Proto(options);

    var dest = typeof options.output === 'string' ? Fs.createWriteStream(options.output) : options.output;
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
