// Load modules

var ChildProcess = require('child_process');
var Lab = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();


lab.experiment('Examples', function () {

    lab.test('empty.js', function (done) {

        ChildProcess.exec('./bin/lab examples/empty.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('0 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('bdd.js', function (done) {

        ChildProcess.exec('./bin/lab examples/bdd.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('tdd.js', function (done) {

        ChildProcess.exec('./bin/lab examples/tdd.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('after.js', function (done) {

        ChildProcess.exec('./bin/lab examples/after.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('before.js', function (done) {

        ChildProcess.exec('./bin/lab examples/before.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('singleTest.js', function (done) {

        ChildProcess.exec('./bin/lab examples/singleTest.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('singleExperiment.js', function (done) {

        ChildProcess.exec('./bin/lab examples/singleExperiment.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('singleExperimentFails.js', function (done) {

        ChildProcess.exec('./bin/lab examples/singleExperimentFails.js', function (error, stdout, stderr) {

            Lab.expect(error).to.exist;
            Lab.expect(stdout).to.contain('1 of 1 tests failed');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('nestedExperiments.js', function (done) {

        ChildProcess.exec('./bin/lab examples/nestedExperiments.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('5 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('afterError.js', function (done) {

        ChildProcess.exec('./bin/lab examples/afterError.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('beforeError.js', function (done) {

        ChildProcess.exec('./bin/lab examples/beforeError.js', function (error, stdout, stderr) {

            Lab.expect(error).to.not.exist;
            Lab.expect(stdout).to.contain('1 tests complete');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });

    lab.test('singleExperimentErrors.js', function (done) {

        ChildProcess.exec('./bin/lab examples/singleExperimentErrors.js', function (error, stdout, stderr) {

            Lab.expect(error).to.exist;
            Lab.expect(stdout).to.contain('1 of 1 tests failed');
            Lab.expect(stdout).to.contain('No global variable leaks detected');
            done();
        });
    });
});
