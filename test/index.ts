import * as _Lab from '../test_runner';
import * as Lab from '..';


const { expect } = _Lab.types;


// script()

const lab = Lab.script();
expect.type<Lab.script.Script>(lab);


// describe()

lab.describe('test', () => { });
expect.error(lab.describe('test'));     // Missing second argument
