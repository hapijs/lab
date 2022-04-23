'use strict';

const internals = {};


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

exports.stashProperty = (obj, property) => {

    const descriptor = Object.getOwnPropertyDescriptor(obj, property);
    delete obj[property];

    return descriptor;
};

exports.restoreProperty = (obj, property, descriptor) => {

    if (descriptor) {
        Object.defineProperty(obj, property, descriptor);
    }
};
