'use strict';

// Load modules

const ChildProcess = require('child_process');
// eslint-disable-next-line no-redeclare
const Crypto = require('crypto');
const Fs = require('fs');
const Http = require('http');
const Os = require('os');
const Path = require('path');
const Util = require('util');

const Code = require('@hapi/code');
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

const unlink = Util.promisify(Fs.unlink);
const writeFile = Util.promisify(Fs.writeFile);


describe('CLI', () => {

    it('runs a single test from the command line', async () => {

        const result = await RunCli(['test/cli/simple.js', '-m', '2000']);
        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2 tests complete');
    });

    it('runs multiple tests from the command line', async () => {

        const result = await RunCli(['test/cli/simple.js', 'test/cli/simple2.js', '-m', '2000']);
        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('4 tests complete');
    });

    it('runs a directory of tests from the command line', async () => {

        const result = await RunCli(['test/cli', '-m', '2000', '-l']);
        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('9 tests complete');
    });

    it('runs a directory of tests with async code from the command line', async () => {

        const result = await RunCli(['test/cli_multi', '-l', '-v']);
        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2 tests complete');
    });

    it('runs a single test and uses .labrc when found', async () => {

        const result = await RunCli([Path.join(__dirname, 'cli_labrc', 'index.js')], Path.join(__dirname, 'cli_labrc'));

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('sets environment from .labrc.js');
        expect(result.output).to.contain('Coverage: 100');
        expect(result.output).to.contain('Lint: No issues');
        expect(result.output).to.not.contain('Leaks: No issues');
    });

    it('exits with code 1 after function throws', async () => {

        const result = await RunCli(['test/cli_throws/throws.js']);
        expect(result.code).to.equal(1);
    });

    it('handles uncaught exceptions', async () => {

        const result = await RunCli(['test/cli_error/failure.js']);
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('failure.js:26');
        expect(result.output).to.contain('failure.js:35');
        expect(result.output).to.contain('failure.js:46');
        expect(result.output).to.contain('failure.js:74');
        expect(result.output).to.contain('failure.js:107');
        expect(result.output).to.contain('5 of 7 tests failed');
    });

    it('handles parser error', async () => {

        const result = await RunCli(['test/cli_error/parse.js']);
        expect(result.code).to.equal(1);
        expect(result.errorOutput).to.contain('Error requiring file');
        expect(result.errorOutput).to.contain(Path.normalize('cli_error/parse_invalid.js') + ':5');
        expect(result.errorOutput).to.not.contain('UnhandledPromiseRejectionWarning');
    });

    it('(--bail) exits with code 1 running a directory of tests after one fails', async () => {

        const result = await RunCli(['test/cli_bail', '-m', '2000', '--bail']);

        expect(result.code).to.equal(1);
        expect(result.output).to.contain('Expected 1 to equal specified value');
        expect(result.output).to.contain('1 of 2 tests failed');
    });

    it('exits with code 1 when function returns error with multiple reporters', async () => {

        const result = await RunCli(['test/cli_throws/throws.js', '-r', 'console', '-r', 'lcov']);
        expect(result.code).to.equal(1);
    });

    it('runs tests with multiple reporters', async () => {

        const result = await RunCli(['test/cli', '-r', 'console', '-r', 'lcov']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('9 tests complete');
    });

    it('runs tests with a custom reporter starting with .', async () => {

        const result = await RunCli(['test/cli', '-r', './node_modules/lab-event-reporter/index.js']);

        expect(result.code).to.equal(0);
        expect(result.combinedOutput).to.equal('');
    });

    it('requires a custom reporter from node_modules', { timeout: 5e3 }, async () => {

        const result = await RunCli(['test/cli', '-r', 'lab-event-reporter']);

        expect(result.code).to.equal(0);
        expect(result.combinedOutput).to.equal('');
    });

    it('displays error message when an unknown reporter is specified', async () => {

        const result = await RunCli(['test/cli', '-r', 'unknown']);

        expect(result.code).to.equal(1);
        expect(result.combinedOutput).to.contain('Cannot find module');
    });

    it('displays a domain\'s error stack (-D)', async () => {

        const result = await RunCli(['test/cli_throws/debug.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.combinedOutput).to.contain('Test script errors:');
    });

    it('shows the help (-h)', async () => {

        const result = await RunCli(['-h']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('Usage: lab [options] [path]');
    });

    it('shows the version (-V)', async () => {

        const result = await RunCli(['-V']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain(Pkg.version);
    });

    it('ignores the list of predefined globals (-I)', async () => {

        const scriptFile = 'global.foo = 1; global.bar = 2';

        await writeFile(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        const result = await RunCli(['test/cli/leaks.js', '-I', 'foo,bar']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('Leaks: No issues');

        await unlink('./test/cli/leaks.js');
    });

    it('ignores the list of predefined globals when using --ignore', async () => {

        const scriptFile = 'global.foo = 1; global.bar = 2';

        await writeFile(Path.join(__dirname, 'cli', 'leaks.js'), scriptFile);

        const result = await RunCli(['test/cli/leaks.js', '--ignore', 'foo,bar']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('Leaks: No issues');

        await unlink('./test/cli/leaks.js');
    });

    it('starts the inspector with --inspect', { timeout: 3000 }, () => {

        return new Promise((resolve, reject) => {

            const httpServer = new Http.Server(() => { });
            httpServer.listen(0, () => {

                const port = httpServer.address().port;
                httpServer.close(() => startInspector(port));
            });


            const startInspector = function (port) {

                const labPath = Path.join(__dirname, '..', 'bin', 'lab');
                const testPath = Path.join(__dirname, 'cli_inspect');
                const childEnv = Object.assign({}, process.env);
                delete childEnv.NODE_ENV;
                const cli = ChildProcess.spawn('node', [].concat([labPath, testPath, `--inspect=${port}`]), { env: childEnv, cwd: '.' });
                let combinedOutput = '';

                cli.once('error', (err) => {

                    expect(err).to.not.exist();
                });

                cli.stderr.on('data', (data) => {

                    combinedOutput += data;
                });

                cli.stdout.on('data', (data) => {

                    combinedOutput += data;
                });

                cli.once('exit', () => {

                    expect(combinedOutput).to.contain('Debugger listening on').and.to.contain(port.toString());
                    if (!cli.killed) {
                        cli.kill('SIGTERM');
                    }

                    resolve();
                });

                setTimeout(() => {

                    cli.kill();
                }, 1000);
            };
        });
    });

    it('silences output (-s)', async () => {

        const result = await RunCli(['test/cli/simple.js', '-s']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.not.contain('..');
    });

    it('displays verbose output (-v)', async () => {

        const result = await RunCli(['test/cli/simple.js', '-v']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2) subtracts two numbers');
    });

    it('runs a single test (-i 1)', async () => {

        const result = await RunCli(['test/cli', '-i', '1']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
    });

    it('reports the used seed for randomization', async () => {

        const result = await RunCli(['test/cli', '--shuffle']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('seed');
    });

    it('runs a range of tests (-i 3-4)', async () => {

        // The range may need to adjust as new tests are added (if they are skipped for example)
        const result = await RunCli(['test/cli', '-i', '3-4']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2 tests complete');
    });

    it('runs in color mode with (-C)', async () => {

        const result = await RunCli(['test/cli/simple.js', '-C']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('\u001b[');
    });

    it('disables color output when tty doesn\'t support it', async () => {

        const result = await RunCli(['test/cli/simple.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.not.contain('\u001b[');
    });

    it('defaults to color output when tty supports it', async () => {

        const result = await RunCli(['test/cli/simpleTty.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('\u001b[');
    });

    it('defaults to no context-timeout for before functions', { timeout: 4000 }, async () => {

        const result = await RunCli(['test/cli_timeout/before.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('##before##');
    });

    it('can specify context-timeout for before functions', async () => {

        const result = await RunCli(['test/cli_timeout/before.js', '--context-timeout', '500']);

        expect(result.code).to.equal(1);
        expect(result.output).to.not.contain('##before##');
    });

    it('can include files for coverage with the --coverage-path argument', async () => {

        const result = await RunCli(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage/include', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 100.00%');
    });

    it('can exclude directories from coverage with the --coverage-exclude argument', async () => {

        const result = await RunCli(['.', '-t', '100', '--coverage-exclude', 'exclude', '-a', '@hapi/code'], 'test/cli_coverage');

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 90.00% (1/10)');
        expect(result.output).to.contain('missing.js missing coverage on line(s)');
    });

    it('can exclude files from coverage with the --coverage-exclude argument', async () => {

        const result = await RunCli(['.', '-t', '100', '--coverage-exclude', 'missing.js', '--coverage-exclude', 'include/include.js', '--coverage-exclude', 'exclude', '-a', '@hapi/code'], 'test/cli_coverage');

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 0.00% (0/0)');
    });

    it('doesn\'t fail with coverage when no external file is being tested', async () => {

        const result = await RunCli(['test/cli/simple.js', '-t', '100']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('2 tests complete');
        expect(result.output).to.contain('Coverage: 0.00%');
    });

    it('can include all files in coverage with the --coverage-all argument', async () => {

        const result = await RunCli(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage', '--coverage-all', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 86.67%');
    });

    it('reports coverage with --coverage-all and without -c or -t', async () => {

        const result = await RunCli(['test/cli_coverage', '--coverage-path', 'test/cli_coverage', '--coverage-all', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 86.67%');
    });

    it('can prevent recursive coverage inclusion with the --coverage-flat argument', async () => {

        const result = await RunCli(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage', '--coverage-all', '--coverage-flat', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 80.00%');
    });

    it('can still exclude files with the --coverage-all argument', async () => {

        const result = await RunCli(['test/cli_coverage', '-t', '100', '--coverage-exclude', 'missing.js', '--coverage-path', 'test/cli_coverage', '--coverage-all', '--coverage-flat', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 0.00%');
    });

    it('outputs an error when --coverage-flat is used without --coverage-all', async () => {

        const result = await RunCli(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage', '--coverage-flat', '-a', '@hapi/code']);

        expect(result.errorOutput).to.include('The "coverage-flat" option can only be used with "coverage-all"');
    });

    it('matches coverage files using --pattern', async () => {

        const result = await RunCli(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage', '--coverage-all', '--pattern', 'include', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 100.00%');
    });

    it('matches coverage files using --coverage-pattern', async () => {

        const result = await RunCli(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage', '--coverage-all', '--coverage-pattern', '.*?', '--pattern', 'include', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('1 tests complete');
        expect(result.output).to.contain('Coverage: 60.00%');
    });

    it('outputs an error when --coverage-pattern is used without --coverage-all', async () => {

        const result = await RunCli(['test/cli_coverage', '-t', '100', '--coverage-path', 'test/cli_coverage', '--coverage-pattern', 'include', '-a', '@hapi/code']);

        expect(result.errorOutput).to.include('The "coverage-pattern" option can only be used with "coverage-all"');
    });

    it('defaults NODE_ENV environment variable to test', async () => {

        const result = await RunCli(['test/cli/environment.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
    });

    it('changes the NODE_ENV based on -e param', async () => {

        const result = await RunCli(['test/cli/environment.js', '-e', 'lab']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
    });

    it('runs tests within a nested "only" experiment and reports ran and skipped test count', async () => {

        const result = await RunCli(['test/cli_only-skip/onlyExperiment.js']);

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
    });

    it('runs tests within a root "only" experiment and reports ran and skipped test count', async () => {

        const result = await RunCli(['test/cli_only-skip/onlyRootExperiment.js']);

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
    });

    it('runs "only" test and reports ran and skipped test count', async () => {

        const result = await RunCli(['test/cli_only-skip/onlyTest.js']);

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
    });

    it('does not display error message when there is more than one "only" within one file', async () => {

        const result = await RunCli(['test/cli_only-skip/onlyMultiple.js']);

        expect(result.combinedOutput).to.contain('7 skipped');
        expect(result.code).to.equal(0);
    });

    it('does not display error message when there is more than one "only" accross multiple files', async () => {

        const result = await RunCli(['test/cli_only-skip/onlyExperiment.js', 'test/cli_only-skip/onlyTest.js']);

        expect(result.combinedOutput).to.contain('14 skipped');
        expect(result.code).to.equal(0);
    });

    describe('when using multiple reporters', () => {

        let filename;
        beforeEach(() => {

            filename = Path.join(Os.tmpdir(), [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-'));
        });

        afterEach(async () => {

            await unlink(filename);
        });

        it('does not display error message when there is more than one "only" accross multiple files', async () => {

            const result = await RunCli(['-r', 'console', '-o', 'stdout', '-r', 'json', '-o', filename, 'test/cli_only-skip/onlyExperiment.js', 'test/cli_only-skip/onlyTest.js']);

            expect(result.combinedOutput).to.contain('14 skipped');
            expect(result.code).to.equal(0);
        });

        it('displays error message when there is more than one "only" accross multiple files and the first reporter is not console', async () => {

            const result = await RunCli(['-r', 'json', '-o', filename, '-r', 'console', '-o', 'stdout', 'test/cli_only-skip/onlyExperiment.js', 'test/cli_only-skip/onlyTest.js']);

            expect(result.combinedOutput).to.contain('14 skipped');
            expect(result.code).to.equal(0);
        });
    });

    it('skips "skip" test and reports ran and skipped test count', async () => {

        const result = await RunCli(['test/cli_only-skip/skip.js']);

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
    });

    it('overrides cli options using script', async () => {

        const result = await RunCli(['test/override/cli.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
    });

    it('writes error message to stderr when a script is detected without an exports.lab', async () => {

        const result = await RunCli(['test/cli_no_exports/missingExports.js']);

        expect(result.output).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.errorOutput).to.contain('includes a lab script that is not exported via exports.lab');
    });

    it('writes error message to stderr when a script is missing exports and other scripts contain them', async () => {

        const result = await RunCli(['test/cli_no_exports/']);

        expect(result.output).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.errorOutput).to.contain('includes a lab script that is not exported via exports.lab');
    });

    it('displays error message when an unknown argument is specified', async () => {

        const result = await RunCli(['-z']);

        expect(result.errorOutput).to.contain('Unknown option: z');
        expect(result.code).to.equal(1);
    });

    it('supports junit reporter', async () => {

        const result = await RunCli(['test/cli/simple.js', '-r', 'junit']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('<testsuites tests="2"');
        expect(result.output).to.contain('<testsuite name="Test CLI" tests="2"');
    });

    it('outputs to file passed with -o argument', async () => {

        const outputPath = __dirname + '/_no_exist';
        try {
            await unlink(outputPath);
        }
        catch {

            // Error is ok here
        }

        const result = await RunCli(['test/cli/simple.js', '-m', '2000', '-o', outputPath]);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.equal('');
        const file = Fs.readFileSync(outputPath);
        expect(file.toString()).to.contain('Leaks: No issues');
        await unlink(outputPath);
    });

    it('loads assertions library', async () => {

        const result = await RunCli(['test/cli_assert/assert.js', '-m', '2000', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2 tests complete');
    });

    it('only loads files matching pattern (-P)', async () => {

        const result = await RunCli(['test/cli_pattern', '-m', '2000', '-a', '@hapi/code', '-P', 'test']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('2 tests complete');
    });

    it('reports a warning when no files matching the pattern are found', async () => {

        const result = await RunCli(['test/cli_pattern', '-m', '2000', '-a', '@hapi/code', '-P', 'nofiles']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('The pattern provided (-P or --pattern) didn\'t match any files.');
    });

    it('only loads files matching pattern when pattern at beginning of name (-P)', async () => {

        const result = await RunCli(['test/cli_pattern', '-m', '2000', '-a', '@hapi/code', '-P', 'file']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('3 tests complete');
    });

    it('loads all files when pattern is empty (-P)', async () => {

        const result = await RunCli(['test/cli_pattern', '-m', '2000', '-a', '@hapi/code', '-P', '']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('3 tests complete');
    });

    it('errors out when unknown module is specified in transform option', async () => {

        const result = await RunCli(['test/cli/simple.js', '-T', 'not-a-transform-module']);

        expect(result.errorOutput).to.contain('Cannot find module');
        expect(result.code).to.equal(1);
    });

    it('displays error message when transform module does not export', async () => {

        const result = await RunCli(['test/cli/simple.js', '-m', '2000', '-T', 'test/transform/exclude/lab-noexport']);

        expect(result.errorOutput).to.contain('transform module must export');
        expect(result.code).to.equal(1);
    });

    it('uses transforms to run a test', async () => {

        const result = await RunCli(['-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/transform-test.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
    });

    it('uses transforms to run a test file that has to be transformed', async () => {

        const result = await RunCli(['-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
    });

    it('uses transforms to run a test file that has to be transformed with coverage support', async () => {

        const result = await RunCli(['-c', '-T', 'test/transform/exclude/lab-transform', 'test/transform/exclude/ext-test.new.js']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(0);
        expect(result.output).to.contain('1 tests complete');
    });

    it('displays error message when multiple reporters with only one output are specified', async () => {

        const result = await RunCli(['-r', 'console', '-r', 'console', '-o', 'stdout']);

        expect(result.errorOutput).to.contain('Usage');
        expect(result.code).to.equal(1);
        expect(result.output).to.equal('');
    });

    it('displays error message when multiple reporters with less outputs are specified', async () => {

        const result = await RunCli(['-r', 'console', '-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout']);

        expect(result.errorOutput).to.contain('Usage');
        expect(result.code).to.equal(1);
        expect(result.output).to.equal('');
    });

    it('displays error message when multiple reporters with more outputs are specified', async () => {

        const result = await RunCli(['-r', 'console', '-r', 'console', '-o', 'stdout', '-o', 'stdout', '-o', 'stdout']);

        expect(result.errorOutput).to.contain('Usage');
        expect(result.code).to.equal(1);
        expect(result.output).to.equal('');
    });

    it('runs a single test and reports failed test plans', async () => {

        const result = await RunCli(['test/cli_plan/simple.js', '-m', '2000', '-a', '@hapi/code']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('Expected 1 assertions, but found 2');
        expect(result.output).to.contain('1 of 4 tests failed');
    });

    it('runs a single test and reports failed test plans', async () => {

        const result = await RunCli(['test/cli_plan/simple.js', '-m', '2000', '-a', '@hapi/code', '-p', '3']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('Expected 1 assertions, but found 2');
        expect(result.output).to.contain('Expected at least 3 assertions, but found 2');
        expect(result.output).to.contain('2 of 4 tests failed');
    });

    it('runs a single test and fails with a plan and no assertion library', async () => {

        const result = await RunCli(['test/cli_plan/simple.js', '-m', '2000', '-a', '']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('Expected 1 assertions, but no assertion library found');
        expect(result.output).to.contain('3 of 4 tests failed');
    });

    it('runs a single test and fails with a plan and no assertion library', async () => {

        const result = await RunCli(['test/cli_plan/simple.js', '-m', '2000', '-p', '3', '-a', '']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('Expected 1 assertions, but no assertion library found');
        expect(result.output).to.contain('Expected at least 3 assertions, but no assertion library found');
        expect(result.output).to.contain('4 of 4 tests failed');
    });

    it('fails with an unhandled Promise rejection if the specified flag is set', async () => {

        const result = await RunCli(['test/cli_reject_promise/reject_promise.js', '-R']);

        expect(result.code).to.equal(1);
    });

    it('fails with an unhandled exception in onCleanup', async () => {

        const result = await RunCli(['test/cli_oncleanup/throws.js']);

        expect(result.code).to.equal(1);
        expect(result.output).to.contain('1 of 2 tests failed');
        expect(result.output).to.contain('oops');
    });

    it('awaits any pending ticks started by test before starting next test', async () => {

        const { code, output } = await RunCli(['test/cli_nexttick/test.js']);

        expect(code).to.equal(1);
        expect(output).to.contain('does not crash lab');
        expect(output).to.not.contain('has another test');
    });

    it('supports test suites that use ESM.', async () => {

        const result = await RunCli(['test/cli_esm']);

        expect(result.errorOutput).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.output).to.contain('1 of 5 tests failed');

        // Ensure scripts are run together, not independently
        expect(result.output.split('Test duration').length - 1).to.equal(1);
    });

    it('does not allow using coverage with ESM test scripts.', async () => {

        const result = await RunCli(['test/cli_esm', '-c', '--coverage-path', 'test/cli_esm']);

        expect(result.output).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.errorOutput).to.contain('Cannot use code coverage with ES modules. Consider using c8: instructions can be found in lab\'s docs.');
    });

    it('does not allow using transform with ESM test scripts.', async () => {

        const result = await RunCli(['test/cli_esm', '-T', 'test/transform/exclude/lab-transform']);

        expect(result.output).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.errorOutput).to.contain('Cannot use transform with ES modules.');
    });

    it('does not allow using typescript with ESM test scripts.', async () => {

        const result = await RunCli(['test/cli_esm', '--typescript']);

        expect(result.output).to.equal('');
        expect(result.code).to.equal(1);
        expect(result.errorOutput).to.contain('Cannot use typescript with ES modules.');
    });
});
