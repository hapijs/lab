import * as Lab from '../../../..';
import { sample, hasProperty } from '..';


const { expect } = Lab.types;


expect.error<string>(1);
expect.error<string>('string');

expect.error(sample.x = '123');
expect.error(sample.y);

try {
    if (true) {
        expect.error<string>(1);
        expect.error<string>('string');

        expect.error(sample.x = '123');
        expect.error(sample.y);
    }
}
catch { }

expect.error(hasProperty({ name: 1 }));
