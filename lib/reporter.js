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

    var self = this;
    var width = 50;
    var n = -1;             // Discount root experiment

    this.engine = engine;
    this.stats = { tests: 0, passes: 0, failures: 0 };
    this.failures = [];

    engine.on('start', function () {

        self.stats.start = new Date();
        process.stdout.write('\n  ');
    });

    engine.on('pass', function (test) {

        self.stats.passes++;
        if (++n % width == 0) {
            process.stdout.write('\n  ');
        }
        process.stdout.write('.');
    });

    engine.on('fail', function (test, err) {

        test.err = err;
        self.stats.failures++;
        self.failures.push(test);
        if (++n % width == 0) {
            process.stdout.write('\n  ');
        }
        process.stdout.write(internals.color('fail', 'x'));
    });

    engine.on('end', function () {

        self.stats.end = new Date();
        self.stats.duration = new Date() - self.stats.start;
        self.epilogue();
    });

    engine.on('test end', function (test) {

        self.stats.tests++;
    });
};


internals.Console.prototype.epilogue = function () {

    var tests;

    console.log();

    function pluralize(n) {
        return 1 == n ? 'test' : 'tests';
    }

    // failure
    if (this.stats.failures) {
        console.error(internals.color('fail', ' %d of %d %s failed') + internals.color('light', ':'),
                      this.stats.failures,
                      this.stats.tests,
                      pluralize(this.engine.total));

        list(this.failures);
        console.error();
        return;
    }

    // pass
    console.log(internals.color('green', ' %d %s complete') + internals.color('light', ' (%s ms)'),
                this.stats.tests || 0,
                pluralize(this.stats.tests),
                this.stats.duration);
    console.log();
};


function pad(str, len) {
    str = String(str);
    return Array(len - str.length + 1).join(' ') + str;
}


function errorDiff(err, type, escape) {
    return Diff['diff' + type](err.actual, err.expected).map(function (str) {
        if (escape) {
            str.value = str.value
              .replace(/\t/g, '<tab>')
              .replace(/\r/g, '<CR>')
              .replace(/\n/g, '<LF>\n');
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


var list = function (failures) {

    console.error();
    failures.forEach(function (test, i) {

        var fmt = internals.color('error title', '  %s) %s:\n') + internals.color('error message', '     %s') + internals.color('error stack', '\n%s\n');

        var err = test.err;
        var message = err.message || '';
        var stack = err.stack || message;
        var index = stack.indexOf(message) + message.length;
        var msg = stack.slice(0, index);
        var actual = err.actual;
        var expected = err.expected;
        var escape = true;

        // explicitly show diff
        if (err.showDiff) {
            escape = false;
            err.actual = actual = JSON.stringify(actual, null, 2);
            err.expected = expected = JSON.stringify(expected, null, 2);
        }

        // actual / expected diff
        if ('string' == typeof actual && 'string' == typeof expected) {
            var len = Math.max(actual.length, expected.length);

            if (len < 20) msg = errorDiff(err, 'Chars', escape);
            else msg = errorDiff(err, 'Words', escape);

            // linenos
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

            fmt = internals.color('error title', '  %s) %s:\n%s')
              + internals.color('error stack', '\n%s\n');
        }

        // indent stack trace without msg
        stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
        console.error(fmt, (i + 1), test.title, msg, stack);
    });
};


internals.color = function (type, str) {

    if (Tty.isatty(1) && Tty.isatty(2)) {
        return '\u001b[' + internals.colors[type] + 'm' + str + '\u001b[0m';
    }

    return str;
};


exports.Json = exports.json = function (engine, isSilent) {

    var self = this

    var tests = []
      , failures = []
      , passes = [];

    engine.on('test end', function (test) {
        tests.push(test);
    });

    engine.on('pass', function (test) {
        passes.push(test);
    });

    engine.on('fail', function (test, err) {

        test.err = err;
        failures.push(test);
    });

    engine.on('end', function () {
        var cov = global._$jscoverage || {};
        var result = self.cov = map(cov);
        result.tests = tests.map(clean);
        result.failures = failures.map(clean);
        result.passes = passes.map(clean);
        if (isSilent) return;
        process.stdout.write(JSON.stringify(result, null, 2));
    });

    function map(cov) {
        var ret = {
            instrumentation: 'node-jscoverage'
          , sloc: 0
          , hits: 0
          , misses: 0
          , coverage: 0
          , files: []
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
            } else if (data[num] !== undefined) {
                ret.hits++;
                ret.sloc++;
            }

            ret.source[num] = {
                source: line
              , coverage: data[num] === undefined
                ? ''
                : data[num]
            };
        });

        ret.coverage = ret.hits / ret.sloc * 100;

        return ret;
    }

    function clean(test) {

        return {
            title: test.title
          , fullTitle: test.fullTitle()
          , duration: test.duration
        }
    }
};


exports.Html = exports.html = function (engine) {

    var jade = require('jade')
      , file = __dirname + '/html/coverage.jade'
      , str = Fs.readFileSync(file, 'utf8')
      , view = jade.compile(str, { filename: file })
      , self = this;

    exports.Json.call(this, engine, true);

    function coverageClass(n) {

        if (n >= 75) return 'high';
        if (n >= 50) return 'medium';
        if (n >= 25) return 'low';
        return 'terrible';
    }
    engine.on('end', function () {

        process.stdout.write(view({
            cov: self.cov
          , coverageClass: coverageClass
        }));
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

            if (userPkg && userPkg.scripts && userPkg.scripts['travis-cov']) {
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

    engine.on('fail', function (test, err) {

        console.log('Tests failed.\n');

        if (err) {
            var message = err.message || '';
            var stack = err.stack || message;
            var index = stack.indexOf(message) + message.length;
            var msg = stack.slice(0, index);
            var actual = err.actual;
            var expected = err.expected;
            var escape = true;

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

        var globCoverage = (totalHits === 0 || totalSloc === 0) ?
                              0 : totalHits / totalSloc * 100;
        console.log('Coverage: ' + Math.floor(globCoverage) + '%');
        if (globCoverage < options.threshold || isNaN(globCoverage)) {
            console.log('Code coverage below threshold: ' + Math.floor(globCoverage) + ' < ' + options.threshold);
            if (typeof process !== 'undefined') {
                process.exit(1);
            }
            return false;

        } else {
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
            } else if (data[num] !== undefined) {
                ret.hits++;
                ret.sloc++;
            }
        });
        ret.coverage = ret.hits / ret.sloc * 100;

        return [ret.hits, ret.sloc];
    };
};
