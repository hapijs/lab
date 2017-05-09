'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../test_runner');
const Lab = require('../');


// Declare internals

const internals = {
    harmonyGlobals: ['Proxy', 'Reflect'],
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

    beforeEach((done) => {

        testedKeys = [];
        done();
    });

    afterEach((done) => {

        testedKeys.forEach((key) => {
            // Only delete globals that were manually set, and avoid deleting pre-existing globals
            if (global[testedKeys] && global[testedKeys] === 1) {
                delete global[testedKeys];
            }
        });
        done();
    });

    it('identifies global leaks', (done) => {

        testedKeys.push('abc');
        global.abc = 1;

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(1);
        done();
    });

    it('identifies global leaks for non-enumerable properties', (done) => {

        testedKeys.push('abc');
        Object.defineProperty(global, 'abc', { enumerable: false, configurable: true, value: 1 });

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(1);
        done();
    });

    it('verifies no leaks', (done) => {

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
        done();
    });

    it('ignores DTrace globals', (done) => {

        testedKeys.push('DTRACE_HTTP_SERVER_RESPONSE');
        global.DTRACE_HTTP_SERVER_RESPONSE = global.DTRACE_HTTP_SERVER_RESPONSE || 1;

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
        done();
    });

    it('works with missing DTrace globals', (done) => {

        delete global.DTRACE_HTTP_SERVER_RESPONSE;
        delete global.DTRACE_HTTP_CLIENT_REQUEST;
        delete global.DTRACE_NET_STREAM_END;
        delete global.DTRACE_HTTP_SERVER_REQUEST;
        delete global.DTRACE_NET_SOCKET_READ;
        delete global.DTRACE_HTTP_CLIENT_RESPONSE;
        delete global.DTRACE_NET_SOCKET_WRITE;
        delete global.DTRACE_NET_SERVER_CONNECTION;

        const leaks = Lab.leaks.detect();

        expect(leaks.length).to.equal(0);
        done();
    });

    it('ignores Counter globals', (done) => {

        const counterGlobals = internals.counterGlobals;
        testedKeys = internals.counterGlobals;

        counterGlobals.forEach((counterGlobal) => {

            global[counterGlobal] = global[counterGlobal] || 1;
        });

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
        done();
    });

    it('handles case where Counter globals do not exist', (done) => {

        const counterGlobals = internals.counterGlobals;
        const originalValues = {};

        counterGlobals.forEach((counterGlobal) => {

            originalValues[counterGlobal] = global[counterGlobal];
            delete global[counterGlobal];
        });

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        for (const counterGlobal in originalValues) {
            global[counterGlobal] = originalValues[counterGlobal];
        }
        done();
    });

    it('ignores WebAssembly global', (done) => {

        testedKeys.push('WebAssembly');
        global.WebAssembly = global.WebAssembly || 1;

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
        done();
    });

    it('ignores Harmony globals', (done) => {

        const harmonyGlobals = internals.harmonyGlobals;
        testedKeys = internals.harmonyGlobals;

        harmonyGlobals.forEach((harmonyGlobal) => {

            global[harmonyGlobal] = global[harmonyGlobal] || 1;
        });

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
        done();
    });

    it('handles case where Harmony globals do not exist', (done) => {

        const harmonyGlobals = internals.harmonyGlobals;
        const originalValues = {};

        harmonyGlobals.forEach((harmonyGlobal) => {

            originalValues[harmonyGlobal] = global[harmonyGlobal];
            delete global[harmonyGlobal];
        });

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        for (const harmonyGlobal in originalValues) {
            global[harmonyGlobal] = originalValues[harmonyGlobal];
        }
        done();
    });

    it('identifies custom globals', (done) => {

        testedKeys.push('abc');
        global.abc = 1;
        const leaks = Lab.leaks.detect(['abc']);
        expect(leaks.length).to.equal(0);
        done();
    });
});
