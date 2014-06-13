var Fs = require('fs');
var Lab = require('../lib');

//No tests required for this file.  Intended to load all Lab files for coverage purposes only.

var internals = {
    //list of files to be excluded from coverage
    exclusions: []
};

internals.loadFiles = function () {
    var files = internals.findAllJSFiles('./metalab', []);
    var coverage = [];

    for (var i = 0, il = files.length; i < il; ++i) {
        var file = files[i];

        coverage.push(require('.' + file));
    }
};

internals.findAllJSFiles = function (root) {

    var files = Fs.readdirSync(root);
    var filesToBeReturned = [];

    for (var i = 0, il = files.length; i < il; ++i) {
        var file = root + '/' + files[i];

        if (!internals.isInList(file)) {
            try {
                var subfiles = internals.findAllJSFiles(file);
                filesToBeReturned = filesToBeReturned.concat(subfiles);
            } catch (e) {
                var pattern = /\.js$/;

                if (pattern.test(file)) {
                    filesToBeReturned.push(file.replace(pattern,''));
                }
            }
        }
    }

    return filesToBeReturned;
};

internals.isInList = function (which, list) {

    if (!list) {
        list = internals.exclusions;
    }

    if (!list || !list.length) {
        return false;
    }

    for (var i = 0, il = list.length; i < il; ++i) {
        if (which === list[i]) {
            return true;
        }
    }

    return false;
};

internals.loadFiles();
