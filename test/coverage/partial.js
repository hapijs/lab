// Load modules


// Declare internals

var internals = {};


exports.method = function (a, b, c) {

    var d = 0;
    if (a) {
        d += 1;
    }
    else if (c > 10) {
        d += 1;
    }

    var e = (a ? b : c);

    var f;
    if (e)
        f = 0;
    else
        f = 1;

    while (false)++f;

    var g = 0;
    label:
        while (g > 3) { ++g; }

    var h = false || a;

    for (var i = 0;
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

    var n = false ?
        a
        +
        b
        :
        0;

    var j = [1, 2, 3];
    var l = 0;
    for (var k in j) {
        ++l;
    }

    var m = (a ? b : c) || (c ? d : e);

    return d + (a || b || c);
};
