'use strict';

// Load modules

const Os = require('os');
const Path = require('path');
const Code = require('code');
const _Lab = require('../test_runner');
const Lab = require('../');
const Transform = require('../lib/transform');


// Declare internals

const internals = {
    transform: [
        {
            ext: '.new', transform: function (content, filename) {

                return content.replace('!NOCOMPILE!', 'value = value ');
            }
        },
        {
            ext: '.inl', transform: function (content, filename) {

                if (Buffer.isBuffer(content)) {
                    content = content.toString();
                }
                return content.concat(Os.EOL).concat('//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkB0cmFjZXVyL2dlbmVyYXRlZC9UZW1wbGF0ZVBhcnNlci8xIiwiLi93aGlsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsQUFBSSxFQUFBLENBQUEsWUFBVyxVQUFvQixDQUFDO0FDS3BDLEFBQUksRUFBQSxDQUFBLFNBQVEsRUFBSSxHQUFDLENBQUM7QUFHbEIsTUFBTSxPQUFPLEVBQUksVUFBVSxLQUFJLENBQUc7QUFFOUIsUUFBTSxLQUFJLENBQUc7QUFDVCxRQUFJLEVBQUksTUFBSSxDQUFDO0VBQ2pCO0FBQUEsQUFFQSxPQUFPLE1BQUksQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF9fbW9kdWxlTmFtZSA9ICRfX3BsYWNlaG9sZGVyX18wOyIsIi8vIExvYWQgbW9kdWxlc1xuXG5cbi8vIERlY2xhcmUgaW50ZXJuYWxzXG5cbnZhciBpbnRlcm5hbHMgPSB7fTtcblxuXG5leHBvcnRzLm1ldGhvZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXG4gICAgd2hpbGUodmFsdWUpIHtcbiAgICAgICAgdmFsdWUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuIl19').concat(Os.EOL);
            }
        },
        { ext: '.js', transform: null }
    ]
};


// Test shortcuts

const lab = exports.lab = _Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

describe('Transform', () => {

    Lab.coverage.instrument({ coveragePath: Path.join(__dirname, './transform/'), coverageExclude: 'exclude', transform: internals.transform });

    it('instruments and measures coverage', (done) => {

        const Test = require('./transform/basic-transform');
        expect(Test.method(1)).to.equal(3);

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'transform/basic-transform') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('does not transform unneeded files', (done) => {

        const Test = require('./transform/basic');
        expect(Test.method(1)).to.equal('!NOCOMPILE!');

        const cov = Lab.coverage.analyze({ coveragePath: Path.join(__dirname, 'transform/basic') });
        expect(cov.percent).to.equal(100);
        done();
    });

    it('unit tests transform.retrieveFile', (done) => {

        let content = Transform.retrieveFile('test/transform/exclude/lab-noexport.js');
        expect(content).to.contain('// no code');

        content = Transform.retrieveFile('test/transform/exclude/lab-noexport.js');
        expect(content).to.contain('// no code');

        content = Transform.retrieveFile('doesnotexist');
        expect(content).to.equal(null);

        done();
    });

    it('should return transformed file through for relative (cwd-rooted) and absolute paths', (done) => {

        require('./transform/basic-transform'); // prime the cache

        const rel = Transform.retrieveFile('test/transform/basic-transform.new');
        expect(rel).to.not.contain('!NOCOMPILE!');

        const abs = Transform.retrieveFile(process.cwd() + '/test/transform/basic-transform.new');
        expect(abs).to.not.contain('!NOCOMPILE!');

        done();
    });
});

describe('Transform.install', () => {

    lab.before((done) => {

        internals.js = require.extensions['.js'];
        internals.new = require.extensions['.new'];
        internals.inl = require.extensions['.inl'];
        done();
    });

    lab.after((done) => {

        require.extensions['.js'] = internals.js;
        require.extensions['.new'] = internals.new;
        require.extensions['.inl'] = internals.inl;
        done();
    });

    it('works correctly', (done) => {

        Transform.install({ transform: internals.transform });

        const Test = require('./transform/sourcemaps');
        expect(Test.method(false)).to.equal(false);

        const Test2 = require('./transform/exclude/transform-basic');
        expect(Test2.method()).to.equal(1);

        done();
    });
});
