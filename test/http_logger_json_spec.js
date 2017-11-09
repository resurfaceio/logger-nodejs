// © 2016-2017 Resurface Labs LLC

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

/**
 * Tests against usage logger for HTTP/HTTPS protocol.
 */
describe('HttpLogger', () => {

    it('formats request', () => {
        const json = new HttpLogger().format(helper.mockRequest(), helper.mockResponse(), undefined, undefined, helper.MOCK_NOW);
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
        const json = new HttpLogger().format(helper.mockRequestWithJson(), helper.mockResponse(), undefined, helper.MOCK_JSON);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain("[\"request_body\",\"" + helper.MOCK_JSON_ESCAPED + "\"]");
        expect(json).to.contain("[\"request_header.content-type\",\"Application/JSON\"]");
        expect(json).to.contain("[\"request_method\",\"POST\"]");
        expect(json).to.contain("[\"request_param.query1\",\"QUERY1\"]");
        expect(json).to.contain(`[\"request_url\",\"${helper.MOCK_URL}?${helper.MOCK_QUERY_STRING}\"]`);
    });

    it('formats request with empty body', () => {
        const json = new HttpLogger().format(helper.mockRequestWithJson2(), helper.mockResponse(), undefined, '');
        expect(parseable(json)).to.be.true;
        expect(json).to.contain("[\"request_header.a\",\"1, 2\"]");
        expect(json).to.contain("[\"request_header.abc\",\"123\"]");
        expect(json).to.contain("[\"request_header.content-type\",\"Application/JSON\"]");
        expect(json).to.contain("[\"request_method\",\"POST\"]");
        expect(json).to.contain("[\"request_param.body1\",\"BODY1\"]");
        expect(json).to.contain("[\"request_param.query1\",\"QUERY1\"]");
        expect(json).to.contain("[\"request_param.query2\",\"QUERY2\"]");
        expect(json).to.contain(`[\"request_url\",\"${helper.MOCK_URL}?${helper.MOCK_QUERY_STRING}\"]`);
        expect(json).not.to.contain('request_body');
    });

    it('formats request with missing details', () => {
        const json = new HttpLogger().format(new HttpRequestImpl(), helper.mockResponse(), undefined, null, helper.MOCK_NOW);
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('request_body');
        expect(json).not.to.contain('request_header');
        expect(json).not.to.contain('request_method');
        expect(json).not.to.contain('request_param');
        expect(json).not.to.contain('request_url');
    });

    it('formats response', () => {
        const json = new HttpLogger().format(helper.mockRequest(), helper.mockResponse());
        expect(parseable(json)).to.be.true;
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).not.to.contain('response_body');
        expect(json).not.to.contain('response_header');
    });

    it('formats response with body', () => {
        const json = new HttpLogger().format(helper.mockRequest(), helper.mockResponseWithHtml(), helper.MOCK_JSON);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain("[\"response_body\",\"" + helper.MOCK_JSON_ESCAPED + "\"]");
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).to.contain("[\"response_header.content-type\",\"text/html; charset=utf-8\"]");
    });

    it('formats response with empty body', () => {
        const json = new HttpLogger().format(helper.mockRequest(), helper.mockResponseWithHtml(), '');
        expect(parseable(json)).to.be.true;
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).to.contain("[\"response_header.content-type\",\"text/html; charset=utf-8\"]");
        expect(json).not.to.contain('response_body');
    });

    it('formats response with missing details', () => {
        const json = new HttpLogger().format(helper.mockRequest(), new HttpResponseImpl(), null);
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('response_body');
        expect(json).not.to.contain('response_code');
        expect(json).not.to.contain('response_header');
    });

});
