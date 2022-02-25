## Introduction

**lab** is a simple test utility for Node.js. Unlike other test utilities, lab uses only async/await features and includes everything you should expect from a modern Node.js test utility. Our goal with **lab** is to keep the execution engine as simple as possible, and not try to build an extensible framework.

**lab** works best with the [**code** assertion library](https://hapi.dev/family/code) but can be used with any assertion library that throws an error when a condition isn't met.

## Usage

By default, **lab** loads all the '\*.js|cjs|mjs' files inside the local 'test' directory and executes the tests found. To use different directories or files, pass the file or directories as arguments:

```bash
$ lab unit.js
```

Test files must require the **lab** module, and export a test script:

```javascript
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const { expect } = Code;
const { it } = exports.lab = Lab.script();

it('returns true when 1 + 1 equals 2', () => {

    expect(1 + 1).to.equal(2);
});
```

Or

```javascript
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const { expect } = Code;
const lab = exports.lab = Lab.script();

lab.test('returns true when 1 + 1 equals 2', () => {

    expect(1 + 1).to.equal(2);
});
```

If a test is performing an asynchronous operation then it should use the `async` / `await` keywords or return a Promise. For example:

```javascript
lab.test('config file has correct value', async () => {

    const file = await fs.readFile('config');
    expect(file.toString()).to.contain('something');
});
```

Tests can be organized into experiments:

```javascript
lab.experiment('math', () => {

    lab.test('returns true when 1 + 1 equals 2', () => {

        expect(1 + 1).to.equal(2);
    });
});
```

If you need to perform some setup operations before or after executing the tests inside an experiment, the `before()` and `after()` methods can be used. To execute code before or after each test in an experiment, use `beforeEach()` and `afterEach()`.

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
- `timeout` - set a test or experiment specific timeout in milliseconds. Defaults to the global timeout (`2000`ms or the value of `-m`).
- `skip` - skip execution. When used on an experiment, all children will be skipped - even if they are marked with `only`.
- `only` - marks all other tests or experiments with `skip`.

You can also append `.only(…)` or `.skip(…)` to `test` and `experiment` instead of using `options`:

```javascript
lab.experiment('with only', () => {

    lab.test.only('only this test will run', () => {

        expect(1 + 1).to.equal(2);
    });

    lab.test('another test that will not be executed', () => {});
});
```

### Behavior Driven Development

To make **lab** look like BDD:

```javascript
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const { expect } = Code;
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

```javascript
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const { expect } = Code;
const { suite, test } = exports.lab = Lab.script();

suite('math', () => {

    test('returns true when 1 + 1 equals 2', () => {

        expect(1 + 1).to.equal(2);
    });
});
```

### Best practices

- Add lab as a dev dependency to your project's `package.json` along with a `test` script:

```json
{
  "devDependencies": {
    "@hapi/lab": "21.x.x"
  },
  "scripts": {
    "test": "lab -t 100",
    "test-cov-html": "lab -r html -o coverage.html"
  }
}
```

Note that `npm test` will execute **lab** with the `-t 100` option which will require 100% code coverage. Run `npm run test-cov-html` and check the `coverage.html` file to figure out where coverage is lacking. When coverage is below the threshold, the CLI will exit with code `1` and will result in an npm Error message.

- Run your tests with

```bash
$ npm test
```

### Timeouts

`before()`, `after()`, `beforeEach()`, `afterEach()` accept an optional `options` argument which must be an object with the following optional keys:
- `timeout` -  set a specific timeout in milliseconds. Disabled by default or the value of `-M`.

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

### Transforms

To use source transforms, you must specify a file with the `-T` command line option that tells Lab how to do the transformation. You can specify many extensions with different transform functions such as `.ts` or `.jsx`.

#### TypeScript

A TypeScript definition file is included with **lab** to make it easier to use inside of an existing TypeScript project. To enable running test files written in TypeScript use the `--typescript` CLI option.

```typescript
import * as Lab from '@hapi/lab';
import { expect } from '@hapi/code';

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

Then the test can be executed using the following command line:

```sh
$ lab --typescript
```

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
- `-i`, `--id` - only run the test for the given identifier (or identifiers range, e.g. `lab -i 1-3,5`). Use `lab -dv` to print all tests and their identifier without running the tests. This is an alias of `ids` array property in `.labrc` file.
- `-I`, `--ignore` - ignore a list of globals for the leak detection (comma separated), this is an alias of `globals` property in `.labrc` file. To ignore symbols, pass the symbol's string representation (e.g. `Symbol(special)`).
- `--inspect` - start lab in debug mode using the [V8 Inspector](https://nodejs.org/dist/latest-v12.x/docs/api/debugger.html#debugger_v8_inspector_integration_for_node_js).
- `--inspect-brk` - see `--inspect`.
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
- `-R`, `--retries` - the number of times to retry a failing test that is explicitly marked with `retry`. Defaults to `5`.
- `--shuffle` - randomize the order that test scripts are executed.  Will not work with `--id`.
- `--seed` - use this seed to randomize the order with `--shuffle`. This is useful to debug order dependent test failures.
- `-s`, `--silence` - silence test output, defaults to false.
- `-S`, `--sourcemaps` - enables sourcemap support for stack traces and code coverage, disabled by default.
- `-t`, `--threshold` - sets the minimum code test coverage percentage to 100%.
- `--types-test` - sets a single TypeScript definition test file (implies `-Y`). Use when the test directory contains other TypeScript files that should not be loaded for definition testing.
- `-T`, `--transform` - javascript file that exports an array of objects ie. `[ { ext: ".js", transform: (content, filename) => { ... } } ]`. Note that if you use this option with -c (--coverage), then you must generate sourcemaps and pass sourcemaps option to get proper line numbers.
- `--typescript` - enables the built-in TypeScript transpiler which uses the project own's `typescript` module and `tsconfig.json` file (or its other formats).
- `-v`, `--verbose` - verbose test output, defaults to false.
- `-V`, `--version` - display lab version information.
- `-Y`, `--types` - validate the module TypeScript types definitions. This is designed exclusively for JavaScript modules that export a TypeScript definition file.


## Methods

### `Lab.script([options])`

Generates a test script interface which is used to add experiments and tests, where:
- `options` - an optional object with the following optional keys:
    - `schedule` - if `false`, an automatic execution of the script is disabled. Automatic execution allows running lab test scripts directly with Node.js without having to use the CLI (e.g. `node test/script.js`). When using **lab** programmatically, this behavior is undesired and can be turned off by setting `schedule` to `false`. If you need to see the output with schedule disabled you should set `output` to `process.stdout`.  Defaults to `true`.
    - `cli` - allows setting command line options within the script. Note that the last script file loaded wins and usage of this is recommended only for temporarily changing the execution of tests. This option is useful for code working with an automatic test engine that run tests on commits. Setting this option has no effect when not using the CLI runner. For example setting `cli` to `{ ids: [1] }` will only execute the first test loaded.

### `script.after([options], action)`

Executes the provided action after the current experiment block is finished where:
- `options` - optional flags as describe in [`script.test()`](#scripttesttitle-options-test).
- `action` - a sync or async function using the signature `function(flags)` where:
    - `flags` - see [Flags](#flags)

### `script.afterEach()`

Executes the provided action after each test is executed in the current experiment block where:
- `options` - optional flags as describe in [`script.test()`](#scripttesttitle-options-test).
- `action` - a sync or async function using the signature `function(flags)` where:
    - `flags` - see [Flags](#flags)

### `script.before()`

Executes the provided action before the current experiment block is started where:
- `options` - optional flags as describe in [`script.test()`](#scripttesttitle-options-test).
- `action` - a sync or async function using the signature `function(flags)` where:
    - `flags` - see [Flags](#flags)

### `script.beforeEach()`

Executes the provided action before each test is executed in the current experiment block where:
- `options` - optional flags as describe in [`script.test()`](#scripttesttitle-options-test).
- `action` - a sync or async function using the signature `function(flags)` where:
    - `flags` - see [Flags](#flags)

### `script.describe(title, [options], content)`

Same as [`script.experiment()`](#scriptexperimenttitle-options-content).

### `script.experiment(title, [options], content)`

Sets up an experiment (a group of tests) where:
- `title` - the experiment description.
- `options` - optional settings:
    - `skip` - if `true`, sets the entire experiment content to be skipped during execution. Defaults to `false`.
    - `only` - if `true`, sets all other experiments to `skip`. Default to `false`.
    - `timeout` - overrides the default test timeout for tests and other timed operations. Defaults to `2000`.
- `content` - a function with signature `function()` which can setup other experiments or tests.

### `script.experiment.only(title, [options], content)`

Same as [`script.experiment()`](#scriptexperimenttitle-options-content) with the `only` option set to `true`.

### `script.experiment.skip(title, [options], content)`

Same as [`script.experiment()`](#scriptexperimenttitle-options-content) with the `skip` option set to `true`.

### `script.it(title, [options], test)`

Same as [`script.test()`](#scripttesttitle-options-test).

### `script.suite(title, [options], content)`

Same as [`script.experiment()`](#scriptexperimenttitle-options-content).

### `script.test(title, [options], test)`

Sets up a test where:
- `title` - the test description.
- `options` - optional settings:
    - `skip` - if `true`, sets the entire experiment content to be skipped during execution. Defaults to `false`.
    - `only` - if `true`, sets all other experiments to `skip`. Default to `false`.
    - `timeout` - overrides the default test timeout for tests and other timed operations in milliseconds. Defaults to `2000`.
    - `plan` - the expected number of assertions the test must execute. This setting should only be used with an assertion library that supports a `count()` function, like [**code**](https://hapi.dev/family/code).
    - `retry` - when `true` or set to a number greater than `0`, if the test fails it will be retried `retries` (defaults to `5`) number of times until it passes.
- `test` - a function with signature `function(flags)` where:
    - the function can throw if the test failed.
    - the function can return a Promise which either resolves (success) or rejects (fails).
    - all other return value is ignored.
    - `flags` - a set of test utilities described in [Flags](#flags).

```javascript
lab.experiment('my plan', () => {

    lab.test('only a single assertion executes', { plan: 1 }, () => {

        expect(1 + 1).to.equal(2);
    });
});
```

### `script.test.only(title, [options], test)`

Same as calling [`script.test()`](#scripttesttitle-options-test) with `only` option set to `true`.

### `script.test.skip(title, [options], test)`

Same as calling [`script.test()`](#scripttesttitle-options-test) with `skip` option set to `true`.

### `Flags`

The `test` function is passed a `flags` object that can be used to create notes or set a function to execute for cleanup operations after the test is complete.

#### `context`

An object that is passed to `before` and `after` functions in addition to tests themselves. `context` is used to set properties inside the before function that can be used by a test function later. It is meant to reduce module level variables that are set by the `before` / `beforeEach` functions. The context object is shallow cloned when passed to tests, as well as to child experiments, allowing you to modify it for each experiment individually without conflict through the use of `before`, `beforeEach`, `after` and `afterEach`.

```javascript
lab.experiment('my experiment', () => {

  lab.before(({ context }) => {

      context.foo = 'bar';
  })

  lab.test('contains context', ({ context }) => {

      expect(context.foo).to.equal('bar');
  });

  lab.experiment('a nested experiment', () => {

    lab.before(({ context }) => {

      context.foo = 'baz';
    });

    lab.test('has the correct context', ({ context }) => {

      expect(context.foo).to.equal('baz');
      // since this is a shallow clone, changes will not be carried to
      // future tests or experiments
      context.foo = 'fizzbuzz';
    });

    lab.test('receives a clean context', ({ context }) => {

      expect(context.foo).to.equal('baz');
    });
  });

  lab.experiment('another nested experiment', () => {

    lab.test('maintains the original context', ({ context }) => {

      expect(context.foo).to.equal('bar');
    });
  });
});
```

#### `mustCall(func, count)`

Sets a requirement that a function must be called a certain number of times where:
- `func` - the function to be called.
- `count` - the number of required invocations.

Returns a wrapped copy of the function. After the test is complete, each `mustCall` assertion will be checked and the test will fail if any function was called the incorrect number of times.

Below is an example demonstrating how to use `mustCall` to verify that `fn` is called exactly two times.

```javascript
lab.test('fn must be called twice', async (flags) => {

    const fn = () => {};
    const wrapped = flags.mustCall(fn, 2);
    wrapped();

    await doSomeAsyncOperation();
    wrapped();
});
```

#### `note(note)`

Adds notes to the test log where:
- `note` - a string to be included in the console reporter at the end of the output.

For example, if you would like to add a note with the current time, your test case may look like the following:

```javascript
lab.test('attaches notes', (flags) => {

    expect(1 + 1).to.equal(2);
    flags.note(`The current time is ${Date.now()}`);
});
```

Multiple notes can be appended for the same test case by simply calling `note()` repeatedly.

#### `onCleanup`

A property that can be assigned a cleanup function registered at runtime to be executed after the test completes. The cleanup function will execute even in the event of a timeout or error. Note that the cleanup function will be executed as-is without any timers. The function assigned to `onCleanup` can return a Promise that will be evaluated.

```javascript
lab.test('cleanups after test', (flags) => {

    flags.onCleanup = () => {

        cleanup_logic();
    };

    expect(1 + 1).to.equal(2);
});
```

#### `onUncaughtException`

A property that can be assigned an override for global exception handling. This can be used to test the code that is explicitly meant to result in uncaught exceptions.

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

#### `onUnhandledRejection`

A property that can be assigned an override function for global rejection handling. This can be used to test the code that is explicitly meant to result in unhandled rejections.

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

## `.labrc.js` File

**lab** supports a `.labrc.js` configuration file for centralizing lab settings. The `.labrc.js` file can be located in the current working directory, any directory that is the parent of the current working directory, or in the user's home directory.  The `.labrc.js` file needs to be able to be required by Node.js.  Therefore, either format it as a JSON file or with a `module.exports` that exports an object with the keys that are the settings.

Below is an example of a `.labrc.js` file to enable linting and test coverage checking:

```js
module.exports = {
    coverage: true,
    threshold: 90,
    lint: true
};
```

### Setting precedent

The `.labrc.js` file will override the **lab** default settings. Any options passed to the **lab** runner will override the settings found in `.labrc.js`.  For example, assume you have the following `.labrc.js` file:

```js
module.exports = {
    coverage: true,
    threshold: 100
};
```

If you need to reduce the coverage threshold for a single run, you can execute **lab** as follows:

```sh
lab -t 80
```

### Available settings

The `.labrc.js` file supports configuration keys that are named with the long name of the command line settings.  Therefore, if you need to specify an assert library, you would export a key named "assert" with the desired value.

In addition, you can use the `paths` parameter to override the default test directory (i.e. `./test`):
```js
module.exports = {
    paths: ['test/lab'],
};
```

As stated at the beginning of the document, `--ignore` parameter is an alias for `globals` option in the `.labrc` file. Therefore if you wish to ignore specific files you'll need to append a `globals` setting, **not** an `ignore` one, as stated on #641.

## Linting

**lab** uses a shareable [eslint](http://eslint.org/) plugin containing a recommended config and several **hapi** specific linting rules. If you want to extend the default linter you must:

1. Add `@hapi/eslint-plugin` as a dependency in your `package.json`.

2. In your project's eslint configuration, add `"extends": "plugin:@hapi/recommended"`.

Your project's eslint configuration will now extend the default **lab** configuration.

### Ignoring files in linting

Since [eslint](http://eslint.org/) is used to lint, you can create an `.eslintignore` containing paths to be ignored:
```
node_modules/*
**/vendor/*.js
```

### Only run linting

In order to run linting and not to execute tests you can combine the `dry` run
flag with the `lint` flag.

```
lab -dL
```

## Integration with an assertion library

Using the `--assert` argument allows you to integrate Lab with your favorite assertion library. Aside from `--assert` from the CLI you can change the `assert` option when executing `report`. Whatever assertion library you specify is imported and assigned to the `Lab.assertions` property. Here is an example using `lab --assert @hapi/code`:

```js
const lab = exports.lab = Lab.script();
const { describe, it } = lab;

// Testing shortcuts
const { expect, fail } = require('@hapi/code');

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
$ lab --assert @hapi/code
```

If you use the [Code](https://github.com/hapijs/code) assertion library Lab will let you know if you have any missing assertions. An example of this is:

```js
describe('expectation', () => {

    it('Test should pass but get marked as having a missing expectation', () => {

        // Invalid and missing assertion - false is a method, not a property!
        // This test will pass.
        Lab.expect(true).to.be.false;
    });
});
```

This is an invalid test but it will pass as the `.false` assertion was not actually called. Lab will report the number of incomplete assertions, their location in your code and return a failure of the tests.

Similarly, if you use an assertion library, **lab** will be able to report the verbosity of your tests. This is a measure of the number of assertions divided by the number of tests. The value will be output when using the console reporter and can be helpful in determining if too many or too few assertions exist in each test. What is too many or too few assertions is entirely up to you.

## Debuggers

**lab** can be started with the option `--inspect` which will run it with the V8 Inspector.

This debugger can be accessed using the URL that is printed in the console, or used in association with a few Chrome extensions ([Node.js V8 Inspector](https://chrome.google.com/webstore/detail/nodejs-v8-inspector/lfnddfpljnhbneopljflpombpnkfhggl), [NIM](https://chrome.google.com/webstore/detail/nim-node-inspector-manage/gnhhdgbaldcilmgcpfddgdbkhjohddkj/related), etc).

As you may know, if your tests are associated with the command `npm test`, you can already run `npm test -- --inspect` to run it with the inspector and avoid creating another command. If you want to listen on a specific port for the inspector, pass `--inspect={port}`.

**lab** also has automatic support for the [WebStorm](https://www.jetbrains.com/webstorm/) debugger, just start a normal debugging session on your npm test script.

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

If the value passed for `reporter` isn't included with Lab, it is loaded from the filesystem. If the string starts with a period (`'./custom-reporter'`), it will be loaded relative to the current working directory. If it doesn't start with a period (`'custom-reporter'`), it will be loaded from the `node_modules` directory, just like any module installed using `npm install`.

Reporters must be a class with the following methods: `start`, `test` and `end`. `options` are passed to the class constructor upon initialization.

See the [json reporter](lib/reporters/json.js) for a good starting point.

## Coverage

### ESM support

Lab does not support code coverage for ES modules.  There are two reasons for this: in order to implement this we would either use [V8's builtin coverage](https://v8.dev/blog/javascript-code-coverage) or an [ESM Loader](https://nodejs.org/api/esm.html#loaders).  Unfortunately the former [doesn't support](https://bugs.chromium.org/p/v8/issues/detail?id=10627) granular branch coverage as we do in lab, and the latter is an experimental API that is still settling.  We hope to provide ESM coverage support in the future once one or both of these issues are resolved.

In the meantime, we recommend using lab with [c8](https://github.com/bcoe/c8) in order to provide code coverage in ESM projects.  Note that c8 does not support granular branch coverage the way we do in lab, for the same reasons listed above.  It's pretty simple to use c8 with lab, though.

First install c8:
```
npm install --save-dev c8
```

Next update your test command to start with c8. Here's an example in a package.json file switching from lab's coverage to c8's coverage:
```diff
   "scripts": {
-      "test": "lab -a @hapi/code -t 100"
+      "test": "c8 --100 lab -a @hapi/code"
   },
```

### Inline enabling/disabling

Sometimes you want to disable code coverage for specific lines, and have the coverage report omit them entirely. To do so, use the `$lab:coverage:(off|on)$` comments. For example:
```javascript
// There is no way to cover this in node 0.10
/* $lab:coverage:off$ */
if (typeof value === 'symbol') {
    // do something with value
}
/* $lab:coverage:on$ */
```

### Coverage bypass stack

Disabling code coverage becomes tricky when dealing with machine-generated or machine-altered code. For example, `babel` can be configured to disable coverage for generated code using the `auxiliaryCommentBefore` and `auxiliaryCommentAfter` options. The naïve approach to this uses `$lab:coverage:on$` and `$lab:coverage:off$`, but these directives overwrite any user-specified directives, so that a block where coverage should be disabled may have that coverage unintentionally re-enabled. To work around this issue, `lab` supports pushing the current code coverage bypass state onto an internal stack using the `$lab:coverage:push$` directive, and supports restoring the top of the stack using the `$lab:coverage:pop$` directive:
```javascript
// There is no way to cover this in node < 10.0.0
/* $lab:coverage:off$ */
const { types } = Util;
const isSet = (types && types.isSet) || (set) => set instanceof Set;
/* $lab:coverage:on$ */

// When Util is imported using import and babel transpiles to cjs, babel can be
// configured to use the stack:
/* $lab:coverage:off$ */
const {
  types
} =
/*$lab:coverage:push$/
/*$lab:coverage:off$*/
_util
/*$lab:coverage:pop$/
.
/*$lab:coverage:push$/
/*$lab:coverage:off$*/
default
/*$lab:coverage:pop$*/
;
const isSet = types && types.isSet || (set) => set instanceof Set;
/* $lab:coverage:on$ */
```

Semantics:

- `$lab:coverage:push$` copies the current skip state to the top of the stack, and leaves it as the current state as well
- `$lab:coverage:pop$` replaces the current skip state with the top of the stack, and removes the top of the stack
  - if the stack is empty, `lab` will tell you by throwing the error `"unable to pop coverage bypass stack"`

### Excluding paths from coverage reporting

The `--coverage-exclude` argument can be repeated multiple times in order to add multiple paths to exclude.  By default the `node_modules` and `test` directories are excluded.  If you want to exclude those as well as a directory named `public` you can run lab as follows:

```bash
lab -c --coverage-exclude test --coverage-exclude node_modules --coverage-exclude public
```

## Acknowledgements

**lab** initial code borrowed heavily from [mocha](http://mochajs.org/), including the actual code used to render the coverage report into HTML. **lab** coverage code was originally adapted from [blanket](https://github.com/alex-seville/blanket) which in turn uses [falafel](https://github.com/substack/node-falafel).
