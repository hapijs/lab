'use strict';

const External = require('@hapi/lab-external-module-test');
const Hoek = require('@hapi/hoek');


Hoek.assert(typeof External[Symbol.for('@hapi/lab/coverage/initialize')], 'Missing external coverage interface');

const checker1 = new External.Checker([1, 2, 3]);
checker1.test(1);

const checker2 = new External.Checker([1, 2, 3]);
checker2.test(1);
checker2.test(2);

const checker3 = new External.Checker([1, 2, 3]);
checker3.test(1);
checker3.test(2);
checker3.test(3);
