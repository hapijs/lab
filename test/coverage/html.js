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

	return d + (a || b || c);
};
