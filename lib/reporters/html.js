// Load modules

var Fs = require('fs');
var Path = require('path');
var Handlebars = require('handlebars');


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;

    var filename = Path.join(__dirname, 'html', 'report.html');
    var template = Fs.readFileSync(filename, 'utf8');

    Handlebars.registerHelper('hits', function (hits) {

        return (hits === undefined ? '' : hits);
    });

    Handlebars.registerHelper('join', function (array, separator) {

        return array.join(separator);
    });

    Handlebars.registerHelper('replace', function (str, from, to, flags) {

        return str.replace(new RegExp(from, flags), to);
    });

    this.view = Handlebars.compile(template);
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    notebook.coverage = notebook.coverage || { percent: 0, files: [] };
    var percent = notebook.coverage.percent;
    var context = {
        cov: notebook.coverage,
        percentClass: percent > 75 ? 'high' : (percent > 50 ? 'medium' : (percent > 25 ? 'low' : 'terrible')),
        percent: (percent % 1 === 0) ? percent.toFixed() : percent.toFixed(2),
        tests: notebook.tests || [],
        duration: notebook.ms
    };

    context.failures = context.tests.filter(function (test) {

        return !!test.err;
    });

    context.skipped = context.tests.filter(function (test) {

        return test.skipped;
    });

    // Populate path to be used for filtering
    context.paths = [];
    context.tests.forEach(function (test) {

        var paths = [];
        test.path.forEach(function (path) {

            path = path.replace(/\ /gi, '_');
            paths.push(path);
            if (context.paths.indexOf(path) === -1) {
                context.paths.push(path);
            }
        });

        test.path = paths;
    });

    notebook.coverage.files.forEach(function (file) {

        file.segments = file.filename.split('/');
        file.basename = file.segments.pop();
        file.percent = (file.percent % 1 === 0) ? file.percent.toFixed() : file.percent.toFixed(2);
        file.percentClass = file.percent > 75 ? 'high' : (file.percent > 50 ? 'medium' : (file.percent > 25 ? 'low' : 'terrible'));

        if (file.segments.length) {
            file.dirname = file.segments.join('/') + '/';
        }
    });

    this.report(this.view(context));
};
