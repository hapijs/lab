// Load modules

var Fs = require('fs');


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    var tests = {};

    emitter.on('test', function (test) {

        tests[test.path] = tests[test.path] || [];
        tests[test.path].push({
            title: test.relativeTitle,
            err: (test.err ? test.err.message || true : false),
            duration: test.duration
        });
    });

    emitter.on('end', function (notebook) {

        var result = JSON.stringify(tests, null, 2);

        if (options.output) {
            Fs.writeFileSync(options.output, result);
            return;
        }

        process.stdout.write(result);
    });
};
