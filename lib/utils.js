// Load modules


// Declare internals

var internals = {};


exports.mergeOptions = function (parent, child) {

    var options = {};
    Object.keys(parent || {}).forEach(function (key) {

        options[key] = parent[key];
    });

    Object.keys(child).forEach(function (key) {

        options[key] = child[key];
    });

    return options;
};
