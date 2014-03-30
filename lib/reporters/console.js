// Load modules

var Summary = require('./summary');
var Utils = require('./utils');


// Declare internals

var internals = {
    width: 50
};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;
    this.count = 0;
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

    if (!this.count) {
        process.stdout.write('\n  ');
    }

    this.count++;

    if ((this.count - 1) % internals.width === 0) {
        process.stdout.write('\n  ');
    }

    process.stdout.write(Utils.color(test.err ? '#red[x]' : '.'));
};


internals.Reporter.prototype.end = function (notebook) {

    return Summary.prototype.end.call(this, notebook)
};