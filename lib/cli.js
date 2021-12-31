'use strict';

const Fs = require('fs');
const Path = require('path');

const Bossy = require('@hapi/bossy');
const FindRc = require('find-rc');
const Hoek = require('@hapi/hoek');

const Modules = require('./modules');
const Pkg = require('../package.json');
const Runner = require('./runner');

// .labrc configuration will be required if it exists
// index.js required below if setting assertions module


const internals = {};


internals.rcPath = FindRc('lab');
internals.rc = internals.rcPath ? require(internals.rcPath) : {};


exports.run = function () {

    const settings = internals.options();

    settings.coveragePath = Path.join(process.cwd(), settings['coverage-path'] || '');
    settings.coverageExclude = ['node_modules', 'test', 'test_runner'];
    if (settings['coverage-exclude']) {
        settings.coverageExclude = settings.coverageExclude.concat(settings['coverage-exclude']);
    }

    settings.lintingPath = process.cwd();

    if (settings.coverage) {
        Modules.coverage.instrument(settings);
    }
    else if (settings.transform) {
        Modules.transform.install(settings);
    }

    if (settings.environment) {
        process.env.NODE_ENV = settings.environment;
    }

    if (settings.sourcemaps) {
        let sourceMapOptions = {};

        if (settings.transform) {
            sourceMapOptions = {
                retrieveFile: Modules.transform.retrieveFile
            };
        }

        require('source-map-support').install(sourceMapOptions);
    }

    const scripts = internals.traverse(settings.paths, settings);
    return Runner.report(scripts, settings);
};


internals.traverse = function (paths, options) {

    let nextPath = null;
    const traverse = function (path) {

        let files = [];
        nextPath = path;

        const pathStat = Fs.statSync(path);
        if (pathStat.isFile()) {
            return path;
        }

        Fs.readdirSync(path).forEach((filename) => {

            nextPath = Path.join(path, filename);
            const stat = Fs.statSync(nextPath);
            if (stat.isDirectory() &&
                !options.flat) {

                files = files.concat(traverse(nextPath, options));
                return;
            }

            if (stat.isFile() &&
                options.pattern.test(filename) &&
                Path.basename(nextPath)[0] !== '.') {

                files.push(nextPath);
            }
        });

        return files;
    };

    let testFiles = [];
    try {
        paths.forEach((path) => {

            testFiles = testFiles.concat(traverse(path));
        });
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }

        console.error('Could not find test file or directory \'' + nextPath + '\'.');
        process.exit(1);
    }

    if (options.pattern &&
        !testFiles.length) {

        console.log('The pattern provided (-P or --pattern) didn\'t match any files.');
        process.exit(0);
    }

    testFiles = testFiles.map((path) => {

        return Path.resolve(path);
    });

    const scripts = [];
    testFiles.forEach((file) => {

        global._labScriptRun = false;
        file = Path.resolve(file);

        try {
            require(file);
        }
        catch (ex) {
            console.error(`Error requiring file: ${file}`);
            console.error(`${ex.message}`);
            console.error(`${ex.stack}`);
            return process.exit(1);
        }

        const pkg = require(file);

        if (pkg.lab &&
            pkg.lab._root) {

            scripts.push(pkg.lab);

            if (pkg.lab._cli) {
                Object.assign(options, pkg.lab._cli);
            }
        }
        else if (global._labScriptRun) {
            console.error(`The file: ${file} includes a lab script that is not exported via exports.lab`);
            return process.exit(1);
        }
    });

    return scripts;
};


internals.options = function () {

    const definition = {
        assert: {
            alias: 'a',
            type: 'string',
            description: 'specify an assertion library module path to require and make available under Lab.assertions',
            default: null
        },
        bail: {
            type: 'boolean',
            description: 'exit the process with a non zero exit code on the first test failure',
            default: null
        },
        colors: {
            alias: 'C',
            type: 'boolean',
            description: 'enable color output (defaults to terminal capabilities)',
            default: null
        },
        'context-timeout': {
            alias: 'M',
            type: 'number',
            description: 'timeout for before, after, beforeEach, afterEach in milliseconds',
            default: null
        },
        coverage: {
            alias: 'c',
            type: 'boolean',
            description: 'enable code coverage analysis',
            default: null
        },
        'coverage-all': {
            type: 'boolean',
            description: 'include all files in coveragePath in report',
            default: null
        },
        'coverage-exclude': {
            type: 'string',
            description: 'set code coverage excludes',
            multiple: true,
            default: null
        },
        'coverage-flat': {
            type: 'boolean',
            description: 'prevent recursive inclusion of all files in coveragePath in report',
            default: null
        },
        'coverage-module': {
            type: 'string',
            description: 'enable coverage on external module',
            multiple: true,
            default: null
        },
        'coverage-path': {
            type: 'string',
            description: 'set code coverage path',
            default: null
        },
        'coverage-pattern': {
            type: 'string',
            description: 'file pattern to use for locating files for coverage',
            default: null
        },
        'default-plan-threshold': {
            alias: 'p',
            type: 'number',
            description: 'minimum plan threshold to apply to all tests that don\'t define any plan',
            default: null
        },
        dry: {
            alias: 'd',
            type: 'boolean',
            description: 'skip all tests (dry run)',
            default: null
        },
        environment: {
            alias: 'e',
            type: 'string',
            description: 'value to set NODE_ENV before tests',
            default: null
        },
        flat: {
            alias: 'f',
            type: 'boolean',
            description: 'prevent recursive collection of tests within the provided path',
            default: null
        },
        globals: {
            alias: ['I', 'ignore'],
            type: 'string',
            description: 'ignore a list of globals for the leak detection (comma separated)',
            default: null
        },
        grep: {
            alias: 'g',
            type: 'string',
            description: 'only run tests matching the given pattern which is internally compiled to a RegExp',
            default: null
        },
        help: {
            alias: 'h',
            type: 'boolean',
            description: 'display usage options',
            default: null
        },
        id: {
            alias: 'i',
            type: 'range',
            description: 'test identifier',
            default: null
        },
        inspect: {
            type: 'boolean',
            description: 'starts lab with the node.js native debugger',
            default: null
        },
        leaks: {
            alias: 'l',
            type: 'boolean',
            description: 'disable global variable leaks detection',
            default: null
        },
        lint: {
            alias: 'L',
            type: 'boolean',
            description: 'enable linting',
            default: null
        },
        linter: {
            alias: 'n',
            type: 'string',
            description: 'linter path to use',
            default: null
        },
        'lint-fix': {
            type: 'boolean',
            description: 'apply any fixes from the linter.',
            default: null
        },
        'lint-options': {
            type: 'string',
            description: 'specify options to pass to linting program. It must be a string that is JSON.parse(able).',
            default: null
        },
        'lint-errors-threshold': {
            type: 'number',
            description: 'linter errors threshold in absolute value',
            default: null
        },
        'lint-warnings-threshold': {
            type: 'number',
            description: 'linter warnings threshold in absolute value',
            default: null
        },
        output: {
            alias: 'o',
            type: 'string',
            description: 'file path to write test results',
            multiple: true,
            default: null
        },
        pattern: {
            alias: 'P',
            type: 'string',
            description: 'file pattern to use for locating tests',
            default: null
        },
        reporter: {
            alias: 'r',
            type: 'string',
            description: 'reporter type [console, html, json, tap, lcov, clover, junit]',
            multiple: true,
            default: null
        },
        retries: {
            alias: 'R',
            type: 'number',
            description: 'number of times to retry tests explicitly marked for retry',
            default: null
        },
        seed: {
            type: 'string',
            description: 'use this seed to randomize the order with `--shuffle`. This is useful to debug order dependent test failures',
            default: null
        },
        shuffle: {
            type: 'boolean',
            description: 'shuffle script execution order',
            default: null
        },
        silence: {
            alias: 's',
            type: 'boolean',
            description: 'silence test output',
            default: null
        },
        'silent-skips': {
            alias: 'k',
            type: 'boolean',
            description: 'don’t output skipped tests',
            default: null
        },
        sourcemaps: {
            alias: ['S', 'sourcemaps'],
            type: 'boolean',
            description: 'enable support for sourcemaps',
            default: null
        },
        threshold: {
            alias: 't',
            type: 'number',
            description: 'code coverage threshold percentage',
            default: null
        },
        timeout: {
            alias: 'm',
            type: 'number',
            description: 'timeout for each test in milliseconds',
            default: null
        },
        transform: {
            alias: ['T', 'transform'],
            type: 'string',
            description: 'javascript file that exports an array of objects ie. [ { ext: ".js", transform: function (content, filename) { ... } } ]',
            default: null
        },
        types: {
            alias: ['Y', 'types'],
            type: 'boolean',
            description: 'test types definitions',
            default: null
        },
        'types-test': {
            type: 'string',
            description: 'location of types definitions test file',
            default: null
        },
        typescript: {
            type: 'boolean',
            description: 'Enables TypeScript support',
            default: null
        },
        verbose: {
            alias: 'v',
            type: 'boolean',
            description: 'verbose test output',
            default: null
        },
        version: {
            alias: 'V',
            type: 'boolean',
            description: 'version information',
            default: null
        }
    };

    const defaults = {
        bail: false,
        coverage: false,
        dry: false,
        environment: 'test',
        flat: false,
        leaks: true,
        lint: false,
        linter: 'eslint',
        'lint-fix': false,
        'lint-errors-threshold': 0,
        'lint-warnings-threshold': 0,
        paths: ['test'],
        reporter: 'console',
        retries: 5,
        shuffle: false,
        silence: false,
        'silent-skips': false,
        sourcemaps: false,
        'context-timeout': 0,
        timeout: 2000,
        verbose: false
    };

    const argv = Bossy.parse(definition);

    if (argv instanceof Error) {
        console.error(Bossy.usage(definition, 'lab [options] [path]'));
        console.error('\n' + argv.message);
        process.exit(1);
    }

    if (argv.help) {
        console.log(Bossy.usage(definition, 'lab [options] [path]'));
        process.exit(0);
    }

    if (argv.version) {
        console.log(Pkg.version);
        process.exit(0);
    }

    const options = Object.assign({}, defaults, internals.rc);
    options.paths = argv._ ? [].concat(argv._) : options.paths;

    const keys = ['assert', 'bail', 'colors', 'context-timeout', 'coverage', 'coverage-exclude',
        'coverage-path', 'coverage-all', 'coverage-flat', 'coverage-module', 'coverage-pattern',
        'default-plan-threshold', 'dry', 'environment', 'flat', 'globals', 'grep',
        'lint', 'lint-errors-threshold', 'lint-fix', 'lint-options', 'lint-warnings-threshold',
        'linter', 'output', 'pattern', 'reporter', 'retries', 'seed', 'shuffle', 'silence', 'silent-skips',
        'sourcemaps', 'threshold', 'timeout', 'transform', 'types', 'types-test', 'typescript', 'verbose'];

    for (let i = 0; i < keys.length; ++i) {
        if (argv.hasOwnProperty(keys[i]) && argv[keys[i]] !== undefined && argv[keys[i]] !== null) {
            options[keys[i]] = argv[keys[i]];
        }
    }

    if (typeof argv.leaks === 'boolean') {
        options.leaks = !argv.leaks;
    }

    if (argv.id) {
        options.ids = argv.id;
    }

    if (Array.isArray(options.reporter) &&
        options.output) {

        if (!Array.isArray(options.output) ||
            options.output.length !== options.reporter.length) {

            console.error(Bossy.usage(definition, 'lab [options] [path]'));
            process.exit(1);
        }
    }

    if (!options.output) {
        options.output = process.stdout;
    }

    if (options.assert) {
        options.assert = require(options.assert);
        require('./').assertions = options.assert;
    }

    if (options.globals) {
        options.globals = options.globals.trim().split(',');
    }

    if (options.silence) {
        options.progress = 0;
    }
    else if (options.verbose) {
        options.progress = 2;
    }

    if (options['types-test']) {
        options.types = true;
    }

    const pattern =  options.pattern ? '.*' + options.pattern + '.*?' : '';

    if (options.typescript) {
        if (options.transform) {
            console.error('Cannot use "typescript" with "transform"');
            process.exit(1);
        }

        if (options.types) {
            console.error('Cannot use "typescript" with "types"');
            process.exit(1);
        }

        options.transform = Modules.typescript.extensions;
        options.sourcemaps = true;
    }

    let exts = '\\.(js)$';
    if (options.transform) {
        const transform = typeof options.transform === 'string' ? require(Path.resolve(options.transform)) : options.transform;

        Hoek.assert(Array.isArray(transform) && transform.length > 0, 'transform module must export an array of objects {ext: ".js", transform: null or function (content, filename)}');
        options.transform = transform;

        const includes = 'js|' + transform.map(internals.mapTransform).join('|');
        exts = '\\.(' + includes + ')$';
    }

    options.pattern = new RegExp(pattern + exts);

    options.coverage = (options.coverage || options.threshold > 0 || options['coverage-all'] || options.reporter.indexOf('html') !== -1 || options.reporter.indexOf('lcov') !== -1 || options.reporter.indexOf('clover') !== -1);
    options.coveragePattern = new RegExp(options['coverage-pattern'] || pattern + exts);

    if (options['coverage-pattern'] && !options['coverage-all']) {
        console.error('The "coverage-pattern" option can only be used with "coverage-all"');
        process.exit(1);
    }

    if (options['coverage-flat'] && !options['coverage-all']) {
        console.error('The "coverage-flat" option can only be used with "coverage-all"');
        process.exit(1);
    }

    return options;
};


internals.mapTransform = function (transform) {

    return transform.ext.substr(1).replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
};
