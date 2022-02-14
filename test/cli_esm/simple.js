import { expect } from '@hapi/code';
import * as _Lab from '../../test_runner/index.js';

import { add } from './api.js';

export const lab = _Lab.script();
const { describe, it } = lab

describe('Test CLI', () => {

    it('adds two numbers together', () => {

        expect(add(1, 1)).to.equal(2);
    });

    it('subtracts two numbers', () => {

        expect(add(2, - 2)).to.equal(0);
    });
});
