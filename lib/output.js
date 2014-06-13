// Load modules

var Tty = require('tty');


// Declare internals

var internals = {};


exports.decorate = function (reporter, options) {

    var dest = options.dest;
    var forceColor = options.forceColor;

    reporter.print = function (text) {

        dest.write(text);
    };

    reporter.console = function (text) {

        process.stdout.write(text);
    };

    reporter.colors = internals.colors(forceColor);
};


internals.color = function (name, code, forceColor) {

    if ((Tty.isatty(1) && Tty.isatty(2)) || forceColor) {
        var color = '\u001b[' + code + 'm';
        return function (text) { return color + text + '\u001b[0m'; };
    }

    return function (text) { return text; };
};


internals.colors = function (forceColor) {

    var codes = {
        'black': 0,
        'gray': 90,
        'red': 31,
        'green': 32,
        'yellow': 33,
        'magenta': 35,
        'redBg': 41,
        'greenBg': 42
    };

    var colors = {};
    var names = Object.keys(codes);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        colors[name] = internals.color(name, codes[name], forceColor);
    }

    return colors;
};
