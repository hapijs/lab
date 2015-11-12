'use strict';

// Adapted from:
// Blanket https://github.com/alex-seville/blanket, copyright (c) 2013 Alex Seville, MIT licensed
// Falafel https://github.com/substack/node-falafel, copyright (c) James Halliday, MIT licensed


// Load modules

const Fs = require('fs');
const Path = require('path');
const Espree = require('espree');
const SourceMapSupport = require('source-map-support');
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

    const base = internals.escape(options.coveragePath || '');
    const excludes = options.coverageExclude ? [].concat(options.coverageExclude).map(internals.escape).join('|') : '';
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

    const addStatement = function (line, node, bool) {

        const id = ++ids;
        statements.push({
            id: id,
            loc: node.loc,
            line: line,
            bool: bool && node.type !== 'ConditionalExpression' && node.type !== 'LogicalExpression'
        });
        return id;
    };

    const annotate = function (node, parent) {

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

        // Coverage status

        if (bypass[node.range[0]]) {
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
        let line;

        if (decoratedTypes.indexOf(node.type) !== -1) {
            if (node.alternate &&
                node.alternate.type !== 'BlockStatement') {

                node.alternate.set('{' + node.alternate.source() + '}');
            }

            consequent = node.consequent || node.body;
            if (consequent.type !== 'BlockStatement') {
                consequent.set('{' + consequent.source() + '}');
            }
        }

        const trackedTypes = [
            'ExpressionStatement',
            'BreakStatement',
            'ContinueStatement',
            'VariableDeclaration',
            'ReturnStatement',
            'ThrowStatement',
            'TryStatement',
            'FunctionDeclaration',
            'IfStatement',
            'WhileStatement',
            'DoWhileStatement',
            'ForStatement',
            'ForInStatement',
            'SwitchStatement',
            'WithStatement',
            'LabeledStatement'
        ];

        if (trackedTypes.indexOf(node.type) !== -1 &&
            (node.type !== 'VariableDeclaration' || (node.parent.type !== 'ForStatement' && node.parent.type !== 'ForInStatement'  && node.parent.type !== 'ForOfStatement')) &&
            (node.type !== 'ExpressionStatement' || node.expression.value !== 'use strict') &&
            node.parent.type !== 'LabeledStatement') {

            tracking.push(node.loc.start.line);
            node.set('global.__$$labCov._line(\'' + filename + '\',' + node.loc.start.line + ');' + node.source());
        }
        else if (node.type === 'ConditionalExpression') {
            line = node.loc.start.line;
            consequent = addStatement(line, node.consequent, false);
            const alternate = addStatement(line, node.alternate, false);

            node.set('(' + node.test.source() + '? global.__$$labCov._statement(\'' + filename + '\',' + consequent + ',' + line + ',' + node.consequent.source() + ') : global.__$$labCov._statement(\'' + filename + '\',' + alternate + ',' + line + ',' + node.alternate.source() + '))');
        }
        else if (node.type === 'LogicalExpression') {
            line = node.loc.start.line;
            const left = addStatement(line, node.left, true);
            const right = addStatement(line, node.right, node.parent.type === 'LogicalExpression');

            node.set('(global.__$$labCov._statement(\'' + filename + '\',' + left + ',' + line + ',' + node.left.source() + ')' + node.operator + 'global.__$$labCov._statement(\'' + filename + '\',' + right + ',' + line + ',' + node.right.source() + '))');
        }
        else if (node.parent &&
            node.parent.test === node &&
            node.parent.type !== 'SwitchCase') {

            line = node.loc.start.line;
            const test = addStatement(line, node, true);

            node.set('global.__$$labCov._statement(\'' + filename + '\',' + test + ',' + line + ',' + node.source() + ')');
        }
    };

    // Parse tree

    const tree = Espree.parse(content, {
        loc: true,
        comment: true,
        range: true,
        ecmaFeatures: {
            blockBindings: true,
            arrowFunctions: true,
            templateStrings: true,
            generators: true,
            forOf: true,
            binaryLiterals: true,
            octalLiterals: true,
            classes: true,
            objectLiteralShorthandProperties: true,
            objectLiteralShorthandMethods: true
        }
    });

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

    const transformedFile = content.replace(/\/\/\#(.*)$/, '');
    internals.sources[filename] = transformedFile.replace(/(\r\n|\n|\r)/gm, '\n').split('\n');

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

    global.__$$labCov.files[filename] = {
        statements: {},
        lines: {}
    };

    const record = global.__$$labCov.files[filename];
    tracking.forEach((item) => {

        record.lines[item] = 0;
    });

    statements.forEach((item) => {

        record.statements[item.line] = record.statements[item.line] || {};
        record.statements[item.line][item.id] = { hit: {}, bool: item.bool, loc: item.loc };
    });

    return chunks.join('');
};


exports.analyze = function (options) {

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

    const files = Object.keys(report.files);
    for (let i = 0; i < files.length; ++i) {
        const filename = files[i];
        if (pattern.test(filename)) {
            report.files[filename].source = internals.sources[filename] || [];
            const data = internals.file(filename, report.files[filename], options);

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

internals.addSourceMapsInformation = function (ret, num) {

    const position = {
        source: ret.filename,
        line: num,
        column: 0
    };
    const originalPosition = SourceMapSupport.mapSourcePosition(position);
    const source = ret.source[num];

    if (position !== originalPosition) {
        source.originalFilename = originalPosition.source.replace(Path.join(process.cwd(), '/').replace(/\\/g, '/'), '');
        source.originalLine = originalPosition.line;

        if (!ret.sourcemaps) {
            ret.sourcemaps = true;
        }
    }
    else {
        source.originalFilename = ret.filename;
        source.originalLine = num;
    }
};


internals.file = function (filename, data, options) {

    const ret = {
        filename: filename.replace(Path.join(process.cwd(), '/').replace(/\\/g, '/'), ''),
        percent: 0,
        hits: 0,
        misses: 0,
        sloc: 0,
        source: {}
    };

    // Process each line of code

    data.source.forEach((line, num) => {

        num++;

        let isMiss = false;
        ret.source[num] = {
            source: line
        };

        if (options.sourcemaps) {
            internals.addSourceMapsInformation(ret, +num);
        }

        if (data.lines[num] === 0) {
            isMiss = true;
            ret.misses++;
            ret.sloc++;
        }
        else if (line) {
            ret.sloc++;

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
                        chunks.push({ source: line.slice(from, i), miss: mask[i - 1] });
                        from = i;
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

        ret.source[num].hits = data.lines[num];
        ret.source[num].miss = isMiss;
    });

    ret.percent = ret.hits / ret.sloc * 100;
    return ret;
};
