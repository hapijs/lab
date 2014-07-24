// Load modules

var Path = require('path');
var _Lab = require('../test_runner');
var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = _Lab.expect;


describe('Coverage', function () {

    it('instruments and measures coverage', function (done) {

        var options = { global: '__$$testCov' };
        Lab.coverage.instrument(options);
        var Test = require('../coverage-test/basic');

    	var script = Lab.script({ schedule: false });
    	script.experiment('test', function () {

    		script.test('value of a', function (finished) {

    			Lab.expect(Test.method(1)).to.equal(1);
    			finished();
    		});
    	});

    	Lab.execute(script, { coverage: true }, null, function (err, notebook) {

            expect(notebook.failures).to.equal(0);
            var report = Lab.coverage.analyze(notebook, options);
            expect(report.percent).to.equal(100);
            delete global.__$$testCov;
			done();
		});
    });
});
