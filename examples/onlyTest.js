var Lab = require('../lib');

var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

describe('math', function() {

  describe('addition', function () {

      before(function(done) {

        console.log('Should execute before');
        done();
      });

      it('returns true when 1 + 1 equals 2', function (done) {

          expect(1+1).to.equal(2);
          done();
      });

      it('returns true when 2 + 2 equals 4', function (done) {

          expect(2+2).to.equal(4);
          done();
      });

      describe('nested addition', function() {

        before(function(done) {

          console.log('Should also execute before');
          done();
        });

        it('returns true when 3 + 3 equals 6', function (done) {

            expect(3+3).to.equal(6);
            done();
        });

        it.only('returns true when 4 + 4 equals 8', function (done) {

            expect(4+4).to.equal(8);
            done();
        });

      });

      describe('another nested addition', function() {

        it('returns true when 5 + 5 equals 10', function (done) {

            expect(5+5).to.equal(10);
            done();
        });

      });

  });

  describe('subtract', function () {

      before(function() {

          throw new Error('Should not execute');
      });

      it('returns true when 1 - 1 equals 0', function (done) {

          expect(1-1).to.equal(0);
          done();
      });

      it.only('returns true when 2 - 1 equals 1', function (done) {

          expect(2-1).to.equal(1);
          done();
      });

      describe('nested subtract', function () {

        before(function() {

            throw new Error('Should not execute');
        });

        it('returns true when 3 - 1 equals 2', function (done) {

            expect(3-1).to.equal(2);
            done();
        });

        it('returns true when 4 - 1 equals 3', function (done) {

            expect(4-1).to.equal(3);
            done();
        });

      });
  });

});
