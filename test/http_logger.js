// © 2016-2017 Resurface Labs LLC

const HttpLogger = require('../lib/all').HttpLogger;

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));

describe('HttpLogger', function () {

    describe('#constructor', function () {
        it('constructs instance and confirms version', function () {
            const logger = new HttpLogger();
            expect(logger).to.exist;
            expect(logger.constructor.name).to.equal('HttpLogger');
            expect(logger.version).to.equal(HttpLogger.version_lookup());
        });
    });

    describe('#version_lookup', function () {
        it('returns valid value', function () {
            const version = HttpLogger.version_lookup();
            expect(version).to.exist;
            expect(version).to.be.a('string');
            expect(version.length).to.be.above(0);
            expect(version).to.startsWith('1.0.');
            expect(version.indexOf('\\')).to.be.below(0);
            expect(version.indexOf('\"')).to.be.below(0);
            expect(version.indexOf('\'')).to.be.below(0);
        });
    });

});
