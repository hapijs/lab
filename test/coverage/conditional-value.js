'use strict';

// Load modules


// Declare internals

const internals = {
    def: 42
};


exports.method = function (value, bool) {

    const v = bool && (value || internals.def);
    return v;
};
