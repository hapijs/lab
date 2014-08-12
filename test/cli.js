// Load modules

var ChildProcess = require('child_process');
var Fs = require('fs');
var Path = require('path');
var Stream = require('stream');
var Lab = require('../');
var _Lab = require('../test_runner');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = _Lab.expect;


describe('CLI', function () {

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
            expect(output).to.contain('9 tests complete');
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

            Fs.unlinkSync('./test/cli/leaks.js');
            done();
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

    it('runs in color mode with (-C)', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-C']);
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
            expect(output).to.contain('\u001b[');
            done();
        });
    });

    it('disables color output when tty doesn\'t support it', function (done) {

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
            expect(output).to.not.contain('\u001b[');
            done();
        });
    });

    it('defaults to color output when tty supports it', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simpleTty.js']);
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
            expect(output).to.contain('\u001b[');
            done();
        });
    });

    it('doesn\'t fail with coverage when no external file is being tested', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-t 10']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist;
        });

        cli.on('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist;
            expect(output).to.contain('2 tests complete');
            expect(output).to.contain('Coverage: 0.00%');
            done();
        });
    });

    it('defaults NODE_ENV environment variable to test', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/environment.js']);
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

    it('changes the NODE_ENV based on -e param', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/environment.js', '-e', 'lab']);
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
});
