// Load modules

var Summary = require('./summary');


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
        this.print('\n  ');
    }

    this.count++;

    if ((this.count - 1) % internals.width === 0) {
        this.print('\n  ');
    }

    this.print(test.err ? '#red[x]' : '.');
};


internals.Reporter.prototype.end = function (notebook) {

    return Summary.prototype.end.call(this, notebook)
};