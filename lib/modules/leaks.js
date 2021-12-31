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
        'AbortController',
        'AbortSignal',
        'AggregateError',
        'Buffer',
        'performance',
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
        'MessageChannel',
        'MessageEvent',
        'MessagePort',
        'structuredClone',

        // Non-Enumerable globals

        'Array',
        'atob',
        'btoa',
        'isNaN',
        'ReferenceError',
        'Number',
        'RangeError',
        'EvalError',
        'Event',
        'EventTarget',
        'FinalizationRegistry',
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
        'WeakRef',
        'WeakSet',
        'DOMException',

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
        'queueMicrotask',

        // External symbols

        'Symbol(graceful-fs.queue)'
    ],

    symbols: [
        Symbol.toStringTag,
        Symbol.for('@hapi/lab/coverage/_state')
    ],

    typescript: [
        '__extends',
        '__assign',
        '__rest',
        '__decorate',
        '__param',
        '__metadata',
        '__awaiter',
        '__generator',
        '__exportStar',
        '__createBinding',
        '__values',
        '__read',
        '__spread',
        '__spreadArrays',
        '__await',
        '__asyncGenerator',
        '__asyncDelegator',
        '__asyncValues',
        '__makeTemplateObject',
        '__importStar',
        '__importDefault',
        '__classPrivateFieldGet',
        '__classPrivateFieldSet',
        '__classPrivateFieldIn'
    ]
};


exports.detect = function (customGlobals, options = {}) {

    let allowed = internals.allowed;
    if (customGlobals) {
        allowed = [...allowed, ...customGlobals];
    }

    if (options.typescript) {
        allowed = [...allowed, ...internals.typescript];
    }

    const symbols = [];
    allowed = allowed.filter((ignore) => {

        if (!/^Symbol\(.+\)$/.test(ignore)) {
            return true;
        }

        symbols.push(ignore);
        return false;
    });

    const leaks = Object.getOwnPropertyNames(global).filter((key) => !allowed.includes(key));

    for (const sym of Object.getOwnPropertySymbols(global)) {
        if (!internals.symbols.includes(sym) &&
            !symbols.includes(sym.toString())) {

            leaks.push(sym.toString());
        }
    }

    return leaks;
};
