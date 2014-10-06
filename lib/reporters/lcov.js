// Load modules

var Path = require('path');


// Declare internals

var internals = {};


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

    var self = this;

    notebook.coverage = notebook.coverage || { files: [] };
    notebook.coverage.files.forEach(function (file) {

        self.reportln('TN:');                                                       // Test Name
        self.reportln('SF:' + Path.join(process.cwd(), '/', file.filename));        // Script File

        var lineNums = Object.keys(file.source);
        lineNums.forEach(function (lineNum) {

            var line = file.source[lineNum];
            var hits = line.miss ? 0 : (line.hits || 1);
            self.reportln('DA:' + lineNum + ',' + hits);                            // Line and total execution count
        });

        self.reportln('LF:' + file.sloc);
        self.reportln('LH:' + file.hits);
        self.reportln('end_of_record');
    });
};
