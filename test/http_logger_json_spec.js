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

    it('formats request with body', () => {
        const json = new HttpLogger().format(helper.mockRequestWithBody(), undefined, helper.mockResponse(), undefined);
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('request_body');  // todo not supported yet
        expect(json).to.contain("[\"request_header.content-type\",\"Application/JSON\"]");
        expect(json).to.contain("[\"request_method\",\"POST\"]");
        expect(json).to.contain(`[\"request_url\",\"${helper.MOCK_URL}?${helper.MOCK_QUERY_STRING}\"]`);
    });

    it('formats request with empty body', () => {
        const json = new HttpLogger().format(helper.mockRequestWithBody2(), '', helper.mockResponse(), undefined);
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('request_body');  // todo not supported yet
        expect(json).to.contain("[\"request_header.a\",\"1, 2\"]");
        expect(json).to.contain("[\"request_header.abc\",\"123\"]");
        expect(json).to.contain("[\"request_header.content-type\",\"Application/JSON\"]");
        expect(json).to.contain("[\"request_method\",\"POST\"]");
        expect(json).to.contain(`[\"request_url\",\"${helper.MOCK_URL}?${helper.MOCK_QUERY_STRING}\"]`);
    });

    it('formats request with nil method and url', () => {
        const json = new HttpLogger().format(new HttpRequestImpl(), undefined, helper.mockResponse(), undefined, helper.MOCK_NOW);
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('request_body');
        expect(json).not.to.contain('request_header');
        expect(json).not.to.contain('request_method');
        expect(json).not.to.contain('request_url');
    });

    it('formats response', () => {
        const json = new HttpLogger().format(helper.mockRequest(), undefined, helper.mockResponse(), undefined);
        expect(parseable(json)).to.be.true;
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).not.to.contain('response_body');
        expect(json).not.to.contain('response_header');
    });

    it('formats response with body', () => {
        const json = new HttpLogger().format(helper.mockRequest(), undefined, helper.mockResponseWithBody(), undefined);
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('response_body');  // todo not supported yet
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).to.contain("[\"response_header.content-type\",\"text/html; charset=utf-8\"]");
    });

    it('formats response with empty body', () => {
        const json = new HttpLogger().format(helper.mockRequest(), undefined, helper.mockResponseWithBody(), '');
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('response_body');  // todo not supported yet
        expect(json).to.contain(`[\"response_code\",\"200\"]`);
        expect(json).to.contain("[\"response_header.content-type\",\"text/html; charset=utf-8\"]");
    });

    it('formats response with undefined content type and response code', () => {
        const json = new HttpLogger().format(helper.mockRequest(), undefined, new HttpResponseImpl(), '');
        expect(parseable(json)).to.be.true;
        expect(json).not.to.contain('request_body');
        expect(json).not.to.contain('response_body');
        expect(json).not.to.contain('response_code');
        expect(json).not.to.contain('response_header');
    });

});
