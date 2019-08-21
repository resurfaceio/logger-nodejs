// © 2016-2019 Resurface Labs Inc.

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;
const helper = require('./helper');
const parseable = helper.parseable;

const resurfaceio = require('../lib/all');
const HttpLogger = resurfaceio.HttpLogger;
const HttpRequestImpl = resurfaceio.HttpRequestImpl;
const HttpResponseImpl = resurfaceio.HttpResponseImpl;

const logger = new resurfaceio.HttpLogger({rules: 'include standard'});

/**
 * Tests against usage logger for HTTP/HTTPS protocol.
 */
describe('HttpLogger', () => {

    it('formats request', () => {
        const json = logger.format(helper.mockRequest(), helper.mockResponse(), undefined, undefined, helper.MOCK_NOW);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain(`[\"agent\",\"${HttpLogger.AGENT}\"]`);
        expect(json).to.contain(`[\"version\",\"${HttpLogger.version_lookup()}\"]`);
        expect(json).to.contain(`[\"now\",\"${helper.MOCK_NOW}\"]`);
        expect(json).to.contain("[\"request_method\",\"GET\"]");
        expect(json).to.contain(`[\"request_url\",\"${helper.MOCK_URL}\"]`);
        expect(json).not.to.contain('request_body');
        expect(json).not.to.contain('request_header');
        expect(json).not.to.contain('request_param');
    });

    it('formats request with body', () => {
        const json = logger.format(helper.mockRequestWithJson(), helper.mockResponse(), undefined, helper.MOCK_HTML);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain("[\"request_body\",\"" + helper.MOCK_HTML + "\"]");
        expect(json).to.contain("[\"request_header:content-type\",\"Application/JSON\"]");
        expect(json).to.contain("[\"request_method\",\"POST\"]");
        expect(json).to.contain(`[\"request_param:message\",\"${helper.MOCK_JSON_ESCAPED}\"]`);
        expect(json).to.contain(`[\"request_url\",\"${helper.MOCK_URL}?${helper.MOCK_QUERY_STRING}\"]`);
        expect(json).not.to.contain('request_param:foo');
    });

    it('formats request with empty body', () => {
        const json = logger.format(helper.mockRequestWithJson2(), helper.mockResponse(), undefined, '');
        expect(parseable(json)).to.be.true;
        expect(json).to.contain("[\"request_header:a\",\"1, 2\"]");
        expect(json).to.contain("[\"request_header:abc\",\"123\"]");
        expect(json).to.contain("[\"request_header:content-type\",\"Application/JSON\"]");
        expect(json).to.contain("[\"request_method\",\"POST\"]");
        expect(json).to.contain("[\"request_param:abc\",\"123, 234\"]");
        expect(json).to.contain(`[\"request_param:message\",\"${helper.MOCK_JSON_ESCAPED}\"]`);
        expect(json).to.contain(`[\"request_url\",\"${helper.MOCK_URL}?${helper.MOCK_QUERY_STRING}\"]`);
        expect(json).not.to.contain('request_body');
        expect(json).not.to.contain('request_param:foo');
    });

    it('formats request with missing details', () => {
        const json = logger.format(new HttpRequestImpl(), helper.mockResponse(), undefined, null, helper.MOCK_NOW);
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('request_body');
        expect(json).not.to.contain('request_header');
        expect(json).not.to.contain('request_method');
        expect(json).not.to.contain('request_param');
        expect(json).not.to.contain('request_url');
    });

    it('formats response', () => {
        const json = logger.format(helper.mockRequest(), helper.mockResponse());
        expect(parseable(json)).to.be.true;
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).not.to.contain('response_body');
        expect(json).not.to.contain('response_header');
    });

    it('formats response with body', () => {
        const json = logger.format(helper.mockRequest(), helper.mockResponseWithHtml(), helper.MOCK_HTML2);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain("[\"response_body\",\"" + helper.MOCK_HTML2 + "\"]");
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).to.contain("[\"response_header:content-type\",\"text/html; charset=utf-8\"]");
    });

    it('formats response with empty body', () => {
        const json = logger.format(helper.mockRequest(), helper.mockResponseWithHtml(), '');
        expect(parseable(json)).to.be.true;
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).to.contain("[\"response_header:content-type\",\"text/html; charset=utf-8\"]");
        expect(json).not.to.contain('response_body');
    });

    it('formats response with header array', () => {
        const response = helper.mockResponseWithHtml();
        response.addHeader('blah', ['A', 'BCD', 'EF']);
        const json = logger.format(helper.mockRequest(), response, helper.MOCK_JSON);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain("[\"response_header:blah\",\"ABCDEF\"]");
    });

    it('formats response with missing details', () => {
        const json = logger.format(helper.mockRequest(), new HttpResponseImpl(), null);
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('response_body');
        expect(json).not.to.contain('response_code');
        expect(json).not.to.contain('response_header');
    });

});
