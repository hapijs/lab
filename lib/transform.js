// Load modules

var Fs = require('fs');

// Declare internals

var internals = {
    fileCache: {}
};


exports.install = function (settings) {

    settings.transform.forEach(function (transform) {

        require.extensions[transform.ext] = function (module, filename) {

            var src = Fs.readFileSync(filename);

            var relativeFilename = filename.substr(process.cwd().length + 1);

            if (typeof transform.transform === 'function') {
                src = transform.transform(src, relativeFilename);
            }

            internals.fileCache[relativeFilename] = src;

            module._compile(src, filename);
        };
    });
};


exports.retrieveFile = function (path) {

    if (internals.fileCache[path]) {
        return internals.fileCache[path];
    }

    var contents = null;
    try {
        contents = Fs.readFileSync(path, 'utf8');
    }
    catch (e) {
        contents = null;
    }

    internals.fileCache[path] = contents;

    return contents;
};
