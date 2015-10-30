'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (value) {

    const top = function (err) {

        const inner = function (err) {

            return value;
        };

        return inner;
    };

    top();
};
