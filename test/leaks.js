// Load modules

var Path = require('path');
var Code = require('code');
var _Lab = require('../test_runner');
var Lab = require('../');


// Declare internals

var internals = {
    harmonyGlobals: ['Promise', 'Proxy', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet']
};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('Leaks', function () {

    it('identifies global leaks', function (done) {

        global.abc = 1;
        var leaks = Lab.leaks.detect();
        delete global.abc;
        expect(leaks.length).to.equal(1);
        done();
    });

    it('identifies global leaks for non-enumerable properties', function (done) {

        Object.defineProperty(global, 'abc', { enumerable: false, configurable: true });
        var leaks = Lab.leaks.detect();
        delete global.abc;
        expect(leaks.length).to.equal(1);
        done();
    });

    it('verifies no leaks', function (done) {

        var leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);
        done();
    });

    it('ignores DTrace globals', function (done) {

        var currentGlobal = global.DTRACE_HTTP_SERVER_RESPONSE;

        global.DTRACE_HTTP_SERVER_RESPONSE = 1;
        var leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        global.DTRACE_HTTP_SERVER_RESPONSE = currentGlobal;
        done();
    });

    it('works with missing DTrace globals', function (done) {

        delete global.DTRACE_HTTP_SERVER_RESPONSE;
        delete global.DTRACE_HTTP_CLIENT_REQUEST;
        delete global.DTRACE_NET_STREAM_END;
        delete global.DTRACE_HTTP_SERVER_REQUEST;
        delete global.DTRACE_NET_SOCKET_READ;
        delete global.DTRACE_HTTP_CLIENT_RESPONSE;
        delete global.DTRACE_NET_SOCKET_WRITE;
        delete global.DTRACE_NET_SERVER_CONNECTION;

        var leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        done();
    });

    it('ignores Counter globals', function (done) {

        global.COUNTER_NET_SERVER_CONNECTION = 1;
        var leaks = Lab.leaks.detect();
        delete global.COUNTER_NET_SERVER_CONNECTION;
        expect(leaks.length).to.equal(0);
        done();
    });

    it('ignores Harmony globals', function (done) {

        var harmonyGlobals = internals.harmonyGlobals;

        for (var i = 0; i < harmonyGlobals.length; ++i) {
            var harmonyGlobal = harmonyGlobals[i];

            global[harmonyGlobal] = global[harmonyGlobal] || 1;
        }

        var leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        for (i = 0; i < harmonyGlobals.length; ++i) {
            harmonyGlobal = harmonyGlobals[i];

            if (global[harmonyGlobal] === 1) {
                delete global[harmonyGlobal];
            }
        }

        done();
    });

    it('handles case where Harmony globals do not exist', function (done) {

        var harmonyGlobals = internals.harmonyGlobals;
        var originalValues = {};

        for (var i = 0; i < harmonyGlobals.length; ++i) {
            var harmonyGlobal = harmonyGlobals[i];

            originalValues[harmonyGlobal] = global[harmonyGlobal];
            delete global[harmonyGlobal];
        }

        var leaks = Lab.leaks.detect();
        expect(leaks.length).to.equal(0);

        for (i = 0; i < harmonyGlobals.length; ++i) {
            harmonyGlobal = harmonyGlobals[i];

            if (originalValues[harmonyGlobal]) {
                global[harmonyGlobal] = originalValues[harmonyGlobal];
            }
        }

        done();
    });

    it('identifies custom globals', function (done) {

        global.abc = 1;
        var leaks = Lab.leaks.detect(['abc']);
        delete global.abc;
        expect(leaks.length).to.equal(0);
        done();
    });
});
