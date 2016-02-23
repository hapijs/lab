'use strict';

// Load modules

const ChildProcess = require('child_process');
const Fs = require('fs');
const Path = require('path');
const Code = require('code');
const Lab = require('../');
const Pkg = require('../package.json');
const _Lab = require('../test_runner');
const runLab = require('./run_lab');

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

        runLab(['test/cli/simple.js', '-m', '2000']).then((result) => {
            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        }).catch(done);
    });

    it('runs multiple tests from the command line', (done) => {

        runLab(['test/cli/simple.js', 'test/cli/simple2.js', '-m', '2000']).then((result) => {
            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('4 tests complete');
            done();
        }).catch(done);
    });

    it('runs a directory of tests from the command line', (done) => {

        runLab(['test/cli', '-m', '2000']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('9 tests complete');
            done();
        }).catch(done);
    });

    it('exits with code 1 after function throws', (done) => {

        runLab(['test/cli_throws/throws.js']).then((result) => {

            expect(result.code).to.equal(1);
            done();
        }).catch(done);
    });

    it('exits with code 1 when function returns error with multiple reporters', (done) => {

        runLab(['test/cli_failure/failure.js', '-r', 'console', '-r', 'lcov']).then((result) => {

            expect(result.code).to.equal(1);
            done();
        }).catch(done);
    });

    it('runs tests with multiple reporters', (done) => {

        runLab(['test/cli', '-r', 'console', '-r', 'lcov']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('9 tests complete');
            done();
        }).catch(done);
    });

    it('runs tests with a custom reporter starting with .', (done) => {

        runLab(['test/cli', '-r', './node_modules/lab-event-reporter/index.js']).then((result) => {

            expect(result.code).to.equal(0);
            expect(result.combinedOutput).to.equal('');
            done();
        }).catch(done);
    });

    it('requires a custom reporter from node_modules', (done) => {

        runLab(['test/cli', '-r', 'lab-event-reporter']).then((result) => {

            expect(result.code).to.equal(0);
            expect(result.combinedOutput).to.equal('');
            done();
        }).catch(done);
    });

    it('displays error message when an unknown reporter is specified', (done) => {

        runLab(['test/cli', '-r', 'unknown']).then((result) => {

            expect(result.code).to.equal(1);
            expect(result.combinedOutput).to.contain('Cannot find module');
            done();
        }).catch(done);
    });

    it('displays a domain\'s error stack (-D)', (done) => {

        runLab(['test/cli_throws/debug.js', '--debug']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.combinedOutput).to.contain('Test script errors:');
            done();
        }).catch(done);
    });

    it('shows the help (-h)', (done) => {

        runLab(['-h']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('Usage: lab [options] [path]');
            done();
        }).catch(done);
    });

    it('shows the version (-V)', (done) => {

        runLab(['-V']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain(Pkg.version);
            done();
        }).catch(done);
    });

    it('ignores the list of predefined globals (-I)', (done) => {

        let output = '';
        const scriptFile = 'global.foo = 1; global.bar = 2';

        Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        runLab(['test/cli/leaks.js', '-I', 'foo,bar']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('No global variable leaks detected');

            Fs.unlink('./test/cli/leaks.js', done);
        }).catch(done);
    });

    it('ignores the list of predefined globals when using --ignore', (done) => {

        let output = '';
        const scriptFile = 'global.foo = 1; global.bar = 2';

        Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        runLab(['test/cli/leaks.js', '--ignore', 'foo,bar']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('No global variable leaks detected');

            Fs.unlink('./test/cli/leaks.js', done);
        }).catch(done);
    });

    it('silences output (-s)', (done) => {

        runLab(['test/cli/simple.js', '-s']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.not.contain('.');
            done();
        }).catch(done);
    });

    it('displays verbose output (-v)', (done) => {

        runLab(['test/cli/simple.js', '-v']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2) subtracts two numbers');
            done();
        }).catch(done);
    });

    it('runs a single test (-i 1)', (done) => {

        runLab(['test/cli', '-i', '1']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        }).catch(done);
    });

    it('runs a range of tests (-i 3-4)', (done) => {

        // The range may need to adjust as new tests are added (if they are skipped for example)
        runLab(['test/cli', '-i', '3-4']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        }).catch(done);
    });

    it('runs in color mode with (-C)', (done) => {

        runLab(['test/cli/simple.js', '-C']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('\u001b[');
            done();
        }).catch(done);
    });

    it('disables color output when tty doesn\'t support it', (done) => {

        runLab(['test/cli/simple.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.not.contain('\u001b[');
            done();
        }).catch(done);
    });

    it('defaults to color output when tty supports it', (done) => {

        runLab(['test/cli/simpleTty.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('\u001b[');
            done();
        }).catch(done);
    });

    it('uses custom coverage path with the --coverage-path argument', (done) => {

        runLab(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage/include', '-a', 'code']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            expect(result.output).to.contain('Coverage: 100.00%');
            done();
        }).catch(done);
    });

    it('uses custom coverage excludes with the --coverage-exclude argument', (done) => {

        runLab(['test/cli_coverage', '-t', '100', '--coverage-exclude', 'test/cli_coverage/exclude', '-a', 'code']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('1 tests complete');
            expect(result.output).to.contain('Coverage: 96.88% (1/32)');
            expect(result.output).to.contain('test/cli_coverage/missing.js missing coverage on line(s)');
            done();
        }).catch(done);
    });

    it('doesn\'t fail with coverage when no external file is being tested', (done) => {

        runLab(['test/cli/simple.js', '-t', '10']).then((result) => {;
            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('2 tests complete');
            expect(result.output).to.contain('Coverage: 0.00%');
            done();
        }).catch(done);
    });

    it('defaults NODE_ENV environment variable to test', (done) => {

        runLab(['test/cli/environment.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        }).catch(done);
    });

    it('changes the NODE_ENV based on -e param', (done) => {

        runLab(['test/cli/environment.js', '-e', 'lab']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        }).catch(done);
    });

    it('runs tests within a nestd "only" experiment and reports ran and skipped test count', (done) => {

        runLab(['test/cli_only-skip/onlyExperiment.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.output).to.contain('Should execute before 1');
            expect(result.output).to.contain('Should execute beforeEach 1');
            expect(result.output).to.contain('Should execute after 1');
            expect(result.output).to.contain('Should execute afterEach 1');
            expect(result.output).to.contain('Should execute before 2');
            expect(result.output).to.contain('Should execute beforeEach 2');
            expect(result.output).to.contain('Should execute after 2');
            expect(result.output).to.contain('Should execute afterEach 2');
            expect(result.output).to.contain('Should execute before 3');
            expect(result.output).to.contain('Should execute beforeEach 3');
            expect(result.output).to.contain('Should execute after 3');
            expect(result.output).to.contain('Should execute afterEach 3');
            expect(result.output).to.contain('Should execute before 4');
            expect(result.output).to.contain('Should execute beforeEach 4');
            expect(result.output).to.contain('Should execute after 4');
            expect(result.output).to.contain('Should execute afterEach 4');
            expect(result.output).to.contain('3 tests complete (6 skipped)');
            expect(result.code).to.equal(0);
            done();
        }).catch(done);
    });

    it('runs tests within a root "only" experiment and reports ran and skipped test count', (done) => {

        runLab(['test/cli_only-skip/onlyRootExperiment.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.output).to.contain('Should execute before 1');
            expect(result.output).to.contain('Should execute beforeEach 1');
            expect(result.output).to.contain('Should execute after 1');
            expect(result.output).to.contain('Should execute afterEach 1');
            expect(result.output).to.contain('Should execute before 2');
            expect(result.output).to.contain('Should execute beforeEach 2');
            expect(result.output).to.contain('Should execute after 2');
            expect(result.output).to.contain('Should execute afterEach 2');
            expect(result.output).to.contain('Should execute before 3');
            expect(result.output).to.contain('Should execute beforeEach 3');
            expect(result.output).to.contain('Should execute after 3');
            expect(result.output).to.contain('Should execute afterEach 3');
            expect(result.output).to.contain('Should execute before 4');
            expect(result.output).to.contain('Should execute beforeEach 4');
            expect(result.output).to.contain('Should execute after 4');
            expect(result.output).to.contain('Should execute afterEach 4');
            expect(result.output).to.contain('Should execute before 5');
            expect(result.output).to.contain('Should execute beforeEach 5');
            expect(result.output).to.contain('Should execute after 5');
            expect(result.output).to.contain('Should execute afterEach 5');
            expect(result.output).to.contain('Should execute before 6');
            expect(result.output).to.contain('Should execute beforeEach 6');
            expect(result.output).to.contain('Should execute after 6');
            expect(result.output).to.contain('Should execute afterEach 6');
            expect(result.output).to.contain('8 tests complete (1 skipped)');
            expect(result.code).to.equal(0);
            done();
        }).catch(done);
    });

    it('runs "only" test and reports ran and skipped test count', (done) => {

        runLab(['test/cli_only-skip/onlyTest.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.output).to.contain('Should execute before 1');
            expect(result.output).to.contain('Should execute beforeEach 1');
            expect(result.output).to.contain('Should execute after 1');
            expect(result.output).to.contain('Should execute afterEach 1');
            expect(result.output).to.contain('Should execute before 2');
            expect(result.output).to.contain('Should execute beforeEach 2');
            expect(result.output).to.contain('Should execute after 2');
            expect(result.output).to.contain('Should execute afterEach 2');
            expect(result.output).to.contain('Should execute before 3');
            expect(result.output).to.contain('Should execute beforeEach 3');
            expect(result.output).to.contain('Should execute after 3');
            expect(result.output).to.contain('Should execute afterEach 3');
            expect(result.output).to.contain('1 tests complete (8 skipped)');
            expect(result.code).to.equal(0);
            done();
        }).catch(done);
    });

    it('displays error message when there is more than one "only" within one file', (done) => {

        runLab(['test/cli_only-skip/onlyMultiple.js']).then((result) => {

            expect(result.errorOutput).to.contain('Multiple tests are marked as "only":');
            expect(result.code).to.equal(1);
            done();
        }).catch(done);
    });

    it('displays error message when there is more than one "only" accross multiple files', (done) => {

        runLab(['test/cli_only-skip/onlyExperiment.js', 'test/cli_only-skip/onlyTest.js']).then((result) => {

            expect(result.errorOutput).to.contain('Multiple tests are marked as "only":');
            expect(result.code).to.equal(1);
            done();
        }).catch(done);
    });

    it('skips "skip" test and reports ran and skipped test count', (done) => {

        runLab(['test/cli_only-skip/skip.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.output).to.contain('Should execute before 1');
            expect(result.output).to.contain('Should execute beforeEach 1');
            expect(result.output).to.contain('Should execute after 1');
            expect(result.output).to.contain('Should execute afterEach 1');
            expect(result.output).to.contain('Should execute before 2');
            expect(result.output).to.contain('Should execute beforeEach 2');
            expect(result.output).to.contain('Should execute after 2');
            expect(result.output).to.contain('Should execute afterEach 2');
            expect(result.output).to.contain('Should execute before 3');
            expect(result.output).to.contain('Should execute beforeEach 3');
            expect(result.output).to.contain('Should execute after 3');
            expect(result.output).to.contain('Should execute afterEach 3');
            expect(result.output).to.contain('Should execute before 4');
            expect(result.output).to.contain('Should execute beforeEach 4');
            expect(result.output).to.contain('Should execute after 4');
            expect(result.output).to.contain('Should execute afterEach 4');
            expect(result.output).to.contain('Should execute before 5');
            expect(result.output).to.contain('Should execute beforeEach 5');
            expect(result.output).to.contain('Should execute after 5');
            expect(result.output).to.contain('Should execute afterEach 5');
            expect(result.output).to.contain('5 tests complete (4 skipped)');
            expect(result.code).to.equal(0);
            done();
        }).catch(done);
    });

    it('overrides cli options using script', (done) => {

        runLab(['test/override/cli.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        }).catch(done);
    });

    it('displays error message when a script is detected without an exports.lab', (done) => {

        runLab(['test/cli_no_exports/missingExports.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('includes a lab script that is not exported via exports.lab');
            done();
        }).catch(done);
    });

    it('displays error message when a script is missing exports and other scripts contain them', (done) => {

        runLab(['test/cli_no_exports/']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('includes a lab script that is not exported via exports.lab');
            done();
        }).catch(done);
    });

    it('displays error message when an unknown argument is specified', (done) => {

        runLab(['-z']).then((result) => {

            expect(result.errorOutput).to.contain('Unknown option: z');
            expect(result.code).to.equal(1);
            done();
        }).catch(done);
    });

    it('supports junit reporter', (done) => {

        runLab(['test/cli/simple.js', '-r', 'junit']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('<testsuite tests="2"');
            done();
        }).catch(done);
    });

    it('outputs to file passed with -o argument', (done) => {

        const outputPath = __dirname + '/_no_exist';
        try {
            Fs.unlinkSync(outputPath);
        }
        catch (err) {

            // Error is ok here
        }

        runLab(['test/cli/simple.js', '-m', '2000', '-o', outputPath]).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.equal('');
            const file = Fs.readFileSync(outputPath);
            expect(file.toString()).to.contain('No global variable leaks detected');
            Fs.unlink(outputPath, done);
        }).catch(done);
    });

    it('loads assertions library', (done) => {

        runLab(['test/cli_assert/assert.js', '-m', '2000', '-a', 'code']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        }).catch(done);
    });

    it('only loads files matching pattern (-P)', (done) => {

        runLab(['test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'test']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        }).catch(done);
    });

    it('only loads files matching pattern when pattern at beginning of name (-P)', (done) => {

        runLab(['test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'file']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('3 tests complete');
            done();
        }).catch(done);
    });

    it('loads all files when pattern is empty (-P)', (done) => {

        runLab(['test/cli_pattern', '-m', '2000', '-a', 'code', '-P', '']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('3 tests complete');
            done();
        }).catch(done);
    });

    it('errors out when unknown module is specified in transform option', (done) => {

        runLab(['test/cli/simple.js', '-T', 'not-a-transform-module']).then((result) => {

            expect(result.errorOutput).to.contain('Cannot find module');
            expect(result.code).to.equal(1);
            done();
        }).catch(done);
    });

    it('displays error message when transform module does not export', (done) => {

        runLab(['test/cli/simple.js', '-m', '2000', '-T', 'test/transform/exclude/lab-noexport']).then((result) => {

            expect(result.errorOutput).to.contain('transform module must export');
            expect(result.code).to.equal(1);
            done();
        }).catch(done);
    });

    it('uses transforms to run a test', (done) => {

        runLab(['-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/transform-test.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        }).catch(done);
    });

    it('uses transforms to run a test file that has to be transformed', (done) => {

        runLab(['-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        }).catch(done);
    });

    it('uses transforms to run a test file that has to be transformed with coverage support', (done) => {

        runLab(['-c', '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js']).then((result) => {

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        }).catch(done);
    });

    it('displays error message when multiple reporters with only one output are specified', (done) => {

        runLab(['-r', 'console', '-r', 'console', '-o', 'stdout']).then((result) => {

            expect(result.errorOutput).to.contain('Usage');
            expect(result.code).to.equal(1);
            expect(result.output).to.equal('');
            done();
        }).catch(done);
    });

    it('displays error message when multiple reporters with less outputs are specified', (done) => {

        runLab(['-r', 'console', '-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout']).then((result) => {

            expect(result.errorOutput).to.contain('Usage');
            expect(result.code).to.equal(1);
            expect(result.output).to.equal('');
            done();
        }).catch(done);
    });

    it('displays error message when multiple reporters with more outputs are specified', (done) => {

        runLab(['-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout', '-o', 'stdout']).then((result) => {

            expect(result.errorOutput).to.contain('Usage');
            expect(result.code).to.equal(1);
            expect(result.output).to.equal('');
            done();
        }).catch(done);
    });
});
