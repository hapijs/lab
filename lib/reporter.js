// Load modules

var Fs = require('fs');
var Diff = require('diff');
var Tty = require('tty');


// Declare internals

var internals = {};


internals.colors = {
    'pass': 90,
    'fail': 31,
    'error title': 0,
    'error message': 31,
    'error stack': 90,
    'green': 32,
    'light': 90,
    'diff gutter': 90,
    'diff added': 42,
    'diff removed': 41
};


exports.Console = exports.console = internals.Console = function (engine) {

    var width = 50;
    var count = 0;
    var failures = [];

    engine.on('test', function (test, err) {

        if (!count) {
            process.stdout.write('\n  ');            
        }
        
        if ((++count - 1) % width === 0) {
            process.stdout.write('\n  ');
        }

        if (err) {
            test.err = err;
            failures.push(test);
            process.stdout.write(internals.color('fail', 'x'));
        }
        else {
            process.stdout.write('.');
        }
    });

    engine.on('end', function (ms) {

        // Some failed
        
        if (!failures.length) {
            console.log(internals.color('green', '\n\n ' + count + ' tests complete') + internals.color('light', ' (' + ms + ' ms)\n'));
            return;
        }
        
        console.error(internals.color('fail', '\n\n ' + failures.length + ' of ' + count + ' tests failed') + internals.color('light', ':\n'));

        failures.forEach(function (test, i) {

            var fmt = internals.color('error title', '  %s) %s:\n') + internals.color('error message', '     %s\n') + (test.timeout ? '' : internals.color('error stack', '%s\n'));

            var message = test.err.message || '';
            var stack = test.err.stack || message;
            var index = stack.indexOf(message) + message.length;
            var msg = stack.slice(0, index);
            var escape = true;

            if (test.err.showDiff) {
                escape = false;
                test.err.actual = JSON.stringify(test.err.actual, null, 2);
                test.err.expected = JSON.stringify(test.err.expected, null, 2);
            }

            if ('string' == typeof test.err.actual && 'string' == typeof test.err.expected) {
                var len = Math.max(test.err.actual.length, test.err.expected.length);

                if (len < 20) {
                    msg = errorDiff(test.err, 'Chars', escape);
                }
                else {
                    msg = errorDiff(test.err, 'Words', escape);
                }

                var lines = msg.split('\n');
                if (lines.length > 4) {
                    var width = String(lines.length).length;
                    msg = lines.map(function (str, i) {
                        
                        return pad(++i, width) + ' |' + ' ' + str;
                    }).join('\n');
                }

                // legend
                msg = '\n'
                  + internals.color('diff removed', 'actual')
                  + ' '
                  + internals.color('diff added', 'expected')
                  + '\n\n'
                  + msg
                  + '\n';

                // indent
                msg = msg.replace(/^/gm, '      ');

                fmt = internals.color('error title', '  %s) %s:\n%s\n') + (test.timeout ? '' : internals.color('error stack', '%s\n'));
            }

            // indent stack trace without msg
            stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
            console.error(fmt, (i + 1), test.title, msg, (test.timeout ? '' : stack));
        });
        console.error();
    });
};


function pad(str, len) {
    str = String(str);
    return Array(len - str.length + 1).join(' ') + str;
}


function errorDiff(err, type, escape) {
    return Diff['diff' + type](err.actual, err.expected).map(function (str) {
        if (escape) {
            str.value = str.value.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n\n');
        }
        if (str.added) return colorLines('diff added', str.value);
        if (str.removed) return colorLines('diff removed', str.value);
        return str.value;
    }).join('');
}


function colorLines(name, str) {
    return str.split('\n').map(function (str) {
        return internals.color(name, str);
    }).join('\n');
}


internals.color = function (type, str) {

    if (Tty.isatty(1) && Tty.isatty(2)) {
        return '\u001b[' + internals.colors[type] + 'm' + str + '\u001b[0m';
    }

    return str;
};


exports.Json = exports.json = function (engine, isSilent) {

    var self = this

    var tests = [];
    var failures = [];
    var passes = [];

    engine.on('test', function (test, err) {
        
        tests.push(test);
        
        if (err) {
            test.err = err;
            failures.push(test);
        }
        else {
            passes.push(test);
        }
    });

    engine.on('end', function () {

        self.cov = map(global._$jscoverage || {});
        self.cov.tests = tests.map(clean);
        self.cov.failures = failures.map(clean);
        self.cov.passes = passes.map(clean);
                
        if (!isSilent) {
            process.stdout.write(JSON.stringify(self.cov, null, 2));
        }
    });

    function clean(test) {

        return {
            title: test.title,
            duration: test.duration
        };
    }

    function map(cov) {
        
        var ret = {
            instrumentation: 'node-jscoverage',
            sloc: 0,
            hits: 0,
            misses: 0,
            coverage: 0,
            files: []
        };

        for (var filename in cov) {
            var data = coverage(filename, cov[filename]);
            ret.files.push(data);
            ret.hits += data.hits;
            ret.misses += data.misses;
            ret.sloc += data.sloc;
        }

        ret.files.sort(function (a, b) {
            
            return a.filename.localeCompare(b.filename);
        });

        if (ret.sloc > 0) {            
            ret.coverage = (ret.hits / ret.sloc) * 100;
        }

        return ret;
    };

    function coverage(filename, data) {
        
        var ret = {
            filename: filename,
            coverage: 0,
            hits: 0,
            misses: 0,
            sloc: 0,
            source: {}
        };

        data.source.forEach(function (line, num) {
            
            num++;

            if (data[num] === 0) {
                ret.misses++;
                ret.sloc++;
            }
            else if (data[num] !== undefined) {
                ret.hits++;
                ret.sloc++;
            }

            ret.source[num] = {
                source: line,
                coverage: data[num] === undefined ? '' : data[num]
            };
        });

        ret.coverage = ret.hits / ret.sloc * 100;
        return ret;
    }
};


exports.Html = exports.html = function (engine) {

    var self = this;
    
    var Jade = require('jade');
    
    var filename = __dirname + '/html/report.jade';
    var template = Fs.readFileSync(filename, 'utf8');
    var view = Jade.compile(template, { filename: filename });

    exports.Json.call(this, engine, true);

    engine.on('end', function () {

        var context = {
            cov: self.cov,
            coverageClass: function (n) { return (n > 75 ? 'high' : (n > 50 ? 'medium' : (n > 25 ? 'low' : 'terrible'))); }
        };
        
        process.stdout.write(view(context));
    });
};


exports.Coverage = exports.coverage = function (engine) {

    engine.on('end', function () {

        var cov = global._$jscoverage || {};
        var options = {};

        var path = process.cwd() + '/package.json';

        var exists = Fs.existsSync(path);
        if (exists) {
            var userPkg = JSON.parse(Fs.readFileSync(path, 'utf8'));

            if (userPkg &&
                userPkg.scripts && userPkg.scripts['travis-cov']) {
                    
                var userOpts = userPkg.scripts['travis-cov'];
                options.threshold = userOpts.threshold || options.threshold;
                options.global = userOpts.global || options.global;
                options.local = userOpts.local || options.local;
                options.removeKey = userOpts.removeKey;
            }
        }

        if (typeof options.removeKey !== 'undefined') {
            delete cov[options.removeKey];
        }

        check(cov, options);
    });

    engine.on('test', function (test, err) {

        if (!err) {
            return;
        }
        
        console.log('Tests failed.\n');

        if (err) {
            var message = err.message || '';
            var stack = err.stack || message;
            var msg = stack.slice(0, stack.indexOf(message) + message.length);
            console.log(msg + stack);
        }

        process.exit(1);
    });

    var check = function (cov, userOptions) {

        if (!cov) {
            return false;
        }

        var options = {
            threshold: 50
        };

        if (userOptions) {
            options.threshold = userOptions.threshold || options.threshold;
        }

        var totals = [];
        for (var filename in cov) {
            
            var data = cov[filename];
            totals.push(reportFile(data, options));
        }

        var totalHits = 0;
        var totalSloc = 0;
        totals.forEach(function (elem) {
            
            totalHits += elem[0];
            totalSloc += elem[1];
        });

        var globCoverage = (totalHits === 0 || totalSloc === 0) ? 0 : totalHits / totalSloc * 100;
        console.log('Coverage: ' + Math.floor(globCoverage) + '%');
        if (globCoverage < options.threshold || isNaN(globCoverage)) {
            console.log('Code coverage below threshold: ' + Math.floor(globCoverage) + ' < ' + options.threshold);
            if (typeof process !== 'undefined') {
                process.exit(1);
            }
            return false;

        }
        else {
            console.log('Coverage succeeded');
        }
        
        return true;
    };

    var reportFile = function (data, options) {

        var ret = {
            coverage: 0,
            hits: 0,
            misses: 0,
            sloc: 0
        };
        
        data.source.forEach(function (line, num) {
            
            num++;
            if (data[num] === 0) {
                ret.misses++;
                ret.sloc++;
            }
            else if (data[num] !== undefined) {
                ret.hits++;
                ret.sloc++;
            }
        });
        
        ret.coverage = ret.hits / ret.sloc * 100;
        return [ret.hits, ret.sloc];
    };
};
