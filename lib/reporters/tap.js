// Load modules


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;

    this.passes = 0;
    this.failures = 0;
    this.skipped = 0;
    this.todo = 0;
    this.counter = 0;
};


internals.Reporter.prototype.start = function (notebook) {

    this.print('1..' + notebook.count + '\n');
};


internals.Reporter.prototype.test = function (test) {

    var title = '(' + test.id + ') ' + test.title.replace(/#/g, '');
    var id = ++this.counter;

    if (test.err) {
        ++this.failures;
        this.print('not ok ' + id + ' ' + title + '\n');
        if (test.err.stack) {
            this.print(test.err.stack.replace(/^/gm, '  ') + '\n');
        }
    }
    else if (test.skipped) {
        ++this.skipped;
        this.print('ok ' + id + ' SKIP ' + title + '\n');
    }
    else if (test.todo) {
        ++this.todo;
        this.print('ok ' + id + ' TODO ' + title + '\n');
    }
    else {
        ++this.passes;
        this.print('ok ' + id + ' ' + title + '\n');
    }
};


internals.Reporter.prototype.end = function (notebook) {

    this.print('# tests ' + (this.passes + this.failures + this.skipped) + '\n');
    this.print('# pass ' + this.passes + '\n');
    this.print('# fail ' + this.failures + '\n');
    this.print('# skipped ' + this.skipped + '\n');
    this.print('# todo ' + this.todo + '\n');
};

