// Load modules

var Fs = require('fs');

// Declare internals

var internals = {
    fileCache: {}
};

internals.prime = function (extension, transform) {

    require.extensions[extension] = function (localModule, filename) {

        var src = Fs.readFileSync(filename, 'utf8');
        var relativeFilename = filename.substr(process.cwd().length + 1);

        src = (typeof transform === 'function') ? transform(src, relativeFilename) : src;

        internals.fileCache[relativeFilename] = src;

        localModule._compile(src, filename);
    };
};

exports.install = function (settings) {

    settings.transform.forEach(function (transform) {

        internals.prime(transform.ext, transform.transform);
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
