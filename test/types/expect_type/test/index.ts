import * as Lab from '../../../..';
import add from '..';


const { expect } = Lab.types;


// Valid

expect.type<string>(add('a', 'b'));
expect.type<number>(add(1, 2));


// Invalid

expect.type<string>(add(1, 2));
