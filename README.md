![lab Logo](https://raw.github.com/hapijs/lab/master/images/lab.png)

Node test utility

[![Build Status](https://secure.travis-ci.org/hapijs/lab.svg)](http://travis-ci.org/hapijs/lab)

Lead Maintainer: [Wyatt Preul](https://github.com/geek)

**lab** is sponsored by [Joyent](http://www.joyent.com/).


## Introduction

**lab** is a simple test utility for Node.js. Unlike other test utilities, lab uses only async/await features and includes everything you should expect from a modern Node.js test utility. Our goal with **lab** is to keep the execution engine as simple as possible, and not try to build an extensible framework.

**lab** works with any assertion library that throws an error when a condition isn't met.


## Command Line

**lab** supports the following command line options:
- `-a`, `--assert` - name of assert library to use. To disable assertion library set to `false`.
- `--bail` - terminate the process with a non-zero exit code on the first test failure. Defaults to `false`.
- `-c`, `--coverage` - enables code coverage analysis.
- `--coverage-path` - sets code coverage path.
- `--coverage-exclude` - sets code coverage excludes.
- `--coverage-all` - report coverage for all matched files, not just those tested.
- `--coverage-flat` - do not perform a recursive find of files for coverage report. Requires `--coverage-all`
- `--coverage-pattern` - only report coverage for files with the given pattern in the name. Defaults to `pattern`. Requires `--coverage-all`
- `-C`, `--colors` - enables or disables color output. Defaults to console capabilities.
- `-d`, `--dry` - dry run. Skips all tests. Use with `-v` to generate a test catalog. Defaults to `false`.
- `-e`, `--environment` - value to set the `NODE_ENV` environment variable to, defaults to 'test'.
- `-f`, `--flat` - do not perform a recursive load of test files within the test directory.
- `-g`, `--grep` - only run tests matching the given pattern which is internally compiled to a RegExp.
- `-h`, `--help` - show command line usage.
- `-i`, `--id` - only run the test for the given identifier (or identifiers range, e.g. `lab -i 1-3,5`). Use `lab -dv` to print all tests and their identifier without running the tests.
- `-I`, `--ignore` - ignore a list of globals for the leak detection (comma separated), this is an alias of `globals` property in `.labrc` file
- `--inspect` - start lab in debug mode using the [V8 Inspector](https://nodejs.org/dist/latest-v7.x/docs/api/debugger.html#debugger_v8_inspector_integration_for_node_js).
- `-l`, `--leaks` - disables global variable leak detection.
- `-L`, `--lint` - run linting rules using linter.  Disabled by default.
- `--lint-errors-threshold` - maximum absolute amount of linting errors. Defaults to 0.
- `--lint-warnings-threshold` - maximum absolute amount of linting warnings. Defaults to 0.
- `--lint-fix` - apply any fixes from the linter, requires `-L` or `--lint` to be enabled. Disabled by default.
- `--lint-options` - specify options to pass to linting program. It must be a string that is JSON.parse(able).
- `-m`, `--timeout` - individual tests timeout in milliseconds (zero disables timeout). Defaults to 2 seconds.
- `-M`, `--context-timeout` - default timeouts for before, after, beforeEach and afterEach in milliseconds. Disabled by default.
- `-o`, `--output` - file to write the report to, otherwise sent to stdout.
- `-p`, `--default-plan-threshold` - sets the minimum number of assertions a test must run. Overridable with [`plan`](#plan).
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

<!-- eslint-disable no-undef -->
```javascript
const { expect } = require('code');
const { it } = exports.lab = require('lab').script();

it('returns true when 1 + 1 equals 2', () => {

    expect(1 + 1).to.equal(2);
});
```

Or

<!-- eslint-disable no-undef -->
```javascript
const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

lab.test('returns true when 1 + 1 equals 2', () => {

    expect(1 + 1).to.equal(2);
});
```

If a test is performing an asynchronous operation then it should use the new `async`/`await` keywords or return a Promise. For example:

<!-- eslint-disable no-undef -->
```javascript
lab.test('config file has correct value', async () => {

    const file = await fs.readFile('config');
    expect(file.toString()).to.contain('something');
});
```


Tests can be organized into experiments:
<!-- eslint-disable no-undef -->
```javascript
lab.experiment('math', () => {

    lab.test('returns true when 1 + 1 equals 2', () => {

        expect(1 + 1).to.equal(2);
    });
});
```

If you need to perform some async actions before or after executing the tests inside an experiment, the `before()` and
`after()` methods can be used. To execute code before or after each test in an experiment, use `beforeEach()` and `afterEach()`.

<!-- eslint-disable no-undef -->
```javascript
lab.experiment('math', () => {

    lab.before(() => {

        return new Promise((resolve) => {

            // Wait 1 second
            setTimeout(() => {

                resolve();
            }, 1000);
        });
    });

    lab.beforeEach(() => {

        // Run before every single test
    });

    lab.test('returns true when 1 + 1 equals 2', () => {

        expect(1 + 1).to.equal(2);
    });
});

```

`test()`, `before()`, `beforeEach()`, `after()` and `afterEach()` also support returning promises just as tests do:

<!-- eslint-disable no-undef -->
```javascript
lab.experiment('math', () => {

    lab.before(() => {

        return aFunctionReturningAPromise();
    });

    lab.test('returns true when 1 + 1 equals 2', () => {

        return aFunctionReturningAPromise()
            .then((aValue) => {

                expect(aValue).to.equal(expectedValue);
            });
    });
});
```

Both `test()` and `experiment()` accept an optional `options` argument which must be an object with the following optional keys:
- `timeout` -  set a test or experiment specific timeout in milliseconds. Defaults to the global timeout (`2000`ms or the value of `-m`).
- `skip` - skip execution. Cannot be overridden in children once parent is set to skip.
- `only` - marks all other tests or experiments with `skip`.

You can also append `.only(…)` or `.skip(…)` to `test` and `experiment` instead of using `options`:

<!-- eslint-disable no-undef -->
```javascript
lab.experiment('with only', () => {

    lab.test.only('only this test will run', () => {

        expect(1 + 1).to.equal(2);
    });

    lab.test('another test that will not be executed', () => {});
});
```


### `plan`

The test function options support a `plan` property, used to specify the expected number of assertions for your test to execute. This setting should only be used with an assertion library that supports a `count()` function, like [`code`](http://npmjs.com/package/code).

<!-- eslint-disable no-undef -->
```javascript
lab.experiment('my plan', () => {

    lab.test('only a single assertion executes', { plan: 1 }, () => {

        expect(1 + 1).to.equal(2);
    });
});
```


### `flags`

The `test` function is passed a `flags` object that can be used to create notes or set a function to execute for cleanup operations after the test is complete.


#### `note()`

Notes are included in the console reporter at the end of the output. For example, if you would like to add a note with the current time, your test case may look like the following:

<!-- eslint-disable no-undef -->
```javascript
lab.test('attaches notes', (flags) => {

    expect(1 + 1).to.equal(2);
    flags.note(`The current time is ${Date.now()}`);
});
```

Multiple notes can be appended for the same test case by simply calling `note()` repeatedly.

#### `mustCall()`

Declare that a particular function must be called a certain number of times. The signature to `mustCall` is `(fn, numberOfExecutions)` and it returns a wrapped copy of the `fn`. After the test is complete, each `mustCall` assertion will be checked and the test will fail if any function was called the incorrect number of times.

Below is an example demonstrating how to use `mustCall` to verify that `fn` is called exactly two times.

<!-- eslint-disable no-undef -->
```javascript
lab.test('fn must be called twice', async (flags) => {

    const fn = () => {};
    const wrapped = flags.mustCall(fn, 2);
    wrapped();

    await doSomeAsyncOperation();
    wrapped();
});
```


#### `onCleanup()`

You can assign a function to the `flags` object `onCleanup` property to register a runtime cleanup function to be executed after the test completed. The cleanup function will execute even in the event of a timeout. Note that the cleanup function will be executed as-is without any timers. Like the test, `onCleanup` can return a Promise that will be evaluated.

<!-- eslint-disable no-undef -->
```javascript
lab.test('cleanups after test', (flags) => {

    flags.onCleanup = () => {

        cleanup_logic();
    };

    expect(1 + 1).to.equal(2);
});
```

#### `flags.onUnhandledRejection()`

You can assign a synchronous function to the `flags` object `onUnhandledRejection` property to register an override for global rejection handling. This can be used to test the code that is explicitly meant to result in unhandled rejections.

<!-- eslint-disable no-undef -->
```javascript
lab.test('leaves an unhandled rejection', (flags) => {

    return new Promise((resolve) => {

        flags.onUnhandledRejection = (err) => {

            expect(err).to.be.an.error('I want this rejection to remain unhandled in production');
            resolve(); // finish the test
        };

        // sample production code
        setTimeout(() => {

            Promise.reject(new Error('I want this rejection to remain unhandled in production'));
        });
    });
});
```

#### `flags.onUncaughtException()`

You can assign a synchronous function to the `flags` object `onUncaughtException` property to register an override for global exception handling. This can be used to test the code that is explicitly meant to result in uncaught exceptions.

<!-- eslint-disable no-undef -->
```javascript
lab.test('leaves an uncaught rejection', (flags) => {

    return new Promise((resolve) => {

        flags.onUncaughtException = (err) => {

            expect(err).to.be.an.error('I want this exception to remain uncaught in production');
            resolve(); // finish the test
        };

        // sample production code
        setTimeout(() => {

            throw new Error('I want this exception to remain uncaught in production');
        });
    });
});
```

#### `context`

`context` is an object that is passed to `before` and `after` functions in addition to tests themselves. The intent is to be able to set properties on `context` inside of a before function that can be used by a test function later. This should help reduce module level variables that are set by `before`/`beforeEach` functions. Tests aren't able to manipulate the context object for other tests.

<!-- eslint-disable no-undef -->
```javascript
lab.before(({ context }) => {

    context.foo = 'bar';
})

lab.test('contains context', ({ context }) => {

    expect(context.foo).to.equal('bar');
});
```


### Timeouts

`before()`, `after()`, `beforeEach()`, `afterEach()` accept an optional `options` argument which must be an object with the following optional keys:
- `timeout` -  set a specific timeout in milliseconds. Disabled by default or the value of `-M`.

<!-- eslint-disable no-undef -->
```javascript
lab.experiment('math', { timeout: 1000 }, () => {

    lab.before({ timeout: 500 }, () =>  {

        doSomething();
    });

    lab.test('returns true when 1 + 1 equals 2', () =>  {

        expect(1 + 1).to.equal(2);
    });
});
```


### Script options

The `script([options])` method takes an optional `options` argument where `options` is an object with the following optional keys:
- `schedule` - if `false`, an automatic execution of the script is disabled. Automatic execution allows running lab test scripts directly
  with Node.js without having to use the CLI (e.g. `node test/script.js`). When using **lab** programmatically, this behavior is undesired and
  can be turned off by setting `schedule` to `false`. If you need to see the output with schedule disabled you should set `output` to `process.stdout`.  Defaults to `true`.
- `cli` - allows setting command line options within the script. Note that the last script file loaded wins and usage of this is recommended
  only for temporarily changing the execution of tests. This option is useful for code working with an automatic test engine that run tests
  on commits. Setting this option has no effect when not using the CLI runner. For example setting `cli` to `{ ids: [1] }` will only execute
  the first test loaded.


### Behavior Driven Development

To make **lab** look like BDD:
<!-- eslint-disable no-undef -->
```javascript
const { expect } = require('code');
const Lab = require('lab');
const { after, before, describe, it } = exports.lab = Lab.script();

describe('math', () => {

    before(() => {});

    after(() => {});

    it('returns true when 1 + 1 equals 2', () => {

        expect(1 + 1).to.equal(2);
    });
});
```


### Test Driven Development

To make **lab** look like TDD:
<!-- eslint-disable no-undef -->
```javascript
const { expect } = require('code');
const Lab = require('lab');
const { suite, test } = exports.lab = Lab.script();

suite('math', () => {

    test('returns true when 1 + 1 equals 2', () => {

        expect(1 + 1).to.equal(2);
    });
});
```


### Transforms

To use source transforms, you must specify a file with the `-T` command line option that tells Lab how to do the transformation. You can specify many extensions with different transform functions such as `.ts` or `.jsx`.


#### TypeScript

A TypeScript definition file is included with **lab** to make it easier to use inside of an existing TypeScript project. Below is a TypeScript test example that uses the [lab-transform-typescript](https://www.npmjs.com/package/lab-transform-typescript) module to manage the transform:

```typescript
import * as Lab from 'lab';

const { expect } = require('code');
const lab = Lab.script();
const { describe, it, before } = lab;
export { lab };

describe('experiment', () => {
    before(() => {});

    it('verifies 1 equals 1', () => {
        expect(1).to.equal(1);
    });
});
```

Then the test can be be executed using the following command line:

```sh
$ lab --sourcemaps --transform node_modules/lab-transform-typescript
```


### Disable Code Coverage

Sometimes you want to disable code coverage for specific lines, and have the coverage report omit them entirely. To do so, use the `$lab:coverage:(off|on)$` comments. For example:
<!-- eslint-disable no-undef -->
```javascript
// There is no way to cover this in node 0.10
/* $lab:coverage:off$ */
if (typeof value === 'symbol') {
    // do something with value
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

In addition, you can use the `paths` parameter to override the default test directory (i.e. `./test`):
```js
module.exports = {
    paths: ['test/lab'],
};
```

As stated at the beginning of the document, `--ignore` parameter is an alias for `globals` option in the `.labrc` file. Therefore if you wish to ignore specific files you'll need to append a `globals` setting, **not** an `ignore` one, as stated on #641.

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

## Integration with an assertion library

Using the `--assert` argument allows you to integrate Lab with your favorite assertion library. Aside from `--assert` from the CLI you can change the `assert` option when executing `report`. Whatever assertion library you specify is imported and assigned to the `Lab.assertions` property. Here is an example using `lab --assert code`:

<!-- eslint-disable no-undef -->
```js
const lab = exports.lab = Lab.script();
const { describe, it } = lab;

// Testing shortcuts
const { expect, fail } = require('code');

describe('expectation', () => {

    it('should be able to expect', () => {

        expect(true).to.be.true();
    });

    it('should be able to fail (This test should fail)', () => {

        fail('Should fail');
    });
});
```

```
$ lab --assert code
```

If you use the [Code](https://github.com/hapijs/code) assertion library Lab will let you know if you have any missing assertions. An example of this is:

<!-- eslint-disable no-undef -->
```js
describe('expectation', () => {

    it('Test should pass but get marked as having a missing expectation', () => {

        // Invalid and missing assertion - false is a method, not a property!
        // This test will pass.
        Lab.expect(true).to.be.false;
    });
});
```

This is an invalid test but it will pass as the `.false` assertion was not actually called. Lab will report the
number of incomplete assertions, their location in your code and return a failure of the tests.

Similarly, if you use an assertion library, **lab** will be able to report the verbosity of your tests. This is a measure of the number of assertions divided by the number of tests. The value will be output when using the console reporter and can be helpful in determining if too many or too few assertions exist in each test. What is too many or too few assertions is entirely up to you.

## Debuggers

**lab** can be started with the option `--inspect` which will run it with the V8 Inspector.

This debugger can be accessed using the URL that is printed in the console, or used in association with a few Chrome extensions ([Node.js V8 Inspector](https://chrome.google.com/webstore/detail/nodejs-v8-inspector/lfnddfpljnhbneopljflpombpnkfhggl), [NIM](https://chrome.google.com/webstore/detail/nim-node-inspector-manage/gnhhdgbaldcilmgcpfddgdbkhjohddkj/related), etc).

As you may know, if your tests are associated with the command `npm test`, you can already run `npm test -- --inspect` to run it with the inspector and avoid creating another command. If you want to listen on a specific port for the inspector, pass `--inspect={port}`.

**lab** also has automatic support for the [WebStorm](https://www.jetbrains.com/webstorm/) debugger, just start a normal debugging session on your npm test script.

## Best practices

- Add lab as a dev dependency to your project's `package.json` along with a `test` script:

```json
{
  "devDependencies": {
    "lab": "15.x.x"
  },
  "scripts": {
    "test": "lab -t 100",
    "test-cov-html": "lab -r html -o coverage.html"
  }
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

In a `.labrc.js` file, multiple reporters and their associated output paths would be represented as follows:

```javascript
module.exports = {
    reporter: ['console', 'html', 'lcov', 'json'],
    output: ['stdout', 'coverage.html', 'lcov.info', 'data.json']
};
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
