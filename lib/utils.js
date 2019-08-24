'use strict';

const internals = {};


exports.mergeOptions = function (parent, child, ignore) {

    ignore = ignore || [];
    const options = {};

    Object.keys(parent || {}).forEach((key) => {

        if (ignore.indexOf(key) === -1) {
            options[key] = parent[key];
        }
    });

    Object.keys(child || {}).forEach((key) => {

        options[key] = child[key];
    });

    return options;
};


exports.applyOptions = function (parent, child) {

    Object.keys(child).forEach((key) => {

        parent[key] = child[key];
    });
};


exports.location = function (depth = 1) {

    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = (ignore, stack) => stack;

    const capture = {};
    Error.captureStackTrace(capture, this);
    const line = capture.stack[depth];

    Error.prepareStackTrace = orig;

    return {
        filename: line.getFileName(),
        line: line.getLineNumber()
    };
};
