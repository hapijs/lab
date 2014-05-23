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
    this.view = Handlebars.compile(template);

    Handlebars.registerHelper('hits', function (hits) {

        return (hits === undefined ? '' : hits);
    });
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    var percent = notebook.coverage.percent;
    var context = {
        cov: notebook.coverage,
        percentClass: percent > 75 ? 'high' : (percent > 50 ? 'medium' : (percent > 25 ? 'low' : 'terrible')),
        percent: (percent % 1 === 0) ? percent.toFixed() : percent.toFixed(2)
    };

    notebook.coverage.files.forEach(function (file) {

        file.segments = file.filename.split('/');
        file.basename = file.segments.pop();
        file.percent = (file.percent % 1 === 0) ? file.percent.toFixed() : file.percent.toFixed(2);
        file.percentClass = file.percent > 75 ? 'high' : (file.percent > 50 ? 'medium' : (file.percent > 25 ? 'low' : 'terrible'));

        if (file.segments.length) {
            file.dirname = file.segments.join('/') + '/';
        }
    });

    return this.view(context);
};
