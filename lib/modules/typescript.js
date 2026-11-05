const ts = require('typescript');
const fs = require('fs');
const path = require('path');

module.exports = function (filename, options) {

    const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
    let compilerOptions = { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES5 };

    if (configPath) {
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));
        compilerOptions = Object.assign(compilerOptions, parsed.options);
    }

    const source = fs.readFileSync(filename, 'utf8');
    return ts.transpileModule(source, { compilerOptions }).outputText;
};