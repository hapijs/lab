'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');

// Declare internals

const internals = {
    fileCache: {},
    transforms: [{ ext: '.js', transform: null }]
};


internals.prime = function (extension) {

    require.extensions[extension] = function (localModule, filename) {

        const src = Fs.readFileSync(filename, 'utf8');
        return localModule._compile(exports.transform(filename, src), filename);
    };
};


exports.install = function (settings, primeFn) {

    if (Array.isArray(settings.transform)) {
        settings.transform.forEach((element) => {

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

    internals.transforms.forEach((transform) => {

        primeFn(transform.ext);
    });
};


exports.transform = function (filename, content) {

    let ext = '';
    let transform = null;

    internals.transforms.forEach((element) => {

        ext = element.ext;
        if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
            transform = element.transform;
        }
    });

    const relativeFilename = Path.relative(process.cwd(), filename);
    internals.fileCache[relativeFilename] = (typeof transform === 'function') ? transform(content, relativeFilename) : content;
    return internals.fileCache[relativeFilename];
};


exports.retrieveFile = function (path) {

    const cwd = process.cwd();
    const cacheKey = path.indexOf(cwd) === 0 ? path.substr(cwd.length + 1) : path;
    if (internals.fileCache[cacheKey]) {
        return internals.fileCache[cacheKey];
    }

    let contents = null;
    try {
        contents = Fs.readFileSync(path, 'utf8');
    }
    catch (e) {
        contents = null;
    }

    internals.fileCache[path] = contents;

    return contents;
};
