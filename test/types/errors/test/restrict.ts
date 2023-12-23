import * as Lab from '../../../..';
import type { UncheckedIndexedAccess, UsesExactOptionalPropertyTypes } from '../lib/index';

const { expect } = Lab.types;

const exact: UsesExactOptionalPropertyTypes = { a: true };

exact.a = undefined;
exact.b = 'ok';
expect.error(exact.b = undefined);

const unchecked: UncheckedIndexedAccess = { a: exact, b: {} };

unchecked.a.a;
expect.error(unchecked.b.a);
