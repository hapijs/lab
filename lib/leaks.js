'use strict';

const whitelist = {};
Object.getOwnPropertyNames(global).forEach((name) => {
    whitelist[name] = true;
});
whitelist._labScriptRun = true;
whitelist.__$$labCov = true;


exports.detect = function (customGlobals) {
    const leaks = [];
    if (!customGlobals) {
        customGlobals = [];
    }
    const globals = Object.getOwnPropertyNames(global);
    for (let i = 0; i < globals.length; ++i) {
        const name = globals[i];
        if (!customGlobals.includes(name) &&
            !whitelist[name] &&
            global[name] !== global) {

            leaks.push(globals[i]);
        }
    }

    return leaks;
};
