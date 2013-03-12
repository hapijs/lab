// Load modules

var Fs = require('fs');
var Diff = require('diff');
var Tty = require('tty');


// Declare internals

var internals = {};


exports.console = function (emitter, options) {

    var width = 50;
    var count = 0;
    var failures = [];

    var color = function (str) {
    
        var colors = {
            'black': 0,
            'gray' : 90,
            'red': 31,
            'green': 32,
            'red-bg': 41,
            'green-bg': 42
        };

        var colorized = str.replace(/#([a-z\-]+)\[([^\]]*)\]/g, function ($0, $1, $2) {
        
            if (Tty.isatty(1) && Tty.isatty(2)) {
                return '\u001b[' + colors[$1] + 'm' + $2 + '\u001b[0m';
            }
            else {
                return $2;
            }
        });

        return colorized;
    };

    emitter.on('test', function (test, err) {

        if (!count) {
            process.stdout.write('\n  ');            
        }
        
        if ((++count - 1) % width === 0) {
            process.stdout.write('\n  ');
        }

        if (err) {
            test.err = err;
            failures.push(test);
            process.stdout.write(color('#red[x]'));
        }
        else {
            process.stdout.write('.');
        }
    });

    emitter.on('end', function (ms) {

        // Success
        
        if (!failures.length) {
            console.log(color('#green[\n\n ' + count + ' tests complete] #gray[(' + ms + ' ms)]\n'));
            return;
        }
        
        // Failure
        
        console.error(color('\n\n #red[' + failures.length + ' of ' + count + ' tests failed]#gray[:]\n'));

        failures.forEach(function (test, i) {

            var format = color('  #black[%s) %s:]\n     #red[%s]\n' + (test.timeout ? '' : '#gray[%s]\n'));

            var message = test.err.message || '';
            var stack = test.err.stack || message;
            var index = stack.indexOf(message) + message.length;
            var msg = stack.slice(0, index);
            var escape = true;

            // Actual vs Expected
            
            if (test.err.showDiff) {
                escape = false;
                test.err.actual = JSON.stringify(test.err.actual, null, 2);
                test.err.expected = JSON.stringify(test.err.expected, null, 2);
            }

            if (typeof test.err.actual === 'string' &&
                typeof test.err.expected === 'string') {

                var len = Math.max(test.err.actual.length, test.err.expected.length);

                var type = (len < 20 ? 'diffChars' : 'diffWords');
                msg = Diff[type](test.err.actual, test.err.expected).map(function (str) {
                    
                    if (escape) {
                        str.value = str.value.replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/\n/g, '\\n\n');
                    }
                    
                    if (str.added || str.removed) {
                        
                        
                        return str.value.split('\n').map(function (segment) {
        
                            return color((str.added ? '#green-bg' : '#red-bg') + '[' + segment + ']');
                        }).join('\n');
                    }
                    
                    return str.value;
                }).join('');

                msg = color('\n#red-bg[actual] #green-bg[expected]\n\n' + msg + '\n');
                msg = msg.replace(/^/gm, '      ');
                format = color('  #black[%s) %s:\n%s]\n' + (test.timeout ? '' : '#gray[%s]\n'));
            }

            stack = stack.slice(index ? index + 1 : index).replace(/^/gm, '  ');
            console.error(format, (i + 1), test.title, msg, (test.timeout ? '' : stack));
        });
        
        console.error();
    });
};


exports.coverage = function (emitter, options) {

    var tests = [];
    var failures = [];
    var passes = [];

    emitter.on('test', function (test, err) {
        
        tests.push(test);
        
        if (err) {
            test.err = err;
            failures.push(test);
        }
        else {
            passes.push(test);
        }
    });

    var map = function (cov) {
        
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
            
            var segmentsA = a.filename.split('/');
            var segmentsB = b.filename.split('/');
            
            var al = segmentsA.length;
            var bl = segmentsB.length;
            
            for (var i = 0; i < al && i < bl; ++i) {
                
                if (segmentsA[i] === segmentsB[i]) {
                    continue;
                }
                
                var lastA = i + 1 === al;
                var lastB = i + 1 === bl;
                
                if (lastA !== lastB) {
                    return lastA ? -1 : 1;
                }
                
                return segmentsA[i] < segmentsB[i] ? -1 : 1;
            }

            return segmentsA.length < segmentsB.length ? -1 : 1;
        });

        if (ret.sloc > 0) {            
            ret.coverage = (ret.hits / ret.sloc) * 100;
        }

        return ret;
    };

    var coverage = function (filename, data) {
        
        var ret = {
            filename: filename.replace(process.cwd() + '/', ''),
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

            if (typeof data.branchData !== 'undefined' &&
                typeof data.branchData[num] !== 'undefined') {

                for (var bi = 0, bl = data.branchData[num].length; bi < bl; ++bi) {
                    if (typeof data.branchData[num][bi] !== 'undefined') {
                        ret.sloc++;

                        if (data.branchData[num][bi].indexOf(true) > -1 &&
                            data.branchData[num][bi].indexOf(false) > -1) {

                            ret.hits++;
                        }
                        else {
                            data[num] = 0;
                            ret.misses++;
                        }
                    }
                }
            }

            ret.source[num] = {
                source: line,
                coverage: data[num] === undefined ? '' : data[num]
            };
        });

        ret.coverage = ret.hits / ret.sloc * 100;
        return ret;
    };

    var clean = function (test) {

        return {
            title: test.title,
            duration: test.duration
        };
    };

    emitter.on('end', function () {

        var cov = map(global._$jscoverage || {});
        cov.tests = tests.map(clean);
        cov.failures = failures.map(clean);
        cov.passes = passes.map(clean);
        
        if (options.dest) {
            options.dest.cov = cov;
            return;
        }
        
        process.stdout.write(JSON.stringify(cov, null, 2));
    });
};


exports.html = function (emitter, options) {

    var Jade = require('jade');
    
    var filename = __dirname + '/html/report.jade';
    var template = Fs.readFileSync(filename, 'utf8');
    var view = Jade.compile(template, { filename: filename });

    options.dest = {};
    exports.coverage(emitter, options);

    emitter.on('end', function () {

        var context = {
            cov: options.dest.cov,
            coverageClass: function (n) { return (n > 75 ? 'high' : (n > 50 ? 'medium' : (n > 25 ? 'low' : 'terrible'))); }
        };
        
        var html = view(context);
        
        if (options.output) {
            Fs.writeFileSync(options.output, html);
            return;
        }
        
        process.stdout.write(html);
    });
};


exports.threshold = function (emitter, options) {
    
    options.dest = {};

    if (options.silence) {
        emitter.on('test', function (test, err) {

            if (err) {
                console.log('Tests failed.\n');
                process.exit(1);
            }
        });
    }
    else {
        exports.console(emitter, options);
    }

    exports.coverage(emitter, options);

    emitter.on('end', function () {

        var coverage = options.dest.cov.coverage;
        console.log('Coverage: ' + coverage.toFixed(2) + '%');
        if (coverage < options.threshold || isNaN(coverage)) {
            console.log('Code coverage below threshold: ' + coverage.toFixed(2) + ' < ' + options.threshold);
            process.exit(1);
        }

        console.log('Coverage succeeded');
    });
};
