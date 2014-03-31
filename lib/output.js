// Load modules

var Tty = require('tty');


// Declare internals

var internals = {};


exports.decorate = function (reporter, options) {

    var dest = options.dest;

    reporter.print = function (text) {

        dest.write(text);
    };

    reporter.console = function (text) {

        process.stdout.write(text);
    };

    reporter.colors = internals.colors;
};


internals.color = function (name, code) {

    if (Tty.isatty(1) && Tty.isatty(2)) {
        var color = '\u001b[' + code + 'm';
        return function (text) { return color + text + '\u001b[0m'; };
    }

    return function (text) { return text; };
};


internals.colors = function () {

    var codes = {
        'black': 0,
        'gray': 90,
        'red': 31,
        'green': 32,
        'magenta': 35,
        'redBg': 41,
        'greenBg': 42
    };

    var colors = {};
    var names = Object.keys(codes);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        colors[name] = internals.color(name, codes[name]);
    }

    return colors;
}();
