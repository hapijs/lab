![lab Logo](https://raw.github.com/hapijs/lab/master/images/lab.png)

Node test utility

[![Build Status](https://secure.travis-ci.org/hapijs/lab.png)](http://travis-ci.org/hapijs/lab)


## Introduction

**lab** is a simple test utility for node. Unlike other test utilities, lab uses domains instead of uncaught exception and other
global manipulation. Our goal with **lab** is to keep the execution engine as simple as possible, and not try to build an extensible framework.

## Command Line

**lab** supports the following command line options:
- `-c` - enables code coverage analysis.
- `-C` - forces color output
- `-d` - dry run. Skips all tests. Use with `-v` to generate a test catalog. Defaults to `false`.
- `-e` - value to set the `NODE_ENV` environment variable to, defaults to 'test'.
- `-g` - only run tests matching the given pattern which is internally compiled to a RegExp.
- `-G` - export `Lab` as a global. Defaults to disabled. If you enable this, make sure to remove any `require('lab')` lines from your tests.
- `-i` - only run the test for the given identifier.
- `-I` - ignore a list of globals for the leak detection (comma separated)
- `-l` - disables global variable leak detection.
- `-m` - individual tests timeout in milliseconds, defaults to 2 seconds.
- `-o` - file to write the report to, otherwise sent to stdout.
- `-p` - sets parallel execution as default test option. Defaults to serial execution.
- `-r` - the reporter used to generate the test results. Defaults to `console`. Options are:
    - `console` - text report.
    - `html` - HTML code coverage report (sets `-c`).
    - `json` - output results in JSON format.
    - `tap` - TAP protocol report.
- `-s` - silence test output, defaults to false.
- `-t` - minimum code test coverage percentage (sets `-c`), defaults to 100%.
- `-v` - verbose test output, defaults to false.

## Usage

To install **lab** globally:
```bash
$ npm install -g lab
```

To use locally:
```bash
$ npm install --save-dev lab
```

Then in further examples you will have to call lab like so:
``` bash
$ ./node_modules/.bin/lab
```

To start:
```bash
$ lab
```

By default, **lab** loads all the '*.js' files inside the local 'test' directory and executes the tests found. To start **lab** using
different directories or files, pass those as arguments:
```bash
$ lab unit.js
```

Test files must require the **lab** module, and add tests using the `test()` method:
```javascript
var Lab = require('lab');

Lab.test('returns true when 1 + 1 equals 2', function (done) {

    Lab.expect(1+1).to.equal(2);
    done();
});
```

When a test is completed, `done(err)` must be called, otherwise the test will time out (2 seconds by default) and will fail.
The test passes if `done()` is call once before the timeout, no exception thrown, and no arguments are passed to `done()`.
If no callback function is provided, the test is considered a TODO reminder and will be skipped.

**lab** works with any test utility that throws an error when a condition isn't met. It uses the same error interface as
[mocha](http://visionmedia.github.com/mocha/) and already includes [chai](http://chaijs.com/)'s `expect()` in its exported
interface as shown above.

Tests can be organized into experiments:
```javascript
Lab.experiment('math', function () {

    Lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
```

If you need to perform some async actions before or after executing the tests inside an experiment, the `before()` and
`after()` methods can be used. To execute code before or after each test in an experiment, use `beforeEach()` and `afterEach()`.

```javascript
Lab.experiment('math', function () {

    Lab.before(function (done) {

        // Wait 1 second
        setTimeout(function () { done(); }, 1000);
    });

    Lab.beforeEach(function (done) {

        // Run before every single test
        done();
    });

    Lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
```

Both `test()` and `experiment()` accept an optional `options` argument which must be an object with the following optional keys:
- `timeout` -  set a test or experiment specific timeout in milliseconds. Defaults to the global timeout (`2000`ms or the value of `-m`).
- `parallel` - sets parallel execution of tests within each experiment level. Defaults to `false` (serial execution).
- `skip` - skip execution. Cannot be overriden in children once parent is set to skip.

```javascript
Lab.experiment('math', { timeout: 1000 }, function () {

    Lab.test('returns true when 1 + 1 equals 2', { parallel: true }, function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
```

To make **lab** look like BDD:
```javascript
var Lab = require('lab');

var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

describe('math', function () {

    it('returns true when 1 + 1 equals 2', function (done) {

        expect(1+1).to.equal(2);
        done();
    });
});
```

To make **lab** look like TDD:
```javascript
var Lab = require('lab');

var suite = Lab.experiment;
var test = Lab.test;
var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;

suite('math', function () {

    test('returns true when 1 + 1 equals 2', function (done) {

        expect(1+1).to.equal(2);
        done();
    });
});
```

## Running lab's tests
To run the tests included in this project, locally clone the repository then install the dependencies:
```bash
$ npm update
```

To run the tests:
```bash
$ node ./bin/lab
```

Or using **make**:
```bash
$ make test
```

To use this pattern in your own project install **lab** as a dev dependency and include a **make** file containing a target like this:
```make
test:
    @node ./node_modules/lab/bin/lab
```

Alternatively you may want to leverage npm's scripts section of your package.json:
```json
"scripts": {
    "test": "lab"
  }
```

Which can be triggered using:
```bash
$ npm test
```

## Acknowledgements

**lab** borrows heavily from [mocha](http://visionmedia.github.com/mocha/), including the actual code used to render the coverage report
into HTML. [mocha](http://visionmedia.github.com/mocha/) is a comprehensive test framework created by TJ Holowaychuk. **lab** coverage code
was originally adapted from [blanket](https://github.com/alex-seville/blanket) which in turn uses
[falafel](https://github.com/substack/node-falafel).
