'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const Handlebars = require('handlebars');
const Hoek = require('hoek');
const SourceMapSupport = require('source-map-support');
const SourceMapConsumer = require('source-map').SourceMapConsumer;


// Declare internals

const internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;

    const filename = Path.join(__dirname, 'html', 'report.html');
    const template = Fs.readFileSync(filename, 'utf8');

    Handlebars.registerHelper('hits', (hits) => {

        return (hits === undefined ? '' : hits);
    });

    Handlebars.registerHelper('join', (array, separator) => {

        return array.join(separator);
    });

    Handlebars.registerHelper('replace', (str, from, to, flags) => {

        return str.replace(new RegExp(from, flags), to);
    });

    Handlebars.registerHelper('lintJoin', (array) => {

        let str = '';

        for (let i = 0; i < array.length; ++i) {
            if (str) {
                str += '&#xa;'; // This is a line break
            }

            str += Hoek.escapeHtml(array[i]); // Handlebars' escape is just not enough
        }

        return new Handlebars.SafeString(str);
    });

    Handlebars.registerHelper('errorMessage', (err) => {

        return new Handlebars.SafeString(Hoek.escapeHtml('' + err.message));
    });

    Handlebars.registerHelper('errorStack', (err) => {

        const stack = err.stack.slice(err.stack.indexOf('\n') + 1).replace(/^\s*/gm, '  ');
        return new Handlebars.SafeString(Hoek.escapeHtml(stack));
    });

    const partialsPath = Path.join(__dirname, 'html', 'partials');
    const partials = Fs.readdirSync(partialsPath);
    partials.forEach((partial) => {

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

    const percent = notebook.coverage.percent;
    const context = {
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

    context.failures = context.tests.filter((test) => {

        return !!test.err;
    });

    context.skipped = context.tests.filter((test) => {

        return test.skipped;
    });

    // Populate path to be used for filtering
    context.paths = [];
    context.tests.forEach((test) => {

        const paths = [];
        test.path.forEach((path) => {

            path = path.replace(/\ /gi, '_');
            paths.push(path);
            if (context.paths.indexOf(path) === -1) {
                context.paths.push(path);
            }
        });

        test.path = paths;
    });

    // if we have sourcemaps, we might have different source files.
    // let's replace existing files with original files
    context.coverage.cov.files = Hoek.flatten(context.coverage.cov.files.map((file) => {

        if (!file.sourcemaps) {
            // return untouched file
            return file;
        }
        const files = {};
        // get sourcemap object which might include the original source file(s)
        const cached = SourceMapSupport.retrieveSourceMap(file.filename);
        if (cached) {
            const smc = new SourceMapConsumer(cached.map);
            // for each generated line, get the origin source file
            for (const i in file.source) {
                const currentSource = file.source[i];
                const parent = Path.dirname(file.filename);
                const filename = Path.relative(parent, currentSource.originalFilename);
                const content = smc.sourceContentFor(filename, true);
                if (content) {
                    if (!(filename in files)) {
                        // initialize file object with each original lines
                        files[filename] = {
                            filename: currentSource.originalFilename,
                            percent: 0, // TODO
                            hits: 0,
                            misses: 0,
                            sloc: 0, // TODO
                            source: {}
                        };
                        content.split('\n').forEach((line, number) => {

                            files[filename].source[number + 1] = {
                                source: line,
                                // consider line covered by default
                                hits: undefined,
                                miss: false
                            };
                        });
                    }
                    const resultFile = files[filename];
                    // update hits and misses for that particular file
                    resultFile.source[currentSource.originalLine].miss = currentSource.miss;
                    resultFile.misses += currentSource.miss ? 1 : 0;
                    if (currentSource.hits) {
                        resultFile.source[currentSource.originalLine].hits =
                            (resultFile.source[currentSource.originalLine].hits || 0) + currentSource.hits;
                        resultFile.hits += currentSource.hits;
                    }
                    if (currentSource.chunks) {
                        // need to display the actual source for chunk also
                        resultFile.source[currentSource.originalLine].chunks =
                            (resultFile.source[currentSource.originalLine].chunks || [])
                            .concat(currentSource.chunks.map((chunk, j) => {

                                const end = currentSource.chunks[j + 1] && currentSource.chunks[j + 1].originalColumn;
                                return {
                                    source: resultFile.source[currentSource.originalLine].source.slice(chunk.originalColumn, end),
                                    miss: chunk.miss,
                                    originalLine: chunk.originalLine,
                                    originalColumn: chunk.originalColumn
                                };
                            }));
                    }
                }
            }
        }
        // returns an array of original source
        return Object.keys(files).map((key) => files[key]);
    }));

    context.coverage.cov.files.forEach((file) => {

        file.segments = file.filename.split('/');
        file.basename = file.segments.pop();
        file.percent = (file.percent % 1 === 0) ? file.percent.toFixed() : file.percent.toFixed(2);
        file.percentClass = file.percent > 75 ? 'high' : (file.percent > 50 ? 'medium' : (file.percent > 25 ? 'low' : 'terrible'));

        if (file.segments.length) {
            file.dirname = file.segments.join('/') + '/';
        }

        if (context.lint.lint.length) {
            const fileLint = internals.findLint(context.lint.lint, file);
            if (fileLint) {
                Object.keys(file.source).forEach((line) => {

                    file.source[line].lintErrors = internals.findLintErrors(fileLint, +line);
                });
            }
        }
    });

    if (!context.lint.disabled) {
        context.lint.errorClass = internals.lintClass(context.lint.totalErrors, this.settings['lint-errors-threshold']);
        context.lint.warningClass = internals.lintClass(context.lint.totalWarnings, this.settings['lint-warnings-threshold']);

        context.lint.lint.forEach((entry) => {

            entry.filename = Path.relative(process.cwd(), Path.resolve(entry.filename));
            entry.errorClass = internals.lintClass(entry.totalErrors, this.settings['lint-errors-threshold']);
            entry.warningClass = internals.lintClass(entry.totalWarnings, this.settings['lint-warnings-threshold']);

            entry.errors.forEach((err) => {

                err.message = Hoek.escapeHtml(err.message);
            });
        }, this);
    }

    this.report(this.view(context));
};

internals.findLint = function (lint, file) {

    for (let i = 0; i < lint.length; ++i) {
        if (lint[i].filename.slice(-file.filename.length) === file.filename && lint[i].errors.length) {
            return lint[i];
        }
    }
};

internals.findLintErrors = function (lint, line) {

    const reports = { errors: [], warnings: [] };
    for (let i = 0; i < lint.errors.length; ++i) {
        const report = lint.errors[i];
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
