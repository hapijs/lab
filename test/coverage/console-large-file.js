'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (value) {

	if (value) {
		value += 1;
	}
	else {
		value -= 1;
	}

	if (value) {
		value += 1;
		value += 1;
	}
	else {
		value -= 1;
		value -= 1;
	}

	if (value) {
		value += 1;
		value += 1;
		value += 1;
	}
	else {
		value -= 1;
		value -= 1;
		value -= 1;
	}

	if (value) {
		value += 1;
		value += 1;
		value += 1;
		value += 1;
	}
	else {
		value -= 1;
		value -= 1;
		value -= 1;
		value -= 1;
	}

	if (value) {
		value += 1;
		value += 1;
		value += 1;
		value += 1;
		value += 1;
	}
	else {
		value -= 1;
		value -= 1;
		value -= 1;
		value -= 1;
		value -= 1;
	}

	return value;
};
