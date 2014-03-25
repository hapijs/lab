// Load modules

var Summary = require('./summary');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    emitter.on('start', function(notebook) {

        console.log('%d..%d', 1, notebook.tests.length);
    });

    var passes = 0;
    var failures = 0;

    emitter.on('test', function (test) {

        var title = test.title.replace(/#/g, '');
        if (test.err) {
            ++failures;
            console.log('not ok %d %s', test.id, title);
            if (test.err.stack) {
                console.log(test.err.stack.replace(/^/gm, '  '));
            }
        }
        else {
            passes++;
            console.log('ok %d %s', test.id, title);
        }
    });

    // console.log('ok %d # SKIP %s', test.id, title);
    // console.log('not ok %d # TODO %s', test.id, title);

    emitter.once('end', function (notebook) {

        console.log('# tests ' + (passes + failures));
        console.log('# pass ' + passes);
        console.log('# fail ' + failures);
    });
};