'use strict';

const HapiPlugin = require('@hapi/eslint-plugin');

// this is a deliberately unused function that will reduce coverage percentage
// if it ends up getting instrumented, giving us something to assert against
const unusedMethod = () => {
	console.log('hello world')
}

module.exports = [...HapiPlugin.configs.module]
