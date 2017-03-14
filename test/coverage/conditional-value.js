'use strict';

// Load modules


exports.method = function (bool, value1, value2) {

    const v = bool && (value1 || value2);
    return v;
};
