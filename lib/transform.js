// Load modules

var Fs = require('fs');

// Declare internals

var internals = {};

internals.prime = function (extension, transform) {

    require.extensions[extension] = function (localModule, filename) {

        var src = Fs.readFileSync(filename, 'utf8');
        var relativeFilename = filename.substr(process.cwd().length + 1);

        src = (typeof transform === 'function') ? transform(src, relativeFilename) : src;

        exports.fileCache[relativeFilename] = src;

        localModule._compile(src, filename);
    };
};

exports.fileCache = {};

exports.install = function (settings) {

    settings.transform.forEach(function (transform) {

        internals.prime(transform.ext, transform.transform);
    });
};

exports.retrieveFile = function (path) {

    if (exports.fileCache[path]) {
        return exports.fileCache[path];
    }

    var contents = null;
    try {
        contents = Fs.readFileSync(path, 'utf8');
    }
    catch (e) {
        contents = null;
    }

    exports.fileCache[path] = contents;

    return contents;
};
