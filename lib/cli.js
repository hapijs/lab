'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const Bossy = require('bossy');
const Hoek = require('hoek');
const Coverage = require('./coverage');
const Pkg = require('../package.json');
const Runner = require('./runner');
const Transform = require('./transform');
const Utils = require('./utils');


// Declare internals

const internals = {};


exports.run = function () {

    const settings = internals.options();
    settings.coveragePath = Path.join(process.cwd(), settings['coverage-path'] || '');
    settings.coverageExclude = settings['coverage-exclude'] || ['test', 'node_modules'];
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

    testFiles = testFiles.map((path) => {

        return Path.resolve(path);
    });

    const scripts = [];
    if (testFiles.length) {
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
    }

    return scripts;
};


internals.options = function () {

    const definition = {
        assert: {
            alias: 'a',
            type: 'string',
            description: 'specify an assertion library module path to require and make available under Lab.assertions'
        },
        colors: {
            alias: 'C',
            type: 'boolean',
            default: null,
            description: 'enable color output (defaults to terminal capabilities)'
        },
        'context-timeout': {
            alias: 'M',
            type: 'number',
            description: 'timeout for before, after, beforeEach, afterEach in milliseconds'
        },
        coverage: {
            alias: 'c',
            type: 'boolean',
            description: 'enable code coverage analysis'
        },
        'coverage-path': {
            type: 'string',
            description: 'set code coverage path'
        },
        'coverage-exclude': {
            type: 'string',
            description: 'set code coverage excludes'
        },
        debug: {
            alias: 'D',
            type: 'boolean',
            default: false,
            description: 'print the stack during a domain error event'
        },
        dry: {
            alias: 'd',
            type: 'boolean',
            description: 'skip all tests (dry run)'
        },
        environment: {
            alias: 'e',
            type: 'string',
            description: 'value to set NODE_ENV before tests',
            default: 'test'
        },
        flat: {
            alias: 'f',
            type: 'boolean',
            description: 'prevent recursive collection of tests within the provided path'
        },
        globals: {
            alias: ['I', 'ignore'],
            type: 'string',
            description: 'ignore a list of globals for the leak detection (comma separated)'
        },
        grep: {
            alias: 'g',
            type: 'string',
            description: 'only run tests matching the given pattern which is internally compiled to a RegExp'
        },
        help: {
            alias: 'h',
            type: 'boolean',
            description: 'display usage options'
        },
        id: {
            alias: 'i',
            type: 'range',
            description: 'test identifier'
        },
        leaks: {
            alias: 'l',
            type: 'boolean',
            description: 'disable global variable leaks detection'
        },
        lint: {
            alias: 'L',
            type: 'boolean',
            description: 'enable linting'
        },
        linter: {
            alias: 'n',
            type: 'string',
            description: 'linter to use',
            default: 'eslint',
            valid: ['eslint', 'jslint']
        },
        'lint-options': {
            type: 'string',
            description: 'specify options to pass to linting program. It must be a string that is JSON.parse(able).'
        },
        'lint-errors-threshold': {
            type: 'number',
            description: 'linter errors threshold in absolute value',
            default: 0
        },
        'lint-warnings-threshold': {
            type: 'number',
            description: 'linter warnings threshold in absolute value',
            default: 0
        },
        output: {
            alias: 'o',
            type: 'string',
            description: 'file path to write test results'
        },
        parallel: {
            alias: 'p',
            type: 'boolean',
            description: 'parallel test execution within each experiment'
        },
        pattern: {
            alias: 'P',
            type: 'string',
            description: 'file pattern to use for locating tests'
        },
        reporter: {
            alias: 'r',
            type: 'string',
            description: 'reporter type [console, html, json, tap, lcov, clover, junit]',
            default: 'console'
        },
        silence: {
            alias: 's',
            type: 'boolean',
            description: 'silence test output'
        },
        sourcemaps: {
            alias: ['S', 'sourcemaps'],
            type: 'boolean',
            description: 'enable support for sourcemaps'
        },
        threshold: {
            alias: 't',
            type: 'number',
            description: 'code coverage threshold percentage'
        },
        timeout: {
            alias: 'm',
            type: 'number',
            description: 'timeout for each test in milliseconds'
        },
        transform: {
            alias: ['T', 'transform'],
            type: 'string',
            description: 'javascript file that exports an array of objects ie. [ { ext: ".js", transform: function (content, filename) { ... } } ]'
        },
        verbose: {
            alias: 'v',
            type: 'boolean',
            description: 'verbose test output'
        },
        version: {
            alias: 'V',
            type: 'boolean',
            description: 'version information'
        }
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

    const options = {
        paths: argv._ ? [].concat(argv._) : ['test']
    };

    if (argv.assert) {
        options.assert = require(argv.assert);
        require('./').assertions = options.assert;
    }

    const keys = ['coverage', 'coverage-path', 'coverage-exclude', 'colors', 'dry', 'debug', 'environment', 'flat',
        'grep', 'globals', 'timeout', 'parallel', 'pattern', 'reporter', 'threshold', 'context-timeout', 'sourcemaps',
        'lint', 'linter', 'transform', 'lint-options', 'lint-errors-threshold', 'lint-warnings-threshold'];
    for (let i = 0; i < keys.length; ++i) {
        if (argv.hasOwnProperty(keys[i]) && argv[keys[i]] !== undefined) {
            options[keys[i]] = argv[keys[i]];
        }
    }

    options.environment = options.environment && options.environment.trim();
    options.leaks = !argv.leaks;
    options.output = argv.output || process.stdout;
    options.coverage = (options.coverage || options.threshold > 0 || options.reporter.indexOf('html') !== -1 || options.reporter.indexOf('lcov') !== -1 || options.reporter.indexOf('clover') !== -1);

    if (Array.isArray(options.reporter) && argv.output) {
        if (!Array.isArray(argv.output) || options.output.length !== options.reporter.length) {
            console.error(Bossy.usage(definition, 'lab [options] [path]'));
            process.exit(1);
        }
    }

    if (options.globals) {
        options.globals = options.globals.trim().split(',');
    }

    if (argv.silence) {
        options.progress = 0;
    }
    else if (argv.verbose) {
        options.progress = 2;
    }

    if (argv.id) {
        options.ids = argv.id;
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

    return options;
};

internals.mapTransform = function (transform) {

    return transform.ext.substr(1).replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
};
