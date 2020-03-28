'use strict';

const Hoek = require('@hapi/hoek');

exports.replace = (str, from, to, flags) => {

    return str.replace(new RegExp(from, flags), to);
};

// Display all valid numbers except zeros
exports.number = (number) => {

    return +number || '';
};

exports.join = (array, separator) => {

    return array.join(separator);
};

exports.lintJoin = (array) => {

    let str = '';

    for (let i = 0; i < array.length; ++i) {
        if (str) {
            str += '&#xa;'; // This is a line break
        }

        str += Hoek.escapeHtml(array[i]);
    }

    return `${str}`;
};

exports.errorMessage = (err) => {

    return `${Hoek.escapeHtml('' + err.message)}`;
};

exports.errorStack = (err) => {

    const stack = err.stack.slice(err.stack.indexOf('\n') + 1).replace(/^\s*/gm, '  ');
    return `${Hoek.escapeHtml(stack)}`;
};
