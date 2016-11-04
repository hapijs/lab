'use strict';

// Load modules

const Crypto = require('crypto');
const Fs = require('fs');
const Os = require('os');
const Path = require('path');
const Code = require('code');
const Pkg = require('../package.json');
const _Lab = require('../test_runner');
const RunCli = require('./run_cli');

// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const afterEach = lab.afterEach;
const expect = Code.expect;


describe('CLI', () => {

    it('runs a single test from the command line', (done) => {

        RunCli(['test/cli/simple.js', '-m', '2000'], (error, result) => {

            if (error) {
                done(error);
            }
            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        });
    });

    it('runs multiple tests from the command line', (done) => {

        RunCli(['test/cli/simple.js', 'test/cli/simple2.js', '-m', '2000'], (error, result) => {

            if (error) {
                done(error);
            }
            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('4 tests complete');
            done();
        });
    });

    it('runs a directory of tests from the command line', (done) => {

        RunCli(['test/cli', '-m', '2000'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('9 tests complete');
            done();
        });
    });

    it('runs a directory of tests with async code from the command line', (done) => {

        RunCli(['test/cli_multi', '-l', '-v'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        });
    });

    it('runs a single test and uses .labrc when found', (done) => {

        RunCli([Path.join(__dirname, 'cli_labrc', 'index.js')], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            expect(result.output).to.contain('sets environment from .labrc.js');
            expect(result.output).to.contain('Coverage: 100');
            expect(result.output).to.contain('Linting results');
            expect(result.output).to.not.contain('No global variable leaks detected');
            done();
        }, Path.join(__dirname, 'cli_labrc'));
    });

    it('exits with code 1 after function throws', (done) => {

        RunCli(['test/cli_throws/throws.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.code).to.equal(1);
            done();
        });
    });

    it('exits with code 1 when function returns error with multiple reporters', (done) => {

        RunCli(['test/cli_failure/failure.js', '-r', 'console', '-r', 'lcov'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.code).to.equal(1);
            done();
        });
    });

    it('runs tests with multiple reporters', (done) => {

        RunCli(['test/cli', '-r', 'console', '-r', 'lcov'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('9 tests complete');
            done();
        });
    });

    it('runs tests with a custom reporter starting with .', (done) => {

        RunCli(['test/cli', '-r', './node_modules/lab-event-reporter/index.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.code).to.equal(0);
            expect(result.combinedOutput).to.equal('');
            done();
        });
    });

    it('requires a custom reporter from node_modules', (done) => {

        RunCli(['test/cli', '-r', 'lab-event-reporter'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.code).to.equal(0);
            expect(result.combinedOutput).to.equal('');
            done();
        });
    });

    it('displays error message when an unknown reporter is specified', (done) => {

        RunCli(['test/cli', '-r', 'unknown'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.code).to.equal(1);
            expect(result.combinedOutput).to.contain('Cannot find module');
            done();
        });
    });

    it('displays a domain\'s error stack (-D)', (done) => {

        RunCli(['test/cli_throws/debug.js', '--debug'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.combinedOutput).to.contain('Test script errors:');
            done();
        });
    });

    it('debug mode is disabled by default', (done) => {

        RunCli(['test/cli_error/failure.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.combinedOutput).to.not.contain('Test script errors:');
            done();
        });
    });

    it('shows the help (-h)', (done) => {

        RunCli(['-h'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('Usage: lab [options] [path]');
            done();
        });
    });

    it('shows the version (-V)', (done) => {

        RunCli(['-V'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain(Pkg.version);
            done();
        });
    });

    it('ignores the list of predefined globals (-I)', (done) => {

        const scriptFile = 'global.foo = 1; global.bar = 2';

        Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        RunCli(['test/cli/leaks.js', '-I', 'foo,bar'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('No global variable leaks detected');

            Fs.unlink('./test/cli/leaks.js', done);
        });
    });

    it('ignores the list of predefined globals when using --ignore', (done) => {

        const scriptFile = 'global.foo = 1; global.bar = 2';

        Fs.writeFileSync(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        RunCli(['test/cli/leaks.js', '--ignore', 'foo,bar'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('No global variable leaks detected');

            Fs.unlink('./test/cli/leaks.js', done);
        });
    });

    it('silences output (-s)', (done) => {

        RunCli(['test/cli/simple.js', '-s'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.not.contain('.');
            done();
        });
    });

    it('displays verbose output (-v)', (done) => {

        RunCli(['test/cli/simple.js', '-v'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2) subtracts two numbers');
            done();
        });
    });

    it('runs a single test (-i 1)', (done) => {

        RunCli(['test/cli', '-i', '1'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        });
    });

    it('runs a range of tests (-i 3-4)', (done) => {

        // The range may need to adjust as new tests are added (if they are skipped for example)
        RunCli(['test/cli', '-i', '3-4'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        });
    });

    it('runs in color mode with (-C)', (done) => {

        RunCli(['test/cli/simple.js', '-C'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('\u001b[');
            done();
        });
    });

    it('disables color output when tty doesn\'t support it', (done) => {

        RunCli(['test/cli/simple.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.not.contain('\u001b[');
            done();
        });
    });

    it('defaults to color output when tty supports it', (done) => {

        RunCli(['test/cli/simpleTty.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('\u001b[');
            done();
        });
    });

    it('uses custom coverage path with the --coverage-path argument', (done) => {

        RunCli(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage/include', '-a', 'code'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            expect(result.output).to.contain('Coverage: 100.00%');
            done();
        });
    });

    it('uses custom coverage excludes with the --coverage-exclude argument', (done) => {

        RunCli(['.', '-t', '100', '--coverage-exclude', 'exclude', '-a', 'code'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('1 tests complete');
            expect(result.output).to.contain('Coverage: 92.86% (1/14)');
            expect(result.output).to.contain('missing.js missing coverage on line(s)');
            done();
        }, 'test/cli_coverage');
    });

    it('doesn\'t fail with coverage when no external file is being tested', (done) => {

        RunCli(['test/cli/simple.js', '-t', '100'], (error, result) => {

            if (error) {
                done(error);
            }
            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('2 tests complete');
            expect(result.output).to.contain('Coverage: 0.00%');
            done();
        });
    });

    it('defaults NODE_ENV environment variable to test', (done) => {

        RunCli(['test/cli/environment.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        });
    });

    it('changes the NODE_ENV based on -e param', (done) => {

        RunCli(['test/cli/environment.js', '-e', 'lab'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        });
    });

    it('runs tests within a nestd "only" experiment and reports ran and skipped test count', (done) => {

        RunCli(['test/cli_only-skip/onlyExperiment.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.output).to.contain([
                'Should execute before 1',
                'Should execute beforeEach 1',
                'Should execute after 1',
                'Should execute afterEach 1',
                'Should execute before 2',
                'Should execute beforeEach 2',
                'Should execute after 2',
                'Should execute afterEach 2',
                'Should execute before 3',
                'Should execute beforeEach 3',
                'Should execute after 3',
                'Should execute afterEach 3',
                'Should execute before 4',
                'Should execute beforeEach 4',
                'Should execute after 4',
                'Should execute afterEach 4',
                '3 tests complete (6 skipped)'
            ]);
            expect(result.code).to.equal(0);
            done();
        });
    });

    it('runs tests within a root "only" experiment and reports ran and skipped test count', (done) => {

        RunCli(['test/cli_only-skip/onlyRootExperiment.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.output).to.contain([
                'Should execute before 1',
                'Should execute beforeEach 1',
                'Should execute after 1',
                'Should execute afterEach 1',
                'Should execute before 2',
                'Should execute beforeEach 2',
                'Should execute after 2',
                'Should execute afterEach 2',
                'Should execute before 3',
                'Should execute beforeEach 3',
                'Should execute after 3',
                'Should execute afterEach 3',
                'Should execute before 4',
                'Should execute beforeEach 4',
                'Should execute after 4',
                'Should execute afterEach 4',
                'Should execute before 5',
                'Should execute beforeEach 5',
                'Should execute after 5',
                'Should execute afterEach 5',
                'Should execute before 6',
                'Should execute beforeEach 6',
                'Should execute after 6',
                'Should execute afterEach 6',
                '8 tests complete (1 skipped)'
            ]);
            expect(result.code).to.equal(0);
            done();
        });
    });

    it('runs "only" test and reports ran and skipped test count', (done) => {

        RunCli(['test/cli_only-skip/onlyTest.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.output).to.contain([
                'Should execute before 1',
                'Should execute beforeEach 1',
                'Should execute after 1',
                'Should execute afterEach 1',
                'Should execute before 2',
                'Should execute beforeEach 2',
                'Should execute after 2',
                'Should execute afterEach 2',
                'Should execute before 3',
                'Should execute beforeEach 3',
                'Should execute after 3',
                'Should execute afterEach 3',
                '1 tests complete (8 skipped)'
            ]);
            expect(result.code).to.equal(0);
            done();
        });
    });

    it('displays error message when there is more than one "only" within one file', (done) => {

        RunCli(['test/cli_only-skip/onlyMultiple.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.combinedOutput).to.contain('Multiple tests are marked as "only":');
            expect(result.code).to.equal(1);
            done();
        });
    });

    it('displays error message when there is more than one "only" accross multiple files', (done) => {

        RunCli(['test/cli_only-skip/onlyExperiment.js', 'test/cli_only-skip/onlyTest.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.combinedOutput).to.contain('Multiple tests are marked as "only":');
            expect(result.code).to.equal(1);
            done();
        });
    });

    describe('when using multiple reporters', () => {

        let filename;
        beforeEach((done) => {

            filename = Path.join(Os.tmpDir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));
            done();
        });

        afterEach((done) => {

            Fs.unlink(filename, () => done());
        });

        it('displays error message when there is more than one "only" accross multiple files', (done) => {

            RunCli(['-r', 'console', '-o', 'stdout', '-r', 'json', '-o', filename, 'test/cli_only-skip/onlyExperiment.js', 'test/cli_only-skip/onlyTest.js'], (error, result) => {

                if (error) {
                    done(error);
                }

                expect(result.combinedOutput).to.contain('Multiple tests are marked as "only":');
                expect(result.code).to.equal(1);
                done();
            });
        });

        it('displays error message when there is more than one "only" accross multiple files and the first reporter is not console', (done) => {

            RunCli(['-r', 'json', '-o', filename, '-r', 'console', '-o', 'stdout', 'test/cli_only-skip/onlyExperiment.js', 'test/cli_only-skip/onlyTest.js'], (error, result) => {

                if (error) {
                    done(error);
                }

                expect(result.combinedOutput).to.contain('Multiple tests are marked as "only":');
                expect(result.code).to.equal(1);
                done();
            });
        });

        it('displays error message when there is more than one "only" accross multiple files and there’s no console reporter', (done) => {

            RunCli(['-r', 'json', '-o', filename, '-r', 'junit', '-o', filename, 'test/cli_only-skip/onlyExperiment.js', 'test/cli_only-skip/onlyTest.js'], (error, result) => {

                if (error) {
                    done(error);
                }

                expect(result.combinedOutput).to.contain('Multiple tests are marked as "only":');
                expect(result.code).to.equal(1);
                done();
            });
        });
    });

    it('skips "skip" test and reports ran and skipped test count', (done) => {

        RunCli(['test/cli_only-skip/skip.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.output).to.contain([
                'Should execute before 1',
                'Should execute beforeEach 1',
                'Should execute after 1',
                'Should execute afterEach 1',
                'Should execute before 2',
                'Should execute beforeEach 2',
                'Should execute after 2',
                'Should execute afterEach 2',
                'Should execute before 3',
                'Should execute beforeEach 3',
                'Should execute after 3',
                'Should execute afterEach 3',
                'Should execute before 4',
                'Should execute beforeEach 4',
                'Should execute after 4',
                'Should execute afterEach 4',
                'Should execute before 5',
                'Should execute beforeEach 5',
                'Should execute after 5',
                'Should execute afterEach 5',
                '5 tests complete (4 skipped)'
            ]);
            expect(result.code).to.equal(0);
            done();
        });
    });

    it('overrides cli options using script', (done) => {

        RunCli(['test/override/cli.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        });
    });

    it('displays error message when a script is detected without an exports.lab', (done) => {

        RunCli(['test/cli_no_exports/missingExports.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('includes a lab script that is not exported via exports.lab');
            done();
        });
    });

    it('displays error message when a script is missing exports and other scripts contain them', (done) => {

        RunCli(['test/cli_no_exports/'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('includes a lab script that is not exported via exports.lab');
            done();
        });
    });

    it('displays error message when an unknown argument is specified', (done) => {

        RunCli(['-z'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.contain('Unknown option: z');
            expect(result.code).to.equal(1);
            done();
        });
    });

    it('supports junit reporter', (done) => {

        RunCli(['test/cli/simple.js', '-r', 'junit'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('<testsuite tests="2"');
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

        RunCli(['test/cli/simple.js', '-m', '2000', '-o', outputPath], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.equal('');
            const file = Fs.readFileSync(outputPath);
            expect(file.toString()).to.contain('No global variable leaks detected');
            Fs.unlink(outputPath, done);
        });
    });

    it('loads assertions library', (done) => {

        RunCli(['test/cli_assert/assert.js', '-m', '2000', '-a', 'code'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        });
    });

    it('only loads files matching pattern (-P)', (done) => {

        RunCli(['test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'test'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('2 tests complete');
            done();
        });
    });

    it('reports a warning when no files matching the pattern are found', (done) => {

        RunCli(['test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'nofiles'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('The pattern provided (-P or --pattern) didn\'t match any files.');
            done();
        });
    });

    it('only loads files matching pattern when pattern at beginning of name (-P)', (done) => {

        RunCli(['test/cli_pattern', '-m', '2000', '-a', 'code', '-P', 'file'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('3 tests complete');
            done();
        });
    });

    it('loads all files when pattern is empty (-P)', (done) => {

        RunCli(['test/cli_pattern', '-m', '2000', '-a', 'code', '-P', ''], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('3 tests complete');
            done();
        });
    });

    it('errors out when unknown module is specified in transform option', (done) => {

        RunCli(['test/cli/simple.js', '-T', 'not-a-transform-module'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.contain('Cannot find module');
            expect(result.code).to.equal(1);
            done();
        });
    });

    it('displays error message when transform module does not export', (done) => {

        RunCli(['test/cli/simple.js', '-m', '2000', '-T', 'test/transform/exclude/lab-noexport'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.contain('transform module must export');
            expect(result.code).to.equal(1);
            done();
        });
    });

    it('uses transforms to run a test', (done) => {

        RunCli(['-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/transform-test.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        });
    });

    it('uses transforms to run a test file that has to be transformed', (done) => {

        RunCli(['-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        });
    });

    it('uses transforms to run a test file that has to be transformed with coverage support', (done) => {

        RunCli(['-c', '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(0);
            expect(result.output).to.contain('1 tests complete');
            done();
        });
    });

    it('displays error message when multiple reporters with only one output are specified', (done) => {

        RunCli(['-r', 'console', '-r', 'console', '-o', 'stdout'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.contain('Usage');
            expect(result.code).to.equal(1);
            expect(result.output).to.equal('');
            done();
        });
    });

    it('displays error message when multiple reporters with less outputs are specified', (done) => {

        RunCli(['-r', 'console', '-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.contain('Usage');
            expect(result.code).to.equal(1);
            expect(result.output).to.equal('');
            done();
        });
    });

    it('displays error message when multiple reporters with more outputs are specified', (done) => {

        RunCli(['-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout', '-o', 'stdout'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.errorOutput).to.contain('Usage');
            expect(result.code).to.equal(1);
            expect(result.output).to.equal('');
            done();
        });
    });

    it('runs a single test and reports failed test plans', (done) => {

        RunCli(['test/cli_plan/simple.js', '-m', '2000', '-a', 'code'], (error, result) => {

            if (error) {
                done(error);
            }
            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('Expected 1 assertions, but found 2');
            expect(result.output).to.contain('1 of 3 tests failed');
            done();
        });
    });

    it('runs a single test and fails with a plan and no assertion library', (done) => {

        RunCli(['test/cli_plan/simple.js', '-m', '2000'], (error, result) => {

            if (error) {
                done(error);
            }
            expect(result.errorOutput).to.equal('');
            expect(result.code).to.equal(1);
            expect(result.output).to.contain('Expected 1 assertions, but no assertion library found');
            expect(result.output).to.contain('3 of 3 tests failed');
            done();
        });
    });

    it('passes even with an unhandled Promise rejection in the code under test', (done) => {

        RunCli(['test/cli_reject_promise/reject_promise.js'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.code).to.equal(0);
            done();
        });
    });

    it('fails with an unhandled Promise rejection if the specified flag is set', (done) => {

        RunCli(['test/cli_reject_promise/reject_promise.js', '-R'], (error, result) => {

            if (error) {
                done(error);
            }

            expect(result.code).to.equal(1);
            done();
        });
    });
});
