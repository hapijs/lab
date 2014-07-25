// Load modules

var Fs = require('fs');
var Tty = require('tty');


// Declare internals

var internals = {};


internals.protos = {
	console: require('./console'),
    html: require('./html'),
    json: require('./json'),
    tap: require('./tap')
};


exports.generate = function (options) {

	var Proto = internals.protos[options.reporter];
	var reporter = new Proto(options);

    var dest = typeof options.output === 'string' ? Fs.createWriteStream(options.output) : options.output;

    reporter.report = function (text) {

        if (dest) {
            dest.write(text);
        }
    };

    reporter.status = function (text) {

        process.stdout.write(text);
    };

    reporter.colors = internals.colors(options.colors);

    reporter.finalize = function (notebook, code, callback) {

        var output = reporter.end(notebook) || '';

        var finalize = function () {

            if (callback) {
                return callback(null, code, output);
            }

            process.exit(code);
        };

        if (dest) {
            dest.write(output, function () {

                if (dest === process.stdout) {
                    return finalize();
                }

                dest.end(function () {

                    return finalize();
                });
            });
        }
        else {
            return finalize();
        }
    };

    return reporter;
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
