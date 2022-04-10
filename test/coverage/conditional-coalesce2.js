'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (first, second) {

    const a = first ?? 'firstMissing';
    const b = second ?? 'secondMissing';

    return a + b;
};
