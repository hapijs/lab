import * as Lab from '../../../..';
import add from '..';


const { expect } = Lab.types;


// add()

add('foo', 'bar');
add(1, 2);

expect.error(add(true, true));
expect.error(add(1, 'two'));
expect.error(add(1));
expect.error(add(1, 2, 3));
