// Load modules


// Declare internals

var internals = {};


exports.detect = function () {

    var leaks = [];
    var knownGlobals = [
        setTimeout,
        setInterval,
        setImmediate,
        clearTimeout,
        clearInterval,
        clearImmediate,
        console,
        Buffer,
        process,
        global,
        constructor
    ];

    if (global.gc) {
        knownGlobals.push(global.gc);
    }

    if (global._blanket) {
        knownGlobals.push(global._blanket);
    }

    if (global['__$$labCov']) {
        knownGlobals.push(global['__$$labCov']);
    }

    if (global.DTRACE_HTTP_SERVER_RESPONSE) {
        knownGlobals.push(DTRACE_HTTP_SERVER_RESPONSE);
        knownGlobals.push(DTRACE_HTTP_SERVER_REQUEST);
        knownGlobals.push(DTRACE_HTTP_CLIENT_RESPONSE);
        knownGlobals.push(DTRACE_HTTP_CLIENT_REQUEST);
        knownGlobals.push(DTRACE_NET_STREAM_END);
        knownGlobals.push(DTRACE_NET_SERVER_CONNECTION);
        knownGlobals.push(DTRACE_NET_SOCKET_READ);
        knownGlobals.push(DTRACE_NET_SOCKET_WRITE);
    }

    if (global.COUNTER_NET_SERVER_CONNECTION) {
        knownGlobals.push(COUNTER_NET_SERVER_CONNECTION);
        knownGlobals.push(COUNTER_NET_SERVER_CONNECTION_CLOSE);
        knownGlobals.push(COUNTER_HTTP_SERVER_REQUEST);
        knownGlobals.push(COUNTER_HTTP_SERVER_RESPONSE);
        knownGlobals.push(COUNTER_HTTP_CLIENT_REQUEST);
        knownGlobals.push(COUNTER_HTTP_CLIENT_RESPONSE);
    }

    if (global.ArrayBuffer) {
        knownGlobals.push(ArrayBuffer);
        knownGlobals.push(Int8Array);
        knownGlobals.push(Uint8Array);
        knownGlobals.push(Uint8ClampedArray);
        knownGlobals.push(Int16Array);
        knownGlobals.push(Uint16Array);
        knownGlobals.push(Int32Array);
        knownGlobals.push(Uint32Array);
        knownGlobals.push(Float32Array);
        knownGlobals.push(Float64Array);
        knownGlobals.push(DataView);
    }

    for (var currentGlobal in global) {
        var found = false;

        for (var knownGlobal in knownGlobals) {
            if (global[currentGlobal] === knownGlobals[knownGlobal]) {
                found = true;
                break;
            }
        }

        if (!found) {
            leaks.push(currentGlobal);
        }
    }

    return leaks;
};
