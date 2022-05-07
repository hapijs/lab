'use strict';

const Code = require('@hapi/code');
const _Lab = require('../test_runner');
const Utils = require('../lib/utils');


const internals = {};


const lab = exports.lab = _Lab.script();
const { describe, it } = lab;
const { expect } = Code;


describe('Utils', () => {

    describe('position()', () => {

        it('ignores invalid stack', () => {

            expect(Utils.position({ stack: '' })).to.equal({});
        });
    });

    describe('stashProperty() and restoreProperty()', () => {

        it('stashes and restores an existing property', () => {

            const obj = { x: 1 };

            expect(obj).to.contain('x');

            const stash = Utils.stashProperty(obj, 'x');

            expect(obj).to.not.contain('x');

            Utils.restoreProperty(obj, 'x', stash);

            expect(obj).to.contain('x');
            expect(obj.x).to.equal(1);
        });

        it('stashes and restores a non-existing property', () => {

            const obj = { x: 1 };

            expect(obj).to.not.contain('y');

            const stash = Utils.stashProperty(obj, 'y');

            expect(obj).to.not.contain('y');

            Utils.restoreProperty(obj, 'y', stash);

            expect(obj).to.not.contain('y');
        });

        it('preserves descriptor', () => {

            const obj = {};
            Object.defineProperty(obj, 'x', {
                value: 1,
                enumerable: false,
                configurable: true
            });

            expect(obj).to.contain('x');

            const stash = Utils.stashProperty(obj, 'x');

            expect(obj).to.not.contain('x');

            Utils.restoreProperty(obj, 'x', stash);

            expect(obj).to.contain('x');

            expect(Object.getOwnPropertyDescriptor(obj, 'x')).to.contain({
                value: 1,
                enumerable: false,
                configurable: true
            });
        });
    });
});
