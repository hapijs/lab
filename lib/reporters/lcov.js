'use strict';

// Load modules

const Path = require('path');


// Declare internals

const internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;
};


internals.Reporter.prototype.reportln = function (line) {

    this.report(line + '\n');
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    notebook.coverage = notebook.coverage || { files: [] };
    notebook.coverage.files.forEach((file) => {

        this.reportln('TN:');                                                       // Test Name
        this.reportln('SF:' + Path.join(process.cwd(), '/', file.filename));        // Script File

        const lineNums = Object.keys(file.source);
        lineNums.forEach((lineNum) => {

            const line = file.source[lineNum];
            const hits = line.miss ? 0 : (line.hits || 1);
            this.reportln('DA:' + lineNum + ',' + hits);                            // Line and total execution count
        });

        this.reportln('LF:' + file.sloc);
        this.reportln('LH:' + file.hits);
        this.reportln('end_of_record');
    });
};
