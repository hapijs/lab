'use strict';

// Load modules

const Code = require('code');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Test CLI', () => {

    it('handles failure', (flags) => {

      return new Promise((resolve) => {

            setImmediate(() => {

                flags.onCleanup = () => {

                    return new Promise(() => {

                        setImmediate(() => {

                            throw new Error('oops');
                        });
                    });
                };

                resolve();
            });
        });
    });

    it('success cleanup', (flags) => {

        return new Promise((resolve) => {

              setImmediate(() => {

                  flags.onCleanup = () => {

                      return new Promise((innerResolve) => {

                          setImmediate(() => {

                              innerResolve();
                          });
                      });
                  };

                  resolve();
              });
          });
      });
});
