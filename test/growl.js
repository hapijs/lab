// Load modules

var _Lab = require('../test_runner');
var Growl = require('../lib/growl');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = _Lab.expect;


describe('Growl', function () {

    it('notifies on failures', function (done) {
        var notebook = {
            failures: ['a'],
            errors: [],
            tests: ['a'],
            time: 10
        };
        Growl.notify(notebook);
        expect(notebook.notified).to.equal(true);
        done();
    });

    it('notifies on success', function (done) {
        var notebook = {
            failures: [],
            errors: [],
            tests: ['a'],
            time: 10
        };
        Growl.notify(notebook);
        expect(notebook.notified).to.equal(true);
        done();
    });
});
