// Load modules

var Path = require('path');
var Fs = require('fs');
var Optimist = require('optimist');
var Coverage = require('./coverage');
var Runner = require('./runner');


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

            file = Path.resolve(file);
            var pkg = require(file);
            if (pkg.lab &&
                pkg.lab._root) {

                scripts.push(pkg.lab);
            }
        });
    }

    return scripts;
};


internals.options = function () {

    var args = {
        coverage: {
            short: 'c',
            type: 'boolean',
            description: 'enable code coverage analysis'
        },
        colors: {
            short: 'C',
            type: 'boolean',
            default: null,
            description: 'enable color output (defaults to terminal capabilities)'
        },
        dry: {
            short: 'd',
            type: 'boolean',
            description: 'skip all tests (dry run)'
        },
        environment: {
            short: 'e',
            type: 'string',
            description: 'value to set NODE_ENV before tests',
            default: 'test'
        },
        flat: {
            short: 'f',
            type: 'boolean',
            description: 'prevent recursive collection of tests within the provided path'
        },
        grep: {
            short: 'g',
            type: 'string',
            description: 'only run tests matching the given pattern which is internally compiled to a RegExp'
        },
        help: {
            short: 'h',
            type: 'boolean',
            description: 'display usage options'
        },
        id: {
            short: 'i',
            type: 'string',
            description: 'test identifier'
        },
        globals: {
            short: 'I',
            type: 'string',
            description: 'ignore a list of globals for the leak detection (comma separated)'
        },
        leaks: {
            short: 'l',
            type: 'boolean',
            description: 'disable global variable leaks detection'
        },
        timeout: {
            short: 'm',
            type: 'number',
            description: 'timeout for each test in milliseconds'
        },
        output: {
            short: 'o',
            type: 'string',
            description: 'file path to write test results'
        },
        parallel: {
            short: 'p',
            type: 'boolean',
            description: 'parallel test execution within each experiment'
        },
        reporter: {
            short: 'r',
            type: 'string',
            description: 'reporter type [console, html, json, tap]'
        },
        silence: {
            short: 's',
            type: 'boolean',
            description: 'silence test output'
        },
        threshold: {
            short: 't',
            type: 'number',
            description: 'code coverage threshold in percentage'
        },
        verbose: {
            short: 'v',
            type: 'boolean',
            description: 'verbose test output'
        }
    };

    var parser = Optimist.usage('Usage: lab [options] [path]');
    var opts = Object.keys(args);
    for (var i = 0, il = opts.length; i < il; ++i) {
        var key = opts[i];
        var opt = args[key];

        parser.options(opt.short, {
            alias: key,
            describe: opt.description,
            boolean: opt.type === 'boolean',
            default: opt.default
        });
    }

    var argv = parser.argv;

    if (argv.h) {
        Optimist.showHelp();
        process.exit(0);
    }

    var options = {
        paths: argv._.length ? argv._ : ['test']
    };

    var keys = ['coverage', 'colors', 'dry', 'environment', 'flat', 'grep', 'globals', 'timeout', 'parallel', 'reporter', 'threshold'];
    for (i = 0, il = keys.length; i < il; ++i) {
        if (argv.hasOwnProperty(args[keys[i]].short)) {
            options[keys[i]] = argv[args[keys[i]].short];
        }
    }

    options.environment = options.environment && options.environment.trim();
    options.leaks = !argv.l;
    options.output = argv.o || process.stdout;
    options.coverage = (options.coverage || options.threshold > 0 || options.reporter === 'html');
    if (options.globals) {
        options.globals = options.globals.trim().split(',');
    }

    if (argv.s) {
        options.progress = 0;
    }
    else if (argv.v) {
        options.progress = 2;
    }

    if (argv.i) {
        options.ids = [];
        var ids = [].concat(argv.i).join(',');
        var ranges = ids.match(/(?:\d+\-\d+)|(?:\d+)/g);
        for (i = 0, il = ranges.length; i < il; ++i) {
            var range = ranges[i];

            range = range.split('-');
            var from = parseInt(range[0], 10);
            if (range.length === 2) {
                var to = parseInt(range[1], 10);
                if (from > to) {
                    continue;
                }

                for (var r = from; r <= to; ++r) {
                    options.ids.push(r);
                }
            }
            else {
                options.ids.push(from);
            }
        }
    }

    return options;
};
