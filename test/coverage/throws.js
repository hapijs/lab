'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (value) {

    if (value) {
        return value;
    }

    throw new Error();
};
