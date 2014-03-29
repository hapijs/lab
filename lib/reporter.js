// Load modules

var Diff = require('diff');
var Fs = require('fs');
var Path = require('path');
var Tty = require('tty');


// Declare internals

var internals = {};


exports.console = function (emitter, options) {

    var width = 50;
    var count = 0;
    var failures = [];

    var color = function (str) {

        var colors = {
            'black': 0,
            'gray': 90,
            'red': 31,
            'green': 32,
            'magenta': 35,
            'red-bg': 41,
            'green-bg': 42
        };

        var colorized = str.replace(/#([a-z\-]+)\[([^\]]*)\]/g, function ($0, $1, $2) {

            if (Tty.isatty(1) && Tty.isatty(2)) {
                return '\u001b[' + colors[$1] + 'm' + $2 + '\u001b[0m';
            }
            else {
                return $2;
            }
        });

        return colorized;
    };

    emitter.on('test', function (test) {

        if (!count) {
            process.stdout.write('\n');
            if (!options.verbose) {
                process.stdout.write('  ');
            }
        }

        ++count;
        if (test.err) {
            failures.push(test);
        }

        if ((count - 1) % width === 0) {
            if (!options.verbose) {
                process.stdout.write('\n  ');
            }
        }


        if (!options.verbose) {
            process.stdout.write(color(test.err ? '#red[x]' : '.'));
        }
        else {
            var format = color('  ' + (test.err ? '#red[x]' : '#green[✓]')  + ' #gray[%s) %s]');
            console.log(format, test.id, test.title);
        }
    });

    emitter.once('end', function (result) {

        // Success

        var checkErrors = function () {

            // Success

            if (!failures.length) {
                console.log(color('\n\n #green[' + count + ' tests complete] #gray[(' + result.ms + ' ms)]\n'));
                formatGlobals();

                return;
            }

            // Failure

            formatErrors();
            formatGlobals();
        };

        var formatErrors = function () {

            console.error('');
            console.error(color('\n\n #red[' + failures.length + ' of ' + count + ' tests failed]#gray[:]\n'));
            var format = '';
            for (var i = 0, il = failures.length; i < il; ++i) {

                var test = failures[i];
                var message = test.err.message || '';
                var stack = test.err.stack || message;
                var index = stack.indexOf(message) + message.length;
                var msg = stack.slice(0, index);
                var escape = true;

                // Actual vs Expected

                if (test.err.showDiff) {
                    escape = false;
                    test.err.actual = JSON.stringify(test.err.actual, null, 2);
                    test.err.expected = JSON.stringify(test.err.expected, null, 2);
                }

                if (typeof test.err.actual === 'string' &&
                    typeof test.err.expected === 'string') {

                    var len = Math.max(test.err.actual.length, test.err.expected.length);

                    var type = (len < 20 ? 'diffChars' : 'diffWords');
                    msg = Diff[type](test.err.actual, test.err.expected).map(colorError, { escape: escape }).join('');

                    msg = color('\n#red-bg[actual] #green-bg[expected]\n\n' + msg + '\n');
                    msg = msg.replace(/^/gm, '      ');
                    format = color('  #black[%s) %s:\n%s]\n' + (test.timeout ? '' : '#gray[%s]\n'));
                }
                else {
                    var boomError = test.err.actual && test.err.actual.isBoom && test.err.actual.message;
                    format = color('  #black[%s) %s:]\n     #red[%s]\n' + (boomError ? '     #magenta[Message: ' + boomError + ']\n' : '') + (test.timeout ? '' : '#gray[%s]\n'));
                }

                var isChai = stack.indexOf('chai') !== -1;
                stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
                if (isChai) {
                    stack = stack.split('\n');
                    if (stack.length > 1) {
                        stack = getStackLine(stack);
                    }
                }

                console.error(format, test.id, test.title, msg, (test.timeout ? '' : stack));
            }

            console.error();
        };

        var formatGlobals = function () {

            if (!options.global) {
                return;
            }

            if (!result.leaks) {
                console.log(color('\n\n #green[ No global variable leaks detected.]\n'));
                return;
            }

            console.log(color('#gray[The following leaks were detected]\n'));
            for (var i = 0, il = result.leaks.length; i < il; ++i) {
                console.log(color('#red[' + result.leaks[i] + ']\n'));
            }
        };

        var colorError = function (str) {

            if (this.escape) {
                str.value = str.value.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n\n');
            }

            if (str.added || str.removed) {
                return str.value.split('\n').map(function (segment) {

                    return color((str.added ? '#green-bg' : '#red-bg') + '[' + segment + ']');
                }).join('\n');
            }

            return str.value;
        };

        var getStackLine = function (stack) {

            for (var i = 0, il = stack.length; i < il; ++i) {
                var stackLine = stack[i];
                if (/chai/.test(stackLine) === false) {
                    return stackLine;
                }
            }

            return stack;
        };

        checkErrors();
    });
};


exports.json = function (emitter, options) {

    var tests = {};

    emitter.on('test', function (test) {

        tests[test.path] = tests[test.path] || [];
        tests[test.path].push({
            title: test.relativeTitle,
            err: (test.err ? test.err.message || true : false),
            duration: test.duration
        });
    });

    emitter.on('end', function (data) {

        var result = JSON.stringify(tests, null, 2);

        if (options.output) {
            Fs.writeFileSync(options.output, result);
            return;
        }

        process.stdout.write(result);
    });
};


exports.coverage = function (emitter, options) {

    var tests = [];
    var failures = [];
    var passes = [];

    emitter.on('test', function (test) {

        tests.push(test);

        if (test.err) {
            failures.push(test);
        }
        else {
            passes.push(test);
        }
    });

    emitter.on('end', function (data) {

        // Process coverage

        var report = global.__$$labCov || {};
        var cov = {
            sloc: 0,
            hits: 0,
            misses: 0,
            coverage: 0,
            files: []
        };

        var covKeys = Object.keys(report);
        for (var ci = 0, cil = covKeys.length; ci < cil; ++ci) {
            var filename = covKeys[ci];
            var data = internals.coverage(filename, report[filename]);

            cov.files.push(data);
            cov.hits += data.hits;
            cov.misses += data.misses;
            cov.sloc += data.sloc;
        }

        // Sort files based on directory structure

        cov.files.sort(function (a, b) {

            var segmentsA = a.filename.split('/');
            var segmentsB = b.filename.split('/');

            var al = segmentsA.length;
            var bl = segmentsB.length;

            for (var i = 0; i < al && i < bl; ++i) {

                if (segmentsA[i] === segmentsB[i]) {
                    continue;
                }

                var lastA = i + 1 === al;
                var lastB = i + 1 === bl;

                if (lastA !== lastB) {
                    return lastA ? -1 : 1;
                }

                return segmentsA[i] < segmentsB[i] ? -1 : 1;
            }

            return segmentsA.length < segmentsB.length ? -1 : 1;
        });

        // Calculate coverage percentage

        if (cov.sloc > 0) {
            cov.coverage = (cov.hits / cov.sloc) * 100;
        }

        // Clean results

        var clean = function (test) {

            var cleaned = {
                title: test.title,
                duration: test.duration
            };

            if (options.verbose &&
                test.err) {

                cleaned.error = {
                    message: test.err.message,
                    stack: test.err.stack || test.err.message,
                    actual: test.err.actual,
                    expected: test.err.expected
                };
            }

            return cleaned;
        };

        cov.tests = tests.map(clean);
        cov.failures = failures.map(clean);
        cov.passes = passes.map(clean);

        // Finalize output

        if (options.verbose) {
            cov.ms = data.ms;
            cov.leaks = data.leaks;
        }

        if (options.dest) {
            options.dest.cov = cov;
            return;
        }

        process.stdout.write(JSON.stringify(cov, null, 2));
    });
};


internals.coverage = function (filename, data) {

    var ret = {
        filename: filename.replace(process.cwd() + '/', ''),
        coverage: 0,
        hits: 0,
        misses: 0,
        sloc: 0,
        source: {}
    };

    // Process each line of code

    data.source.forEach(function (line, num) {

        num++;

        var isMiss = false;
        ret.source[num] = {
            source: line
        };

        if (data.lines[num] === 0) {
            isMiss = true;
            ret.misses++;
            ret.sloc++;
        }
        else if (line) {
            ret.sloc++;

            if (data.statements[num]) {
                var mask = new Array(line.length);
                Object.keys(data.statements[num]).forEach(function (id) {

                    var statement = data.statements[num][id];
                    if (statement.hit.true &&
                        statement.hit.false) {

                        return;
                    }

                    if (statement.loc.start.line !== num) {
                        data.statements[statement.loc.start.line] = data.statements[statement.loc.start.line] || {};
                        data.statements[statement.loc.start.line][id] = statement;
                        return;
                    }

                    if (statement.loc.end.line !== num) {
                        data.statements[statement.loc.end.line] = data.statements[statement.loc.end.line] || {};
                        data.statements[statement.loc.end.line][id] = {
                            hit: statement.hit,
                            loc: {
                                start: {
                                    line: statement.loc.end.line,
                                    column: 0
                                },
                                end: {
                                    line: statement.loc.end.line,
                                    column: statement.loc.end.column
                                }
                            }
                        };

                        statement.loc.end.column = line.length;
                    }

                    isMiss = true;
                    var issue = statement.hit.true ? 'true' : (statement.hit.false ? 'false' : 'never');
                    for (var a = statement.loc.start.column; a < statement.loc.end.column; ++a) {
                        mask[a] = issue;
                    }
                });

                var chunks = [];

                var from = 0;
                for (var a = 1, al = mask.length; a < al; ++a) {
                    if (mask[a] !== mask[a - 1]) {
                        chunks.push({ source: line.slice(from, a), miss: mask[a - 1] });
                        from = a;
                    }
                }

                chunks.push({ source: line.slice(from), miss: mask[from] });

                if (isMiss) {
                    ret.source[num].chunks = chunks;
                    ret.misses++;
                }
                else {
                    ret.hits++;
                }
            }
            else {
                ret.hits++;
            }
        }

        ret.source[num].coverage = data.lines[num] === undefined ? '' : data.lines[num];
        ret.source[num].miss = isMiss;
    });

    ret.coverage = ret.hits / ret.sloc * 100;
    return ret;
};


exports.html = function (emitter, options) {

    var Handlebars = require('handlebars');

    var filename = Path.join(__dirname, 'html', 'report.html');
    var template = Fs.readFileSync(filename, 'utf8');
    var view = Handlebars.compile(template);
    var coverageClass = function (n) { return (n > 75 ? 'high' : (n > 50 ? 'medium' : (n > 25 ? 'low' : 'terrible'))); };

    options.dest = {};
    exports.coverage(emitter, options);

    emitter.on('end', function () {

        var context = {
            cov: options.dest.cov,
            coverageClass: coverageClass(options.dest.cov.coverage)
        };

        context.cov.coverage = context.cov.coverage.toFixed() === context.cov.coverage ? context.cov.coverage.toFixed() : context.cov.coverage.toFixed(2);
        context.cov.files.forEach(function (file) {

            file.coverageClass = coverageClass(file.coverage);
            file.segments = file.filename.split('/');
            file.basename = file.segments.pop();
            file.coverage = file.coverage.toFixed() === file.coverage ? file.coverage.toFixed() : file.coverage.toFixed(2);

            if (file.segments.length) {
                file.dirname = file.segments.join('/') + '/';
            }
        });

        var html = view(context);

        if (options.output) {
            Fs.writeFileSync(options.output, html);
            return;
        }

        process.stdout.write(html);
    });
};


exports.threshold = function (emitter, options) {

    options.dest = {};

    if (options.silence) {
        emitter.on('test', function (test) {

            if (test.err) {
                console.log('Tests failed.\n');
                process.exit(1);
            }
        });
    }
    else {
        exports.console(emitter, options);
    }

    exports.coverage(emitter, options);

    emitter.on('end', function () {

        var coverage = options.dest.cov.coverage;
        console.log('Coverage: ' + coverage.toFixed(2) + '%');
        if (coverage < options.threshold || isNaN(coverage)) {

            internals.consoleCoverage(options.dest.cov);
            console.log('Code coverage below threshold: ' + coverage.toFixed(2) + ' < ' + options.threshold);
            process.exit(1);
        }

        console.log('Coverage succeeded');
    });
};


internals.consoleCoverage = function (coverage) {

    console.log('');
    coverage.files.forEach(function (file) {

        var missingLines = [];
        Object.keys(file.source).forEach(function (lineNumber) {

            var line = file.source[lineNumber];
            if (line.miss) {
                missingLines.push(lineNumber);
            }
        });

        if (missingLines.length) {
            console.log(file.filename + ' missing coverage on line(s): ' + missingLines.join(', '));
        }
    });
};
