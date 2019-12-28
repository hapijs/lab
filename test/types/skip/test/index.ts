import * as Lab from '../../../..';
import add from '..';


const { expect } = Lab.types;

// $lab:types:off$
throw new Error('Should be skipped');
// $lab:types:on$

throw new Error('Should be skipped'); // $lab:types:skip$

// add()

add('foo', 'bar');
add(1, 2);

expect.error(add(true, true));
expect.error(add(1, 'two'));
expect.error(add(1));
expect.error(add(1, 2, 3));
