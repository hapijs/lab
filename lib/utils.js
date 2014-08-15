// Load modules


// Declare internals

var internals = {};


exports.mergeOptions = function (parent, child, ignore) {

    ignore = ignore || [];
    var options = {};

    Object.keys(parent || {}).forEach(function (key) {

        if (ignore.indexOf(key) === -1) {
            options[key] = parent[key];
        }
    });

    Object.keys(child || {}).forEach(function (key) {

        options[key] = child[key];
    });

    return options;
};


exports.applyOptions = function (parent, child) {

    Object.keys(child).forEach(function (key) {

        parent[key] = child[key];
    });
};
