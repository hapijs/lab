'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (a, b, c) {

	// $lab:coverage:off$
	let d = 0;
	if (a) { /* $lab:coverage:off$ */
		d += 1;
	}
	else if (c > 10) {
		d += 1;
	}

	return d + (a || b || c);
	/* $lab:coverage:on$ */
};
