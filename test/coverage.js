// Load modules

var Os = require('os');
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

    it('instruments and measures coverage', function (done) {

        var options = { coverageVar: '__$$testCov1', path: Path.join(__dirname, './coverage/basic') };
        Lab.coverage.instrument(options);
        var Test = require('./coverage/basic');

        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('value of a', function (finished) {

                Lab.expect(Test.method(1)).to.equal(1);
                finished();
            });
        });

        Lab.execute(script, { coverage: true }, null, function (err, notebook) {

            expect(notebook.failures).to.equal(0);
            var report = Lab.coverage.analyze(options);
            expect(report.percent).to.equal(100);
            delete global.__$$testCov1;
            done();
        });
    });

    it('identifies lines with partial coverage', function (done) {

        var options = { coverageVar: '__$$testCov2', path: Path.join(__dirname, './coverage/partial') };
        Lab.coverage.instrument(options);
        var Test = require('./coverage/partial');

        var script = Lab.script({ schedule: false });
        script.experiment('test', function () {

            script.test('value of a', function (finished) {

                Test.method(1, 2, 3);
                finished();
            });
        });

        Lab.execute(script, { coverage: true }, null, function (err, notebook) {

            expect(notebook.failures).to.equal(0);
            var report = Lab.coverage.analyze(options);
            expect(Math.floor(report.percent)).to.equal(69);
            expect(report.sloc).to.equal(13);
            expect(report.misses).to.equal(4);
            expect(report.hits).to.equal(9);
            delete global.__$$testCov2;
            done();
        });
    });

    it('bypasses marked code', function (done) {

        var options = { coverageVar: '__$$testCov3' };
        var Test = Lab.coverage.load(Path.join(__dirname, './coverage/bypass.js'), options);
        Lab.coverage.cleanup();
        Test.method(1, 2, 3);

        var report = Lab.coverage.analyze(options);
        expect(Math.floor(report.percent)).to.equal(100);
        expect(report.sloc).to.equal(15);
        expect(report.misses).to.equal(0);
        expect(report.hits).to.equal(15);
        delete global.__$$testCov3;
        done();
    });

    it('ignores non-matching files', function (done) {

        var options = { coverageVar: '__$$testCov4', path: Path.join(__dirname, './coverage/never_match') };
        Lab.coverage.instrument(options);

        var Test = require('./coverage/ignore');
        var report = Lab.coverage.analyze(options);
        expect(Math.floor(report.percent)).to.equal(0);
        expect(report.files).to.have.length(0);
        delete global.__$$testCov4;
        done();
    });

    it('load using defaults', function (done) {

        var Test = Lab.coverage.load(Path.join(__dirname, './coverage/bypass.js'));
        Lab.coverage.cleanup();
        var files = Object.keys(global.__$$labCov.files);
        var temps = files.filter(function (file) {

            return file.indexOf(Os.tmpDir()) === 0;
        });

        expect(temps).to.have.length(1);
        delete global.__$$labCov.files[temps[0]];
        done();
    });
});
