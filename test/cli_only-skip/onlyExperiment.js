'use strict';

// Load modules

const Code = require('@hapi/code');
const _Lab = require('../../test_runner');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;
const before = lab.before;
const beforeEach = lab.beforeEach;
const after = lab.after;
const afterEach = lab.afterEach;

describe('math', () => {

    before(() => {

        console.log('Should execute before 1');
    });

    beforeEach(() => {

        console.log('Should execute beforeEach 1');
    });

    after(() => {

        console.log('Should execute after 1');
    });

    afterEach(() => {

        console.log('Should execute afterEach 1');
    });

    describe('addition', () => {

        before(() => {

            console.log('Should execute before 2');
        });

        beforeEach(() => {

            console.log('Should execute beforeEach 2');
        });

        after(() => {

            console.log('Should execute after 2');
        });

        afterEach(() => {

            console.log('Should execute afterEach 2');
        });

        it('returns true when 1 + 1 equals 2', () => {

            throw new Error("Should not execute this test");
        });

        it('returns true when 2 + 2 equals 4', () => {

            throw new Error("Should not execute this test");
        });

        describe.only('nested addition', () => {

            before(() => {

                console.log('Should execute before 3');
            });

            beforeEach(() => {

                console.log('Should execute beforeEach 3');
            });

            after(() => {

                console.log('Should execute after 3');
            });

            afterEach(() => {

                console.log('Should execute afterEach 3');
            });

            it('returns true when 3 + 3 equals 6', () => {

                expect(3 + 3).to.equal(6);
            });

            it('returns true when 4 + 4 equals 8', () => {

                expect(4 + 4).to.equal(8);
            });

            describe('deeply nested addtion', () => {

                before(() => {

                    console.log('Should execute before 4');
                });

                beforeEach(() => {

                    console.log('Should execute beforeEach 4');
                });

                after(() => {

                    console.log('Should execute after 4');
                });

                afterEach(() => {

                    console.log('Should execute afterEach 4');
                });

                it('returns true when 5 + 5 equals 10', () => {

                    expect(5 + 5).to.equal(10);
                });
            });
        });

        describe('another nested addition', () => {

            before(() => {

                throw new Error('Should not execute sibling before');
            });

            beforeEach(() => {

                throw new Error('Should not execute sibling beforeEach');
            });

            after(() => {

                throw new Error('Should not execute sibling after');
            });

            afterEach(() => {

                throw new Error('Should not execute sibling afterEach');
            });

            it('returns true when 6 + 6 equals 12', () => {

                throw new Error("Should not execute this test");
            });

        });
    });

    describe('subtract', () => {

        before(() => {

            throw new Error('Should not execute unrelated before');
        });

        beforeEach(() => {

            throw new Error('Should not execute unrelated beforeEach');
        });

        after(() => {

            throw new Error('Should not execute unrelated after');
        });

        afterEach(() => {

            throw new Error('Should not execute unrelated afterEach');
        });

        it('returns true when 1 - 1 equals 0', () => {

            throw new Error("Should not execute this test");
        });

        it('returns true when 2 - 1 equals 1', () => {

            throw new Error("Should not execute this test");
        });
    });
});

describe('unrelated subtract', () => {

    before(() => {

        throw new Error('Should not execute unrelated before');
    });

    beforeEach(() => {

        throw new Error('Should not execute unrelated beforeEach');
    });

    after(() => {

        throw new Error('Should not execute unrelated after');
    });

    afterEach(() => {

        throw new Error('Should not execute unrelated afterEach');
    });

    it('returns true when 3 - 3 equals 0', () => {

        throw new Error("Should not execute this test");
    });
});
