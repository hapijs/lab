// Load modules

var Fs = require('fs');
var Path = require('path');
var Handlebars = require('handlebars');


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;

    var filename = Path.join(__dirname, 'junit', 'report.xml');
    var template = Fs.readFileSync(filename, 'utf8');
    this.view = Handlebars.compile(template);

};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    var context = {
        count: notebook.tests.length,
        failures: notebook.failures,
        errors: notebook.errors.length,
        skipped: 0,
        time: notebook.ms / 1000
    };

    var tests = context.tests = [];

    notebook.tests.forEach(function (nbtest) {

        var test = {
            title: nbtest.title,
            path: nbtest.path.join(' '),
            relativeTitle: nbtest.relativeTitle,
            time: nbtest.duration / 1000
        };

        if (nbtest.skipped || nbtest.todo) {

            test.skipped = true;
            ++context.skipped;
        }

        if (nbtest.err) {

            test.err = {
              name: nbtest.err.name,
              message: nbtest.err.message,
              details: nbtest.err.stack
            };
        }

        tests.push(test);
    });

    this.report(this.view(context));
};
