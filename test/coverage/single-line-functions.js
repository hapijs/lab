'use strict';

// Load modules


// Declare internals

const internals = {};


exports.method1 = (a, b) => a + b;
exports.method1NotCalled = (a, b) => a * b;

exports.method2 = (a, b) => {return a + b;};
exports.method2NotCalled = (a, b) => {return a * b;};

exports.method3 = (a, b) => {
	return a + b;
};
exports.method3NotCalled = (a, b) => {
	return a * b;
};

exports.method4 = (a, b) =>
	a + b
exports.method4NotCalled = (a, b) =>
	a * b

exports.method5 = function (a, b) {return a + b;};
exports.method5NotCalled = function (a, b) {return a * b;};

exports.method6 = function (a, b) {return a + b;};
exports.method6NotCalled = function (a, b) {return a * b;};

exports.method7 = function (a, b) {
	return a + b;
};
exports.method7NotCalled = function (a, b) {
	return a * b;
};

exports.method8 = function (a, b) {
	return a + b;
};
exports.method8NotCalled = function (a, b) {
	return a * b;
};

exports.method9 = function (a, b) {a = a - 1; b = b + 1; return a + b;};
exports.method9NotCalled = function (a, b) {a = a - 1; b = b + 1; return a * b;};

exports.method10 = (a, b) => exports.method9(a, b);
exports.method10NotCalled = (a, b) => exports.method9NotCalled(a, b);

exports.method11 = (a, b) => a || b;
exports.method11Partial = (a, b) => a || b;
