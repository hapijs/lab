'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (value) {

    const top = function (err) {

        if (err) {
            return err;
        }

        const inner = function (err) {

            if (err) {
                return err;
            }

            return value;
        };

        return inner;
    };

    top();
};
