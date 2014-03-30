// Load modules

var Diff = require('diff');
var Utils = require('./utils');


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

    var failures = notebook.tests.filter(function (test) {

        return !!test.err;
    });

    var report = function () {

        // Tests

        if (!failures.length) {
            console.log(Utils.color('\n\n #green[' + notebook.tests.length + ' tests complete] #gray[(' + notebook.ms + ' ms)]\n'));
        }
        else {
            formatErrors();
        }

        // Leaks

        if (notebook.leaks) {
            if (notebook.leaks.length) {
                console.log(Utils.color('#gray[The following leaks were detected]\n'));
                for (var i = 0, il = notebook.leaks.length; i < il; ++i) {
                    console.log(Utils.color('#red[' + notebook.leaks[i] + ']\n'));
                }
            }
            else {
                console.log(Utils.color('\n\n #green[ No global variable leaks detected.]\n'));
            }
        }

        // Coverage

        var coverage = notebook.coverage;
        if (coverage) {
            console.log('Coverage: ' + coverage.percent.toFixed(2) + '%');
            if (coverage.percent < 100) {
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

                if (coverage.percent < self.settings.threshold || isNaN(coverage.percent)) {
                    console.log('Code coverage below threshold: ' + coverage.percent.toFixed(2) + ' < ' + self.settings.threshold);
                }
            }
        }
    };

    var formatErrors = function () {

        console.error('');
        console.error(Utils.color('\n\n #red[' + failures.length + ' of ' + notebook.tests.length + ' tests failed]#gray[:]\n'));
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
                msg = Diff[type](test.err.actual, test.err.expected).map(internals.colorError, { escape: escape }).join('');

                msg = Utils.color('\n#red-bg[actual] #green-bg[expected]\n\n' + msg + '\n');
                msg = msg.replace(/^/gm, '      ');
                format = Utils.color('  #black[%s) %s:\n%s]\n' + (test.timeout ? '' : '#gray[%s]\n'));
            }
            else {
                var boomError = test.err.actual && test.err.actual.isBoom && test.err.actual.message;
                format = Utils.color('  #black[%s) %s:]\n     #red[%s]\n' + (boomError ? '     #magenta[Message: ' + boomError + ']\n' : '') + (test.timeout ? '' : '#gray[%s]\n'));
            }

            var isChai = stack.indexOf('chai') !== -1;
            stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
            if (isChai) {
                stack = stack.split('\n');
                if (stack.length > 1) {
                    stack = internals.getStackLine(stack);
                }
            }

            console.error(format, test.id, test.title, msg, (test.timeout ? '' : stack));
        }

        console.error();
    };

    return report();
};


internals.colorError = function (str) {

    if (this.escape) {
        str.value = str.value.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n\n');
    }

    if (str.added || str.removed) {
        return str.value.split('\n').map(function (segment) {

            return Utils.color((str.added ? '#green-bg' : '#red-bg') + '[' + segment + ']');
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
