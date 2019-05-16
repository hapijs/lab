'use strict';

const Hoek = require('@hapi/hoek');


module.exports.default = async function (a, b) {

    await Hoek.wait();
    return a + b;
};
