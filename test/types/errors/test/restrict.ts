import * as Lab from '../../../..';
import type { UncheckedIndexedAccess, UsesExactOptionalPropertyTypes } from '../lib/index';

const { expect } = Lab.types;

const exact: UsesExactOptionalPropertyTypes = { a: true };

exact.a = undefined;
exact.b = 'ok';
exact.b = undefined;      // Fails

const unchecked: UncheckedIndexedAccess = { a: exact, b: {} };

unchecked.a.a;
unchecked.b.a;      // Fails
