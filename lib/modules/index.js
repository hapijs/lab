'use strict';

const internals = {
    list: ['coverage', 'leaks', 'lint', 'transform', 'types', 'typescript']
};


internals.addModule = function (module) {

    Object.defineProperty(exports, module, {
        configurable: true,
        enumerable: true,
        get() {

            return require(`./${module}`);
        }
    });
};


for (const module of internals.list) {
    internals.addModule(module);
}
