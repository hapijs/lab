'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (value) {

    const { a, ...rest } = { a: 1, b: 2, c: 3 };

    return { a, ...rest };
};
