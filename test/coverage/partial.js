'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (a, b, c) {

    let d = 0;
    if (a) {
        d += 1;
    }
    else if (c > 10) {
        d += 1;
    }

    const e = (a ? b : c);

    let f;
    if (e)
        f = 0;
    else
        f = 1;

    while (false)++f;

    let g = 0;
    label:
        while (g > 3) { ++g; }

    const h = false || a;

    for (let i = 0;
        i < 3;
        ++i) {

    }

    if (a ||
        b ||
        (c ?
        d :
        e)) {

        ++a;
    }

    const n = false ?
        a
        +
        b
        :
        0;

    const j = [1, 2, 3];
    let l = 0;
    for (let k in j) {
        ++l;
    }
    
    for (let o of j) {      
        ++l;
    }

    const m = (a ? b : c) || (c ? d : e);

    return d + (a || b || c);
};
