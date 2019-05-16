import * as Lab from '../../../..';
import add from '..';


const { expect } = Lab.types;


expect.error(add(true, true));
expect.error(add('foo', 'bar'));
