'use strict';

const Utils = require('./utils');

// An unfortunate quirk of source-maps is that it detects
// whether it's a node or browser environment based on the
// presence of fetch(), which is now a global in node v18.
const stash = Utils.stashProperty(globalThis, 'fetch');

module.exports = require('source-map');

Utils.restoreProperty(globalThis, 'fetch', stash);
