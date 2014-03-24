// Adapted from:
// Blanket https://github.com/alex-seville/blanket, copyright (c) 2013 Alex Seville, MIT licensed
// Falafel https://github.com/substack/node-falafel, copyright (c) James Halliday, MIT licensed


// Load modules

var Fs = require('fs');
var Path = require('path');
var Esprima = require('esprima');


// Declare internals

var internals = {};


exports.instrument = function () {

    var currentDir = process.cwd().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    var filterPattern = '^' + currentDir + '\\/((?!node_modules|test).).*$';
    var pattern = new RegExp(filterPattern, 'i');

    var origLoader = require.extensions['.js'];
    require.extensions['.js'] = function (localModule, filename) {

        var originalFilename = filename;
        filename = filename.replace(/\\/g, '/');

        if (!pattern.test(filename)) {
            return origLoader(localModule, originalFilename);
        }

        var baseDirPath = Path.dirname(filename).replace(/\\/g, '/') + '/.';

        var instrumented = internals.instrument(filename);
        instrumented = instrumented.replace(/require\s*\(\s*("|')\./g, 'require($1' + baseDirPath);
        localModule._compile(instrumented, originalFilename);
    };
};


internals.instrument = function (filename) {

    var file = Fs.readFileSync(filename, 'utf8');
    var content = file.replace(/^\#\!.*/, '');

    var tracking = [];
    var statements = [];
    var chunks = content.split('');
    var ids = 0;

    var annotate = function (node, parent) {

        // Decorate node

        node.parent = parent;

        node.source = function () {

            return chunks.slice(node.range[0], node.range[1]).join('');
        };

        node.set = function (s) {

            chunks[node.range[0]] = s;
            for (var i = node.range[0] + 1, il = node.range[1]; i < il; i++) {
                chunks[i] = '';
            }
        };

        // Recursively annotate the tree from the inner-most out

        Object.keys(node).forEach(function (key) {

            if (key === 'parent') {
                return;
            }

            var children = [].concat(node[key]);
            children.forEach(function (child) {

                if (child && typeof child.type === 'string') {              // Identify node types
                    annotate(child, node);
                }
            });
        });

        // Annotate source code

        var decoratedTypes = [
            'IfStatement',
            'WhileStatement',
            'DoWhileStatement',
            'ForStatement',
            'ForInStatement',
            'WithStatement'
        ];

        if (decoratedTypes.indexOf(node.type) !== -1) {
            if (node.alternate &&
                node.alternate.type !== 'BlockStatement') {

                node.alternate.set('{' + node.alternate.source() + '}');
            }

            var consequent = node.consequent || node.body;
            if (consequent &&
                consequent.type !== 'BlockStatement') {

                consequent.set('{' + consequent.source() + '}');
            }
        }

        var trackedTypes = [
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
            'WithStatement'
        ];

        if (trackedTypes.indexOf(node.type) !== -1 &&
            node.parent.type !== 'LabeledStatement' &&
            (node.type !== 'VariableDeclaration' || (node.parent.type !== 'ForStatement' && node.parent.type !== 'ForInStatement'))) {

            tracking.push(node.loc.start.line);
            node.set('__$$labLine(\'' + filename + '\',' + node.loc.start.line + ');' + node.source());
        }

        if (node.type === 'ConditionalExpression') {
            var line = node.loc.start.line;
            var consequent = ++ids;
            var alternate = ++ids;
            statements.push({ id: consequent, loc: JSON.stringify(node.consequent.loc), line: line });
            statements.push({ id: alternate, loc: JSON.stringify(node.alternate.loc), line: line });

            node.set(node.test.source() + '?' + '__$$labStatement(\'' + filename + '\',' + consequent + ',' + line + ',' + node.consequent.source() + ') : __$$labStatement(\'' + filename + '\',' + alternate + ',' + line + ',' + node.alternate.source() + ')');
        }

        if (node.type === 'LogicalExpression') {
            var line = node.loc.start.line;
            var right = ++ids;
            var left = ++ids;
            statements.push({ id: right, loc: JSON.stringify(node.right.loc), line: line });
            statements.push({ id: left, loc: JSON.stringify(node.left.loc), line: line });

            node.set('__$$labStatement(\'' + filename + '\',' + left + ',' + line + ',' + node.left.source() + ')' + node.operator + '__$$labStatement(\'' + filename + '\',' + right + ',' + line + ',' + node.right.source() + ')');
        }
    };

    annotate(Esprima.parse(content, { loc: true, comment: true, range: true }));

    // Generate preamble

    var __$$labLine = function (filename, line) {

        __$$labCov[filename].lines[line]++;
    };

    var __$$labStatement = function (filename, id, line, source) {

        __$$labCov[filename].statements[line][id].hit = true;
        return source;
    };

    var preamble =
        'if (typeof __$$labCov === \'undefined\') {' +
            '__$$labCov = {};' +
        '}' +

        'var __$$labLine = ' + __$$labLine.toString() + ';' +
        'var __$$labStatement = ' + __$$labStatement.toString() + ';' +

        '__$$labCov[\'' + filename + '\'] = {' +
            'statements: [],' +
            'lines: [],' +
            'source: [\'' + file.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/(\r\n|\n|\r)/gm, '\n').split('\n').join('\', \n\'') + '\']' +
        '};'

    tracking.forEach(function (item) {

        preamble += '__$$labCov[\'' + filename + '\'].lines[' + item + '] = 0;';
    });

    statements.forEach(function (item) {

        preamble +=
            '__$$labCov[\'' + filename + '\'].statements[' + item.line + '] = __$$labCov[\'' + filename + '\'].statements[' + item.line + '] || {};' +
            '__$$labCov[\'' + filename + '\'].statements[' + item.line + '][' + item.id + '] = { hit: false, loc: ' + item.loc + '};';
    });

    return preamble + chunks.join('');
};

