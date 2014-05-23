var Fs = require('fs');
var Lab = require('../lib');

var experiment = Lab.experiment;
var test = Lab.test;

experiment('Errors', function () {

    test('throws when 1 does not equal 2', function (done) {

        var files = internals.findAllJSFiles('./metalab', []);
        var coverage = [];

        for (var i = 0, il = files.length; i < il; ++i) {
            var file = files[i];

            coverage.push(require('.' + file));
        }
        done();
    });
});


var internals = {};

internals.findAllJSFiles = function (root, exclusions) {

    var files = Fs.readdirSync(root);
    var filesToBeReturned = [];

    for (var i = 0, il = files.length; i < il; ++i) {
        var file = root + '/' + files[i];

        if (!internals.isInList(file, exclusions)) {
            try {
                var subfiles = internals.findAllJSFiles(file, exclusions);
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
}

internals.isInList = function (which, list) {

    for (var i = 0, il = list.length; i < il; ++i) {
        if (which === list[i]) {
            return true;
        }
    }

    return false;
}
