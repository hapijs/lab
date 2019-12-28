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
