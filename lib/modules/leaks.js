'use strict';

const Events = require('events');
const WorkerThreads = require('worker_threads');

const internals = {
    allowed: [
        '_labScriptRun',                // Lab global to detect script executions

        // Enumerable globals

        'GLOBAL',
        'root',
        'constructor',
        '__$$labCov',
        'gc',

        // Sometime

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

        // External symbols

        'Symbol(graceful-fs.queue)'
    ],

    symbols: [
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


exports.detect = async function (customGlobals, options = {}) {

    const nodeGlobals = await internals.getNodeGlobals();

    let allowed = [...internals.allowed, ...nodeGlobals.allowed];

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
            !symbols.includes(sym.toString()) &&
            !nodeGlobals.symbols.includes(sym.toString())) {

            leaks.push(sym.toString());
        }
    }

    return leaks;
};

internals.getNodeGlobals = async () => {

    const nodeGlobalsWorker = new WorkerThreads.Worker(__filename);
    const [nodeGlobals] = await Events.once(nodeGlobalsWorker, 'message');

    return nodeGlobals;
};

if (!WorkerThreads.isMainThread) {
    // When this module is used as a worker, it posts back global property names and symbols
    WorkerThreads.parentPort.postMessage({
        allowed: Object.getOwnPropertyNames(globalThis),
        symbols: Object.getOwnPropertySymbols(globalThis).map(String)
    });
}
