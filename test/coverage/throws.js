// Load modules


// Declare internals

var internals = {};


exports.method = function (value) {

    if (value) {
        return value;
    }

    throw new Error();
};
