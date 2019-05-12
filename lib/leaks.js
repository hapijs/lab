'use strict';

const internals = {
    allowed: [
        '_labScriptRun',                // Lab global to detect script executions

        // Enumerable globals

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
        'GLOBAL',
        'globalThis',
        'root',
        'constructor',
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
        'DataView',
        '__$$labCov',
        'gc',

        // Non-Enumerable globals

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
        'Intl',
        'Map',
        'Promise',
        'Set',
        'Symbol',
        'WeakMap',
        'WeakSet',

        // Sometime

        'Atomics',
        'Proxy',
        'Reflect',
        'SharedArrayBuffer',
        'WebAssembly',
        'URL',
        'URLSearchParams',
        'TextEncoder',
        'TextDecoder',
        'BigInt',
        'BigUint64Array',
        'BigInt64Array',
        'DTRACE_HTTP_SERVER_RESPONSE',
        'DTRACE_HTTP_SERVER_REQUEST',
        'DTRACE_HTTP_CLIENT_RESPONSE',
        'DTRACE_HTTP_CLIENT_REQUEST',
        'DTRACE_NET_STREAM_END',
        'DTRACE_NET_SERVER_CONNECTION',
        'DTRACE_NET_SOCKET_READ',
        'DTRACE_NET_SOCKET_WRITE',
        'COUNTER_NET_SERVER_CONNECTION',
        'COUNTER_NET_SERVER_CONNECTION_CLOSE',
        'COUNTER_HTTP_SERVER_REQUEST',
        'COUNTER_HTTP_SERVER_RESPONSE',
        'COUNTER_HTTP_CLIENT_REQUEST',
        'COUNTER_HTTP_CLIENT_RESPONSE',
        'queueMicrotask'
    ],

    symbols: [
        Symbol.toStringTag
    ]
};


exports.detect = function (customGlobals) {

    let allowed = internals.allowed;
    if (customGlobals) {
        allowed = allowed.concat(customGlobals);
    }

    const leaks = Object.getOwnPropertyNames(global).filter((key) => !allowed.includes(key));

    if (Object.getOwnPropertySymbols(global).some((key) => !internals.symbols.includes(key))) {
        leaks.push('global-symbol-property');
    }

    return leaks;
};
