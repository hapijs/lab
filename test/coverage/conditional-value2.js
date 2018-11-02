'use strict';

// Load modules


exports.method = function (value1, value2, value3) {
	if (value1 || value2 || value3) {
		return true;
	}
	return false;
};
