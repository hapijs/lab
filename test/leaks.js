'use strict';

// Load modules

const Code = require('@hapi/code');
const Semver = require('semver');
const _Lab = require('../test_runner');
const Lab = require('../');


// Declare internals

const internals = {
    harmonyGlobals: ['Proxy', 'Reflect', 'WebAssembly'],
    counterGlobals: [
        'COUNTER_NET_SERVER_CONNECTION',
        'COUNTER_NET_SERVER_CONNECTION_CLOSE',
        'COUNTER_HTTP_SERVER_REQUEST',
        'COUNTER_HTTP_SERVER_RESPONSE',
        'COUNTER_HTTP_CLIENT_REQUEST',
        'COUNTER_HTTP_CLIENT_RESPONSE'
    ]
};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const afterEach = lab.afterEach;
const beforeEach = lab.beforeEach;
const expect = Code.expect;


describe('Leaks', () => {

    let testedKeys = [];

    beforeEach(() => {

        testedKeys = [];
    });

    afterEach(() => {

        testedKeys.forEach((key) => {
            // Only delete globals that were manually set, and avoid deleting pre-existing globals
            if (global[testedKeys] && global[testedKeys] === 1) {
                delete global[testedKeys];
            }
        });
    });

    it('identifies global leaks', async () => {

        testedKeys.push('abc');
        global.abc = 1;

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(1);
    });

    it('identifies global leaks (symbol)', async () => {

        const symbol = Symbol('test');
        global[symbol] = 1;

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(1);
        delete global[symbol];
    });

    it('identifies global leaks for non-enumerable properties', async () => {

        testedKeys.push('abc');
        Object.defineProperty(global, 'abc', { enumerable: false, configurable: true, value: 1 });

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(1);
    });

    it('verifies no leaks', async () => {

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
    });

    it('ignores DTrace globals', async () => {

        testedKeys.push('DTRACE_HTTP_SERVER_RESPONSE');
        global.DTRACE_HTTP_SERVER_RESPONSE = global.DTRACE_HTTP_SERVER_RESPONSE || 1;

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
    });

    it('works with missing DTrace globals', async () => {

        delete global.DTRACE_HTTP_SERVER_RESPONSE;
        delete global.DTRACE_HTTP_CLIENT_REQUEST;
        delete global.DTRACE_NET_STREAM_END;
        delete global.DTRACE_HTTP_SERVER_REQUEST;
        delete global.DTRACE_NET_SOCKET_READ;
        delete global.DTRACE_HTTP_CLIENT_RESPONSE;
        delete global.DTRACE_NET_SOCKET_WRITE;
        delete global.DTRACE_NET_SERVER_CONNECTION;

        const leaks = await Lab.leaks.detect();

        expect(leaks.length).to.equal(0);
    });

    it('ignores Counter globals', { skip: process.platform === 'win32' && Semver.gte(process.version, '11.0.0') }, async () => {

        const counterGlobals = internals.counterGlobals;
        testedKeys = internals.counterGlobals;

        counterGlobals.forEach((counterGlobal) => {

            global[counterGlobal] = global[counterGlobal] || 1;
        });

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
    });

    it('handles case where Counter globals do not exist', async () => {

        const counterGlobals = internals.counterGlobals;
        const originalValues = {};

        counterGlobals.forEach((counterGlobal) => {

            originalValues[counterGlobal] = global[counterGlobal];
            delete global[counterGlobal];
        });

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        for (const counterGlobal in originalValues) {
            global[counterGlobal] = originalValues[counterGlobal];
        }
    });

    it('ignores WebAssembly global', async () => {

        testedKeys.push('WebAssembly');
        global.WebAssembly = global.WebAssembly || 1;

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
    });

    it('ignores undici global', async () => {

        // trigger a lazy require of Undici, where supported, to expose a `Symbol(undici.globalDispatcher.1)`
        typeof FormData;

        const leaks = await Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
    });

    it('identifies custom globals', async () => {

        testedKeys.push('abc');
        global.abc = 1;
        const leaks = await Lab.leaks.detect(['abc']);
        expect(leaks.length).to.equal(0);
    });
});
