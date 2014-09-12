// Load modules

var Fs = require('fs');
var Path = require('path');
var Bossy = require('bossy');
var Coverage = require('./coverage');
var Runner = require('./runner');
var Utils = require('./utils');


// Declare internals

var internals = {};


exports.run = function () {

    var settings = internals.options();
    settings.coveragePath = process.cwd();
    settings.coverageExclude = ['test', 'node_modules'];

    if (settings.coverage) {
        Coverage.instrument(settings);
    }

    if (settings.environment) {
        process.env.NODE_ENV = settings.environment;
    }

    var scripts = internals.traverse(settings.paths, settings);
    return Runner.report(scripts, settings);
};


internals.traverse = function (paths, options) {

    var traverse = function (path) {

        var files = [];

        var stat = Fs.statSync(path);
        if (stat.isFile()) {
            return path;
        }

        Fs.readdirSync(path).forEach(function (file) {

            file = Path.join(path, file);
            var stat = Fs.statSync(file);
            if (stat.isDirectory() &&
                !options.flat) {

                files = files.concat(traverse(file, options));
                return;
            }

            if (stat.isFile() &&
                /\.(js)$/.test(file) &&
                Path.basename(file)[0] !== '.') {

                files.push(file);
            }
        });

        return files;
    };

    var testFiles = [];
    paths.forEach(function (path) {

        testFiles = testFiles.concat(traverse(path));
    });

    testFiles = testFiles.map(function (path) {

        return Path.resolve(path);
    });

    var scripts = [];
    if (testFiles.length) {
        testFiles.forEach(function (file) {

            global._labScriptRun = false;
            file = Path.resolve(file);
            var pkg = require(file);
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

    var definition = {
        coverage: {
            alias: 'c',
            type: 'boolean',
            description: 'enable code coverage analysis'
        },
        colors: {
            alias: 'C',
            type: 'boolean',
            default: null,
            description: 'enable color output (defaults to terminal capabilities)'
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
        globals: {
            alias: ['I', 'ignore'],
            type: 'string',
            description: 'ignore a list of globals for the leak detection (comma separated)'
        },
        leaks: {
            alias: 'l',
            type: 'boolean',
            description: 'disable global variable leaks detection'
        },
        timeout: {
            alias: 'm',
            type: 'number',
            description: 'timeout for each test in milliseconds'
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
        reporter: {
            alias: 'r',
            type: 'string',
            description: 'reporter type [console, html, json, junit, tap, lcov, clover]',
            default: 'console',
            valid: ['console', 'html', 'json', 'tap', 'junit', 'tap', 'lcov', 'clover']
        },
        silence: {
            alias: 's',
            type: 'boolean',
            description: 'silence test output'
        },
        threshold: {
            alias: 't',
            type: 'number',
            description: 'code coverage threshold percentage'
        },
        verbose: {
            alias: 'v',
            type: 'boolean',
            description: 'verbose test output'
        }
    };

    var argv = Bossy.parse(definition);

    if (argv instanceof Error) {
        console.error(Bossy.usage(definition, 'lab [options] [path]'));
        console.error('\n' + argv.message);
        process.exit(1);
    }

    if (argv.help) {
        console.log(Bossy.usage(definition, 'lab [options] [path]'));
        process.exit(0);
    }

    var options = {
        paths: argv._ ? [argv._] : ['test']
    };

    var keys = ['coverage', 'colors', 'dry', 'environment', 'flat', 'grep', 'globals', 'timeout', 'parallel', 'reporter', 'threshold'];
    for (var i = 0, il = keys.length; i < il; ++i) {
        if (argv.hasOwnProperty(keys[i])) {
            options[keys[i]] = argv[keys[i]];
        }
    }

    options.environment = options.environment && options.environment.trim();
    options.leaks = !argv.l;
    options.output = argv.o || process.stdout;
    options.coverage = (options.coverage || options.threshold > 0 || options.reporter === 'html' || options.reporter === 'lcov' || options.reporter === 'clover');
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

    return options;
};
