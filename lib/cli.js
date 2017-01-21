'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const Bossy = require('bossy');
const FindRc = require('find-rc');
const Hoek = require('hoek');
const Coverage = require('./coverage');
const Pkg = require('../package.json');
const Runner = require('./runner');
const Transform = require('./transform');
const Utils = require('./utils');
// .labrc configuration will be required if it exists


// Declare internals

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
        Coverage.instrument(settings);
    }
    else if (settings.transform) {
        Transform.install(settings);
    }

    if (settings.environment) {
        process.env.NODE_ENV = settings.environment;
    }

    if (settings.sourcemaps) {
        let sourceMapOptions = {};

        if (settings.transform) {
            sourceMapOptions = {
                retrieveFile: Transform.retrieveFile
            };
        }

        require('source-map-support').install(sourceMapOptions);
    }

    const scripts = internals.traverse(settings.paths, settings);
    return Runner.report(scripts, settings);
};


internals.traverse = function (paths, options) {

    const traverse = function (path) {

        let files = [];

        const pathStat = Fs.statSync(path);
        if (pathStat.isFile()) {
            return path;
        }

        Fs.readdirSync(path).forEach((filename) => {

            const file = Path.join(path, filename);
            const stat = Fs.statSync(file);
            if (stat.isDirectory() &&
                !options.flat) {

                files = files.concat(traverse(file, options));
                return;
            }

            if (stat.isFile() &&
                options.pattern.test(filename) &&
                Path.basename(file)[0] !== '.') {

                files.push(file);
            }
        });

        return files;
    };

    let testFiles = [];
    paths.forEach((path) => {

        testFiles = testFiles.concat(traverse(path));
    });

    if (options.pattern && !testFiles.length) {
        options.output.write('The pattern provided (-P or --pattern) didn\'t match any files.');
        process.exit(0);
    }

    testFiles = testFiles.map((path) => {

        return Path.resolve(path);
    });

    const scripts = [];
    testFiles.forEach((file) => {

        global._labScriptRun = false;
        file = Path.resolve(file);
        const pkg = require(file);
        if (pkg.lab &&
            pkg.lab._root) {

            scripts.push(pkg.lab);

            if (pkg.lab._cli) {
                Utils.applyOptions(options, pkg.lab._cli);
            }
        }
        else if (global._labScriptRun) {
            options.output.write('The file: ' + file + ' includes a lab script that is not exported via exports.lab');
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
        'coverage-path': {
            type: 'string',
            description: 'set code coverage path',
            default: null
        },
        'coverage-exclude': {
            type: 'string',
            description: 'set code coverage excludes',
            multiple: true,
            default: null
        },
        debug: {
            alias: 'D',
            type: 'boolean',
            description: 'print the stack during a domain error event',
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
        parallel: {
            alias: 'p',
            type: 'boolean',
            description: 'parallel test execution within each experiment',
            default: null
        },
        pattern: {
            alias: 'P',
            type: 'string',
            description: 'file pattern to use for locating tests',
            default: null
        },
        rejections: {
            alias: 'R',
            type: 'boolean',
            description: 'fail test on unhandled Promise rejections',
            default: null
        },
        reporter: {
            alias: 'r',
            type: 'string',
            description: 'reporter type [console, html, json, tap, lcov, clover, junit]',
            multiple: true,
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
        debug: false,
        dry: false,
        environment: 'test',
        flat: false,
        leaks: true,
        lint: false,
        linter: 'eslint',
        'lint-fix': false,
        'lint-errors-threshold': 0,
        'lint-warnings-threshold': 0,
        parallel: false,
        paths: ['test'],
        rejections: false,
        reporter: 'console',
        shuffle: false,
        silence: false,
        'silent-skips': false,
        sourcemaps: false,
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

    const options = Utils.mergeOptions(defaults, internals.rc);
    options.paths = argv._ ? [].concat(argv._) : options.paths;

    const keys = ['assert', 'bail', 'colors', 'context-timeout', 'coverage', 'coverage-exclude',
        'coverage-path', 'debug', 'dry', 'environment', 'flat', 'globals', 'grep',
        'lint', 'lint-errors-threshold', 'lint-fix', 'lint-options', 'lint-warnings-threshold',
        'linter', 'output', 'parallel', 'pattern', 'rejections', 'reporter', 'seed', 'shuffle', 'silence',
        'silent-skips', 'sourcemaps', 'threshold', 'timeout', 'transform', 'verbose'];
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

    if (Array.isArray(options.reporter) && options.output) {
        if (!Array.isArray(options.output) || options.output.length !== options.reporter.length) {
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

    options.pattern = options.pattern ? '.*' + options.pattern + '.*?' : '';
    if (options.transform) {
        const transform = require(Path.resolve(options.transform));

        Hoek.assert(Array.isArray(transform) && transform.length > 0, 'transform module must export an array of objects {ext: ".js", transform: null or function (content, filename)}');
        options.transform = transform;

        const includes = 'js|' + transform.map(internals.mapTransform).join('|');
        const regex = options.pattern + '\\.(' + includes + ')$';
        options.pattern = new RegExp(regex);
    }
    else {
        options.pattern = new RegExp(options.pattern + '\\.(js)$');
    }

    options.coverage = (options.coverage || options.threshold > 0 || options.reporter.indexOf('html') !== -1 || options.reporter.indexOf('lcov') !== -1 || options.reporter.indexOf('clover') !== -1);

    return options;
};

internals.mapTransform = function (transform) {

    return transform.ext.substr(1).replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
};
