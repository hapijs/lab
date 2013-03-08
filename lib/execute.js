// Load modules

var Path = require('path');
var Fs = require('fs');
var Optimist = require('optimist');
var Engine = require('./engine');
var Reporter = require('./reporter');
var Lab = require('./');


// Declare internals

var internals = {};


internals.lookupFiles = function (path, recursive) {

    var files = [];

    if (!Fs.existsSync(path)) {
        path += '.js';
    }

    var stat = Fs.statSync(path);
    if (stat.isFile()) {
        return path;
    }

    Fs.readdirSync(path).forEach(function (file) {

        file = Path.join(path, file);
        var stat = Fs.statSync(file);
        if (stat.isDirectory()) {
            if (recursive) {
                files = files.concat(internals.lookupFiles(file, recursive));
            }

            return;
        }

        if (!stat.isFile() || !/\.(js)$/.test(file) || Path.basename(file)[0] == '.') {
            return;
        }

        files.push(file);
    });

    return files;
};


exports.execute = function () {

    var argv = Optimist.usage('Usage: $0 [-c] [-r reporter]')
        .default('r', 'console')
        .argv;

    module.paths.push(process.cwd());
    module.paths.push(Path.join(process.cwd(), 'node_modules'));

    if (argv.c) {
        require('blanket');
    }

    Error.stackTraceLimit = Infinity;

    var files = [];
    if (!argv._.length) {
        argv._.push('test');
    }

    argv._.forEach(function (arg) {

        files = files.concat(internals.lookupFiles(arg, true));
    });

    files = files.map(function (path) {

        return Path.resolve(path);
    });

    if (files.length) {
        files.forEach(function (file) {

            file = Path.resolve(file);
            require(file);
        });
    }

    var engine = new Engine();
    var reporter = new (Reporter[argv.r] || require(argv.r))(engine);

    return engine.run(Lab.root, process.exit);
};


