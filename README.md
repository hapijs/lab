<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
![lab Logo](https://raw.github.com/spumko/lab/master/images/lab.png)

Node test utility

[![Build Status](https://secure.travis-ci.org/spumko/lab.png)](http://travis-ci.org/spumko/lab)


## Introduction

**lab** is a simple test utility for node. Unlike other test frameworks, **lab** does not attempt to cover many use cases or provide
rich functionality and extensibility. In fact, this project started as a fork off [mocha](http://visionmedia.github.com/mocha/) and was
repeatedly refactored until only the very basic functionality was left which was then rewritten into a handful of functions.

**lab**'s primary goal is to support the narrow use cases of the [**spumko**](https://github.com/spumko) modules. If you give it a try
and find a missing feature, you are better off giving [mocha](http://visionmedia.github.com/mocha/) a try. We are unlikely to add
functionality to it. It is not meant to be a framework, just a handy utility.

## Acknowledgements

**lab** borrows heavily from [mocha](http://visionmedia.github.com/mocha/), including the actual code used to render the coverage report
into HTML. [mocha](http://visionmedia.github.com/mocha/) is a comprehensive test framework created by TJ Holowaychuk and published under the
[MIT license](https://github.com/visionmedia/mocha/blob/master/LICENSE).

## Usage

To install **lab**:

```bash
$ npm install lab
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

Test files must require the **lab** module, and add tests using the 'test()' method:
```javascript
var Lab = require('lab');

Lab.test('returns true when 1 + 1 equals 2', function (done) {

    Lab.expect(1+1).to.equal(2);
    done();
});
```

When a test is completed, 'done()' must be called, otherwise the test will time out (2 seconds by default) and will fail.
The test passes if 'done()' is call once before the timeout, and no exception thrown.

**lab** works with any test utility that throws an error when a condition isn't met. It uses the same error interface as
[mocha](http://visionmedia.github.com/mocha/) and already includes (chai)[http://chaijs.com/]'s 'expect()' in its exported
interface as shown above.

Tests can be organized into experiments:
```javascript
var Lab = require('lab');

Lab.experiment('math', function () {
    
    Lab.test('returns true when 1 + 1 equals 2', function (done) {

        Lab.expect(1+1).to.equal(2);
        done();
    });
});
```

If you need to perform some asynch actions before or after executing the tests inside an experiment, the 'before()' and
'after()' methods can be used:
```javascript
var Lab = require('lab');

Lab.experiment('math', function () {

    Lab.before(function (done) {
        
        // Wait 1 second
        setTimeout(function () { done(); }, 1000);
    });    

    Lab.test('returns true when 1 + 1 equals 2', function (done) {

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
var setup = Lab.before;
ver suite = Lab.after;

suite('math', function () {
    
    test('returns true when 1 + 1 equals 2', function (done) {

        expect(1+1).to.equal(2);
        done();
    });
});
```

## Command Line

**lab** supports the following command line options:
- `-r` - the reporter used to generate the test results. Defaults to `console`. Options are:
    - `console` - simple text output to console
    - `coverage` - JSON code coverage report
    - `html` - HTML code coverage report
    - `threshold` - Code coverage percentage check
- `-m` - individual tests timeout in milliseconds, defaults to 2 seconds
- `-o` - file to save the report to (`html` only), otherwise sent to stdout
- `-t` - minimum code test coverage percentage (`threshold` only), defaults to 100%
- `-e` - value to set the `NODE_ENV` environment variable to, defaults to 'test'

## Motivation

**lab** was developed to provide a minimal layer above writing simple node test cases. In contrast with other
test frameworks, **lab** does not modify any prototypes, globals, and uses node
[domains](http://nodejs.org/api/domain.html) to capture test errors. We've used other test frameworks and utilities
but at some point needed greater control over the tools, especially around domains and error handling in node.

