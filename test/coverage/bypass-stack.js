'use strict';

// Load modules


// Declare internals

const internals = {
  isSet: 'isSet-shim',
};


internals.utilModule = {
  default: {
    types: {
      // $lab:coverage:off$
      isSet: (v) => v instanceof Set
      // $lab:coverage:on$
    }
  }
};

exports.getIsSet = function () {

  /* $lab:coverage:off$ */
  const {
    types
  } =
  /*$lab:coverage:push$*/
  /*$lab:coverage:off$*/
  internals.utilModule
  /*$lab:coverage:pop$*/
  .
  /*$lab:coverage:push$*/
  /*$lab:coverage:off$*/
  default
  /*$lab:coverage:pop$*/
  ;
  const isSet = types && types.isSet || internals.isSet;
  /* $lab:coverage:on$ */

  return isSet;
};
