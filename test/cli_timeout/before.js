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

before(() => {

  return new Promise((resolve) => {

    setTimeout(() => {

      console.log('##before##');
      resolve();
    }, 2000)
  });
});

describe('test before timeout', () => {

  it('test', () => {

    console.log('##test##');
    expect(1).to.equal(1);
  });
});
