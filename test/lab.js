var Lab = require('../lib');
var Metalab = require('../metalab')

var experiment = Lab.experiment;
var test = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

experiment('Errors', function () {

    test('throws when 1 does not equal 2', function (done) {
        //var Testlab = require('../metalab');
        //Testlab.experiment('Test', function () {

            //Testlab.test('it runs a test', function (donee) {

                //Testlab.expect(2).to.equal(1);
                //donee();
                expect(1).to.equal(2);
                done();
            //});
        //});
    });
});
