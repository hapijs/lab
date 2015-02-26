// Load modules

var Fs = require('fs');

// Declare internals

var internals = {};


exports.install = function (settings) {

    settings.transform.forEach(function (transform) {

        require.extensions[transform.ext] = function(module, filename) {

            var src = Fs.readFileSync(filename);

            if (typeof transform.transform === 'function') {
                src = transform.transform(src);
            }

            module._compile(src, filename);
        };
    });
};
