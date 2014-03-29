// Load modules

var Fs = require('fs');
var Path = require('path');
var Coverage = require('./coverage');


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    var Handlebars = require('handlebars');

    var filename = Path.join(__dirname, 'html', 'report.html');
    var template = Fs.readFileSync(filename, 'utf8');
    var view = Handlebars.compile(template);
    var coverageClass = function (n) { return (n > 75 ? 'high' : (n > 50 ? 'medium' : (n > 25 ? 'low' : 'terrible'))); };

    options.dest = {};
    Coverage(emitter, options);

    emitter.on('end', function (notebook) {

        var context = {
            cov: options.dest.cov,
            coverageClass: coverageClass(options.dest.cov.coverage)
        };

        context.cov.coverage = context.cov.coverage.toFixed() === context.cov.coverage ? context.cov.coverage.toFixed() : context.cov.coverage.toFixed(2);
        context.cov.files.forEach(function (file) {

            file.coverageClass = coverageClass(file.coverage);
            file.segments = file.filename.split('/');
            file.basename = file.segments.pop();
            file.coverage = file.coverage.toFixed() === file.coverage ? file.coverage.toFixed() : file.coverage.toFixed(2);

            if (file.segments.length) {
                file.dirname = file.segments.join('/') + '/';
            }
        });

        var html = view(context);

        if (options.output) {
            Fs.writeFileSync(options.output, html);
            return;
        }

        process.stdout.write(html);
    });
};
