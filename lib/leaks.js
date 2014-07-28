// Load modules


// Declare internals

var internals = {};


exports.detect = function (customGlobals) {

    var enumLeaks = internals.detectEnumerableLeaks(customGlobals);
    var nonEnumLeaks = internals.detectNonEnumerableLeaks(customGlobals);

    return enumLeaks.concat(nonEnumLeaks);
};


internals.detectEnumerableLeaks = function (customGlobals) {

    var leaks = [];
    var knownGlobals = [
        'setTimeout',
        'setInterval',
        'setImmediate',
        'clearTimeout',
        'clearInterval',
        'clearImmediate',
        'console',
        'Buffer',
        'process',
        'global',
        'constructor',
        'module',
        'require',
        'undefined',
        'GLOBAL',
        'root'
    ];

    customGlobals.forEach(function(custom) {

        if (global[custom]) {
            knownGlobals.push(global[custom]);
        }
    });

    if (global.gc) {
        knownGlobals.push('gc');
    }

    if (global['__$$labCov']) {
        knownGlobals.push('__$$labCov');
    }

    if (global.DTRACE_HTTP_SERVER_RESPONSE) {
        knownGlobals.push('DTRACE_HTTP_SERVER_RESPONSE');
        knownGlobals.push('DTRACE_HTTP_SERVER_REQUEST');
        knownGlobals.push('DTRACE_HTTP_CLIENT_RESPONSE');
        knownGlobals.push('DTRACE_HTTP_CLIENT_REQUEST');
        knownGlobals.push('DTRACE_NET_STREAM_END');
        knownGlobals.push('DTRACE_NET_SERVER_CONNECTION');
        knownGlobals.push('DTRACE_NET_SOCKET_READ');
        knownGlobals.push('DTRACE_NET_SOCKET_WRITE');
    }

    if (global.COUNTER_NET_SERVER_CONNECTION) {
        knownGlobals.push('COUNTER_NET_SERVER_CONNECTION');
        knownGlobals.push('COUNTER_NET_SERVER_CONNECTION_CLOSE');
        knownGlobals.push('COUNTER_HTTP_SERVER_REQUEST');
        knownGlobals.push('COUNTER_HTTP_SERVER_RESPONSE');
        knownGlobals.push('COUNTER_HTTP_CLIENT_REQUEST');
        knownGlobals.push('COUNTER_HTTP_CLIENT_RESPONSE');
    }

    // Harmony features.

    if (global.Proxy) {
        knownGlobals.push('Proxy');
    }

    if (global.Symbol) {
        knownGlobals.push('Symbol');
    }


    // Check all enumerable properties to see if they are leaks
    for (var currentGlobal in global) {
        var found = knownGlobals.indexOf(currentGlobal.toString()) !== -1;

        if (!found) {
            leaks.push(currentGlobal);
        }
    }

    return leaks;
};


internals.detectNonEnumerableLeaks = function (customGlobals) {

    var leaks = [];
    var knownGlobals = [
        'Array',
        'isNaN',
        'ReferenceError',
        'Number',
        'RangeError',
        'EvalError',
        'Function',
        'isFinite',
        'Object',
        'undefined',
        'Date',
        'SyntaxError',
        'WeakSet',
        'String',
        'eval',
        'parseFloat',
        'unescape',
        'Error',
        'encodeURI',
        'NaN',
        'RegExp',
        'encodeURIComponent',
        'Math',
        'decodeURI',
        'parseInt',
        'Infinity',
        'escape',
        'decodeURIComponent',
        'JSON',
        'TypeError',
        'URIError',
        'Boolean',
        'ArrayBuffer',
        'Int8Array',
        'Uint8Array',
        'Uint8ClampedArray',
        'Int16Array',
        'Uint16Array',
        'Int32Array',
        'Uint32Array',
        'Float32Array',
        'Float64Array',
        'DataView'
    ];

    customGlobals.forEach(function(custom) {

        if (global[custom]) {
            knownGlobals.push(global[custom]);
        }
    });

    // Harmony features.

    if (global.WeakMap) {
        knownGlobals.push('WeakMap');
    }

    if (global.Promise) {
        knownGlobals.push('Promise');
    }

    // Check all non-enumerable properties to see if they are leaks
    var nonEnumKeys = internals.getNonEnumKeys();
    for (var i = 0, il = nonEnumKeys.length; i < il; ++i) {
        var currentGlobal = nonEnumKeys[i];
        var found = knownGlobals.indexOf(currentGlobal) !== -1;

        if (!found) {
            leaks.push(currentGlobal);
        }
    }

    return leaks;
};


internals.getNonEnumKeys = function () {

    var allKeys = Object.getOwnPropertyNames(global);
    var enumKeys = Object.keys(global);
    var nonEnumKeys = allKeys.filter(function (key) {

        return (enumKeys.indexOf(key) === -1);
    });

    return nonEnumKeys;
};
