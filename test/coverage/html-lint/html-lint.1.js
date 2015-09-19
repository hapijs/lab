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

	false && console.log(d == null) // Double linting fail

	return d + (a || b || c);
};
