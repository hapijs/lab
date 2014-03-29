// Load modules

var Summary = require('./summary');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    var width = 50;
    var count = 0;

    emitter.on('test', function (test) {

        if (!count) {
            process.stdout.write('\n');
            if (!options.verbose) {
                process.stdout.write('  ');
            }
        }

        ++count;

        if ((count - 1) % width === 0) {
            if (!options.verbose) {
                process.stdout.write('\n  ');
            }
        }

        if (!options.verbose) {
            process.stdout.write(Utils.color(test.err ? '#red[x]' : '.'));
        }
        else {
            var format = Utils.color('  ' + (test.err ? '#red[x]' : '#green[\u2713]') + ' #gray[%s) %s]');
            console.log(format, test.id, test.title);
        }
    });

    Summary(emitter, options);
};
