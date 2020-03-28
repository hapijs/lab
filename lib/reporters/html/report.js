'use strict';

const { scripts } = require('./partials/scripts');
const { css } = require('./partials/css');
const { menu } = require('./partials/menu');
const { tests } = require('./partials/tests');
const { cov } = require('./partials/cov');
const { linting } = require('./partials/linting');

exports.reportTemplate = function (context) {

    return `<!doctype html>
<html>
  <head>
    <title>Tests &amp; Coverage</title>
    ${scripts()}
    ${css()}
  </head>
  <body>
    ${menu(context.coverage, context.lint)}
    ${tests(context.failures, context.skipped, context.tests, context.duration, context.paths, context.errors)}
    ${cov(context.coverage)}
    ${linting(context.lint)}
  </body>
</html>`;
};
