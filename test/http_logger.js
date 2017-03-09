// © 2016-2017 Resurface Labs LLC

const HttpLogger = require('../lib/all').HttpLogger;

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));

/**
 * Tests against usage logger for HTTP/HTTPS protocol.
 */
describe('HttpLogger', function () {

    it('creates a valid frozen object', function () {
        const logger = new HttpLogger();
        expect(logger).to.exist;
        expect(logger.constructor['name']).to.equal('HttpLogger');
        expect(Object.isFrozen(logger)).to.be.true;
    });

});
