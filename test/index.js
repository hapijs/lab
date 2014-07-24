// Load modules

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


describe('Lab', function () {

    it('creates a script and executes', function (done) {

		var a = 0;
    	var script = Lab.script({ schedule: false });
    	script.experiment('test', function () {

    		script.before(function (finished) {

    			++a;
    			finished();
    		});

    		script.test('value of a', function (finished) {

    			Lab.expect(a).to.equal(1);
    			finished();
    		});

    		script.after(function (finished) {

    			++a;
    			finished();
    		});
    	});

    	Lab.execute(script, null, null, function (err, notebook) {

    		expect(a).to.equal(2);
    		expect(notebook.tests).to.have.length(1);
    		expect(notebook.tests[0].id).to.equal(1);
    		expect(notebook.failures).to.equal(0);
			done();
		});
    });

    it('creates a script and executes (BDD)', function (done) {

		var a = 0;
    	var script = Lab.script({ schedule: false });
    	script.describe('test', function () {

    		script.before(function (finished) {

    			++a;
    			finished();
    		});

    		script.it('value of a', function (finished) {

    			Lab.expect(a).to.equal(1);
    			finished();
    		});

    		script.after(function (finished) {

    			++a;
    			finished();
    		});
    	});

    	Lab.execute(script, null, null, function (err, notebook) {

    		expect(a).to.equal(2);
    		expect(notebook.tests).to.have.length(1);
    		expect(notebook.failures).to.equal(0);
			done();
		});
    });

    it('creates a script and executes (TDD)', function (done) {

		var a = 0;
    	var script = Lab.script({ schedule: false });
    	script.suite('test', function () {

    		script.before(function (finished) {

    			++a;
    			finished();
    		});

    		script.test('value of a', function (finished) {

    			Lab.expect(a).to.equal(1);
    			finished();
    		});

    		script.after(function (finished) {

    			++a;
    			finished();
    		});
    	});

    	Lab.execute(script, null, null, function (err, notebook) {

    		expect(a).to.equal(2);
    		expect(notebook.tests).to.have.length(1);
    		expect(notebook.failures).to.equal(0);
			done();
		});
    });

    it('executes beforeEach and afterEach', function (done) {

		var a = 0;
		var b = 0;
    	var script = Lab.script({ schedule: false });
    	script.experiment('test', function () {

    		script.before(function (finished) {

    			++a;
    			finished();
    		});

    		script.beforeEach(function (finished) {

    			++b;
    			finished();
    		});

    		script.test('value of a', function (finished) {

    			Lab.expect(a).to.equal(1);
    			Lab.expect(b).to.equal(1);
    			finished();
    		});

    		script.test('value of b', function (finished) {

    			Lab.expect(a).to.equal(1);
    			Lab.expect(b).to.equal(3);
    			finished();
    		});

    		script.after(function (finished) {

    			++a;
    			finished();
    		});

    		script.afterEach(function (finished) {

    			++b;
    			finished();
    		});
    	});

    	Lab.execute(script, null, null, function (err, notebook) {

    		expect(a).to.equal(2);
    		expect(b).to.equal(4);
    		expect(notebook.tests).to.have.length(2);
    		expect(notebook.failures).to.equal(0);
			done();
		});
    });
});
