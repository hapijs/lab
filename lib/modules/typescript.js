'use strict';

const Typescript = require('typescript');

const internals = {
    configs: new Map()
};

internals.transform = function (content, fileName) {

    const configFile = Typescript.findConfigFile(Typescript.getDirectoryPath(fileName), Typescript.sys.fileExists);

    if (!internals.configs.has(configFile)) {
        try {
            var { config, error } = Typescript.readConfigFile(configFile, Typescript.sys.readFile);
            if (error) {
                throw new Error(`TypeScript config error in ${configFile}: ${error.messageText}`);
            }
        }
        catch (err) {
            throw new Error(`Cannot find a tsconfig file for ${fileName}`);
        }

        const { options } = Typescript.parseJsonConfigFileContent(config, Typescript.sys, Typescript.getDirectoryPath(configFile), {}, configFile);
        options.sourceMap = false;
        options.inlineSourceMap = true;
        options.inlineSources = true;
        options.module = Typescript.ModuleKind.CommonJS;
        internals.configs.set(configFile, options);
    }

    const compilerOptions = internals.configs.get(configFile);
    const { outputText } = Typescript.transpileModule(content, { fileName, compilerOptions });
    return outputText;
};

exports.extensions = [
    { ext: '.ts', transform: internals.transform },
    { ext: '.tsx', transform: internals.transform }
];


// Adapted from https://github.com/garthk/lab-transform-typescript
// Copyright (C) 2016-2017 Garth Kidd <garth@garthk.com>, MIT Licensed
