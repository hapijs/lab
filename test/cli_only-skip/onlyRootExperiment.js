'use strict';

// Load modules

const Code = require('code');
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

describe.only('math', () => {

    before((done) => {

        console.log('Should execute before 1');
        done();
    });

    beforeEach((done) => {

        console.log('Should execute beforeEach 1');
        done();
    });

    after((done) => {

        console.log('Should execute after 1');
        done();
    });

    afterEach((done) => {

        console.log('Should execute afterEach 1');
        done();
    });

    describe('addition', () => {

        before((done) => {

            console.log('Should execute before 2');
            done();
        });

        beforeEach((done) => {

            console.log('Should execute beforeEach 2');
            done();
        });

        after((done) => {

            console.log('Should execute after 2');
            done();
        });

        afterEach((done) => {

            console.log('Should execute afterEach 2');
            done();
        });

        it('returns true when 1 + 1 equals 2', (done) => {

            expect(1 + 1).to.equal(2);
            done();
        });

        it('returns true when 2 + 2 equals 4', (done) => {

            expect(2 + 2).to.equal(4);
            done();
        });

        describe('nested addition', () => {

            before((done) => {

                console.log('Should execute before 3');
                done();
            });

            beforeEach((done) => {

                console.log('Should execute beforeEach 3');
                done();
            });

            after((done) => {

                console.log('Should execute after 3');
                done();
            });

            afterEach((done) => {

                console.log('Should execute afterEach 3');
                done();
            });

            it('returns true when 3 + 3 equals 6', (done) => {

                expect(3 + 3).to.equal(6);
                done();
            });

            it('returns true when 4 + 4 equals 8', (done) => {

                expect(4 + 4).to.equal(8);
                done();
            });

            describe('deeply nested addtion', () => {

                before((done) => {

                    console.log('Should execute before 4');
                    done();
                });

                beforeEach((done) => {

                    console.log('Should execute beforeEach 4');
                    done();
                });

                after((done) => {

                    console.log('Should execute after 4');
                    done();
                });

                afterEach((done) => {

                    console.log('Should execute afterEach 4');
                    done();
                });

                it('returns true when 5 + 5 equals 10', (done) => {

                    expect(5 + 5).to.equal(10);
                    done();
                });
            });
        });

        describe('another nested addition', () => {

            before((done) => {

                console.log('Should execute before 5');
                done();
            });

            beforeEach((done) => {

                console.log('Should execute beforeEach 5');
                done();
            });

            after((done) => {

                console.log('Should execute after 5');
                done();
            });

            afterEach((done) => {

                console.log('Should execute afterEach 5');
                done();
            });

            it('returns true when 6 + 6 equals 12', (done) => {

                expect(6 + 6).to.equal(12);
                done();
            });

        });
    });

    describe('subtract', () => {

        before((done) => {

            console.log('Should execute before 6');
            done();
        });

        beforeEach((done) => {

            console.log('Should execute beforeEach 6');
            done();
        });

        after((done) => {

            console.log('Should execute after 6');
            done();
        });

        afterEach((done) => {

            console.log('Should execute afterEach 6');
            done();
        });

        it('returns true when 1 - 1 equals 0', (done) => {

            expect(1 - 1).to.equal(0);
            done();
        });

        it('returns true when 2 - 1 equals 1', (done) => {

            expect(2 - 1).to.equal(1);
            done();
        });
    });
});

describe('unrelated subtract', () => {

    before((done) => {

        throw new Error('Should not execute unrelated before');
        done();
    });

    beforeEach((done) => {

        throw new Error('Should not execute unrelated beforeEach');
        done();
    });

    after((done) => {

        throw new Error('Should not execute unrelated after');
        done();
    });

    afterEach((done) => {

        throw new Error('Should not execute unrelated afterEach');
        done();
    });

    it('returns true when 3 - 3 equals 0', (done) => {

        throw new Error("Should not execute this test");
        done();
    });
});
