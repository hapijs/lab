// Load modules


// Declare internals

var internals = {};


exports.detect = function (customGlobals) {

    var whitelist = {
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
        gc: true
    };

    if (customGlobals) {
        for (var c = 0, cl = customGlobals.length; c < cl; ++c) {
            whitelist[customGlobals[c]] = true;
        }
    }

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

    var leaks = [];
    var globals = Object.keys(global);
    for (var i = 0, il = globals.length; i < il; ++i) {
        if (!whitelist[globals[i]] &&
            global[globals[i]] !== global) {
            
            leaks.push(globals[i]);
        }
    }

    return leaks;
};
