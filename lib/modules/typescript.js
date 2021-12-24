'use strict';

const Typescript = require('typescript');

const internals = {
    configs: {}
};

internals.transform = function (content, fileName) {

    const path = Typescript.normalizePath(Typescript.sys.getCurrentDirectory());
    const configFile = process.env.TSCONFIG || Typescript.findConfigFile(path, Typescript.sys.fileExists);

    if (!internals.configs[configFile]) {
        const { config, error } = Typescript.readConfigFile(configFile, Typescript.sys.readFile);
        if (error) {
            console.error(`TypeScript config error in ${configFile}: ${error.messageText}`);
            process.exit(1);
        }

        const { options } = Typescript.parseJsonConfigFileContent(config, Typescript.sys, Typescript.getDirectoryPath(configFile), {}, configFile);
        options.sourceMap = false;
        options.inlineSourceMap = true;
        options.module = 1; // CommonJS
        internals.configs[configFile] = options;
    }

    const compilerOptions = internals.configs[configFile];
    const { outputText } = Typescript.transpileModule(content, { fileName, compilerOptions });
    return outputText;
};

exports.extensions = [
    { ext: '.ts', transform: internals.transform },
    { ext: '.tsx', transform: internals.transform }
];


// Adapted from https://github.com/garthk/lab-transform-typescript
// Copyright (C) 2016-2017 Garth Kidd <garth@garthk.com>, MIT Licensed
