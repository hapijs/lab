'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (value) {

    'use strict';
    return value;
};

exports.singleLine = function (value) {

    "use strict"; return value;
};

exports.shouldFail = function (value) {

    return eval('unknownvar = 42');
};
