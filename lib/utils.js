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


exports.position = function (err) {

    const match = /\:(\d+)\:(\d+)/.exec(err.stack.split('\n')[1]);
    if (!match) {
        return {};
    }

    return {
        line: parseInt(match[1], 10),
        column: parseInt(match[2], 10)
    };
};
