// Load modules


// Declare internals

var internals = {};


exports.method = function (value) {

    var top = function (err) {

        var inner = function (err) {

            return value;
        };

        return inner;
    };

    top();
};
