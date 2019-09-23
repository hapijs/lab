'use strict';

module.exports.default = function (a, b) {

    if (a < 10) {
        throw new Error('Bad argument');
    }

    return a + b;
};
