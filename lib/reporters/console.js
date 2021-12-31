'use strict';

const Util = require('util');

const Diff = require('diff');
const SupportsColor = require('supports-color');


const internals = {
    width: 50,
    maxDiffLength: 20 * 1024            // 20Kb
};


internals.stringify = function (obj) {

    // $lab:coverage:off$

    if (process.version[1] !== '1') {
        obj = internals.sortObject(obj);
    }
    // $lab:coverage:on$

    return Util.inspect(obj, { compact: false, depth: Infinity, maxArrayLength: Infinity, breakLength: Infinity, sorted: true });
};


// $lab:coverage:off$

internals.sortObject = (obj, _seen) => {

    if (!obj ||
        typeof obj !== 'object') {

        return obj;
    }

    const seen = _seen || new Map();

    if (seen.has(obj)) {
        return seen.get(obj);
    }

    const output = Array.isArray(obj) ? [] : {};
    seen.set(obj, output);

    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        const value = obj[key];
        output[key] = internals.sortObject(value, seen);
    }

    return output;
};
// $lab:coverage:on$


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

        // ..x....x.-...4..!.

        if (!this.count) {
            this.report('\n  ');
        }

        this.count++;

        if ((this.count - 1) % internals.width === 0) {
            this.report('\n  ');
        }

        if (test.err) {
            this.report(this.colors.red('x'));
        }
        else if (test.skipped ||
            test.todo) {

            this.report(this.colors.magenta('-'));
        }
        else if (test.tries > 1) {
            const tries = test.tries > 9 ? '!' : test.tries.toString();
            this.report(this.colors.yellow(tries));
        }
        else {
            this.report('.');
        }
    }
    else {
        // $lab:coverage:off$
        const check = process.platform === 'win32' ? '\u221A' : '\u2714';
        const asterisk = process.platform === 'win32' ? '\u00D7' : '\u2716';
        // $lab:coverage:on$

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
    const magenta = this.colors.magenta;

    // Tests

    const notes = notebook.tests.filter(internals.filterNotes);

    const failures = notebook.tests.filter(internals.filterFailures);

    const skipped = notebook.tests.filter(internals.filterSkipped);

    let output = '';
    const totalTests = notebook.tests.length - skipped.length;

    const errors = notebook.errors || [];
    if (errors.length) {
        output += 'Test script errors:\n\n';
        errors.forEach((err = {}) => {

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

                let actual = internals.stringify(test.err.actual);
                let expected = internals.stringify(test.err.expected);

                if (actual.length > internals.maxDiffLength) {
                    actual = actual.substr(0, internals.maxDiffLength) + '[truncated]';
                }

                if (expected.length > internals.maxDiffLength) {
                    expected = expected.substr(0, internals.maxDiffLength) + '[truncated]';
                }

                output += '      ' + whiteRedBg('actual') + ' ' + blackGreenBg('expected') + '\n\n      ';

                const comparison = Diff.diffWords(actual, expected);
                for (let j = 0; j < comparison.length; ++j) {
                    const item = comparison[j];
                    const value = item.value;
                    output += value.split('\n').map((line) => {

                        if (item.added) {
                            return blackGreenBg(line);
                        }

                        if (item.removed) {
                            return whiteRedBg(line);
                        }

                        return line;
                    }).join('\n      ');
                }

                output += '\n\n      ' + yellow(message);
                output += '\n\n';
            }
            else {
                output += '      ' + red(message) + '\n\n';
            }

            if (test.err instanceof Error && test.err.at) {
                // Ensure test.err is indeed an Error since internal failures may surface as a
                // string, and strings have an at() method as of node v16.8.
                output += gray('      at ' + test.err.at.filename + ':' + test.err.at.line + ':' + test.err.at.column) + '\n';
            }
            else if (!test.timeout &&
                test.err.stack) {
                let stack = test.err.stack;
                if (stack.indexOf(message) !== -1) {
                    stack = stack.slice(stack.indexOf(message) + message.length + 1);
                }

                output += gray(stack.replace(/^/gm, '  ')) + '\n';
            }

            if (test.err.data) {
                let errorData = internals.stringify(test.err.data);

                if (Array.isArray(test.err.data)) {
                    errorData = errorData.replace(/\n\s*/g, ' ');
                }
                else if (typeof test.err.data === 'object') {
                    errorData = errorData.replace(/^\{[\s\n]/, '').replace(/[\s\n]\}/, '');
                }

                output += gray('\n      Additional error data:\n' + errorData.replace(/^/gm, '        ')) + '\n';
            }

            output += '\n';
        }

        output += '\n' + red(failures.length + ' of ' + totalTests + ' tests failed');
    }
    else {
        output += green(totalTests + ' tests complete');
    }

    if (skipped.length) {
        output += magenta(` (${skipped.length} skipped)`);
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
            output += 'Leaks: ' + green('No issues') + '\n';
        }
    }

    if (notebook.shuffle) {
        output += 'Randomized with seed: ' + notebook.seed + '. Use --shuffle --seed ' + notebook.seed + ' to run tests in same order again.\n';
    }

    // Coverage

    const coverage = notebook.coverage;
    if (coverage) {
        const status = coverage.percent.toFixed(2) + '%';
        output += 'Coverage: ';
        output += coverage.percent === 100 ? green(status) : red(status + ' (' + (coverage.sloc - coverage.hits) + '/' + coverage.sloc + ')');
        if (coverage.percent < 100) {
            for (const file of coverage.files) {
                let missingLines;

                // Source map

                if (file.sourcemaps) {
                    const missingLinesByFile = {};
                    for (const lineNumber in file.source) {
                        const line = file.source[lineNumber];
                        if (line.miss) {
                            missingLines = missingLinesByFile[line.originalFilename] = missingLinesByFile[line.originalFilename] || [];
                            missingLines.push(line.originalLine);
                        }
                    }

                    const files = Object.keys(missingLinesByFile);
                    if (files.length) {
                        output += red('\n' + file.filename + ' missing coverage from file(s):');
                        for (const filename of files) {
                            output += red('\n\t' + filename + ' on line(s): ' + missingLinesByFile[filename].join(', '));
                        }
                    }

                    continue;
                }

                // Plain JS

                missingLines = [];
                for (const lineNumber in file.source) {
                    const line = file.source[lineNumber];
                    if (line.miss) {
                        missingLines.push(parseInt(lineNumber, 10));
                    }
                }

                if (missingLines.length) {
                    // Lines missing coverage are reported as a list of
                    // spans, e.g. "1, 3-8, 10, 13-15".
                    const missingLinesReport = [];
                    const span = {
                        start: missingLines[0],
                        end: missingLines[0]
                    };
                    for (let i = 1; i <= missingLines.length; ++i) {
                        const line = missingLines[i];
                        if (line === span.end + 1) {
                            // Extend the current span.
                            span.end = line;
                        }
                        else {
                            // Flush current span to output.
                            if (span.start === span.end) {
                                missingLinesReport.push(span.start);
                            }
                            else if (span.start + 1 === span.end) {
                                missingLinesReport.push(span.start);
                                missingLinesReport.push(span.end);
                            }
                            else {
                                missingLinesReport.push(span.start + '-' + span.end);
                            }

                            // Start a new span.
                            span.start = line;
                            span.end = line;
                        }
                    }

                    output += yellow('\n' + file.filename + ' missing coverage on line(s): ' + missingLinesReport.join(', '));
                }
            }

            if (coverage.percent < this.settings.threshold) {
                output += red('\nCode coverage below threshold: ' + coverage.percent.toFixed(2) + ' < ' + this.settings.threshold);
            }
        }

        output += '\n';

        // External coverage

        if (this.settings['coverage-module']) {
            output += 'External coverage:';

            let hasErrors = false;
            for (const file of coverage.files) {
                if (!file.externals) {
                    continue;
                }

                hasErrors = true;
                output += gray('\n' + file.filename + ':');
                let source;
                for (const report of file.externals) {
                    if (source !== report.source) {
                        source = report.source;
                        output += gray('\n\t' + source + ':');
                    }

                    output += (report.severity !== 'warning' ? red : yellow)('\n\t\tLine ' + report.line + ': ' + report.message);
                }
            }

            if (!hasErrors) {
                output += green(' No issues');
            }

            output += '\n';
        }
    }

    // Lint

    const lint = notebook.lint;
    if (lint) {
        output += 'Lint:';

        let hasErrors = false;
        for (const entry of lint.lint) {
            if (!entry.errors ||
                !entry.errors.length) {
                continue;
            }

            hasErrors = true;
            output += gray('\n\t' + entry.filename + ':');
            for (const err of entry.errors) {
                output += (err.severity === 'ERROR' ? red : yellow)('\n\t\tLine ' + err.line + ': ' + err.message);
            }
        }

        if (!hasErrors) {
            output += green(' No issues');
        }

        output += '\n';
    }

    // Types

    if (notebook.types) {
        output += 'Types:';

        if (notebook.types.length) {
            for (const error of notebook.types) {
                const pos = error.line ? `:${error.line}:${error.column}` : '';
                output += gray(`\n\t${error.filename}${pos}: `) + red(error.message);
            }
        }
        else {
            output += green(' No issues\n');
        }
    }

    // Notes

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

    if (enabled &&
        Array.isArray(code)) {

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
        enabled = SupportsColor.stdout;
    }

    const codes = {
        black: 0,
        gray: 90,
        red: 31,
        green: 32,
        yellow: 33,
        magenta: 35,
        redBg: 41,
        greenBg: 42,
        whiteRedBg: [37, 41],
        blackGreenBg: [30, 42]
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
