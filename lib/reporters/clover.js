'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const Handlebars = require('handlebars');


// Declare internals

const internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;

    const filename = Path.join(__dirname, 'clover', 'report.xml');
    const template = Fs.readFileSync(filename, 'utf8');

    if (this.settings.coveragePath) {
        this.settings.packageRoot = Path.basename(this.settings.coveragePath);
    }
    else {
        this.settings.packageRoot = 'root';
    }

    Handlebars.registerHelper('hits', (hits) => {

        return (hits === undefined ? '0' : hits);
    });

    this.view = Handlebars.compile(template);
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    const settings = this.settings;

    notebook.coverage = notebook.coverage || { files: [] };
    const context = {
        cov: notebook.coverage,
        now: Date.now(),
        fileCount: notebook.coverage.files.length,
        packageCount: 0,
        packages: {}
    };

    notebook.coverage.files.forEach((file) => {

        file.segments = file.filename.split('/');
        file.basename = file.segments.pop();
        file.coveredlines = 0;

        if (file.segments.length) {
            file.dirname = file.segments.join('/') + '/';
            file.package = settings.packageRoot + '.' + file.segments.join('.');
        }
        else {
            file.package = settings.packageRoot;
        }


        if (!context.packages[file.package]) {
            context.packages[file.package] = {
                files: [],
                hits: 0,
                misses: 0,
                sloc: 0,
                percent: 0
            };
            context.packageCount++;
        }

        const curPackage = context.packages[file.package];

        curPackage.files.push(file);
        curPackage.hits += file.hits;
        curPackage.misses += file.misses;
        curPackage.sloc += file.sloc;
        curPackage.percent = curPackage.hits / curPackage.sloc;

    });

    this.report(this.view(context));
};
