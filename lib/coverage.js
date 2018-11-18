'use strict';

// Adapted from:
// Blanket https://github.com/alex-seville/blanket, copyright (c) 2013 Alex Seville, MIT licensed
// Falafel https://github.com/substack/node-falafel, copyright (c) James Halliday, MIT licensed


// Load modules

const Fs = require('fs');
const Path = require('path');
const Espree = require('espree');
const SourceMapConsumer = require('source-map').SourceMapConsumer;
const SourceMapSupport = require('source-map-support');
const Eslintrc = require('./linter/.eslintrc');
const Transform = require('./transform');


// Declare internals

const internals = {
    patterns: [],
    sources: {}
};


internals.prime = function (extension) {

    require.extensions[extension] = function (localModule, filename) {

        for (let i = 0; i < internals.patterns.length; ++i) {
            if (internals.patterns[i].test(filename.replace(/\\/g, '/'))) {
                return localModule._compile(internals.instrument(filename), filename);
            }
        }

        const src = Fs.readFileSync(filename, 'utf8');
        return localModule._compile(Transform.transform(filename, src), filename);
    };
};


exports.instrument = function (options) {

    internals.patterns.unshift(internals.pattern(options));

    Transform.install(options, internals.prime);
};


internals.pattern = function (options) {

    const coveragePath = options.coveragePath || '';
    const base = internals.escape(coveragePath);
    const excludes = options.coverageExclude ? [].concat(options.coverageExclude).map((path) => {

        let isFile = false;
        try {
            const pathStat = Fs.statSync(Path.join(coveragePath, path));
            isFile = pathStat.isFile();
        }
        catch (ex) {
            if (ex.code !== 'ENOENT') {
                console.error(ex);
            }
        }

        const escaped = internals.escape(path);
        return isFile ? escaped : `${escaped}\\/`;
    }).join('|') : '';

    const regex = '^' + base + (excludes ? (base[base.length - 1] === '/' ? '' : '\\/') + '(?!' + excludes + ')' : '');
    return new RegExp(regex);
};


internals.escape = function (string) {

    return string.replace(/\\/g, '/').replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
};


internals.instrument = function (filename) {

    filename = filename.replace(/\\/g, '/');

    const file = Fs.readFileSync(filename, 'utf8');
    let content = file.replace(/^\#\!.*/, '');
    content = Transform.transform(filename, content);

    const tracking = [];
    const statements = [];
    const chunks = content.split('');
    let ids = 0;
    const bypass = {};
    const nodesByLine = {};

    const addStatement = function (line, node, bool) {

        const id = ++ids;
        statements.push({
            id,
            loc: node.loc,
            line,
            bool: bool && node.type !== 'ConditionalExpression' && node.type !== 'LogicalExpression'
        });
        return id;
    };

    const addToLines = function (node, line) {

        if (!(line in nodesByLine)) {
            nodesByLine[line] = [];
        }

        nodesByLine[line].push(node.type);
    };

    const annotate = function (node, parent) {

        const line = node.loc.start.line;
        // Decorate node

        node.parent = parent;

        node.source = function () {

            return chunks.slice(node.range[0], node.range[1]).join('');
        };

        node.set = function (s) {

            chunks[node.range[0]] = s;
            for (let i = node.range[0] + 1; i < node.range[1]; ++i) {
                chunks[i] = '';
            }
        };

        // Reference node types per line, to detect commented lines
        addToLines(node, line);
        const end = node.loc.end.line;
        if (end !== line) {
            addToLines(node, end);
        }

        // Coverage status

        const bypassTests = [];
        for (let i = node.range[0]; i <= node.range[1]; ++i) {
            bypassTests.push(bypass[i]);
        }

        if (bypassTests.every((test) => test)) {
            return;
        }

        // Recursively annotate the tree from the inner-most out

        Object.keys(node).forEach((name) => {

            if (name === 'parent') {
                return;
            }

            const children = [].concat(node[name]);
            children.forEach((child) => {

                if (child && typeof child.type === 'string') {              // Identify node types
                    annotate(child, node);
                }
            });
        });

        // Annotate source code

        const decoratedTypes = [
            'IfStatement',
            'WhileStatement',
            'DoWhileStatement',
            'ForStatement',
            'ForInStatement',
            'WithStatement'
        ];

        let consequent;

        if (decoratedTypes.indexOf(node.type) !== -1) {
            if (node.alternate &&
                node.alternate.type !== 'BlockStatement') {

                node.alternate.set(`{${node.alternate.source()}}`);
            }

            consequent = node.consequent || node.body;
            if (consequent.type !== 'BlockStatement') {
                consequent.set(`{${consequent.source()}}`);
            }
        }

        if (node.type === 'ExpressionStatement' && node.expression.value === 'use strict') {
            return;
        }

        const trackedTypes = [
            'ExpressionStatement',
            'BreakStatement',
            'ContinueStatement',
            'VariableDeclaration',
            'ReturnStatement',
            'ThrowStatement',
            'TryStatement',
            'IfStatement',
            'WhileStatement',
            'DoWhileStatement',
            'ForStatement',
            'ForInStatement',
            'SwitchStatement',
            'WithStatement',
            'LabeledStatement'
        ];


        if (node.parent && node.parent.type === 'BlockStatement' &&
            node.parent.parent.type.includes('FunctionExpression') &&
            node.parent.body[0] === node) {

            const id = addStatement(line, node, false);

            node.set(`global.__$$labCov._statement('${filename}', ${id}, ${line}, true); ${node.source()};`);
        }
        else if (trackedTypes.indexOf(node.type) !== -1 &&
            (node.type !== 'VariableDeclaration' || (node.parent.type !== 'ForStatement' && node.parent.type !== 'ForInStatement'  && node.parent.type !== 'ForOfStatement')) &&
            node.parent.type !== 'LabeledStatement') {

            tracking.push(line);
            node.set(`global.__$$labCov._line('${filename}',${line});${node.source()}`);
        }
        else if (node.type === 'ConditionalExpression') {
            consequent = addStatement(line, node.consequent, false);
            const alternate = addStatement(line, node.alternate, false);

            node.set(`(${node.test.source()}? global.__$$labCov._statement('${filename}',${consequent},${line},(${node.consequent.source()})) : global.__$$labCov._statement('${filename}',${alternate},${line},(${node.alternate.source()})))`);
        }
        else if (node.type === 'LogicalExpression') {
            const left = addStatement(line, node.left, true);
            const right = addStatement(line, node.right, node.parent.type === 'LogicalExpression' || node.parent.type === 'IfStatement');

            node.set(`(global.__$$labCov._statement(\'${filename }\',${left},${line},${node.left.source()})${node.operator}global.__$$labCov._statement(\'${filename}\',${right},${line},${node.right.source()}))`);
        }
        else if (node.parent && node.parent.type === 'ArrowFunctionExpression' &&
            node.type.includes('Expression')) {

            const id = addStatement(line, node, false);

            node.set(`global.__$$labCov._statement('${filename}', ${id}, ${line}, ${node.source()})`);
        }
        else if (node.parent &&
            node.parent.test === node &&
            node.parent.type !== 'SwitchCase') {

            const test = addStatement(line, node, true);

            node.set(`global.__$$labCov._statement(\'${filename}\',${test},${line},${node.source()})`);
        }
    };

    // Parse tree

    const tree = Espree.parse(content, Eslintrc.parserOptions);

    // Process comments

    let skipStart = 0;
    let segmentSkip = false;
    tree.comments.forEach((comment) => {

        const directive = comment.value.match(/^\s*\$lab\:coverage\:(off|on)\$\s*$/);
        if (directive) {
            const skip = directive[1] !== 'on';
            if (skip !== segmentSkip) {
                segmentSkip = skip;
                if (skip) {
                    skipStart = comment.range[1];
                }
                else {
                    for (let i = skipStart; i < comment.range[0]; ++i) {
                        bypass[i] = true;
                    }
                }
            }
        }
    });

    // Begin code annotation

    annotate(tree);

    // Store original source

    internals.sources[filename] = content.replace(/(\r\n|\n|\r)/gm, '\n').split('\n');

    // Setup global report container
    // $lab:coverage:off$
    if (typeof global.__$$labCov === 'undefined') {
        global.__$$labCov = {
            files: {},

            _line: function (name, line) {

                global.__$$labCov.files[name].lines[line]++;
            },

            _statement: function (name, id, line, source) {

                const statement = global.__$$labCov.files[name].statements[line][id];
                if (!statement.bool) {
                    statement.hit[!source] = true;
                }

                statement.hit[!!source] = true;
                return source;
            }
        };
    }                                                   // $lab:coverage:on$

    if (typeof global.__$$labCov.files[filename] === 'undefined') {
        global.__$$labCov.files[filename] = {
            statements: {},
            lines: {},
            commentedLines: {}
        };

        const record = global.__$$labCov.files[filename];
        tracking.forEach((item) => {

            record.lines[item] = 0;
        });

        statements.forEach((item) => {

            record.statements[item.line] = record.statements[item.line] || {};
            record.statements[item.line][item.id] = { hit: {}, bool: item.bool, loc: item.loc };
        });

        const blank = /^\s*$/;
        // Compute SLOC by counting all non-blank lines, and subtract comments
        // Don't bother with actual coverage (dealing with hits, misses and bypass is tricky) and rely only on AST
        // Only comments that don't share the same line with something else must be subtracted
        record.sloc = internals.sources[filename].filter((line) => !blank.test(line)).length -
            tree.comments.map((node) => {

                const start = node.loc.start.line;
                const end = node.loc.end.line;
                let commented = 0;
                // But don't count commented white lines, cause there are already subtracted
                for (let i = start; i <= end; ++i) {
                    // Don't consider line commented if it contains something which isn't another comment
                    if ((!nodesByLine[i] || !nodesByLine[i].find((type) => type !== 'Line' && type !== 'Block')) && !record.commentedLines[i]) {
                        record.commentedLines[i] = true;

                        // Acorn removes comment delimiters, so start and end lines must never be considered blank if they content is
                        if (i === start || i === end || !blank.test(internals.sources[filename][i - 1])) {
                            commented++;
                        }
                    }
                }

                return commented;
            }).reduce((a, b) => a + b, 0);
    }

    return chunks.join('');
};


internals.traverse = function (coveragePath, options) {

    let nextPath = null;
    const traverse = function (path) {

        let files = [];
        nextPath = path;

        const pathStat = Fs.statSync(path);
        if (pathStat.isFile()) {
            return path;
        }

        Fs.readdirSync(path).forEach((filename) => {

            nextPath = Path.join(path, filename);
            const basename = Path.basename(nextPath);
            const stat = Fs.statSync(nextPath);
            if (stat.isDirectory() &&
                basename[0] !== '.' &&
                !options['coverage-flat']) {

                files = files.concat(traverse(nextPath, options));
                return;
            }

            if (stat.isFile() &&
                basename[0] !== '.' &&
                options.coveragePattern.test(nextPath.replace(/\\/g, '/'))) {

                files.push(nextPath);
            }
        });

        return files;
    };

    const coverageFiles = [].concat(traverse(coveragePath));

    return coverageFiles.map((path) => {

        return Path.resolve(path);
    });

};


exports.analyze = async function (options) {

    // Process coverage  (global.__$$labCov needed when labCov isn't defined)

    /* $lab:coverage:off$ */ const report = global.__$$labCov || { files: {} }; /* $lab:coverage:on$ */
    const pattern = internals.pattern(options);

    const cov = {
        sloc: 0,
        hits: 0,
        misses: 0,
        percent: 0,
        files: []
    };

    // Filter files

    let files;


    if (options['coverage-all']) {
        files = internals.traverse(options.coveragePath, options);
    }
    else {
        files = Object.keys(report.files);
    }

    for (let i = 0; i < files.length; ++i) {
        const filename = files[i].replace(/\\/g, '/');
        if (pattern.test(filename)) {
            if (!report.files[filename]) {
                internals.instrument(filename);
            }

            report.files[filename].source = internals.sources[filename] || [];
            const data = await internals.file(filename, report.files[filename], options);

            cov.files.push(data);
            cov.hits += data.hits;
            cov.misses += data.misses;
            cov.sloc += data.sloc;
        }
    }

    // Sort files based on directory structure

    cov.files.sort((a, b) => {

        const segmentsA = a.filename.split('/');
        const segmentsB = b.filename.split('/');

        const al = segmentsA.length;
        const bl = segmentsB.length;

        for (let i = 0; i < al && i < bl; ++i) {

            if (segmentsA[i] === segmentsB[i]) {
                continue;
            }

            const lastA = i + 1 === al;
            const lastB = i + 1 === bl;

            if (lastA !== lastB) {
                return lastA ? -1 : 1;
            }

            return segmentsA[i] < segmentsB[i] ? -1 : 1;
        }

        return segmentsA.length < segmentsB.length ? -1 : 1;
    });

    // Calculate coverage percentage

    if (cov.sloc > 0) {
        cov.percent = (cov.hits / cov.sloc) * 100;
    }

    return cov;
};

internals.addSourceMapsInformation = function (smc, ret, num) {

    const source = ret.source[num];
    const position = {
        source: ret.filename,
        line: num,
        // when using 0 column, it sometimes miss the original line
        column: source.source.length
    };
    let originalPosition = smc.originalPositionFor(position);

    // Ensure folder separator to be url-friendly
    source.originalFilename = originalPosition.source && originalPosition.source.replace(/\\/g, '/');
    source.originalLine = originalPosition.line;

    if (!ret.sourcemaps) {
        ret.sourcemaps = true;
    }

    if (source.chunks) {
        source.chunks.forEach((chunk) => {
            // Also add source map information on chunks
            originalPosition = smc.originalPositionFor({ line: num, column: chunk.column });
            chunk.originalFilename = originalPosition.source;
            chunk.originalLine = originalPosition.line;
            chunk.originalColumn = originalPosition.column;
        });
    }
};


internals.file = async function (filename, data, options) {

    const ret = {
        // Ensure folder separator to be url-friendly
        filename: filename.replace(Path.join(process.cwd(), '/').replace(/\\/g, '/'), ''),
        percent: 0,
        hits: 0,
        misses: 0,
        sloc: data.sloc,
        source: {}
    };

    // Use sourcemap consumer rather than SourceMapSupport.mapSourcePosition itself which perform path transformations
    let sourcemap = null;
    if (options.sourcemaps) {
        sourcemap = SourceMapSupport.retrieveSourceMap(ret.filename);
        if (!sourcemap) {
            const smre = /\/\/\#.*data:application\/json[^,]+base64,.*\r?\n?$/;
            let sourceIndex = data.source.length - 1;
            while (sourceIndex >= 0 && !smre.test(data.source[sourceIndex])) {
                sourceIndex--;
            }

            if (sourceIndex >= 0) {
                const re = /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^\*]+?)[ \t]*(?:\*\/)[ \t]*$)/mg;
                let lastMatch;
                let match;
                while (match = re.exec(data.source[sourceIndex])) {
                    lastMatch = match;
                }

                sourcemap = {
                    url: lastMatch[1],
                    map: Buffer.from(lastMatch[1].slice(lastMatch[1].indexOf(',') + 1), 'base64').toString()
                };
            }
        }
    }

    const smc = sourcemap ? await new SourceMapConsumer(sourcemap.map) : null;

    // Process each line of code
    data.source.forEach((line, num) => {

        num++;

        let isMiss = false;
        ret.source[num] = {
            source: line
        };

        if (data.lines[num] === 0) {
            isMiss = true;
            ret.misses++;
        }
        else if (line) {
            if (data.statements[num]) {
                const mask = new Array(line.length);
                Object.keys(data.statements[num]).forEach((id) => {

                    const statement = data.statements[num][id];
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
                    const issue = statement.hit.true ? 'true' : (statement.hit.false ? 'false' : 'never');
                    for (let i = statement.loc.start.column; i < statement.loc.end.column; ++i) {
                        mask[i] = issue;
                    }
                });

                const chunks = [];

                let from = 0;
                for (let i = 1; i < mask.length; ++i) {
                    if (mask[i] !== mask[i - 1]) {
                        chunks.push({ source: line.slice(from, i), miss: mask[i - 1], column: from });
                        from = i;
                    }
                }

                chunks.push({ source: line.slice(from), miss: mask[from], column: from });

                if (isMiss) {
                    ret.source[num].chunks = chunks;
                    ret.misses++;
                }
                else {
                    ret.hits++;
                }
            }
            else if (!data.commentedLines[num] && line.trim()) {
                // Only increment hits if the current line isn't blank and commented
                ret.hits++;
            }
        }

        if (smc) {
            internals.addSourceMapsInformation(smc, ret, num);
        }

        ret.source[num].hits = data.lines[num];
        ret.source[num].miss = isMiss;
    });

    ret.percent = ret.hits / ret.sloc * 100;
    return ret;
};
