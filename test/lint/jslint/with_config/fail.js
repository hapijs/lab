// Load modules


// Declare internals

var internals = {};


exports.method = function (value) {

    var myString = 'x';
    var myObject = {
        x: 10
    };
    value = eval('myObject.' + myString);
    return value;
};
