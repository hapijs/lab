// Load modules


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;

    this.passes = 0;
    this.failures = 0;
};


internals.Reporter.prototype.start = function (notebook) {

    this.print('1..' + notebook.count + '\n');
};


internals.Reporter.prototype.test = function (test) {

    var title = test.title.replace(/#/g, '');
    if (test.err) {
        this.failures++;
        this.print('not ok ' + test.id + ' ' + title + '\n');
        if (test.err.stack) {
            this.print(test.err.stack.replace(/^/gm, '  ') + '\n');
        }
    }
    else {
        this.passes++;
        this.print('ok ' + test.id + ' ' + title + '\n');
    }
};


internals.Reporter.prototype.end = function (notebook) {

    this.print('# tests ' + (this.passes + this.failures) + '\n');
    this.print('# pass ' + this.passes + '\n');
    this.print('# fail ' + this.failures + '\n');
};


// ('ok %d # SKIP %s', test.id, title)
// ('not ok %d # TODO %s', test.id, title)
