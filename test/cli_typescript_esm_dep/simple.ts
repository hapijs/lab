import { expect } from '@hapi/code';
import * as _Lab from '../../test_runner/index.js';

import { add } from 'esm-dep';


const { describe, it } = exports.lab = _Lab.script();

describe('Test CLI', () => {

    it('imports from an ESM dependency', () => {

        expect(add(1, 1)).to.equal(2);
    });
});
