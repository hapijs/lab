// Load modules

var Tty = require('tty');


// Declare internals

var internals = {};


internals.colors = {
    'black': 0,
    'gray': 90,
    'red': 31,
    'green': 32,
    'magenta': 35,
    'red-bg': 41,
    'green-bg': 42
};


exports.print = function (/* format, arg1, arg2, ..., arg3 */) {

    var formatted = exports.format.apply(this, arguments);
    process.stdout.write(formatted);
};


exports.format = function (format /*, arg1, arg2, ..., arg3 */) {

    var args = Array.prototype.slice.call(arguments, 1);
    var i = 0;
    var formatted = format.replace(/%s/g, function ($0) {

        if (i >= args.length) {
            return $0;
        }

        return args[i++];
    });

    var colorized = formatted.replace(/#([a-z\-]+)\[([^\]]*)\]/g, function ($0, $1, $2) {

        if (Tty.isatty(1) && Tty.isatty(2)) {
            return '\u001b[' + internals.colors[$1] + 'm' + $2 + '\u001b[0m';
        }

        return $2;
    });

    return colorized;
};
