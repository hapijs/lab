// Load modules

var Diff = require('diff');


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

};


internals.Reporter.prototype.end = function (notebook) {

    // Colors

    var red = this.colors.red;
    var redBg = this.colors.redBg;
    var green = this.colors.green;
    var greenBg = this.colors.greenBg;
    var magenta = this.colors.magenta;
    var gray = this.colors.gray;

    // Tests

    var failures = notebook.tests.filter(function (test) {

        return !!test.err;
    });

    var output = '\n\n ';
    if (!failures.length) {
        output += green(notebook.tests.length + ' tests complete') + ' (' + notebook.ms + ' ms)\n\n';
    }
    else {
        output += red(failures.length + ' of ' + notebook.tests.length + ' tests failed:') + '\n\n';

        for (var i = 0, il = failures.length; i < il; ++i) {
            var test = failures[i];
            var message = test.err.message || '';
            var stack = test.err.stack || message;
            var index = stack.indexOf(message) + message.length;

            // Actual vs Expected

            if (test.err.showDiff) {
                test.err.actual = JSON.stringify(test.err.actual, null, 2);
                test.err.expected = JSON.stringify(test.err.expected, null, 2);
            }

            if (typeof test.err.actual === 'string' &&
                typeof test.err.expected === 'string') {

                output += '  ' + test.id + ') ' + test.title + ':\n\n' +
                          '      ' + redBg('actual') + ' ' + greenBg('expected') + '\n\n      ';

                var comparison = Diff.diffWords(test.err.actual, test.err.expected);
                for (var c = 0, cl = comparison.length; c < cl; ++c) {
                    var item = comparison[c];
                    var value = item.value;

                    if (!test.err.showDiff) {
                        value = value.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n\n');
                    }

                    var lines = value.split('\n');
                    for (var l = 0, ll = lines.length; l < ll; ++l) {
                        if (l) {
                            output += '\n      ';
                        }

                        if (item.added || item.removed) {
                            output += item.added ? greenBg(lines[l]) : redBg(lines[l]);
                        }
                        else {
                            output += lines[l];
                        }
                    }
                }

                output += '\n\n';
            }
            else {
                output += '  ' + test.id + ') ' + test.title + ':\n\n' +
                          '      ' + red(stack.slice(0, index)) + '\n';

                var boomError = test.err.actual && test.err.actual.isBoom && test.err.actual.message;
                if (boomError) {
                    output += '     ' + magenta('Message: ' + boomError) + '\n';
                }

                output += '\n';
            }

            if (!test.timeout) {
                var isChai = stack.indexOf('chai') !== -1;
                stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
                if (isChai) {
                    stack = stack.split('\n');
                    if (stack.length > 1) {
                        stack = internals.getStackLine(stack);
                    }
                }

                output += gray(stack) + '\n';
            }

            output += '\n';
        }

        output += '\n';
    }

    // Leaks

    if (notebook.leaks) {
        if (notebook.leaks.length) {
            output += red(' The following leaks were detected:') + '\n\n';
            for (var i = 0, il = notebook.leaks.length; i < il; ++i) {
                output += red(notebook.leaks[i]) + '\n';
            }
        }
        else {
            output += green(' No global variable leaks detected.') + '\n';
        }

        output += '\n';
    }

    // Coverage

    var coverage = notebook.coverage;
    if (coverage) {
        var status = 'Coverage: ' + coverage.percent.toFixed(2) + '%';
        output += coverage.percent === 100 ? green(status) : red(status) + '\n';
        if (coverage.percent < 100) {
            output += '\n';
            coverage.files.forEach(function (file) {

                var missingLines = [];
                Object.keys(file.source).forEach(function (lineNumber) {

                    var line = file.source[lineNumber];
                    if (line.miss) {
                        missingLines.push(lineNumber);
                    }
                });

                if (missingLines.length) {
                    output += red(file.filename + ' missing coverage on line(s): ' + missingLines.join(', ')) + '\n';
                }
            });

            if (coverage.percent < this.settings.threshold || isNaN(coverage.percent)) {
                output += red('Code coverage below threshold: ' + coverage.percent.toFixed(2) + ' < ' + this.settings.threshold) + '\n';
            }
        }

        output += '\n';
    }

    return output;
};


internals.getStackLine = function (stack) {

    for (var i = 0, il = stack.length; i < il; ++i) {
        var stackLine = stack[i];
        if (/chai/.test(stackLine) === false) {
            return stackLine;
        }
    }

    return stack;
};
