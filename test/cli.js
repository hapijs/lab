// Load modules
var _Lab = require('../test_runner');
var Path = require('path');
var Lab = require('../');
var ChildProcess = require('child_process');
var Fs = require('fs');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = _Lab.expect;

describe('Cli', function () {
	var labPath = Path.join(__dirname, '..', 'bin', '_lab');

	it('runs a single test from the command line', function (done) {

		var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js']);
		var output = '';

    	cli.stdout.on('data', function (data) {

			output += data;
        });

        cli.stderr.on('data', function (data) {

			expect(data).to.not.exist;
        });

		cli.on('close', function (code, signal) {
			expect(code).to.equal(0);
			expect(signal).to.not.exist;
			expect(output).to.contain('2 tests complete');
			done();
		});
	});

	it('runs a directory of tests from the command line', function (done) {

		var cli = ChildProcess.spawn('node', [labPath,'test/cli']);
		var output = '';

		cli.stdout.on('data', function (data) {

			output += data;
		});

		cli.stderr.on('data', function (data) {

			expect(data).to.not.exist;
		});

		cli.on('close', function (code, signal) {
			expect(code).to.equal(0);
			expect(signal).to.not.exist;
			expect(output).to.contain('6 tests complete');
			done();
		});
	});

	it('shows the help (-h)', function (done) {

		var cli = ChildProcess.spawn('node', [labPath,'-h']);
		var output = '';

		cli.stderr.on('data', function (data) {

			output+= data;
		});

		cli.on('close', function (code, signal) {

			expect(code).to.equal(0);
			expect(signal).to.not.exist;
			expect(output).to.contain('Usage: lab [options] [path]');
			done();
		});
	});

	it('ignores the list of predefined globals (-I)', function (done) {

		var output = '';
		var scriptFile = 'global.foo = 1; global.bar = 2';

		Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

		var cli = ChildProcess.spawn('node', [labPath,'test/cli/leaks.js', '-I', 'foo,bar']);

		cli.stdout.on('data', function (data) {

			output += data;
		});

		cli.stderr.on('data', function (data) {

			expect(data).to.not.exist;
		});

		cli.on('close', function (code, signal) {

			expect(code).to.equal(0);
			expect(signal).to.not.exist;
			expect(output).to.contain('No global variable leaks detected');

			ChildProcess.exec('rm ./test/cli/leaks.js', done);
		});
	});

	it('silences output (-s)', function (done) {

		var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-s']);
		var output = '';

		cli.stdout.on('data', function (data) {

			output += data;
		});

		cli.stderr.on('data', function (data) {

			expect(data).to.not.exist;
		});

		cli.on('close', function (code, signal) {

			expect(code).to.equal(0);
			expect(signal).to.not.exist;
			expect(output).to.not.contain('.');
			done();
		});
	});

	it('displays verbose output (-v)', function (done) {

		var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-v']);
		var output = '';

		cli.stdout.on('data', function (data) {

			output += data;
		});

		cli.stderr.on('data', function (data) {

			expect(data).to.not.exist;
		});

		cli.on('close', function (code, signal) {

			expect(code).to.equal(0);
			expect(signal).to.not.exist;
			expect(output).to.contain('2) subtracts two numbers');
			done();
		});
	});

	it('runs a single test (-i 1)', function (done) {

		var cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-i', '1']);
		var output = '';

		cli.stdout.on('data', function (data) {

			output += data;
		});

		cli.stderr.on('data', function (data) {

			expect(data).to.not.exist;
		});

		cli.on('close', function (code, signal) {

			expect(code).to.equal(0);
			expect(signal).to.not.exist;
			expect(output).to.contain('1 tests complete');
			done();
		});
	});

	it ('runs a range of tests (-i 1-4)', function (done) {

		var cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-i', '1-4']);
		var output = '';

		cli.stdout.on('data', function (data) {

			output += data;
		});

		cli.stderr.on('data', function (data) {

			expect(data).to.not.exist;
		});

		cli.on('close', function (code, signal) {

			expect(code).to.equal(0);
			expect(signal).to.not.exist;
			expect(output).to.contain('4 tests complete');
			done();
		});
	});
});
