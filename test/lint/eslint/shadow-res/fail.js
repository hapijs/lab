'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (value) {

    const top = function (res) {

        const inner = function (res) {

            return value;
        };

        return inner;
    };

    top();
};
