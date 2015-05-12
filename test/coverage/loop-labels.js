// Load modules


// Declare internals

var internals = {};


exports.method = function () {

    outer: for (var i = 0; i < 1; ++i) {
        inner: for (var j = 0; j < 1; ++j) {
            continue outer;
        }
    }

    return [i, j];
};

