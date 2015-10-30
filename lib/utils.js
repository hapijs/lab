'use strict';

// Load modules


// Declare internals

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
