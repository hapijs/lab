// Load modules


// Declare internals

var internals = {};


exports = module.exports = function (emitter, options) {

    emitter.on('end', function (notebook) {

        var tests = notebook.tests;
        var failures = [];
        var passes = [];

        tests.forEach(function (test) {

            if (test.err) {
                failures.push(test);
            }
            else {
                passes.push(test);
            }
        });

        // Process coverage

        var report = global.__$$labCov || {};
        var cov = {
            sloc: 0,
            hits: 0,
            misses: 0,
            coverage: 0,
            files: []
        };

        var covKeys = Object.keys(report);
        for (var ci = 0, cil = covKeys.length; ci < cil; ++ci) {
            var filename = covKeys[ci];
            var data = internals.coverage(filename, report[filename]);

            cov.files.push(data);
            cov.hits += data.hits;
            cov.misses += data.misses;
            cov.sloc += data.sloc;
        }

        // Sort files based on directory structure

        cov.files.sort(function (a, b) {

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

        // Calculate coverage percentage

        if (cov.sloc > 0) {
            cov.coverage = (cov.hits / cov.sloc) * 100;
        }

        // Clean results

        var clean = function (test) {

            var cleaned = {
                title: test.title,
                duration: test.duration
            };

            if (options.verbose &&
                test.err) {

                cleaned.error = {
                    message: test.err.message,
                    stack: test.err.stack || test.err.message,
                    actual: test.err.actual,
                    expected: test.err.expected
                };
            }

            return cleaned;
        };

        cov.tests = tests.map(clean);
        cov.failures = failures.map(clean);
        cov.passes = passes.map(clean);

        // Finalize output

        if (options.verbose) {
            cov.ms = notebook.ms;
            cov.leaks = notebook.leaks;
        }

        if (options.dest) {
            options.dest.cov = cov;
            return;
        }

        process.stdout.write(JSON.stringify(cov, null, 2));
    });
};


internals.coverage = function (filename, data) {

    var ret = {
        filename: filename.replace(process.cwd() + '/', ''),
        coverage: 0,
        hits: 0,
        misses: 0,
        sloc: 0,
        source: {}
    };

    // Process each line of code

    data.source.forEach(function (line, num) {

        num++;

        var isMiss = false;
        ret.source[num] = {
            source: line
        };

        if (data.lines[num] === 0) {
            isMiss = true;
            ret.misses++;
            ret.sloc++;
        }
        else if (line) {
            ret.sloc++;

            if (data.statements[num]) {
                var mask = new Array(line.length);
                Object.keys(data.statements[num]).forEach(function (id) {

                    var statement = data.statements[num][id];
                    if (statement.hit.true &&
                        statement.hit.false) {

                        return;
                    }

                    if (statement.loc.start.line !== num) {
                        data.statements[statement.loc.start.line] = data.statements[statement.loc.start.line] || {};
                        data.statements[statement.loc.start.line][id] = statement;
                        return;
                    }

                    if (statement.loc.end.line !== num) {
                        data.statements[statement.loc.end.line] = data.statements[statement.loc.end.line] || {};
                        data.statements[statement.loc.end.line][id] = {
                            hit: statement.hit,
                            loc: {
                                start: {
                                    line: statement.loc.end.line,
                                    column: 0
                                },
                                end: {
                                    line: statement.loc.end.line,
                                    column: statement.loc.end.column
                                }
                            }
                        };

                        statement.loc.end.column = line.length;
                    }

                    isMiss = true;
                    var issue = statement.hit.true ? 'true' : (statement.hit.false ? 'false' : 'never');
                    for (var a = statement.loc.start.column; a < statement.loc.end.column; ++a) {
                        mask[a] = issue;
                    }
                });

                var chunks = [];

                var from = 0;
                for (var a = 1, al = mask.length; a < al; ++a) {
                    if (mask[a] !== mask[a - 1]) {
                        chunks.push({ source: line.slice(from, a), miss: mask[a - 1] });
                        from = a;
                    }
                }

                chunks.push({ source: line.slice(from), miss: mask[from] });

                if (isMiss) {
                    ret.source[num].chunks = chunks;
                    ret.misses++;
                }
                else {
                    ret.hits++;
                }
            }
            else {
                ret.hits++;
            }
        }

        ret.source[num].coverage = data.lines[num] === undefined ? '' : data.lines[num];
        ret.source[num].miss = isMiss;
    });

    ret.coverage = ret.hits / ret.sloc * 100;
    return ret;
};
