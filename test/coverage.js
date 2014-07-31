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


describe('Coverage', function () {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, './coverage'), coverageExclude: 'exclude' });

    it('instruments and measures coverage', function (done) {

        var Test = require('./coverage/basic');
        Test.method(1);

        var report = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, './coverage/basic') });
        expect(report.percent).to.equal(100);
        done();
    });

    it('identifies lines with partial coverage', function (done) {

        var Test = require('./coverage/partial');
        Test.method(1, 2, 3);

        var report = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, './coverage/partial') });
        expect(Math.floor(report.percent)).to.equal(69);
        expect(report.sloc).to.equal(13);
        expect(report.misses).to.equal(4);
        expect(report.hits).to.equal(9);
        done();
    });

    it('bypasses marked code', function (done) {

        var Test = require('./coverage/bypass');
        Test.method(1, 2, 3);

        var report = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, './coverage/bypass') });
        expect(Math.floor(report.percent)).to.equal(100);
        expect(report.sloc).to.equal(15);
        expect(report.misses).to.equal(0);
        expect(report.hits).to.equal(15);
        done();
    });

    it('ignores non-matching files', function (done) {

        var Test = require('./coverage/exclude/ignore');

        var report = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, './coverage/exclude/ignore') });
        expect(Math.floor(report.percent)).to.equal(0);
        expect(report.files).to.have.length(0);
        done();
    });
});
