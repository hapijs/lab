// Load modules

var ChildProcess = require('child_process');
var Fs = require('fs');
var Path = require('path');
var Code = require('code');
var Lab = require('../');
var Pkg = require('../package.json');
var _Lab = require('../test_runner');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('CLI', function () {

    var labPath = Path.join(__dirname, '..', 'bin', '_lab');

    it('runs a single test from the command line', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-m', '2000']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
            done();
        });
    });

    it('runs multiple tests from the command line', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', 'test/cli/simple2.js', '-m', '2000']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('4 tests complete');
            done();
        });
    });

    it('runs a directory of tests from the command line', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-m', '2000']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('10 tests complete');
            done();
        });
    });

    it('exits with code 1 when after function throws', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_throws/throws.js']);
        var outData = '';
        var errData = '';

        cli.stdout.on('data', function (data) {

            outData += data;
        });

        cli.stderr.on('data', function (data) {

            errData += data;
        });

        cli.once('close', function (code) {

            expect(code).to.not.equal(0);
            done();
        });
    });

    it('exits with code 1 when function returns error with multiple reporters', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_failure/failure.js', '-r', 'console', '-r', 'lcov']);
        var outData = '';
        var errData = '';

        cli.stdout.on('data', function (data) {

            outData += data;
        });

        cli.stderr.on('data', function (data) {

            errData += data;
        });

        cli.once('close', function (code) {

            expect(code).to.not.equal(0);
            done();
        });
    });

    it('runs tests with multiple reporters', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-r', 'console', '-r', 'lcov']);
        var outData = '';

        cli.stdout.on('data', function (data) {

            outData += data;
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(outData).to.contain('10 tests complete');
            done();
        });
    });

    it('runs tests with a custom reporter starting with .', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-r', './node_modules/lab-event-reporter/index.js']);
        var outData = '';

        cli.stdout.on('data', function (data) {

            outData += data;
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(outData).to.equal('');
            done();
        });
    });

    it('requires a custom reporter from node_modules', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-r', 'lab-event-reporter']);
        var outData = '';

        cli.stdout.on('data', function (data) {

            outData += data;
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(outData).to.equal('');
            done();
        });
    });

    it('displays error message when an unknown reporter is specified', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-r', 'unknown']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            output += data;
        });

        cli.once('close', function (code, signal) {

            expect(code).to.not.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('Cannot find module');
            done();
        });
    });

    it('displays a domain\'s error stack (-D)', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_throws/debug.js', '--debug']);
        var outData = '';
        var errData = '';

        cli.stdout.on('data', function (data) {

            outData += data;
        });

        cli.stderr.on('data', function (data) {

            errData += data;
        });

        cli.once('close', function (code) {

            expect(code).to.not.equal(0);
            done();
        });
    });

    it('shows the help (-h)', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-h']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('Usage: lab [options] [path]');
            done();
        });
    });

    it('shows the version (-V)', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-V']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain(Pkg.version);
            done();
        });
    });

    it('ignores the list of predefined globals (-I)', function (done) {

        var output = '';
        var scriptFile = 'global.foo = 1; global.bar = 2';

        Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/leaks.js', '-I', 'foo,bar']);

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('No global variable leaks detected');

            Fs.unlinkSync('./test/cli/leaks.js');
            done();
        });
    });

    it('ignores the list of predefined globals when using --ignore', function (done) {

        var output = '';
        var scriptFile = 'global.foo = 1; global.bar = 2';

        Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/leaks.js', '--ignore', 'foo,bar']);

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
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

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
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

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
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

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('runs a range of tests (-i 3-4)', function (done) {

        // The range may need to adjust as new tests are added (if they are skipped for example)
        var cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-i', '3-4']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
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

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
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

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
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

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('\u001b[');
            done();
        });
    });

    it('uses custom coverage path with the --coverage-path argument', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage/include', '-a', 'code']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            expect(output).to.contain('Coverage: 100.00%');
            done();
        });
    });

    it('uses custom coverage excludes with the --coverage-exclude argument', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_coverage', '-t', '100', '--coverage-exclude', 'test/cli_coverage/exclude', '-a', 'code']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            expect(output).to.contain('Coverage: 96.55% (1/29)');
            expect(output).to.contain('test/cli_coverage/missing.js missing coverage on line(s)');
            done();
        });
    });

    it('doesn\'t fail with coverage when no external file is being tested', function (done) {

        var cli = ChildProcess.spawn(labPath, ['test/cli/simple.js', '-t', '10']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
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

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
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

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('runs tests with "only" method when set and reports correct test count', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/only.js']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('overrides cli options using script', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/override/cli.js']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('displays error message when a script is detected without an exports.lab', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_no_exports/missingExports.js']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('includes a lab script that is not exported via exports.lab');
            done();
        });
    });

    it('displays error message when a script is missing exports and other scripts contain them', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_no_exports/']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('includes a lab script that is not exported via exports.lab');
            done();
        });
    });

    it('displays error message when an unknown argument is specified', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-z']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            output += data;
            expect(data).to.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('Unknown option: z');
            done();
        });
    });

    it('supports junit reporter', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/only.js', '-r', 'junit']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('<testsuite tests="2"');
            done();
        });
    });

    it('outputs to file passed with -o argument', function (done) {

        var outputPath = __dirname + '/_no_exist';
        try {
            Fs.unlinkSync(outputPath);
        }
        catch (err) {

            // Error is ok here
        }

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-m', '2000', '-o', outputPath]);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();

            var file = Fs.readFileSync(outputPath);
            expect(file.toString()).to.contain('No global variable leaks detected');
            Fs.unlinkSync(outputPath);
            done();
        });
    });

    it('loads assertions library', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_assert/assert.js', '-m', '2000', '-a', 'code']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
            done();
        });
    });

    it('only loads files matching pattern (-P)', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'test']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
            done();
        });
    });

    it('only loads files matching pattern when pattern at beginning of name (-P)', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'file']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('3 tests complete');
            done();
        });
    });

    it('loads all files when pattern is empty (-P)', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli_pattern', '-m', '2000', '-a', 'code', '-P', '']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('3 tests complete');
            done();
        });
    });

    it('errors out when unknown module is specified in transform option', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-T', 'not-a-transform-module']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            output += data;
            expect(data).to.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.not.equal(0);
            expect(signal).to.not.exist();
            done();
        });
    });

    it('displays error message when transform module does not export', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-m', '2000', '-T', 'test/transform/exclude/lab-noexport']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            output += data;
            expect(data).to.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.not.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('transform module must export');
            done();
        });
    });

    it('uses transforms to run a test', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/transform-test.js']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            output += data;
            expect(data).to.not.exist();
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('uses transforms to run a test file that has to be transformed', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            output += data;
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('uses transforms to run a test file that has to be transformed with coverage support', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-c', '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js']);
        var output = '';

        cli.stdout.on('data', function (data) {

            output += data;
        });

        cli.stderr.on('data', function (data) {

            output += data;
        });

        cli.once('close', function (code, signal) {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('displays error message when multiple reporters with only one output are specified', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-r', 'console', '-r', 'console', '-o', 'stdout']);
        var output = '';

        cli.once('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            done();
        });
    });

    it('displays error message when multiple reporters with less outputs are specified', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-r', 'console', '-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout']);
        var output = '';

        cli.once('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            done();
        });
    });

    it('displays error message when multiple reporters with more outputs are specified', function (done) {

        var cli = ChildProcess.spawn('node', [labPath, '-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout', '-o', 'stdout']);
        var output = '';

        cli.once('close', function (code, signal) {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            done();
        });
    });
});
