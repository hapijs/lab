// Load modules

var Path = require('path');
var Fs = require('fs');
var Optimist = require('optimist');
var Coverage = require('./coverage');
var Runner = require('./runner');


// Declare internals

var internals = {};


exports.run = function () {

    var options = exports.options();

    if (options.coverage) {
        Coverage.instrument();
    }

    var experiments = internals.traverse(options.paths);
    return Runner.execute(experiments, options);
};


internals.traverse = function (paths) {

    // Collect filenames using provided list of files or directories

    var traverse = function (path) {

        var files = [];

        var stat = Fs.statSync(path);
        if (stat.isFile()) {
            return path;
        }

        Fs.readdirSync(path).forEach(function (file) {

            file = Path.join(path, file);
            var stat = Fs.statSync(file);
            if (stat.isDirectory()) {
                files = files.concat(traverse(file));
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

    var experiments = [];
    if (testFiles.length) {
        testFiles.forEach(function (file) {

            file = Path.resolve(file);
            var pkg = require(file);
            if (pkg.lab &&
                pkg.lab._root) {

                experiments.push(pkg.lab._root);
            }
        });
    }

    return experiments;
};


exports.options = function () {

    var args = {
        coverage: {
            short: 'c',
            type: 'boolean',
            description: 'enable code coverage analysis'
        },
        color: {
            short: 'C',
            type: 'boolean',
            description: 'force color output'
        },
        dry: {
            short: 'd',
            type: 'boolean',
            description: 'skip all tests (dry run)'
        },
        environment: {
            short: 'e',
            type: 'string',
            description: 'value to set NODE_ENV before tests'
        },
        grep: {
            short: 'g',
            type: 'string',
            description: 'only run tests matching the given pattern which is internally compiled to a RegExp'
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
        var opt = opts[i];
        parser.alias(opt.short, i).describe(opt.short, opt.description);
        if (opt.type === 'boolean') {
            parser.boolean(opt.short);
        }
    }

    var argv = parser.argv;

    if (argv.h || argv.help) {
        Optimist.showHelp();
        process.exit(0);
    }

    var options = {
        paths: argv._.length ? argv._ : ['test']
    };

    var keys = Object.keys(Runner.defaults);
    for (i = 0, il = keys.length; i < il; ++i) {
        options[keys[i]] = (argv.hasOwnProperty(args[keys[i]].short) ? argv[args[keys[i]].short] : Runner.defaults[keys[i]]);
    }

    options.coverage = (options.coverage || options.threshold > 0 || options.reporter === 'html');
    return options;
};
