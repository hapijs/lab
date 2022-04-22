'use strict';

exports.method = function () {

	// $lab:coverage:off$ $if:testing$
	if (false ? 1 : 0) {
		// $lab:coverage:on$ $not:testing$
		return -1;
	}

	// $lab:coverage:on$
	return 1;
};
