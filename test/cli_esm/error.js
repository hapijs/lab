import { expect } from '@hapi/code';
import * as _Lab from '../../test_runner/index.js';

export const lab = _Lab.script();
const { describe, it } = lab;

describe('Test CLI', () => {

    it('adds two numbers together', () => {

        expect(1 + 1).to.equal(4);
    });
});
