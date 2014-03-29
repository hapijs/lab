// Load modules

var Tty = require('tty');


// Declare internals

var internals = {};


exports.color = function (str) {

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
