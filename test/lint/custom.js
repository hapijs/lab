'use strict';

exports.lint = function () {

  process.send([{
    filename: 'custom',
    errors: [
      { line: 1, severity: 'ERROR', message: 'custom runner' }
    ]
  }]);
};

exports.lint();
