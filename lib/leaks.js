'use strict';

// Load modules


// Declare internals

const internals = {};


exports.detect = function (customGlobals) {

    const whitelist = {
        _labScriptRun: true,                // Lab global to detect script executions

        // Enumerable globals
        setTimeout: true,
        setInterval: true,
        setImmediate: true,
        clearTimeout: true,
        clearInterval: true,
        clearImmediate: true,
        console: true,
        Buffer: true,
        process: true,
        global: true,
        GLOBAL: true,
        root: true,
        constructor: true,
        ArrayBuffer: true,
        Int8Array: true,
        Uint8Array: true,
        Uint8ClampedArray: true,
        Int16Array: true,
        Uint16Array: true,
        Int32Array: true,
        Uint32Array: true,
        Float32Array: true,
        Float64Array: true,
        DataView: true,
        __$$labCov: true,
        gc: true,

        // Non-Enumerable globals
        Array: true,
        isNaN: true,
        ReferenceError: true,
        Number: true,
        RangeError: true,
        EvalError: true,
        Function: true,
        isFinite: true,
        Object: true,
        undefined: true,
        Date: true,
        SyntaxError: true,
        String: true,
        eval: true,
        parseFloat: true,
        unescape: true,
        Error: true,
        encodeURI: true,
        NaN: true,
        RegExp: true,
        encodeURIComponent: true,
        Math: true,
        decodeURI: true,
        parseInt: true,
        Infinity: true,
        escape: true,
        decodeURIComponent: true,
        JSON: true,
        TypeError: true,
        URIError: true,
        Boolean: true,
        Intl: true,
        Map: true,
        Promise: true,
        Set: true,
        Symbol: true,
        WeakMap: true,
        WeakSet: true
    };

    if (customGlobals) {
        for (let i = 0; i < customGlobals.length; ++i) {
            whitelist[customGlobals[i]] = true;
        }
    }

    // $lab:coverage:off$
    if (global.Atomics) {
        whitelist.Atomics = true;
    }
    // $lab:coverage:on$

    if (global.Proxy) {
        whitelist.Proxy = true;
    }

    if (global.Reflect) {
        whitelist.Reflect = true;
    }

    // $lab:coverage:off$
    if (global.SharedArrayBuffer) {
        whitelist.SharedArrayBuffer = true;
    }
    // $lab:coverage:on$

    // $lab:coverage:off$
    if (global.WebAssembly) {
    // $lab:coverage:on$
        whitelist.WebAssembly = true;
    }

    // $lab:coverage:off$
    if (global.URL) {
        whitelist.URL = true;
        whitelist.URLSearchParams = true;
    }
    // $lab:coverage:on$

    // $lab:coverage:off$
    if (global.TextEncoder) {
        whitelist.TextEncoder = true;
    }
    // $lab:coverage:on$

    // $lab:coverage:off$
    if (global.TextDecoder) {
        whitelist.TextDecoder = true;
    }
    // $lab:coverage:on$

    // $lab:coverage:off$
    if (global.BigInt) {
        whitelist.BigInt = true;
        whitelist.BigUint64Array = true;
        whitelist.BigInt64Array = true;
    }
    // $lab:coverage:on$

    if (global.DTRACE_HTTP_SERVER_RESPONSE) {
        whitelist.DTRACE_HTTP_SERVER_RESPONSE = true;
        whitelist.DTRACE_HTTP_SERVER_REQUEST = true;
        whitelist.DTRACE_HTTP_CLIENT_RESPONSE = true;
        whitelist.DTRACE_HTTP_CLIENT_REQUEST = true;
        whitelist.DTRACE_NET_STREAM_END = true;
        whitelist.DTRACE_NET_SERVER_CONNECTION = true;
        whitelist.DTRACE_NET_SOCKET_READ = true;
        whitelist.DTRACE_NET_SOCKET_WRITE = true;
    }

    if (global.COUNTER_NET_SERVER_CONNECTION) {
        whitelist.COUNTER_NET_SERVER_CONNECTION = true;
        whitelist.COUNTER_NET_SERVER_CONNECTION_CLOSE = true;
        whitelist.COUNTER_HTTP_SERVER_REQUEST = true;
        whitelist.COUNTER_HTTP_SERVER_RESPONSE = true;
        whitelist.COUNTER_HTTP_CLIENT_REQUEST = true;
        whitelist.COUNTER_HTTP_CLIENT_RESPONSE = true;
    }

    // $lab:coverage:off$
    if ('queueMicrotask' in global) {
        whitelist.queueMicrotask = true;
    }
    // $lab:coverage:on$

    const leaks = [];
    const globals = Object.getOwnPropertyNames(global);
    for (let i = 0; i < globals.length; ++i) {
        if (!whitelist[globals[i]] &&
            global[globals[i]] !== global) {

            leaks.push(globals[i]);
        }
    }

    return leaks;
};
