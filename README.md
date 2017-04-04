![lab Logo](https://raw.github.com/hapijs/lab/master/images/lab.png)

Node test utility

[![Build Status](https://secure.travis-ci.org/hapijs/lab.svg)](http://travis-ci.org/hapijs/lab)

Lead Maintainer: [Wyatt Preul](https://github.com/geek)

**lab** is sponsored by [Joyent](http://www.joyent.com/). [Joyent](http://www.joyent.com) is currently looking for a [Node.js core engineer](https://www.joyent.com/about/careers/nodejs-core-engineer) to hire.

## Introduction

**lab** is a simple test utility for node. Unlike other test utilities, lab uses domains instead of uncaught exception and other
global manipulation. Our goal with **lab** is to keep the execution engine as simple as possible, and not try to build an extensible framework.
**lab** works with any assertion library that throws an error when a condition isn't met.

## Command Line

**lab** supports the following command line options:
- `-a`, `--assert` - name of assert library to use.
- `--bail` - terminate the process with a non-zero exit code on the first test failure. Defaults to `false`.
- `-c`, `--coverage` - enables code coverage analysis.
- `--coverage-path` - sets code coverage path.
- `--coverage-exclude` - sets code coverage excludes.
- `-C`, `--colors` - enables or disables color output. Defaults to console capabilities.
- `-d`, `--dry` - dry run. Skips all tests. Use with `-v` to generate a test catalog. Defaults to `false`.
- `-D`, `--debug` - print the stack during a domain error event.
- `-e`, `--environment` - value to set the `NODE_ENV` environment variable to, defaults to 'test'.
- `-f`, `--flat` - do not perform a recursive load of test files within the test directory.
- `-g`, `--grep` - only run tests matching the given pattern which is internally compiled to a RegExp.
- `-h`, `--help` - show command line usage.
- `-i`, `--id` - only run the test for the given identifier (or identifiers range).
- `-I`, `--ignore` - ignore a list of globals for the leak detection (comma separated)
- `--inspect` - start lab in debug mode using the [V8 Inspector](https://nodejs.org/dist/latest-v7.x/docs/api/debugger.html#debugger_v8_inspector_integration_for_node_js).
- `-l`, `--leaks` - disables global variable leak detection.
- `-L`, `--lint` - run linting rules using linter.  Disabled by default.
- `--lint-errors-threshold` - maximum absolute amount of linting errors. Defaults to 0.
- `--lint-warnings-threshold` - maximum absolute amount of linting warnings. Defaults to 0.
- `-m`, `--timeout` - individual tests timeout in milliseconds (zero disables timeout). Defaults to 2 seconds.
- `-M`, `--context-timeout` - default timeouts for before, after, beforeEach and afterEach in milliseconds. Disabled by default.
- `-n`, `--linter` - specify linting program file path; default is `eslint`.
- `--lint-fix` - apply any fixes from the linter, requires `-L` or `--lint` to be enabled. Disabled by default.
- `--lint-options` - specify options to pass to linting program. It must be a string that is JSON.parse(able).
- `-o`, `--output` - file to write the report to, otherwise sent to stdout.
- `-p`, `--parallel` - sets parallel execution as default test option. Defaults to serial execution.
- `-P`, `--pattern` - only load files with the given pattern in the name.
- `-r`, `--reporter` - the reporter used to generate the test results. Defaults to `console`. Options are:
    - `console` - text report.
    - `html` - HTML test and code coverage report (sets `-c`).
    - `json` - output results in JSON format.
    - `junit` - output results in JUnit XML format.
    - `tap` - TAP protocol report.
    - `lcov` - output to [lcov](http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php) format.
    - `clover` - output results in [Clover XML](https://confluence.atlassian.com/display/CLOVER) format.
    - [Multiple Reporters](#multiple-reporters) - See Below
    - [Custom Reporters](#custom-reporters) - See Below
- `-R`, `--rejections` - fail tests on unhandled Promise rejections.
- `--shuffle` - randomize the order that test scripts are executed.  Will not work with `--id`.
- `--seed` - use this seed to randomize the order with `--shuffle`. This is useful to debug order dependent test failures.
- `-s`, `--silence` - silence test output, defaults to false.
- `-S`, `--sourcemaps` - enables sourcemap support for stack traces and code coverage, disabled by default.
- `-t`, `--threshold` - sets the minimum code test coverage percentage to 100%.
- `-T`, `--transform` - javascript file that exports an array of objects ie. `[ { ext: ".js", transform: (content, filename) => { ... } } ]`. Note that if you use this option with -c (--coverage), then you must generate sourcemaps and pass sourcemaps option to get proper line numbers.
- `-v`, `--verbose` - verbose test output, defaults to false.
- `-V`, `--version` - display lab version information.

## Usage

To install locally:
```bash
$ npm install --save-dev lab
```

By default, **lab** loads all the '\*.js' files inside the local 'test' directory and executes the tests found.  To use different directories or files, pass the file or directories as arguments:

```bash
$ lab unit.js
```

Test files must require the **lab** module, and export a test script:
```javascript
const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();

lab.test('returns true when 1 + 1 equals 2', (done) => {

    Code.expect(1 + 1).to.equal(2);
    done();
});
```

When a test is completed, `done(err)` must be called, otherwise the test will time out (2 seconds by default) and will fail.
The test passes if `done()` is called once before the timeout, no exception thrown, and no arguments are passed to `done()`.
If no callback function is provided, the test is considered a TODO reminder and will be skipped.

Tests can be organized into experiments:
```javascript
lab.experiment('math', () => {

    lab.test('returns true when 1 + 1 equals 2', (done) => {

        Code.expect(1 + 1).to.equal(2);
        done();
    });
});
```

If you need to perform some async actions before or after executing the tests inside an experiment, the `before()` and
`after()` methods can be used. To execute code before or after each test in an experiment, use `beforeEach()` and `afterEach()`.

```javascript
lab.experiment('math', () => {

    lab.before((done) => {

        // Wait 1 second
        setTimeout(() => {

            done();
        }, 1000);
    });

    lab.beforeEach((done) => {

        // Run before every single test
        done();
    });

    lab.test('returns true when 1 + 1 equals 2', (done) => {

        Code.expect(1 + 1).to.equal(2);
        done();
    });
});

```

`test()`, `before()`, `beforeEach()`, `after()` and `afterEach()` also support returning promises instead of using the `done` callback:

```javascript
lab.experiment('math', () => {

    lab.before(() => {

        const promise = aFunctionReturningAPromise();

        return promise;
    });

    lab.test('returns true when 1 + 1 equals 2', () => {

        return aFunctionReturningAPromise()
            .then((aValue) => {

                Code.expect(aValue).to.equal(expectedValue);
            });
    });
});
```

Both `test()` and `experiment()` accept an optional `options` argument which must be an object with the following optional keys:
- `timeout` -  set a test or experiment specific timeout in milliseconds. Defaults to the global timeout (`2000`ms or the value of `-m`).
- `parallel` - sets parallel execution of tests within each experiment level. Defaults to `false` (serial execution).
- `skip` - skip execution. Cannot be overridden in children once parent is set to skip.
- `only` - marks all other tests or experiments with `skip`.

You can also append `.only(…)` or `.skip(…)` to `test` and `experiment` instead of using the `options` flags:

```javascript
lab.experiment('with only', () => {

    lab.test.only('only this test will run', (done) => {

        Code.expect(1 + 1).to.equal(2);
        done();
    });

    lab.test('another test that will not be executed', (done) =>  {

        done();
    });
});
```

The `test()` callback has a `note()` function attached to it that can be used to
attach notes to the test case.  These notes are included in the console reporter
at the end of the output.  For example, if you would like to add a note with the
current time, your test case may look like the following:

```javascript
lab.test('attaches notes', (done) => {

    Code.expect(1 + 1).to.equal(2);
    done.note(`The current time is ${Date.now()}`);
    done();
});
```

Multiple notes can be appended for the same test case by simply calling `note()`
repeatedly.


The `test()` callback provides a second `onCleanup` argument which is a function used to register a runtime cleanup function
to be executed after the test completed. The cleanup function will execute even in the event of a timeout. Note that the cleanup
function will be executed as-is without any timers and if it fails to call it's `next` argument, the runner will freeze.

```javascript
lab.test('cleanups after test', (done, onCleanup) => {

    onCleanup((next) => {

        cleanup_logic();
        return next();
    });

    Code.expect(1 + 1).to.equal(2);
    done();
});
```

Additionally, `test()` options support a `plan` setting to specify the expected number of assertions for your test to execute. This
setting should only be used with an assertion library that supports a `count()` function, like [`code`](http://npmjs.com/package/code).
*`plan` may not work with parallel test executions*

```javascript
lab.experiment('my plan', () => {

    lab.test('only a single assertion executes', { plan: 1 }, (done) => {

        Code.expect(1 + 1).to.equal(2);
        done();
    });
});
```

`before()`, `after()`, `beforeEach()`, `afterEach()` accept an optional `options` argument which must be an object with the following optional keys:
- `timeout` -  set a specific timeout in milliseconds. Disabled by default or the value of `-M`.

```javascript
lab.experiment('math', { timeout: 1000 }, () => {

    lab.before({ timeout: 500 }, (done) =>  {

        doSomething();
        done();
    });

    lab.test('returns true when 1 + 1 equals 2', { parallel: true }, (done) =>  {

        Code.expect(1 + 1).to.equal(2);
        done();
    });
});
```

The `script([options])` method takes an optional `options` argument where `options` is an object with the following optional keys:
- `schedule` - if `false`, an automatic execution of the script is disabled. Automatic execution allows running lab test scripts directly
  with node without having to use the cli (e.g. `node test/script.js`). When using **lab** programmatically, this behavior is undesired and
  can be turned off by setting `schedule` to `false`. If you need to see the output with schedule disabled you should set `output` to `process.stdout`.  Defaults to `true`.
- `cli` - allows setting command line options within the script. Note that the last script file loaded wins and usage of this is recommended
  only for temporarily changing the execution of tests. This option is useful for code working with an automatic test engine that run tests
  on commits. Setting this option has no effect when not using the CLI runner. For example setting `cli` to `{ ids: [1] }` will only execute
  the first test loaded.

To make **lab** look like BDD:
```javascript
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Code.expect;

describe('math', () => {

    before((done) => {

        done();
    });

    after((done) => {

        done();
    });

    it('returns true when 1 + 1 equals 2', (done) => {

        expect(1 + 1).to.equal(2);
        done();
    });
});
```

To make **lab** look like TDD:
```javascript
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('math', () => {

    test('returns true when 1 + 1 equals 2', (done) => {

        expect(1 + 1).to.equal(2);
        done();
    });
});
```

To use source transforms, you must specify a file with the `-T` command line option that tells Lab how to do the transformation. You can specify many extensions with different transform functions such as `.coffee` or `.jsx`. A sample file using the babel transpiler and the CoffeeScript compiler could look like:

```javascript
const Babel = require('babel-core');
const Coffee = require('coffee-script');
const Btoa = require('btoa');

module.exports = [
    { ext: '.js', transform: (content, filename) => {

        // Make sure to only transform your code or the dependencies you want
        if (filename.indexOf('node_modules') === -1) {
            const result = Babel.transform(content, { sourceMap: 'inline', filename, sourceFileName: filename });
            return result.code;
        }

        return content;
    } },
    { ext: '.coffee', transform: (content, filename) => {

        // Again, make sure to only transform your code or the dependencies you want
        if (filename.indexOf('node_modules') === -1) {
            const result = Coffee.compile(content, {
                sourceMap: true,
                inline: true,
                sourceRoot: '/',
                sourceFiles: [filename]
            });

            // append source map to end of compiled JS
            return result.js +
              '\n//# sourceMappingURL=data:application/json;base64,' +
              Btoa(unescape(encodeURIComponent(result.v3SourceMap)));
        }

        return content;
    } }
];
```

Sometimes you want to disable code coverage for specific lines, and have the coverage report omit them entirely. To do so, use the `$lab:coverage:(off|on)$` comments. For example:
```javascript
// There is no way to cover this in node 0.10
/* $lab:coverage:off$ */
if (typeof value === 'symbol') {
    return '[' + value.toString() + ']';
}
/* $lab:coverage:on$ */

```

## `.labrc.js` file

**lab** supports a `.labrc.js` configuration file for centralizing lab settings.  
The `.labrc.js` file can be located in the current working directory, any
directory that is the parent of the current working directory, or in the user's
home directory.  The `.labrc.js` file needs to be able to be required by
Node.js.  Therefore, either format it as a JSON file or with a `module.exports`
that exports an object with the keys that are the settings.  


Below is an example of a `.labrc.js` file to enable linting and test coverage checking:

```js
module.exports = {
    coverage: true,
    threshold: 90,
    lint: true
};
```

### `.labrc.js` setting precedent

The `.labrc.js` file will override the **lab** default settings. Any options passed
to the **lab** runner will override the settings found in `.labrc.js`.  For example,
assume you have the following `.labrc.js` file:

```js
module.exports = {
    coverage: true,
    threshold: 100
};
```

If you need to reduce the coverage threshold for a single run, you can execute
**lab** as follows:

```sh
lab -t 80
```

### `.labrc.js` available settings

The `.labrc.js` file supports configuration keys that are named with the long name
of the command line settings.  Therefore, if you need to specify an assert
library, you would export a key named "assert" with the desired value.


## Extending the linter

**lab** uses a shareable [eslint](http://eslint.org/) config, and a plugin containing several **hapi** specific linting rules. If you want to extend the default linter you must:

1. Add `eslint-plugin-hapi` and `eslint-config-hapi` as dependencies in your `package.json`. You must add both the plugin and the config because eslint treats them as peer dependencies. For more background, see [eslint/eslint#3458](https://github.com/eslint/eslint/issues/3458) and [eslint/eslint#2518](https://github.com/eslint/eslint/issues/2518).

2. In your project's eslint configuration, add `"extends": "eslint-config-hapi"`. eslint will automatically infer the `eslint-config-`, so technically you can just write `"extends": "hapi"`.

Your project's eslint configuration will now extend the default **lab** configuration.

## Ignoring files in linting

Since [eslint](http://eslint.org/) is used to lint, you can create an `.eslintignore` containing paths to be ignored:
```
node_modules/*
**/vendor/*.js
```

## Only run linting

In order to run linting and not to execute tests you can combine the `dry` run
flag with the `lint` flag.

```
lab -dL
```

## Running a custom linter

If you would like to run a different linter, or even a custom version of eslint you should
pass the `-n` or `--linter` argument with the path to the lint runner.  For example,
if you plan to use jslint, you can install `lab-jslint` then pass `--linter node_modules/lab-jslint`.

## Integration with an assertion library

Using the `--assert` argument allows you to integrate Lab with your favorite assertion library. It works by
requiring the imported assertion library via the `Lab.assertions` property. Here is an example
using `--assert code`:

```js
// Testing shortcuts
const expect = Lab.assertions.expect;
const fail = Lab.assertions.fail;


describe('expectation', () => {

    it('should be able to expect', (done) => {

        expect(true).to.be.true();

        done();
    });

    it('should be able to fail (This test should fail)', (done) => {

        fail('Should fail');

        done();
    });

});
```

If you use the [Code](https://github.com/hapijs/code) assertion library Lab will let you know if you
have any missing assertions. An example of this is:

```js
describe('expectation', () => {

    it('Test should pass but get marked as having a missing expectation', (done) => {

        // Invalid and missing assertion - false is a method, not a property!
        // This test will pass.
        expect(true).to.be.false;

        done();
    });

});
```

This is an invalid test but it will pass as the `.false` assertion was not actually called. Lab will report the
number of incomplete assertions, their location in your code and return a failure of the tests.

## Debuggers

**lab** can be started with the option `--inspect` which will run it with the V8 Inspector.

This debugger can be accessed using the URL that is printed in the console, or used in association with a few Chrome extensions ([Node.js V8 Inspector](https://chrome.google.com/webstore/detail/nodejs-v8-inspector/lfnddfpljnhbneopljflpombpnkfhggl), [NIM](https://chrome.google.com/webstore/detail/nim-node-inspector-manage/gnhhdgbaldcilmgcpfddgdbkhjohddkj/related), etc).

As you may know, if your tests are associated with the command `npm test`, you can already run `npm test -- --inspect` to run it with the inspector and avoid creating another command. If you want to listen on a specific port for the inspector, pass `--inspect={port}`.

**lab** also has automatic support for the [WebStorm](https://www.jetbrains.com/webstorm/) debugger, just start a normal debugging session on your npm test script.

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
    "lab": "5.x.x"
  },
  "scripts": {
    "test": "lab -t 100",
    "test-cov-html": "lab -r html -o coverage.html"
  },
  "licenses": [
    {
      "type": "BSD",
      "url": "http://github.com/hapijs/lab/raw/master/LICENSE"
    }
  ]
}
```

Note that `npm test` will execute **lab** with the `-t 100` option which will
require 100% code coverage. Run `npm run test-cov-html` and check the `coverage.html`
file to figure out where coverage is lacking. When coverage is below the threshold,
the CLI will exit with code `1` and will result in an npm Error message.

- Run your tests with

```bash
$ npm test
```

## Multiple Reporters

Multiple reporters can be specified by providing multiple reporter options.

```bash
$ lab -r console -r html
```

If any output `-o` is provided, they must match the same number of provided reporter options. The reporters would be paired with an output based on
the order in which they were supplied. When specifying multiple outputs, use `stdout` to send a particular reporter to stdout.

```bash
$ lab -r console -o stdout -r html -o coverage.html -r lcov -o lcov.info -r json -o data.json
```

Multiple reporters of the same kind are also supported.

```bash
$ lab -r console -o stdout -r console -o console.log
```

## Custom Reporters

If the value passed for `reporter` isn't included with Lab, it is loaded from the filesystem.
If the string starts with a period (`'./custom-reporter'`), it will be loaded relative to the current working directory.
If it doesn't start with a period (`'custom-reporter'`), it will be loaded from the `node_modules` directory, just like any module installed using `npm install`.

Reporters must be a class with the following methods: `start`, `test` and `end`. `options` are passed to the class constructor upon initialization.

See the [json reporter](lib/reporters/json.js) for a good starting point.

## Excluding paths from coverage reporting

The `--coverage-exclude` argument can be repeated multiple times in order to add multiple paths to exclude.  By default the `node_modules` and `test` directories are excluded.  If you want to exclude those as well as a directory named `public` you can run lab as follows:

```bash
lab -c --coverage-exclude test --coverage-exclude node_modules --coverage-exclude public
```

## Acknowledgements

**lab** initial code borrowed heavily from [mocha](http://mochajs.org/), including the actual code used to render
the coverage report into HTML. **lab** coverage code was originally adapted from [blanket](https://github.com/alex-seville/blanket)
which in turn uses [falafel](https://github.com/substack/node-falafel).
