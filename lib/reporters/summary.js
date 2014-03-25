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

    var self = this;

    // Tests

    var failures = notebook.tests.filter(function (test) {

        return !!test.err;
    });

    var output = '\n\n ';
    if (!failures.length) {
        output += '#green[' + notebook.tests.length + ' tests complete] #gray[(' + notebook.ms + ' ms)]\n\n';
    }
    else {
        output += '#red[' + failures.length + ' of ' + notebook.tests.length + ' tests failed]#gray[:]\n\n';

        for (var i = 0, il = failures.length; i < il; ++i) {
            var test = failures[i];
            var message = test.err.message || '';
            var stack = test.err.stack || message;
            var index = stack.indexOf(message) + message.length;
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
                var comparison = Diff[type](test.err.actual, test.err.expected);

                output += '  #black[' + test.id + ') ' + test.title + ':]\n\n' +
                          '      #red-bg[actual] #green-bg[expected]\n\n';

                for (var c = 0, cl = comparison.length; c < cl; ++c) {
                    var item = comparison[c];
                    var value = item.value;

                    if (escape) {
                        value = value.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n\n');
                    }

                    var lines = value.split('\n');
                    for (var l = 0, ll = lines.length; l < ll; ++l) {

                        output += '      ';
                        if (item.added || item.removed) {
                            output += (item.added ? '#green-bg' : '#red-bg') + '[' + lines[l] + ']';
                        }
                        else {
                            output += lines[l];
                        }

                        output += '\n';
                    }
                }

                output += '\n\n';
            }
            else {
                var boomError = test.err.actual && test.err.actual.isBoom && test.err.actual.message;
                var msg = stack.slice(0, index);
                output += this.format('  #black[%s) %s:]\n     #red[%s]\n' + (boomError ? '     #magenta[Message: ' + boomError + ']\n' : ''), test.id, test.title, msg);
            }

            if (test.timeout) {
                var isChai = stack.indexOf('chai') !== -1;
                stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
                if (isChai) {
                    stack = stack.split('\n');
                    if (stack.length > 1) {
                        stack = internals.getStackLine(stack);
                    }
                }

                output += this.format('#gray[%s]\n', stack);
            }

            output += '\n';
        }

        output += '\n';
    }

    // Leaks

    if (notebook.leaks) {
        if (notebook.leaks.length) {
            output += '#gray[The following leaks were detected]:\n\n';
            for (var i = 0, il = notebook.leaks.length; i < il; ++i) {
                output += '#red[' + notebook.leaks[i] + ']\n';
            }
        }
        else {
            output += '#green[ No global variable leaks detected.]\n';
        }
    }

    // Coverage

    var coverage = notebook.coverage;
    if (coverage) {
        output += 'Coverage: ' + coverage.percent.toFixed(2) + '%\n';
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
                    output += file.filename + ' missing coverage on line(s): ' + missingLines.join(', ') + '\n';
                }
            });

            if (coverage.percent < this.settings.threshold || isNaN(coverage.percent)) {
                output += 'Code coverage below threshold: ' + coverage.percent.toFixed(2) + ' < ' + this.settings.threshold + '\n';
            }
        }
    }

    return this.format(output);
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
