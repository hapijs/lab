'use strict';

// Load modules

const ChildProcess = require('child_process');
const Fs = require('fs');
const Path = require('path');
const Code = require('code');
const Lab = require('../');
const Pkg = require('../package.json');
const _Lab = require('../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('CLI', () => {

    const labPath = Path.join(__dirname, '..', 'bin', '_lab');

    it('runs a single test from the command line', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-m', '2000']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
            done();
        });
    });

    it('runs multiple tests from the command line', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', 'test/cli/simple2.js', '-m', '2000']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('4 tests complete');
            done();
        });
    });

    it('runs a directory of tests from the command line', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-m', '2000']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('10 tests complete');
            done();
        });
    });

    it('exits with code 1 when after function throws', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_throws/throws.js']);
        let outData = '';
        let errData = '';

        cli.stdout.on('data', (data) => {

            outData += data;
        });

        cli.stderr.on('data', (data) => {

            errData += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.not.equal(0);
            done();
        });
    });

    it('exits with code 1 when function returns error with multiple reporters', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_failure/failure.js', '-r', 'console', '-r', 'lcov']);
        let outData = '';
        let errData = '';

        cli.stdout.on('data', (data) => {

            outData += data;
        });

        cli.stderr.on('data', (data) => {

            errData += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.not.equal(0);
            done();
        });
    });

    it('runs tests with multiple reporters', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-r', 'console', '-r', 'lcov']);
        let outData = '';

        cli.stdout.on('data', (data) => {

            outData += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(outData).to.contain('10 tests complete');
            done();
        });
    });

    it('runs tests with a custom reporter starting with .', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-r', './node_modules/lab-event-reporter/index.js']);
        let outData = '';

        cli.stdout.on('data', (data) => {

            outData += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(outData).to.equal('');
            done();
        });
    });

    it('requires a custom reporter from node_modules', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-r', 'lab-event-reporter']);
        let outData = '';

        cli.stdout.on('data', (data) => {

            outData += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(outData).to.equal('');
            done();
        });
    });

    it('displays error message when an unknown reporter is specified', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-r', 'unknown']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            output += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.not.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('Cannot find module');
            done();
        });
    });

    it('displays a domain\'s error stack (-D)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_throws/debug.js', '--debug']);
        let outData = '';
        let errData = '';

        cli.stdout.on('data', (data) => {

            outData += data;
        });

        cli.stderr.on('data', (data) => {

            errData += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.not.equal(0);
            done();
        });
    });

    it('shows the help (-h)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-h']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('Usage: lab [options] [path]');
            done();
        });
    });

    it('shows the version (-V)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-V']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain(Pkg.version);
            done();
        });
    });

    it('ignores the list of predefined globals (-I)', (done) => {

        let output = '';
        const scriptFile = 'global.foo = 1; global.bar = 2';

        Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/leaks.js', '-I', 'foo,bar']);

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('No global variable leaks detected');

            Fs.unlinkSync('./test/cli/leaks.js');
            done();
        });
    });

    it('ignores the list of predefined globals when using --ignore', (done) => {

        let output = '';
        const scriptFile = 'global.foo = 1; global.bar = 2';

        Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/leaks.js', '--ignore', 'foo,bar']);

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('No global variable leaks detected');

            Fs.unlinkSync('./test/cli/leaks.js');
            done();
        });
    });

    it('silences output (-s)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-s']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.not.contain('.');
            done();
        });
    });

    it('displays verbose output (-v)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-v']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2) subtracts two numbers');
            done();
        });
    });

    it('runs a single test (-i 1)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-i', '1']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('runs a range of tests (-i 3-4)', (done) => {

        // The range may need to adjust as new tests are added (if they are skipped for example)
        const cli = ChildProcess.spawn('node', [labPath, 'test/cli', '-i', '3-4']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
            done();
        });
    });

    it('runs in color mode with (-C)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-C']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('\u001b[');
            done();
        });
    });

    it('disables color output when tty doesn\'t support it', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.not.contain('\u001b[');
            done();
        });
    });

    it('defaults to color output when tty supports it', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simpleTty.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('\u001b[');
            done();
        });
    });

    it('uses custom coverage path with the --coverage-path argument', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage/include', '-a', 'code']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            expect(output).to.contain('Coverage: 100.00%');
            done();
        });
    });

    it('uses custom coverage excludes with the --coverage-exclude argument', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_coverage', '-t', '100', '--coverage-exclude', 'test/cli_coverage/exclude', '-a', 'code']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            expect(output).to.contain('Coverage: 96.88% (1/32)');
            expect(output).to.contain('test/cli_coverage/missing.js missing coverage on line(s)');
            done();
        });
    });

    it('doesn\'t fail with coverage when no external file is being tested', (done) => {

        const cli = ChildProcess.spawn(labPath, ['test/cli/simple.js', '-t', '10']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
            expect(output).to.contain('Coverage: 0.00%');
            done();
        });
    });

    it('defaults NODE_ENV environment variable to test', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/environment.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('changes the NODE_ENV based on -e param', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/environment.js', '-e', 'lab']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('runs tests with "only" method when set and reports correct test count', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/only.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('overrides cli options using script', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/override/cli.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('displays error message when a script is detected without an exports.lab', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_no_exports/missingExports.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('includes a lab script that is not exported via exports.lab');
            done();
        });
    });

    it('displays error message when a script is missing exports and other scripts contain them', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_no_exports/']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('includes a lab script that is not exported via exports.lab');
            done();
        });
    });

    it('displays error message when an unknown argument is specified', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-z']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            output += data;
            expect(data).to.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            expect(output).to.contain('Unknown option: z');
            done();
        });
    });

    it('supports junit reporter', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/only.js', '-r', 'junit']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('<testsuite tests="2"');
            done();
        });
    });

    it('outputs to file passed with -o argument', (done) => {

        const outputPath = __dirname + '/_no_exist';
        try {
            Fs.unlinkSync(outputPath);
        }
        catch (err) {

            // Error is ok here
        }

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-m', '2000', '-o', outputPath]);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();

            const file = Fs.readFileSync(outputPath);
            expect(file.toString()).to.contain('No global variable leaks detected');
            Fs.unlinkSync(outputPath);
            done();
        });
    });

    it('loads assertions library', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_assert/assert.js', '-m', '2000', '-a', 'code']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
            done();
        });
    });

    it('only loads files matching pattern (-P)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'test']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('2 tests complete');
            done();
        });
    });

    it('only loads files matching pattern when pattern at beginning of name (-P)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'file']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('3 tests complete');
            done();
        });
    });

    it('loads all files when pattern is empty (-P)', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli_pattern', '-m', '2000', '-a', 'code', '-P', '']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('3 tests complete');
            done();
        });
    });

    it('errors out when unknown module is specified in transform option', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-T', 'not-a-transform-module']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            output += data;
            expect(data).to.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.not.equal(0);
            expect(signal).to.not.exist();
            done();
        });
    });

    it('displays error message when transform module does not export', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, 'test/cli/simple.js', '-m', '2000', '-T', 'test/transform/exclude/lab-noexport']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            output += data;
            expect(data).to.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.not.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('transform module must export');
            done();
        });
    });

    it('uses transforms to run a test', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/transform-test.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            output += data;
            expect(data).to.not.exist();
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('uses transforms to run a test file that has to be transformed', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            output += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('uses transforms to run a test file that has to be transformed with coverage support', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-c', '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js']);
        let output = '';

        cli.stdout.on('data', (data) => {

            output += data;
        });

        cli.stderr.on('data', (data) => {

            output += data;
        });

        cli.once('close', (code, signal) => {

            expect(code).to.equal(0);
            expect(signal).to.not.exist();
            expect(output).to.contain('1 tests complete');
            done();
        });
    });

    it('displays error message when multiple reporters with only one output are specified', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-r', 'console', '-r', 'console', '-o', 'stdout']);
        let output = '';

        cli.once('close', (code, signal) => {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            done();
        });
    });

    it('displays error message when multiple reporters with less outputs are specified', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-r', 'console', '-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout']);
        let output = '';

        cli.once('close', (code, signal) => {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            done();
        });
    });

    it('displays error message when multiple reporters with more outputs are specified', (done) => {

        const cli = ChildProcess.spawn('node', [labPath, '-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout', '-o', 'stdout']);
        let output = '';

        cli.once('close', (code, signal) => {

            expect(code).to.equal(1);
            expect(signal).to.not.exist();
            done();
        });
    });
});
