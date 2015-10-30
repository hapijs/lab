'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (value) {

    const myString = 'x';
    const myObject = {
        x: 10
    };
    value = eval('myObject.' + myString);
    return value;
};
