// Load modules

var Tty = require('tty');
var Diff = require('diff');
var StringifySafe = require('json-stringify-safe');


// Declare internals

var internals = {
    width: 50
};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;
    this.count = 0;
    this.last = [];

    this.colors = internals.colors(options.colors);
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

    if (this.settings.progress === 0) {
        return;
    }

    if (this.settings.progress === 1) {

        // ..x....x.-..

        if (!this.count) {
            this.report('\n  ');
        }

        this.count++;

        if ((this.count - 1) % internals.width === 0) {
            this.report('\n  ');
        }

        this.report(test.err ? this.colors.red('x') : (test.skipped || test.todo ? this.colors.magenta('-') : '.'));
    }
    else {

        var check = process.platform === 'win32' ? '\u221A' : '\u2714';
        var asterisk = process.platform === 'win32' ? '\u00D7' : '\u2716';

        // Verbose (Spec reporter)

        for (var i = 0, il = test.path.length; i < il; ++i) {
            if (test.path[i] !== this.last[i]) {
                this.report(internals.spacer(i * 2) + test.path[i] + '\n');
            }
        }

        this.last = test.path;

        var spacer = internals.spacer(test.path.length * 2);
        if (test.err) {
            this.report(spacer + this.colors.red(asterisk + test.id + ') ' + test.relativeTitle) + '\n');
        }
        else {
            var symbol = test.skipped || test.todo ? this.colors.magenta('-') : this.colors.green(check);
            this.report(spacer + symbol + ' ' + this.colors.gray(test.id + ') ' + test.relativeTitle +
                ' (' + test.duration + ' ms)') + '\n');
        }
    }
};


internals.spacer = function (length) {

    return new Array(length + 1).join(' ');
};


internals.stringifyReplacer = function (key, value) {

    // Show usually invisible values from JSON.stringify in a different way,
    // follow the bracket format of json-stringify-safe.

    if (value === undefined) {
        return '[undefined]';
    }

    if (typeof value === 'function' || value === Infinity || value === -Infinity) {
        return '[' + value.toString() + ']';
    }

    /* $lab:coverage:off$ */ // There is no way to cover that in node 0.10
    if (typeof value === 'symbol') {
        return '[' + value.toString() + ']';
    }
    /* $lab:coverage:on$ */

    return value;
};


internals.Reporter.prototype.end = function (notebook) {

    if (this.settings.progress) {
        this.report('\n\n');
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

    var failures = notebook.tests.filter(internals.filterFailures);

    var skipped = notebook.tests.filter(internals.filterSkipped);

    var output = '';
    var totalTests = notebook.tests.length - skipped.length;

    var errors = notebook.errors || [];
    if (errors.length) {
        output += 'Test script errors:\n\n';
        errors.forEach(function (error) {

            output += red(error.message || error) + '\n';
            if (error.stack) {
                var stack = error.stack.slice(error.stack.indexOf('\n') + 1)
                                       .replace(/^/gm, '  ')
                                       .split('\n')
                                       .filter(internals.filterNodeModules)               // Remove node_modules files
                                       .slice(0, 5)                                       // Show only first 5 stack lines
                                       .join('\n');

                output += gray(stack) + '\n';
            }

            output += '\n';
        });
        output += red('There were ' + errors.length + ' test script error(s).') + '\n\n';
    }

    if (failures.length) {
        output += 'Failed tests:\n\n';

        for (var i = 0, il = failures.length; i < il; ++i) {
            var test = failures[i];
            var message = test.err.message || '';

            output += '  ' + test.id + ') ' + test.title + ':\n\n';

            // Actual vs Expected

            if (test.err.actual !== undefined &&
                test.err.expected !== undefined) {

                var actual = StringifySafe(test.err.actual, internals.stringifyReplacer, 2);
                var expected = StringifySafe(test.err.expected, internals.stringifyReplacer, 2);

                output += '      ' + redBg('actual') + ' ' + greenBg('expected') + '\n\n      ';

                var comparison = Diff.diffWords(actual, expected);
                for (var c = 0, cl = comparison.length; c < cl; ++c) {
                    var item = comparison[c];
                    var value = item.value;
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

                output += '\n\n      ' + yellow(message);
                output += '\n\n';
            }
            else {
                output += '      ' + red(message) + '\n\n';
            }

            if (test.err.at) {
                output += gray('      at ' + test.err.at.filename + ':' + test.err.at.line + ':' + test.err.at.column) + '\n';
            }
            else if (!test.timeout &&
                test.err.stack) {

                output += gray(test.err.stack.slice(test.err.stack.indexOf('\n') + 1).replace(/^/gm, '  ')) + '\n';
            }

            output += '\n';
        }

        output += '\n' + red(failures.length + ' of ' + totalTests + ' tests failed') + '\n';
    }
    else {
        output += green(totalTests + ' tests complete') + '\n';
    }

    output += 'Test duration: ' + notebook.ms + ' ms\n';

    // Assertions

    if (notebook.assertions !== undefined) {
        output += 'Assertions count: ' + notebook.assertions + ' (verbosity: ' + (notebook.assertions / totalTests).toFixed(2) + ')\n';
    }

    // Leaks

    if (notebook.leaks) {
        if (notebook.leaks.length) {
            output += red('The following leaks were detected:' + notebook.leaks.join(', ')) + '\n';
        }
        else {
            output += green('No global variable leaks detected') + '\n';
        }
    }

    // Coverage

    var coverage = notebook.coverage;
    if (coverage) {
        var status = 'Coverage: ' + coverage.percent.toFixed(2) + '%';

        output += coverage.percent === 100 ? green(status) : red(status + ' (' + (coverage.sloc - coverage.hits) + '/' + coverage.sloc + ')');
        if (coverage.percent < 100) {
            coverage.files.forEach(function (file) {

                var missingLines;
                if (file.sourcemaps) {
                    var missingLinesByFile = {};
                    Object.keys(file.source).forEach(function (lineNumber) {

                        var line = file.source[lineNumber];
                        if (line.miss) {
                            missingLines = missingLinesByFile[line.originalFilename] = missingLinesByFile[line.originalFilename] || [];
                            missingLines.push(line.originalLine);
                        }
                    });

                    var files = Object.keys(missingLinesByFile);
                    if (files.length) {
                        output += red('\n' + file.filename + ' missing coverage from file(s):');
                        files.forEach(function (filename) {

                            output += red('\n\t' + filename + ' on line(s): ' + missingLinesByFile[filename].join(', '));
                        });
                    }
                }
                else {
                    missingLines = [];
                    Object.keys(file.source).forEach(function (lineNumber) {

                        var line = file.source[lineNumber];
                        if (line.miss) {
                            missingLines.push(lineNumber);
                        }
                    });

                    if (missingLines.length) {
                        output += red('\n' + file.filename + ' missing coverage on line(s): ' + missingLines.join(', '));
                    }
                }
            });

            if (coverage.percent < this.settings.threshold || isNaN(coverage.percent)) {
                output += red('\nCode coverage below threshold: ' + coverage.percent.toFixed(2) + ' < ' + this.settings.threshold);
            }
        }

        output += '\n';
    }

    var lint = notebook.lint;
    if (lint) {
        output += 'Linting results:';

        var hasErrors = false;
        lint.lint.forEach(function (entry) {

            // Don't show anything if there aren't issues
            if (!entry.errors || !entry.errors.length) {
                return;
            }

            hasErrors = true;
            output += gray('\n\t' + entry.filename + ':');
            entry.errors.forEach(function (error) {

                output += (error.severity === 'ERROR' ? red : yellow)('\n\t\tLine ' + error.line + ': ' + error.message);
            });
        });

        if (!hasErrors) {
            output += green(' No issues\n');
        }
    }

    output += '\n';
    this.report(output);
};


internals.color = function (name, code, enabled) {

    if (enabled) {
        var color = '\u001b[' + code + 'm';
        return function (text) {

            return color + text + '\u001b[0m';
        };
    }

    return function (text) {

        return text;
    };
};


internals.colors = function (enabled) {

    if (enabled === null) {
        enabled = Tty.isatty(1) && Tty.isatty(2);
    }

    var codes = {
        'black': 0,
        'gray': 90,
        'red': 31,
        'green': 32,
        'yellow': 33,
        'magenta': 35,
        'redBg': 41,
        'greenBg': 42
    };

    var colors = {};
    var names = Object.keys(codes);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        colors[name] = internals.color(name, codes[name], enabled);
    }

    return colors;
};


internals.filterFailures = function (test) {

    return !!test.err;
};


internals.filterNodeModules = function (line) {

    return !(/\/node_modules\//.test(line));
};


internals.filterSkipped = function (test) {

    return test.skipped;
};
