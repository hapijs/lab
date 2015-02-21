// Load modules

var Path = require('path');
var Code = require('code');
var _Lab = require('../test_runner');
var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = _Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;

describe('Transform', function () {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, './transform/'), coverageExclude: 'exclude', 
        transform: [
            {ext: '.new', transform: function (content) {

                return content.replace('!NOCOMPILE!', 'value = value ');
            }},
            {ext: '.js', transform: null}
        ]
    });

    it('instruments and measures coverage', function (done) {

        var Test = require('./transform/basic-transform');
        expect(Test.method(1)).to.equal(3);

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'transform/basic-transform') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('does not transform unneeded files', function (done) {

        var Test = require('./transform/basic');
        expect(Test.method(1)).to.equal('!NOCOMPILE!');

        var cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'transform/basic') });
        expect(cov.percent).to.equal(100);
        done();
    });
});
