// Load modules

var Fs = require('fs');


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    emitter.on('end', function (notebook) {

        var tests = {};
        notebook.tests.forEach(function (test) {

            path = test.path.join('/');
            tests[path] = tests[path] || [];
            tests[path].push({
                title: test.relativeTitle,
                err: (test.err ? test.err.message || true : false),
                duration: test.duration
            });
        });

        var result = JSON.stringify(tests, null, 2);

        if (options.output) {
            Fs.writeFileSync(options.output, result);
            return;
        }

        process.stdout.write(result);
    });
};
