'use strict';

// Load modules


// Declare internals

const internals = {};

/*$lab:coverage:off$*/const noop = function () {};

const /*$lab:coverage:on$*/FiveMath = function () {

    this.addFive = function (value) {

        return value + 5;
    };

    this.subtractFive = function (value) {

      return value - 5;
    };
};

const fiveMath = new FiveMath();

exports.method = fiveMath.addFive;
