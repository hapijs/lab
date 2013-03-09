// Load modules


// Declare internals

var internals = {};


exports = module.exports = internals.Experiment = function (title, context) {

    this.title = title;
    this.context = context;

    this.experiments = [];
    this.tests = [];
    this.befores = [];
    this.afters = [];
};


internals.Experiment.prototype.before = function (fn) {

    this.befores.push(fn);
};


internals.Experiment.prototype.after = function (fn) {

    this.afters.push(fn);
};


internals.Experiment.prototype.experiment = function (experiment) {

    experiment.parent = this;
    this.experiments.push(experiment);
};


internals.Experiment.prototype.test = function (title, fn) {

    var test = {
        title: this.fullTitle() + ' ' + title,
        fn: fn,
        context: this.context
    };

    this.tests.push(test);
};


internals.Experiment.prototype.fullTitle = function () {

    if (this.parent) {
        return this.parent.fullTitle() + ' ' + this.title;
    }

    return this.title;
};


internals.Experiment.prototype.total = function () {

    var rval = this.tests.length;
    for (var i = 0, il = this.experiments.length; i < il; ++i) {
        rval += this.experiments[i].total();
    }

    return rval;
};


