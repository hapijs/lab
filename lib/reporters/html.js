// Load modules

var Fs = require('fs');
var Path = require('path');
var Handlebars = require('handlebars');
var Hoek = require('hoek');


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

    Handlebars.registerHelper('lintJoin', function (array) {

        var str = '';

        for (var i = 0, il = array.length; i < il; ++i) {
            if (str) {
                str += '&#xa;'; // This is a line break
            }

            str += Hoek.escapeHtml(array[i]); // Handlebars' escape is just not enough
        }

        return new Handlebars.SafeString(str);
    });

    Handlebars.registerHelper('errorMessage', function (error) {

        return new Handlebars.SafeString(Hoek.escapeHtml('' + (error.message || error)));
    });

    Handlebars.registerHelper('errorStack', function (error) {

        var stack = error.stack.slice(error.stack.indexOf('\n') + 1).replace(/^\s*/gm, '  ');
        return new Handlebars.SafeString(Hoek.escapeHtml(stack));
    });

    var partialsPath = Path.join(__dirname, 'html', 'partials');
    var partials = Fs.readdirSync(partialsPath);
    partials.forEach(function (partial) {

        Handlebars.registerPartial(Path.basename(partial, '.html'), Fs.readFileSync(Path.join(partialsPath, partial), 'utf8'));
    });

    this.view = Handlebars.compile(template);
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    notebook.coverage = notebook.coverage || { percent: 0, files: [] };
    notebook.lint = notebook.lint || { lint: [], disabled: true };

    var percent = notebook.coverage.percent;
    var context = {
        coverage: {
            cov: notebook.coverage,
            percentClass: percent > 75 ? 'high' : (percent > 50 ? 'medium' : (percent > 25 ? 'low' : 'terrible')),
            percent: (percent % 1 === 0) ? percent.toFixed() : percent.toFixed(2)
        },
        lint: notebook.lint,
        tests: notebook.tests || [],
        errors: notebook.errors || [],
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

    context.coverage.cov.files.forEach(function (file) {

        file.segments = file.filename.split('/');
        file.basename = file.segments.pop();
        file.percent = (file.percent % 1 === 0) ? file.percent.toFixed() : file.percent.toFixed(2);
        file.percentClass = file.percent > 75 ? 'high' : (file.percent > 50 ? 'medium' : (file.percent > 25 ? 'low' : 'terrible'));

        if (file.segments.length) {
            file.dirname = file.segments.join('/') + '/';
        }

        if (context.lint.lint.length) {
            var fileLint = internals.findLint(context.lint.lint, file);
            if (fileLint) {
                Object.keys(file.source).forEach(function (line) {

                    file.source[line].lintErrors = internals.findLintErrors(fileLint, +line);
                });
            }
        }
    });

    if (!context.lint.disabled) {
        context.lint.errorClass = internals.lintClass(context.lint.totalErrors, this.settings['lint-errors-threshold']);
        context.lint.warningClass = internals.lintClass(context.lint.totalWarnings, this.settings['lint-warnings-threshold']);

        context.lint.lint.forEach(function (entry) {

            entry.filename = Path.relative(process.cwd(), Path.resolve(entry.filename));
            entry.errorClass = internals.lintClass(entry.totalErrors, this.settings['lint-errors-threshold']);
            entry.warningClass = internals.lintClass(entry.totalWarnings, this.settings['lint-warnings-threshold']);

            entry.errors.forEach(function (error) {

                error.message = Hoek.escapeHtml(error.message);
            });
        }, this);
    }

    this.report(this.view(context));
};

internals.findLint = function (lint, file) {

    for (var f = 0, fl = lint.length; f < fl; ++f) {
        if (lint[f].filename.slice(-file.filename.length) === file.filename && lint[f].errors.length) {
            return lint[f];
        }
    }
};

internals.findLintErrors = function (lint, line) {

    var reports = { errors: [], warnings: [] };
    for (var i = 0, il = lint.errors.length; i < il; ++i) {
        var report = lint.errors[i];
        if (report.line === line) {

            if (report.severity === 'ERROR') {
                reports.errors.push(report.message);
            }
            else {
                reports.warnings.push(report.message);
            }
        }
    }

    return reports.errors.length || reports.warnings.length ? reports : undefined;
};

internals.lintClass = function (count, threshold) {

    return count > threshold ? 'low' : (count > 0 ? 'medium' : 'high');
};
