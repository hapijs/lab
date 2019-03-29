'use strict';

// Load modules

const Code = require('@hapi/code');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Test CLI', () => {

    it('handles return rejection', () => {

        return Promise.reject(new Error('fail'));
    });

    it('handles return rejection in next tick', () => {

        return new Promise(() => {

            setImmediate(() => {

                Promise.reject(new Error('rejection'));
            });
        });
    });

    it('handles throw in next tick', () => {

        return new Promise(() => {

            setImmediate(() => {

                throw new Error('throw');
            });
        });
    });

    it('passes rejection to flags.onUnhandledRejection handler', (flags) => {

        return new Promise((resolve) => {

            flags.onUnhandledRejection = (err) => {

                expect(err).to.be.an.error('rejection');
                resolve();
            };

            setImmediate(() => {

                Promise.reject(new Error('rejection'));
            });
        });
    });

    it('handles an error inside flags.onUnhandledRejection handler', (flags) => {

        return new Promise(() => {

            flags.onUnhandledRejection = () => {

                throw new Error('incorrectly implemented error handling or a failed assertion');
            };

            setImmediate(() => {

                Promise.reject(new Error('rejection'));
            });
        });
    });

    it('passes asynchronously thrown exception into flags.onUncaughtException handler', (flags) => {

        return new Promise((resolve) => {

            flags.onUncaughtException = (err) => {

                expect(err).to.be.an.error('throw');
                resolve();
            };

            setImmediate(() => {

                throw new Error('throw');
            });
        });
    });

    it('handles an error inside flags.onUncaughtException handler', (flags) => {

        return new Promise(() => {

            flags.onUncaughtException = () => {

                throw new Error('incorrectly implemented error handling or a failed assertion');
            };

            setImmediate(() => {

                throw new Error('throw');
            });
        });
    });
});
