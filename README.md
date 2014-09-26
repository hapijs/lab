![lab Logo](https://raw.github.com/hapijs/lab/master/images/lab.png)

Node test utility

[![Build Status](https://secure.travis-ci.org/hapijs/lab.png)](http://travis-ci.org/hapijs/lab)

Lead Maintainer: [Wyatt Preul](https://github.com/geek)


## Introduction

**lab** is a simple test utility for node. Unlike other test utilities, lab uses domains instead of uncaught exception and other
global manipulation. Our goal with **lab** is to keep the execution engine as simple as possible, and not try to build an extensible framework.
**lab** works with any assertion library that throws an error when a condition isn't met.

## Command Line

**lab** supports the following command line options:
- `-c`, `--coverage` - enables code coverage analysis.
- `-C`, `--colors` - enables or disables color output. Defaults to console capabilities.
- `-d`, `--dry` - dry run. Skips all tests. Use with `-v` to generate a test catalog. Defaults to `false`.
- `-e`, `--environment` - value to set the `NODE_ENV` environment variable to, defaults to 'test'.
- `-f`, `--flat` - do not perform a recursive load of test files within the test directory.
- `-g`, `--grep` - only run tests matching the given pattern which is internally compiled to a RegExp.
- `-h`, `--help` - show command line usage.
- `-i`, `--id` - only run the test for the given identifier (or identifiers range).
- `-I`, `--ignore` - ignore a list of globals for the leak detection (comma separated)
- `-l`, `--leaks` - disables global variable leak detection.
- `-m`, `--timeout` - individual tests timeout in milliseconds (zero disables timeout). Defaults to 2 seconds.
- `-n`, `--notify` - show Growl notifications.
- `-M`, `--context-timeout` - default timeouts for before, after, beforeEach and afterEach in milliseconds. Disabled by default.
- `-o`, `--output` - file to write the report to, otherwise sent to stdout.
- `-p`, `--parallel` - sets parallel execution as default test option. Defaults to serial execution.
- `-r`, `--reporter` - the reporter used to generate the test results. Defaults to `console`. Options are:
    - `console` - text report.
    - `html` - HTML test and code coverage report (sets `-c`).
    - `json` - output results in JSON format.
    - `junit` - output results in JUnit XML format.
    - `tap` - TAP protocol report.
    - `lcov` - output to [lcov](http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php) format.
    - `clover` - output results in [Clover XML](https://confluence.atlassian.com/display/CLOVER) format.
- `-s`, `--silence` - silence test output, defaults to false.
- `-S`, `--sourcemaps` - enables sourcemap support for stack traces and code coverage, disabled by default.
- `-t`, `--threshold` - minimum code test coverage percentage (sets `-c`), defaults to 100%.
- `-v`, `--verbose` - verbose test output, defaults to false.

## Usage

To install **lab** globally:
```bash
$ npm install -g lab
```

To use locally:
```bash
$ npm install --save-dev lab
```

By default, **lab** loads all the '\*.js' files inside the local 'test' directory and executes the tests found.  To use different directories or files, pass the file or directories as arguments:

```bash
$ lab unit.js
```

Test files must require the **lab** module, and export a test script:
```javascript
var Lab = require('lab');
var lab = exports.lab = Lab.script();

lab.test('returns true when 1 + 1 equals 2', function (done) {

    Lab.expect(1+1).to.equal(2);
    done();
});
```

When a test is completed, `done(err)` must be called, otherwise the test will time out (2 seconds by default) and will fail.
The test passes if `done()` is call once before the timeout, no exception thrown, and no arguments are passed to `done()`.
If no callback function is provided, the test is considered a TODO reminder and will be skipped.

Tests can be organized into experiments:
```javascript
lab.experiment('math', function () {

    lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
```

If you need to perform some async actions before or after executing the tests inside an experiment, the `before()` and
`after()` methods can be used. To execute code before or after each test in an experiment, use `beforeEach()` and `afterEach()`.

```javascript
lab.experiment('math', function () {

    lab.before(function (done) {

        // Wait 1 second
        setTimeout(function () { done(); }, 1000);
    });

    lab.beforeEach(function (done) {

        // Run before every single test
        done();
    });

    lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
```

Both `test()` and `experiment()` accept an optional `options` argument which must be an object with the following optional keys:
- `timeout` -  set a test or experiment specific timeout in milliseconds. Defaults to the global timeout (`2000`ms or the value of `-m`).
- `parallel` - sets parallel execution of tests within each experiment level. Defaults to `false` (serial execution).
- `skip` - skip execution. Cannot be overridden in children once parent is set to skip.
- `only` - marks all other tests or experiments with `skip`.  This doesn't mark all other experiments and tests in a suite of scripts as skipped, instead it works within a single test script.

`before()`, `after()`, `beforeEach()`, `afterEach()` accept an optional `options` argument which must be an object with the following optional keys:
- `timeout` -  set a specific timeout in milliseconds. Disabled by default or the value of `-M`.

```javascript
lab.experiment('math', { timeout: 1000 }, function () {

    lab.before({ timeout: 500 }, function (done) {

        doSomething();
        done();
    });

    lab.test('returns true when 1 + 1 equals 2', { parallel: true }, function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
```

The `script([options])` method takes an optional `options` argument where `options` is an object with the following optional keys:
- `schedule` - if `false`, an automatic execution of the script is disabled. Automatic execution allows running lab test scripts directly
  with node without having to use the cli (e.g. `node test/script.js`). When using **lab** programmatically, this behavior is undesired and
  can be turned off by setting `schedule` to `false`. Defaults to `true`.
- `cli` - allows setting command line options within the script. Note that the last script file loaded wins and usage of this is recommended
  only for temporarily changing the execution of tests. This option is useful when code working with an automatic test engine that runs test
  on commits. Setting this option has no effect when not using the CLI runner. For example setting `cli` to `{ ids: [1] }` will only execute
  the first test loaded.

To make **lab** look like BDD:
```javascript
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Lab.expect;

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
var lab = exports.lab = Lab.script();

var suite = lab.suite;
var test = lab.test;
var before = lab.before;
var after = lab.after;
var expect = Lab.expect;

suite('math', function () {

    test('returns true when 1 + 1 equals 2', function (done) {

        expect(1+1).to.equal(2);
        done();
    });
});
```

## Best practices

- Install **lab** as a global module:

```bash
$ npm install -g lab
```

- Add lab as a dev dependency to your project's `package.json` along with a `test` script:

```json
{
  "name": "example",
  "version": "1.0.0",
  "dependencies": {
  },
  "devDependencies": {
    "lab": "4.x.x"
  },
  "scripts": {
    "test": "make test-cov"
  },
  "licenses": [
    {
      "type": "BSD",
      "url": "http://github.com/hapijs/lab/raw/master/LICENSE"
    }
  ]
}
```

- Add a `Makefile` to your project:

```bash
test:
    @node node_modules/lab/bin/lab
test-cov:
    @node node_modules/lab/bin/lab -t 100
test-cov-html:
    @node node_modules/lab/bin/lab -r html -o coverage.html

.PHONY: test test-cov test-cov-html
```

Note that `npm test` will execute **lab** with the `-t 100` option which will require 100% code coverage. Change or remove
this option if you just cannot be bothered with producing quality code. Run `make test-cov-html` and check the `coverage.html`
file to figure out where coverage is lacking.

- Run your tests with

```bash
$ npm test
```

## Acknowledgements

**lab** initial code borrowed heavily from [mocha](http://visionmedia.github.com/mocha/), including the actual code used to render
the coverage report into HTML. **lab** coverage code was originally adapted from [blanket](https://github.com/alex-seville/blanket)
which in turn uses [falafel](https://github.com/substack/node-falafel).
