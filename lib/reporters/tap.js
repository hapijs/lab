// Load modules


// Declare internals

var internals = {};


exports = module.exports = internals.Reporter = function (options) {

    this.settings = options;

    this.passes = 0;
    this.failures = 0;
};


internals.Reporter.prototype.start = function (notebook) {

    console.log('%d..%d', 1, notebook.count);
};


internals.Reporter.prototype.test = function (test) {

    var title = test.title.replace(/#/g, '');
    if (test.err) {
        this.failures++;
        console.log('not ok %d %s', test.id, title);
        if (test.err.stack) {
            console.log(test.err.stack.replace(/^/gm, '  '));
        }
    }
    else {
        this.passes++;
        console.log('ok %d %s', test.id, title);
    }
};


internals.Reporter.prototype.end = function (notebook) {

    console.log('# tests ' + (this.passes + this.failures));
    console.log('# pass ' + this.passes);
    console.log('# fail ' + this.failures);
};


// console.log('ok %d # SKIP %s', test.id, title);
// console.log('not ok %d # TODO %s', test.id, title);
