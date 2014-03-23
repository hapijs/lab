// Adapted from Blanket https://github.com/alex-seville/blanket, copyright (c) 2013 Alex Seville, MIT licensed

// Load modules

var Fs = require('fs');
var Path = require('path');
var Falafel = require('falafel');


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

        internals.instrument(filename, function (instrumented) {

            var baseDirPath = Path.dirname(filename).replace(/\\/g, '/') + '/.';

            instrumented = instrumented.replace(/require\s*\(\s*("|')\./g, 'require($1' + baseDirPath);
            localModule._compile(instrumented, originalFilename);
        });
    };
};


internals.linesToAddTracking = [
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


internals.linesToAddBrackets = [
    'IfStatement',
    'WhileStatement',
    'DoWhileStatement',
    'ForStatement',
    'ForInStatement',
    'WithStatement'
];


internals.instrument = function (filename, next) {

    var trackingArraySetup = [];
    var branchingArraySetup = [];

    var content = Fs.readFileSync(filename, 'utf8');
    var sourceArray = content.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/(\r\n|\n|\r)/gm, '\n').split('\n');
    content = content.replace(/^\#\!.*/, '');

    var tracker = function (node) {

        if (internals.linesToAddBrackets.indexOf(node.type) > -1) {
            var bracketsExistAlt = node.alternate;
            if (bracketsExistAlt &&
                bracketsExistAlt.type !== 'BlockStatement') {

                bracketsExistAlt.update('{\n' + bracketsExistAlt.source() + '}\n');
            }

            var bracketsExistObject = node.consequent || node.body;
            if (bracketsExistObject &&
                bracketsExistObject.type !== 'BlockStatement') {

                bracketsExistObject.update('{\n' + bracketsExistObject.source() + '}\n');
            }
        }

        if (internals.linesToAddTracking.indexOf(node.type) > -1 &&
            node.parent.type !== 'LabeledStatement') {

            if (node.type === 'ExpressionStatement' &&
                node.expression &&
                node.expression.left &&
                !node.expression.left.object &&
                !node.expression.left.property &&
                node.expression.left.name === '__$$labcov') {

                throw new Error('The __$$labcov variable name is reserved and cannot be used in ' + filename);
            }

            if (node.type === 'VariableDeclaration' &&
                (node.parent.type === 'ForStatement' || node.parent.type === 'ForInStatement')) {

                return;
            }

            if (node.loc &&
                node.loc.start) {

                node.update('__$$labcov[\'' + filename + '\'][' + node.loc.start.line + ']++;' + node.source());
                trackingArraySetup.push(node.loc.start.line);
            }
            else {
                throw new Error('Node missing location: ' + Object.keys(node));
            }
        }
        else if (node.type === 'ConditionalExpression') {
            var line = node.loc.start.line;
            var col = node.loc.start.column;

            branchingArraySetup.push({
                line: line,
                column: col,
                file: filename,
                consequent: node.consequent.loc,
                alternate: node.alternate.loc
            });

            var updated = '_$branchFcn(\'' + filename + '\',' + line + ',' + col + ',' + node.test.source() + ')?' + node.consequent.source() + ':' + node.alternate.source();
            node.update(updated);
        }
    };

    var instrumented = Falafel(content, { loc: true, comment: true }, tracker);

    var sourceString = sourceArray.join('\', \n\'');
    var intro = 'if (typeof __$$labcov === \'undefined\') __$$labcov = {};' +
                'var _$branchFcn = function (f,l,c,r) { ' +
                'if (!!r) { ' +
                '__$$labcov[f].branchData[l][c][0] = __$$labcov[f].branchData[l][c][0] || [];' +
                '__$$labcov[f].branchData[l][c][0].push(r); }' +
                'else { ' +
                '__$$labcov[f].branchData[l][c][1] = __$$labcov[f].branchData[l][c][1] || [];' +
                '__$$labcov[f].branchData[l][c][1].push(r); }' +
                'return r;};' +
                'if (typeof __$$labcov[\'' + filename + '\'] === \'undefined\'){' +
                '__$$labcov[\'' + filename + '\'] = [];' +
                '__$$labcov[\'' + filename + '\'].branchData = [];' +
                '__$$labcov[\'' + filename + '\'].source = [\'' + sourceString + '\'];';

    trackingArraySetup.sort(function (a, b) {

        return parseInt(a, 10) > parseInt(b, 10);
    }).forEach(function (item) {

        intro += '__$$labcov[\'' + filename + '\'][' + item + ']=0;';
    });

    branchingArraySetup.sort(function (a, b) {

        return a.line > b.line;
    }).sort(function (a, b) {

        return a.column > b.column;
    }).forEach(function (item) {

        if (item.file === filename) {
            intro += 'if (typeof __$$labcov[\'' + filename + '\'].branchData[' + item.line + '] === \'undefined\')' +
                     '{ __$$labcov[\'' + filename + '\'].branchData[' + item.line + ']=[]; }' +
                     '__$$labcov[\'' + filename + '\'].branchData[' + item.line + '][' + item.column + '] = [];' +
                     '__$$labcov[\'' + filename + '\'].branchData[' + item.line + '][' + item.column + '].consequent = ' + JSON.stringify(item.consequent) + ';' +
                     '__$$labcov[\'' + filename + '\'].branchData[' + item.line + '][' + item.column + '].alternate = ' + JSON.stringify(item.alternate) + ';';
        }
    });

    intro += '}';

    return next(intro + instrumented);
};
