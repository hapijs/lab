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

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, 'coverage'), coverageExclude: 'exclude' });
    require('./coverage/prime');        // Initialize global container

    it('instruments and measures coverage', function (done) {

        var Test = require('./coverage/basic');
        Test.method(1);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/basic') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('identifies lines with partial coverage', function (done) {

        var Test = require('./coverage/partial');
        Test.method(1, 2, 3);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/partial') });
        expect(Math.floor(cov.percent)).to.equal(59);
        expect(cov.sloc).to.equal(47);
        expect(cov.misses).to.equal(19);
        expect(cov.hits).to.equal(28);
        done();
    });

    it('bypasses marked code', function (done) {

        var Test = require('./coverage/bypass');
        Test.method(1, 2, 3);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/bypass') });
        expect(Math.floor(cov.percent)).to.equal(100);
        expect(cov.sloc).to.equal(15);
        expect(cov.misses).to.equal(0);
        expect(cov.hits).to.equal(15);
        done();
    });

    it('ignores non-matching files', function (done) {

        var Test = require('./coverage/exclude/ignore');

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/exclude/ignore') });
        expect(Math.floor(cov.percent)).to.equal(0);
        expect(cov.files).to.have.length(0);
        done();
    });

    it('measures missing while statement coverage', function (done) {

        var Test = require('./coverage/while');
        Test.method(false);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'coverage/while') });
        expect(cov.percent).to.be.lessThan(100);
        done();
    });

    describe('#analyze', function () {

        it('sorts file paths in report', function (done) {

            var files = global.__$$labCov.files;
            var paths = ['/a/b', '/a/b/c', '/a/c/b', '/a/c', '/a/b/c', '/a/b/a'];
            paths.forEach(function (path) {

                files[path] = { source: [] };
            });

            var cov = Lab.coverage.analyze({ coveragePath: '/a' });
            var sorted = cov.files.map(function (file) {

                return file.filename;
            });

            expect(sorted).to.deep.equal(['/a/b', '/a/c', '/a/b/a', '/a/b/c', '/a/c/b']);
            done();
        });
    });
});
