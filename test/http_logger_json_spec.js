// © 2016-2017 Resurface Labs LLC

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;
const helper = require('./helper');
const parseable = helper.parseable;

const HttpLogger = require('../lib/all').HttpLogger;

/**
 * Tests against usage logger for HTTP/HTTPS protocol.
 */
describe('HttpLogger', () => {

    it('formats request', () => {
        const json = new HttpLogger().format(helper.mockRequest(), undefined, helper.mockResponse(), undefined, helper.MOCK_NOW);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain(`[\"agent\",\"${HttpLogger.AGENT}\"]`);
        expect(json).to.contain(`[\"version\",\"${HttpLogger.version_lookup()}\"]`);
        expect(json).to.contain(`[\"now\",\"${helper.MOCK_NOW}\"]`);
        expect(json).to.contain("[\"request_method\",\"GET\"]");
        expect(json).to.contain(`[\"request_url\",\"${helper.MOCK_URL}\"]`);
        expect(json).not.to.contain('request_body');
        expect(json).not.to.contain('request_header');
        expect(json).not.to.contain('response_body');
        expect(json).not.to.contain('response_header');
    });

    it('formats response', () => {
        const json = new HttpLogger().format(helper.mockRequest(), undefined, helper.mockResponse(), undefined);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).not.to.contain('response_body');
        expect(json).not.to.contain('response_header');
    });

});
