import { expect } from '@hapi/code';
import * as _Lab from '../../test_runner/index.js';

const { describe, it } = exports.lab = _Lab.script();

describe('Test CLI', () => {

    it('adds two numbers together', () => {

        expect(1 + 1).to.equal(4);
    });
});
