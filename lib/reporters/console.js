'use strict';

// Load modules

const Tty = require('tty');
const Diff = require('diff');
const StringifySafe = require('json-stringify-safe');
const StableStringify = require('json-stable-stringify');


// Declare internals

const internals = {
    width: 50
};

internals.stringify = (obj, serializer, indent) => {

    return StableStringify(obj,
      { space: indent, replacer: StringifySafe.getSerialize(serializer) });
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

    if (this.settings['silent-skips'] && (test.skipped || test.todo)) {
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

        const check = process.platform === 'win32' ? '\u221A' : '\u2714';
        const asterisk = process.platform === 'win32' ? '\u00D7' : '\u2716';

        // Verbose (Spec reporter)

        for (let i = 0; i < test.path.length; ++i) {
            if (test.path[i] !== this.last[i] || (i > 0 && test.path[i - 1] !== this.last[i - 1])) {
                this.report(internals.spacer(i * 2) + test.path[i] + '\n');
            }
        }

        this.last = test.path;

        const spacer = internals.spacer(test.path.length * 2);
        if (test.err) {
            this.report(spacer + this.colors.red(asterisk + ' ' + test.id + ') ' + test.relativeTitle) + '\n');
        }
        else {
            const symbol = test.skipped || test.todo ? this.colors.magenta('-') : this.colors.green(check);
            const assertion = test.assertions === undefined ? '' : ' and ' + test.assertions + ' assertions';
            this.report(spacer + symbol + ' ' + this.colors.gray(test.id + ') ' + test.relativeTitle +
                ' (' + test.duration + ' ms' + assertion + ')') + '\n');
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

    const red = this.colors.red;
    const green = this.colors.green;
    const gray = this.colors.gray;
    const yellow = this.colors.yellow;
    const whiteRedBg = this.colors.whiteRedBg;
    const blackGreenBg = this.colors.blackGreenBg;

    // Tests

    const notes = notebook.tests.filter(internals.filterNotes);

    const failures = notebook.tests.filter(internals.filterFailures);

    const skipped = notebook.tests.filter(internals.filterSkipped);

    let output = '';
    const totalTests = notebook.tests.length - skipped.length;

    const errors = notebook.errors || [];
    if (errors.length) {
        output += 'Test script errors:\n\n';
        errors.forEach((err) => {

            output += red(err.message) + '\n';
            if (err.stack) {
                const stack = err.stack.slice(err.stack.indexOf('\n') + 1)
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

        for (let i = 0; i < failures.length; ++i) {
            const test = failures[i];
            const message = test.err.message || '';

            output += '  ' + test.id + ') ' + test.title + ':\n\n';

            // Actual vs Expected

            if (test.err.actual !== undefined &&
                test.err.expected !== undefined) {

                const actual = internals.stringify(test.err.actual, internals.stringifyReplacer, 2);
                const expected = internals.stringify(test.err.expected, internals.stringifyReplacer, 2);

                output += '      ' + whiteRedBg('actual') + ' ' + blackGreenBg('expected') + '\n\n      ';

                const comparison = Diff.diffWords(actual, expected);
                for (let j = 0; j < comparison.length; ++j) {
                    const item = comparison[j];
                    const value = item.value;
                    const lines = value.split('\n');
                    for (let k = 0; k < lines.length; ++k) {
                        if (k) {
                            output += '\n      ';
                        }

                        if (item.added || item.removed) {
                            output += item.added ? blackGreenBg(lines[k]) : whiteRedBg(lines[k]);
                        }
                        else {
                            output += lines[k];
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

            if (test.err.data) {
                const isObject = typeof test.err.data === 'object' && !Array.isArray(test.err.data);
                let errorData = internals.stringify(test.err.data, null, isObject ? 4 : null);
                if (isObject) {
                    errorData = errorData.replace(/(\n\s*)"(.*)"\:/g, '$1$2:').split('\n').slice(1, -1).join('\n');
                }

                output += gray('\n      Additional error data:\n' + errorData.replace(/^/gm, '      ')) + '\n';
            }

            output += '\n';
        }

        output += '\n' + red(failures.length + ' of ' + totalTests + ' tests failed');
    }
    else {
        output += green(totalTests + ' tests complete');
    }
    if (skipped.length) {
        output += gray(` (${skipped.length} skipped)`);
    }
    output += '\n';
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

    if (notebook.shuffle) {
        output += 'Randomized with seed: ' + notebook.seed + '. Use --shuffle --seed ' + notebook.seed + ' to run tests in same order again.\n';
    }

    // Coverage

    const coverage = notebook.coverage;
    if (coverage) {
        const status = 'Coverage: ' + coverage.percent.toFixed(2) + '%';

        output += coverage.percent === 100 ? green(status) : red(status + ' (' + (coverage.sloc - coverage.hits) + '/' + coverage.sloc + ')');
        if (coverage.percent < 100) {
            coverage.files.forEach((file) => {

                let missingLines;
                if (file.sourcemaps) {
                    const missingLinesByFile = {};
                    Object.keys(file.source).forEach((lineNumber) => {

                        const line = file.source[lineNumber];
                        if (line.miss) {
                            missingLines = missingLinesByFile[line.originalFilename] = missingLinesByFile[line.originalFilename] || [];
                            missingLines.push(line.originalLine);
                        }
                    });

                    const files = Object.keys(missingLinesByFile);
                    if (files.length) {
                        output += red('\n' + file.filename + ' missing coverage from file(s):');
                        files.forEach((filename) => {

                            output += red('\n\t' + filename + ' on line(s): ' + missingLinesByFile[filename].join(', '));
                        });
                    }
                }
                else {
                    missingLines = [];
                    Object.keys(file.source).forEach((lineNumber) => {

                        const line = file.source[lineNumber];
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

    const lint = notebook.lint;
    if (lint) {
        output += 'Linting results:';

        let hasErrors = false;
        lint.lint.forEach((entry) => {

            // Don't show anything if there aren't issues
            if (!entry.errors || !entry.errors.length) {
                return;
            }

            hasErrors = true;
            output += gray('\n\t' + entry.filename + ':');
            entry.errors.forEach((err) => {

                output += (err.severity === 'ERROR' ? red : yellow)('\n\t\tLine ' + err.line + ': ' + err.message);
            });
        });

        if (!hasErrors) {
            output += green(' No issues\n');
        }
    }

    if (notes.length) {
        output += '\n\nTest notes:\n';
        notes.forEach((test) => {

            output += gray(test.relativeTitle) + '\n';
            test.notes.forEach((note) => {

                output += yellow(`\t* ${note}`);
            });
        });
    }

    output += '\n';
    this.report(output);
};


internals.color = function (name, code, enabled) {

    if (enabled && Array.isArray(code)) {
        const color = '\u001b[' + code[0] + ';' + code[1] + 'm';
        return function (text) {

            return color + text + '\u001b[0m';
        };
    }
    else if (enabled) {
        const color = '\u001b[' + code + 'm';
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

    const codes = {
        'black': 0,
        'gray': 92,
        'red': 31,
        'green': 32,
        'yellow': 33,
        'magenta': 35,
        'redBg': 41,
        'greenBg': 42,
        'whiteRedBg': [37, 41],
        'blackGreenBg': [30, 42]
    };

    const colors = {};
    const names = Object.keys(codes);
    for (let i = 0; i < names.length; ++i) {
        const name = names[i];
        colors[name] = internals.color(name, codes[name], enabled);
    }

    return colors;
};


internals.filterNotes = function (test) {

    return test.notes && test.notes.length;
};


internals.filterFailures = function (test) {

    return !!test.err;
};


internals.filterNodeModules = function (line) {

    return !(/\/node_modules\//.test(line));
};


internals.filterSkipped = function (test) {

    return test.skipped || test.todo;
};
