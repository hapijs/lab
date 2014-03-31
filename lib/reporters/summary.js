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

    var output = [];

    // Tests

    var failures = notebook.tests.filter(function (test) {

        return !!test.err;
    });

    output.push('\n\n ');
    if (!failures.length) {
        output.push(this.format('#green[' + notebook.tests.length + ' tests complete] #gray[(' + notebook.ms + ' ms)]\n\n'));
    }
    else {
        output.push(this.format('#red[' + failures.length + ' of ' + notebook.tests.length + ' tests failed]#gray[:]\n\n'));

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
                var msg = Diff[type](test.err.actual, test.err.expected).map(internals.colorError, { escape: escape }).join('');
                msg = msg.replace(/^/gm, '      ');

                output.push(this.format('  #black[%s) %s:]\n', test.id, test.title));
                output.push(this.format('\n      #red-bg[actual] #green-bg[expected]\n\n'));
                output.push(this.format(msg));
                output.push('\n\n');
            }
            else {
                var boomError = test.err.actual && test.err.actual.isBoom && test.err.actual.message;
                var msg = stack.slice(0, index);
                output.push(this.format('  #black[%s) %s:]\n     #red[%s]\n' + (boomError ? '     #magenta[Message: ' + boomError + ']\n' : ''), test.id, test.title, msg));
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

                output.push(this.format('#gray[%s]\n', stack));
            }

            output.push('\n');
        }

        output.push('\n');
    }

    // Leaks

    if (notebook.leaks) {
        if (notebook.leaks.length) {
            output.push('#gray[The following leaks were detected]:\n\n');
            for (var i = 0, il = notebook.leaks.length; i < il; ++i) {
                output.push('#red[' + notebook.leaks[i] + ']\n');
            }
        }
        else {
            output.push('#green[ No global variable leaks detected.]\n');
        }
    }

    // Coverage

    var coverage = notebook.coverage;
    if (coverage) {
        output.push('Coverage: ' + coverage.percent.toFixed(2) + '%\n');
        if (coverage.percent < 100) {
            output.push('\n');
            coverage.files.forEach(function (file) {

                var missingLines = [];
                Object.keys(file.source).forEach(function (lineNumber) {

                    var line = file.source[lineNumber];
                    if (line.miss) {
                        missingLines.push(lineNumber);
                    }
                });

                if (missingLines.length) {
                    self.print(file.filename + ' missing coverage on line(s): ' + missingLines.join(', ') + '\n');
                }
            });

            if (coverage.percent < this.settings.threshold || isNaN(coverage.percent)) {
                output.push('Code coverage below threshold: ' + coverage.percent.toFixed(2) + ' < ' + this.settings.threshold + '\n');
            }
        }
    }

    return output.join('');
};


internals.colorError = function (str) {

    if (this.escape) {
        str.value = str.value.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n\n');
    }

    if (str.added || str.removed) {
        return str.value.split('\n').map(function (segment) {

            return (str.added ? '#green-bg' : '#red-bg') + '[' + segment + ']';
        }).join('\n');
    }

    return str.value;
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
