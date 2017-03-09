// © 2016-2017 Resurface Labs LLC

const BaseLogger = require('../lib/all').BaseLogger;

const chai = require('chai');
const expect = chai.expect;

/**
 * Tests against basic usage logger to embed or extend.
 */
describe('BaseLogger', function () {

    it('creates a valid frozen object', function () {
        const logger = new BaseLogger();
        expect(logger).to.exist;
        expect(logger.constructor['name']).to.equal('BaseLogger');
        expect(Object.isFrozen(logger)).to.be.true;
    });

    it('provides valid version', function () {
        const version = BaseLogger.version_lookup();
        expect(version).to.exist;
        expect(version).to.be.a('string');
        expect(version.length).to.be.above(0);
        expect(version).to.startsWith('1.0.');
        expect(version.indexOf('\\')).to.be.below(0);
        expect(version.indexOf('\"')).to.be.below(0);
        expect(version.indexOf('\'')).to.be.below(0);
        const logger = new BaseLogger();
        expect(logger.version).to.equal(BaseLogger.version_lookup());
        expect(logger._version).to.equal(BaseLogger.version_lookup());
        expect(logger['version']).to.equal(BaseLogger.version_lookup());
        expect(logger['_version']).to.equal(BaseLogger.version_lookup());
    });

    it('skips writes to version', function () {
        const logger = new BaseLogger();
        logger._version = 'X.Y.Z';
        logger['_version'] = 'X.Y.Z';
        expect(logger.version).to.equal(BaseLogger.version_lookup());
        logger.version = 'X.Y.Z';
        logger['version'] = 'X.Y.Z';
        expect(logger.version).to.equal(BaseLogger.version_lookup());
    });

});
