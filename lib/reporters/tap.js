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

internals.Reporter.prototype.insertYAMLBlock = function(test) {

    this.report('  ---\n');
    this.report('  duration_ms: ' + test.duration + '\n');
    if (test.err && test.err.stack) {
        this.report('  stack: |-\n');
        this.report('    ' + test.err.stack.replace(/(\n|\r\n)/gm, '\n    ') + '\n');
    }
    this.report('  ...\n');
};


internals.Reporter.prototype.start = function (notebook) {

    this.report('TAP version 13\n');
    this.report('1..' + notebook.count + '\n');
};


internals.Reporter.prototype.test = function (test) {

    var title = '(' + test.id + ') ' + test.title.replace(/#/g, '');
    var id = ++this.counter;

    if (test.err) {
        ++this.failures;
        this.report('not ok ' + id + ' ' + title + '\n');
        this.insertYAMLBlock(test);
    }
    else if (test.skipped) {
        ++this.skipped;
        this.report('ok ' + id + ' # SKIP ' + title + '\n');
    }
    else if (test.todo) {
        ++this.todo;
        this.report('ok ' + id + ' # TODO ' + title + '\n');
    }
    else {
        ++this.passes;
        this.report('ok ' + id + ' ' + title + '\n');
        this.insertYAMLBlock(test);
    }
};


internals.Reporter.prototype.end = function (notebook) {

    this.report('# tests ' + (this.passes + this.failures + this.skipped) + '\n');
    this.report('# pass ' + this.passes + '\n');
    this.report('# fail ' + this.failures + '\n');
    this.report('# skipped ' + this.skipped + '\n');
    this.report('# todo ' + this.todo + '\n');
};
