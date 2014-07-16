// Load modules

var Lab = require('../lib');
var ChildProcess = require('child_process');

// Declare internals

var internals = {};

Lab.experiment('Examples', function () {

    Lab.test('empty.js', function (done) {

        ChildProcess.exec('./bin/lab examples/empty.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('0 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('bdd.js', function (done) {

        ChildProcess.exec('./bin/lab examples/bdd.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('tdd.js', function (done) {

        ChildProcess.exec('./bin/lab examples/tdd.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('after.js', function (done) {

        ChildProcess.exec('./bin/lab examples/after.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('before.js', function (done) {

        ChildProcess.exec('./bin/lab examples/before.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('singleTest.js', function (done) {

        ChildProcess.exec('./bin/lab examples/singleTest.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('singleExperiment.js', function (done) {

        ChildProcess.exec('./bin/lab examples/singleExperiment.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('singleExperimentFails.js', function (done) {

        ChildProcess.exec('./bin/lab examples/singleExperimentFails.js', function (error, stdout, stderr) {

            Lab.expect(error).to.exist;
            Lab.expect(stdout).to.contain('1 of 1 tests failed');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('nestedExperiments.js', function (done) {

        ChildProcess.exec('./bin/lab examples/nestedExperiments.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('5 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('afterError.js', function (done) {

        ChildProcess.exec('./bin/lab examples/afterError.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('beforeError.js', function (done) {

        ChildProcess.exec('./bin/lab examples/beforeError.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('singleExperimentErrors.js', function (done) {

        ChildProcess.exec('./bin/lab examples/singleExperimentErrors.js', function (error, stdout, stderr) {

            Lab.expect(error).to.exist;
            Lab.expect(stdout).to.contain('1 of 1 tests failed');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('skip.js', function (done) {

        ChildProcess.exec('./bin/lab examples/skip.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete (1 tests skipped)');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('skipFails.js', function (done) {

        ChildProcess.exec('./bin/lab examples/skipFails.js', function (error, stdout, stderr) {

            Lab.expect(error).to.exist;
            Lab.expect(stdout).to.contain('1 of 1 (1 tests skipped) tests failed');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    Lab.test('onlyExperiment.js', function (done) {

        ChildProcess.exec('./bin/lab -v examples/onlyExperiment.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('2 tests complete');
            Lab.expect(stdout).to.contain('3) returns true when 3 + 3 equals 6');
            Lab.expect(stdout).to.contain('4) returns true when 4 + 4 equals 8');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            Lab.expect(stdout).to.contain('Should execute before');
            done();
        });
    });

    Lab.test('onlyTest.js', function (done) {

        ChildProcess.exec('./bin/lab -v examples/onlyTest.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('4) returns true when 4 + 4 equals 8');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            Lab.expect(stdout).to.contain('Should execute before');
            Lab.expect(stdout).to.contain('Should also execute before');
            done();
        });
    });

});
