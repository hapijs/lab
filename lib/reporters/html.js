'use strict';

const Fs = require('fs');
const Path = require('path');

const Handlebars = require('handlebars');
const Hoek = require('@hapi/hoek');
const SourceMap = require('source-map');
const SourceMapSupport = require('source-map-support');


const internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;

    const filename = Path.join(__dirname, 'html', 'report.html');
    const template = Fs.readFileSync(filename, 'utf8');

    // Display all valid numbers except zeros
    Handlebars.registerHelper('number', (number) => {

        return +number || '';
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


internals.Reporter.prototype.end = async function (notebook) {

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
    context.coverage.cov.files = context.coverage.cov.files.map(async (file) => {

        if (!file.sourcemaps) {
            // return untouched file
            return file;
        }

        const descriptors = {};
        const generatedContent = Object.keys(file.source).map((k) => file.source[k].source).join('\n');

        // Rather than relying on generated content, get the nodes tree from sourcemap consumer
        const sourcemap = SourceMapSupport.retrieveSourceMap(file.filename).map;
        const smc = await new SourceMap.SourceMapConsumer(sourcemap);

        // For each original files that might have been transformed into this generate content, store a new descriptor
        SourceMap.SourceNode.fromStringWithSourceMap(generatedContent, smc).walkSourceContents((sourceFile, content) => {

            descriptors[sourceFile] = {
                generated: file.filename,
                filename: sourceFile,
                source: {}
            };

            content.split('\n').forEach((line, number) => {

                descriptors[sourceFile].source[number + 1] = {
                    source: line,
                    // consider line covered by default
                    hits: undefined,
                    miss: false
                };
            });
        });

        // Now maps coverage information to original files
        Object.keys(file.source).forEach((generatedLine) => {

            const source = file.source[generatedLine];

            // Affect hits and misses to entire lines
            if (source.originalFilename in descriptors) {
                const target = descriptors[source.originalFilename].source[source.originalLine];
                target.miss = source.miss;
                target.hits = source.hits;
            }

            if (!source.chunks) {
                return;
            }

            // The same generated line might have chunks from different original files/lines:
            // [{originalLine: 8, originalColumn: 0}, {originalLine: 13, originalColumn: 12}, {originalLine: 13, originalColumn: 4}]
            // We must group them by original files, then by lines
            const groupsByFiles = {};
            source.chunks.forEach((chunk) => {

                if (!(chunk.originalFilename in groupsByFiles)) {
                    groupsByFiles[chunk.originalFilename] = [];
                }

                const groups = groupsByFiles[chunk.originalFilename];

                if (!(chunk.originalLine in groups)) {
                    groups[chunk.originalLine] = [];
                }

                groups[chunk.originalLine].push(chunk);
            });

            // Now that all chunks are properly grouped, we order them by columns and copy them to original descriptors
            for (const originalFilename in groupsByFiles) {
                const groups = groupsByFiles[originalFilename];
                const descriptor = descriptors[originalFilename];

                if (!descriptor) {
                    continue;
                }

                for (const originalLine in groups) {
                    const chunks = groups[originalLine].sort((a, b) => a.originalColumn - b.originalColumn);

                    const target = descriptor.source[originalLine];
                    target.chunks = chunks.map((chunk, n) => {

                        // First chunk of each line always starts at 0
                        const start = n === 0 ? 0  : chunk.originalColumn;
                        // Column of chunk N is the end column of chunk N-1
                        const end = chunks[n + 1] && chunks[n + 1].originalColumn;
                        return Object.assign({}, chunk, {
                            // Override the source line to only include the original slice for that chunk
                            source: target.source.slice(start, end)
                        });
                    });
                    target.miss = true;
                }
            }

        });

        // Return original file descriptors (that will be flatten next) and generated file as well
        return Object.keys(descriptors).map((key) => descriptors[key]).concat([file]);
    });

    for (let i = 0; i < context.coverage.cov.files.length; ++i) {
        // Need to await for SourceMap.SourceMapConsumer
        const file = await context.coverage.cov.files[i];
        context.coverage.cov.files[i] = file;
    }

    context.coverage.cov.files = Hoek.flatten(context.coverage.cov.files);

    context.coverage.cov.files.forEach((file) => {

        file.segments = file.filename.split('/');
        file.basename = file.segments.pop();
        if (file.percent >= 0) {
            file.percent = (file.percent % 1 === 0) ? file.percent.toFixed() : file.percent.toFixed(2);
            file.percentClass = file.percent > 75 ? 'high' : (file.percent > 50 ? 'medium' : (file.percent > 25 ? 'low' : 'terrible'));
        }
        else {
            file.percentClass = 'hide';
        }

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
        if (lint[i].filename.replace(/\\/g, '/').slice(-file.filename.length) === file.filename && lint[i].errors.length) {
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
