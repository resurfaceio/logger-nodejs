// © 2016-2021 Resurface Labs Inc.

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));

const { expect } = chai;
const helper = require('./helper');

const { parseable } = helper;

const resurfaceio = require('../lib/all');

const { HttpLogger } = resurfaceio;
const { HttpMessage } = resurfaceio;
const { HttpRequestImpl } = resurfaceio;
const { HttpResponseImpl } = resurfaceio;
const { WriterWrapper } = resurfaceio;

/**
 * Tests against message formatter for HTTP/HTTPS protocol.
 */
describe('HttpMessage', () => {
  it('formats request', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, helper.mockRequest(), helper.mockResponse(), undefined, undefined, helper.MOCK_NOW);
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).to.contain(`["host","${HttpLogger.host_lookup()}"]`);
    expect(msg).to.contain(`["now","${helper.MOCK_NOW}"]`);
    expect(msg).to.contain('["request_method","GET"]');
    expect(msg).to.contain(`["request_url","${helper.MOCK_URL}"]`);
    expect(msg).not.to.contain('request_body');
    expect(msg).not.to.contain('request_header');
    expect(msg).not.to.contain('request_param');
    expect(msg).not.to.contain('interval');
  });

  it('formats request with body', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, helper.mockRequestWithJson(), helper.mockResponse(), undefined, helper.MOCK_HTML);
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).to.contain(`["request_body","${helper.MOCK_HTML}"]`);
    expect(msg).to.contain('["request_header:content-type","Application/JSON"]');
    expect(msg).to.contain('["request_method","POST"]');
    expect(msg).to.contain(`["request_param:message","${helper.MOCK_JSON_ESCAPED}"]`);
    expect(msg).to.contain(`["request_url","${helper.MOCK_URL}?${helper.MOCK_QUERY_STRING}"]`);
    expect(msg).not.to.contain('request_param:foo');
  });

  it('formats request with empty body', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponse(), undefined, '');
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).to.contain('["request_header:a","1, 2"]');
    expect(msg).to.contain('["request_header:abc","123"]');
    expect(msg).to.contain('["request_header:content-type","Application/JSON"]');
    expect(msg).to.contain('["request_method","POST"]');
    expect(msg).to.contain('["request_param:abc","123, 234"]');
    expect(msg).to.contain(`["request_param:message","${helper.MOCK_JSON_ESCAPED}"]`);
    expect(msg).to.contain(`["request_url","${helper.MOCK_URL}?${helper.MOCK_QUERY_STRING}"]`);
    expect(msg).not.to.contain('request_body');
    expect(msg).not.to.contain('request_param:foo');
  });

  it('formats request with missing details', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, new HttpRequestImpl(), helper.mockResponse(), undefined, null, helper.MOCK_NOW);
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).not.to.contain('request_body');
    expect(msg).not.to.contain('request_header');
    expect(msg).not.to.contain('request_method');
    expect(msg).not.to.contain('request_param');
    expect(msg).not.to.contain('request_url');
    expect(msg).not.to.contain('interval');
  });

  it('formats response', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, helper.mockRequest(), helper.mockResponse());
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).to.contain(`["response_code","200"]`);
    expect(msg).not.to.contain('response_body');
    expect(msg).not.to.contain('response_header');
  });

  it('formats response with body', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, helper.mockRequest(), helper.mockResponseWithHtml(), helper.MOCK_HTML2);
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).to.contain(`["response_body","${helper.MOCK_HTML2}"]`);
    expect(msg).to.contain(`["response_code","200"]`);
    expect(msg).to.contain('["response_header:content-type","text/html; charset=utf-8"]');
  });

  it('formats response with empty body', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, helper.mockRequest(), helper.mockResponseWithHtml(), '');
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).to.contain(`["response_code","200"]`);
    expect(msg).to.contain('["response_header:content-type","text/html; charset=utf-8"]');
    expect(msg).not.to.contain('response_body');
  });

  it('formats response with header array', () => {
    const response = helper.mockResponseWithHtml();
    response.addHeader('blah', ['A', 'BCD', 'EF']);
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, helper.mockRequest(), response, helper.MOCK_JSON);
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).to.contain('["response_header:blah","ABCDEF"]');
  });

  it('formats response with missing details', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    HttpMessage.send(logger, helper.mockRequest(), new HttpResponseImpl(), null);
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).not.to.contain('response_body');
    expect(msg).not.to.contain('response_code');
    expect(msg).not.to.contain('response_header');
    expect(msg).not.to.contain('interval');
  });

  it('caps at overflow limit', () => {
    const queue = [];
    const logger = new HttpLogger({ queue, rules: 'include debug' });
    const response = new HttpResponseImpl();
    response.write = () => {};
    const wrapped = new WriterWrapper(response);
    response.write(Buffer.alloc(wrapped.limit + 1, 0));
    HttpMessage.send(logger, helper.mockRequest(), response, wrapped.logged());
    expect(queue.length).to.equal(1);
    const msg = queue[0];
    expect(parseable(msg)).to.be.true;
    expect(msg).to.contain(`["response_body","{\\"overflowed: ${wrapped.limit + 1}\\"}"]`);
  });
});
