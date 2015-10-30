'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function () {
    let i = 0;
    let j = 0;

    outer: for (; i < 1; ++i) {
        inner: for (; j < 1; ++j) {
            continue outer;
        }
    }

    return [i, j];
};

