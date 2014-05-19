// Load modules

var Diff = require('diff');


// Declare internals

var internals = {
    width: 50
};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;
    this.count = 0;
    this.last = [];
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

    if (this.settings.level === 0) {
        return;
    }

    if (this.settings.level === 1) {

        // ..x..

        if (!this.count) {
            this.console('\n  ');
        }

        this.count++;

        if ((this.count - 1) % internals.width === 0) {
            this.console('\n  ');
        }

        this.console(test.err ? this.colors.red('x') : (test.skipped || test.todo ? this.colors.magenta('-') : '.'));
    }
    else {

        // Verbose (Spec reporter)

        for (var i = 0, il = test.path.length; i < il; ++i) {
            if (test.path[i] !== this.last[i]) {
                this.print(internals.spacer(i * 2) + test.path[i] + '\n');
            }
        }

        this.last = test.path;

        var spacer = internals.spacer(test.path.length * 2);
        if (test.err) {
            this.print(spacer + this.colors.red('\u2716' + test.id + ') ' + test.relativeTitle) + '\n');
        }
        else {
            var symbol = test.skipped || test.todo ? this.colors.magenta('-') : this.colors.green('\u2714');
            this.print(spacer + symbol + ' ' + this.colors.gray(test.id + ') ' + test.relativeTitle +
                ' (' + test.duration + ' ms)') + '\n');
        }
    }
};


internals.spacer = function (length) {

    return new Array(length + 1).join(' ');
};


internals.Reporter.prototype.end = function (notebook) {

    if (this.settings.level) {
        this[this.settings.level === 1 ? 'console' : 'print']('\n\n');
    }

    // Colors

    var red = this.colors.red;
    var redBg = this.colors.redBg;
    var green = this.colors.green;
    var greenBg = this.colors.greenBg;
    var magenta = this.colors.magenta;
    var gray = this.colors.gray;
    var yellow = this.colors.yellow;

    // Tests

    var failures = notebook.tests.filter(function (test) {

        return !!test.err;
    });

    var output = ' ';
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

                if (message) {
                    output += '\n\n      ' + yellow(message);
                }

                output += '\n\n';
            }
            else {
                output += '  ' + test.id + ') ' + test.title + ':\n\n' +
                          '      ' + red(stack.slice(0, index)) + '\n';

                var msg = test.err.actual && test.err.actual.message;
                if (msg) {
                    output += '      ' + magenta('Message: ' + msg) + '\n';
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
        var status = ' Coverage: ' + coverage.percent.toFixed(2) + '%';
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
                    output += ' ' + red(file.filename + ' missing coverage on line(s): ' + missingLines.join(', ')) + '\n';
                }
            });

            if (coverage.percent < this.settings.threshold || isNaN(coverage.percent)) {
                output += ' ' + red('Code coverage below threshold: ' + coverage.percent.toFixed(2) + ' < ' + this.settings.threshold) + '\n';
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
