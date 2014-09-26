// Load modules

var Growl = require('growl');
var Path =  require('path');


// Declare internals

var internals = {};

internals.image = function image (name) {
  return Path.join(__dirname, '../images/' , name + '.png');

};

internals.sendNotification = function (failed, total, time) {
    var growlOptions = {
        name: 'lab',
        title: failed ? 'Failed' : 'Passed',
        image: internals.image(failed ? 'error' : 'ok')
    };

    var message;
    if (failed) {
        message = failed + ' of ' + total + ' tests failed';
    } else {
        message = total + ' tests passed in ' + time + 'ms';
    }

    return Growl(message, growlOptions);
};

exports.notify = function growlNotify (notebook) {
    var failed = notebook.failures.length + notebook.errors.length;
    var total = notebook.tests.length;
    var time = notebook.ms;

    internals.sendNotification(failed, total, time);
    notebook.notified = true;
};
