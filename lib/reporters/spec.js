// Load modules

var Summary = require('./summary');


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;
    this.last = [];
};


internals.Reporter.prototype.start = function (notebook) {

};


internals.Reporter.prototype.test = function (test) {

    for (var i = 0, il = test.path.length; i < il; ++i) {
        if (test.path[i] !== this.last[i]) {
            this.print(internals.spacer(i * 2) + test.path[i] + '\n');
        }
    }

    this.last = test.path;

    var spacer = internals.spacer(test.path.length * 2);
    if (test.err) {
        this.print(spacer + this.colors.red('\u2716' + test.id + ') ' + test.relativeTitle) + '\n');
    }
    else {
        this.print(spacer + this.colors.green('\u2714') + ' ' + this.colors.gray(test.id + ') ' + test.relativeTitle) + '\n');
    }
};


internals.Reporter.prototype.end = function (notebook) {

    return Summary.prototype.end.call(this, notebook)
};


internals.spacer = function (length) {

    return new Array(length + 1).join(' ');
};