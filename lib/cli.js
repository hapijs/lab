// Load modules

var Fs = require('fs');
var Path = require('path');
var Bossy = require('bossy');
var Hoek = require('hoek');
var Coverage = require('./coverage');
var Runner = require('./runner');
var Transform = require('./transform');
var Utils = require('./utils');


// Declare internals

var internals = {
    pattern: /\.(js)$/
};


exports.run = function () {

    var settings = internals.options();
    settings.coveragePath = process.cwd();
    settings.coverageExclude = ['test', 'node_modules'];
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
        var sourceMapOptions = {};

        if (settings.transform) {
            sourceMapOptions = {
                retrieveFile: Transform.retrieveFile
            };
        }

        require('source-map-support').install(sourceMapOptions);
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
                internals.pattern.test(file) &&
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
        assert: {
            alias: 'a',
            type: 'string',
            description: 'specify an assertion library module path to require and make available under Lab.assertions'
        },
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
        'context-timeout': {
            alias: 'M',
            type: 'number',
            description: 'timeout for before, after, beforeEach, afterEach in milliseconds'
        },
        dry: {
            alias: 'd',
            type: 'boolean',
            description: 'skip all tests (dry run)'
        },
        debug: {
            alias: 'D',
            type: 'boolean',
            default: false,
            description: 'print the stack during a domain error event'
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
            description: 'reporter type [console, html, json, tap, lcov, clover, junit]',
            default: 'console',
            valid: ['console', 'html', 'json', 'tap', 'lcov', 'clover', 'junit']
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
        transform: {
            alias: ['T', 'transform'],
            type: 'string',
            description: 'javascript file that exports an array of objects ie. [ { ext: ".js", transform: function (content, filename) { ... } } ]'
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
        paths: argv._ ? [].concat(argv._) : ['test']
    };

    if (argv.assert) {
        options.assert = require(argv.assert);
        require('./').assertions = options.assert;
    }

    var keys = ['coverage', 'colors', 'dry', 'debug', 'environment', 'flat', 'grep', 'globals', 'timeout', 'parallel', 'reporter', 'threshold', 'context-timeout', 'sourcemaps', 'lint', 'linter', 'transform', 'lint-options'];
    for (var i = 0, il = keys.length; i < il; ++i) {
        if (argv.hasOwnProperty(keys[i]) && argv[keys[i]] !== undefined) {
            options[keys[i]] = argv[keys[i]];
        }
    }

    options.environment = options.environment && options.environment.trim();
    options.leaks = !argv.leaks;
    options.output = argv.output || process.stdout;
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

    if (options.transform) {
        var transform = require(Path.resolve(options.transform));

        Hoek.assert(Array.isArray(transform), 'transform module must export an array of objects {ext: ".js", transform: null or function (content, filename)}');
        options.transform = transform;

        if (transform.length > 0) {
            var includes = 'js|' + transform.map(internals.mapTransform).join('|');
            var regex = '\\.(' + includes + ')$';
            internals.pattern = new RegExp(regex);
        }
    }

    return options;
};

internals.mapTransform = function (transform) {

    return transform.ext.substr(1).replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
};
