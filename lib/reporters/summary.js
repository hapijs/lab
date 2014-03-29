// Load modules

var Diff = require('diff');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    emitter.once('end', function (notebook) {

        var failures = notebook.tests.filter(function (test) {

            return !!test.err;
        });

        // Success

        var checkErrors = function () {

            // Success

            if (!failures.length) {
                console.log(Utils.color('\n\n #green[' + notebook.tests.length + ' tests complete] #gray[(' + notebook.ms + ' ms)]\n'));
                formatGlobals();

                return;
            }

            // Failure

            formatErrors();
            formatGlobals();
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
                    msg = Diff[type](test.err.actual, test.err.expected).map(colorError, { escape: escape }).join('');

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

            if (!notebook.leaks) {
                console.log(Utils.color('\n\n #green[ No global variable leaks detected.]\n'));
                return;
            }

            console.log(Utils.color('#gray[The following leaks were detected]\n'));
            for (var i = 0, il = notebook.leaks.length; i < il; ++i) {
                console.log(Utils.color('#red[' + notebook.leaks[i] + ']\n'));
            }
        };

        var colorError = function (str) {

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
