'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method = function (a, b) {
	return add(a, b);

	function add(a, b) {
		return a + b;
	}
};
exports.methodNotCalled = function (a, b) {
	return add(a, b);

	function add(a, b) {
		return a + b;
	}
};