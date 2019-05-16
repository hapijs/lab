import * as Lab from '../../../..';
import add from '..';


const { expect } = Lab.types;


add(1, true); expect.error(add(1, true)); add(1, true);
