// Load modules


// Declare internals

var internals = {};


exports.method = function (value) {

    var top = function (res) {

        var inner = function (res) {

            return value;
        };
    };

    top();
};
