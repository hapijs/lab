import * as Lab from '../../../..';
import add from '..';


const { expect } = Lab.types;


expect.type<string>(await add('a', 'b'));
expect.type<number>(await add(1, 2));
