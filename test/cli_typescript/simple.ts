import { expect } from '@hapi/code';
import * as _Lab from '../../test_runner';

const { describe, it } = exports.lab = _Lab.script();

describe('Test CLI', () => {

    it('adds two numbers together', () => {

        expect(1 + 1).to.equal(2);
    });

    it('subtracts two numbers', () => {

        expect(2 - 2).to.equal(0);
    });
});
