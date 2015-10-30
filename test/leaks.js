'use strict';

// Load modules

const Path = require('path');
const Code = require('code');
const _Lab = require('../test_runner');
const Lab = require('../');


// Declare internals

const internals = {
    harmonyGlobals: ['Promise', 'Proxy', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet']
};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Leaks', () => {

    it('identifies global leaks', (done) => {

        global.abc = 1;
        const leaks = Lab.leaks.detect();
        delete global.abc;
        expect(leaks.length).to.equal(1);
        done();
    });

    it('identifies global leaks for non-enumerable properties', (done) => {

        Object.defineProperty(global, 'abc', { enumerable: false, configurable: true });
        const leaks = Lab.leaks.detect();
        delete global.abc;
        expect(leaks.length).to.equal(1);
        done();
    });

    it('verifies no leaks', (done) => {

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
        done();
    });

    it('ignores DTrace globals', (done) => {

        const currentGlobal = global.DTRACE_HTTP_SERVER_RESPONSE;

        global.DTRACE_HTTP_SERVER_RESPONSE = 1;
        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        global.DTRACE_HTTP_SERVER_RESPONSE = currentGlobal;
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

        global.COUNTER_NET_SERVER_CONNECTION = 1;
        const leaks = Lab.leaks.detect();
        delete global.COUNTER_NET_SERVER_CONNECTION;
        expect(leaks.length).to.equal(0);
        done();
    });

    it('ignores Harmony globals', (done) => {

        const harmonyGlobals = internals.harmonyGlobals;

        for (let i = 0; i < harmonyGlobals.length; ++i) {
            const harmonyGlobal = harmonyGlobals[i];

            global[harmonyGlobal] = global[harmonyGlobal] || 1;
        }

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        for (let i = 0; i < harmonyGlobals.length; ++i) {
            const harmonyGlobal = harmonyGlobals[i];

            if (global[harmonyGlobal] === 1) {
                delete global[harmonyGlobal];
            }
        }

        done();
    });

    it('handles case where Harmony globals do not exist', (done) => {

        const harmonyGlobals = internals.harmonyGlobals;
        const originalValues = {};

        for (let i = 0; i < harmonyGlobals.length; ++i) {
            const harmonyGlobal = harmonyGlobals[i];

            originalValues[harmonyGlobal] = global[harmonyGlobal];
            delete global[harmonyGlobal];
        }

        const leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        for (let i = 0; i < harmonyGlobals.length; ++i) {
            const harmonyGlobal = harmonyGlobals[i];

            if (originalValues[harmonyGlobal]) {
                global[harmonyGlobal] = originalValues[harmonyGlobal];
            }
        }

        done();
    });

    it('identifies custom globals', (done) => {

        global.abc = 1;
        const leaks = Lab.leaks.detect(['abc']);
        delete global.abc;
        expect(leaks.length).to.equal(0);
        done();
    });
});
