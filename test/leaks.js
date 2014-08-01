// Load modules

var Path = require('path');
var _Lab = require('../test_runner');
var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = _Lab.expect;


describe('Leaks', function () {

    it('identifies global leaks', function (done) {

        global.abc = 1;
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

        global.DTRACE_HTTP_SERVER_RESPONSE = 1;
        var leaks = Lab.leaks.detect();
        delete global.DTRACE_HTTP_SERVER_RESPONSE;
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

    it('identifies custom globals', function (done) {

        global.abc = 1;
        var leaks = Lab.leaks.detect(['abc']);
        delete global.abc;
        expect(leaks.length).to.equal(0);
        done();
    });
});
