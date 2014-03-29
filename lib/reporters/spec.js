// Load modules

var Summary = require('./summary');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    var last = [];

    emitter.on('test', function (test) {

        for (var i = 0, il = test.path.length; i < il; ++i) {
            if (test.path[i] !== last[i]) {
                console.log(internals.spacer(i * 2) + test.path[i]);
            }
        }

        last = test.path;

        var spacer = internals.spacer(test.path.length * 2);
        var format = spacer + Utils.color(test.err ? '#red[\u2716 %s) %s]' : '#green[\u2714] #gray[%s) %s]');
        console.log(format, test.id, test.relativeTitle);
    });

    Summary(emitter, options);
};


internals.spacer = function (length) {

    return new Array(length + 1).join(' ');
};