'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const before = lab.before;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

before(({ context }) => {

  context._message = '##original##';
});

describe('test context', () => {

  it('test tries to change context', ({ context }) => {

    context._message = '##mutated##';
  })

  it('test outputs context._message', ({ context: { _message } }) => {

    console.log(_message);
    expect(1).to.equal(1);
  });
});
