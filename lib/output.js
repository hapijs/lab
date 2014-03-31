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
    'redBg': 41,
    'greenBg': 42
};


exports.print = function (text) {

    process.stdout.write(text);
};


exports.console = function (text) {

    process.stdout.write(text);
};


internals.color = function (name) {

    if (Tty.isatty(1) && Tty.isatty(2)) {
        var color = '\u001b[' + internals.colors[name] + 'm';
        return function (text) { return color + text + '\u001b[0m'; };
    }

    return function (text) { return text; };
};


exports.colors = function () {

    var colors = {};
    var names = Object.keys(internals.colors);
    for (var i = 0, il = names.length; i < il; ++i) {
        var name = names[i];
        colors[name] = internals.color(name);
    }

    return colors;
}();
