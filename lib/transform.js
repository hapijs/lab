// Load modules

var Fs = require('fs');

// Declare internals

var internals = {
    fileCache: {},
    transforms: [ { ext: '.js', transform: null } ]
};


internals.prime = function (extension) {

    require.extensions[extension] = function (localModule, filename) {

        var src = Fs.readFileSync(filename, 'utf8');
        return localModule._compile(exports.transform(filename, src), filename);
    };
};


exports.install = function (settings, primeFn) {

    if (Array.isArray(settings.transform)) {
        settings.transform.forEach(function (element) {

            if (element.ext === '.js') {
                internals.transforms[0].transform = element.transform;
            }
            else {
                internals.transforms.push(element);
            }
        });
    }

    if (typeof primeFn !== 'function') {
        primeFn = internals.prime;
    }

    internals.transforms.forEach(function (transform) {

        primeFn(transform.ext);
    });
};


exports.transform = function (filename, content) {

    var ext = '';
    var transform = null;

    internals.transforms.forEach(function (element) {

        ext = element.ext;
        if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
            transform = element.transform;
        }
    });

    var relativeFilename = filename.substr(process.cwd().length + 1);
    internals.fileCache[relativeFilename] = (typeof transform === 'function') ? transform(content, relativeFilename) : content;
    return internals.fileCache[relativeFilename];
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
