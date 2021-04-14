// © 2016-2021 Resurface Labs Inc.

const resurfaceio = require('../lib/all');

const DemoURL = 'https://demo.resurface.io/ping';
const {HttpRequestImpl} = resurfaceio;
const {HttpResponseImpl} = resurfaceio;

module.exports = {
  DEMO_URL: DemoURL,

  MOCK_AGENT: 'helper.js',

  MOCK_HTML: '<html>Hello World!</html>',

  MOCK_HTML2: '<html>Hola Mundo!</html>',

  MOCK_HTML3: '<html>1 World 2 World Red World Blue World!</html>',

  MOCK_HTML4: '<html>1 World\n2 World\nRed World \nBlue World!\n</html>',

  MOCK_HTML5: `<html>
<input type="hidden">SENSITIVE</input>
<input class='foo' type="hidden">
SENSITIVE
</input>
</html>`,

  MOCK_JSON: '{ "hello" : "world" }',

  MOCK_JSON_ESCAPED: '{ \\"hello\\" : \\"world\\" }',

  MOCK_NOW: '1455908640173',

  MOCK_QUERY_STRING: 'foo=bar',

  MOCK_URL: 'http://localhost/index.html', // todo should have port?

  MOCK_URLS_DENIED: [`${DemoURL}/noway3is5this1valid2`, 'https://www.noway3is5this1valid2.com/'],

  MOCK_URLS_INVALID: ['', 'noway3is5this1valid2', 'ftp:\\www.noway3is5this1valid2.com/', 'urn:ISSN:1535–3613'],

  mockRequest() {
    const r = new HttpRequestImpl();
    r.method = 'GET';
    r.protocol = 'http';
    r.hostname = 'localhost';
    r.url = '/index.html';
    return r;
  },

  mockRequestWithJson() {
    const r = new HttpRequestImpl();
    r.headers['content-type'] = 'Application/JSON';
    r.body.message = this.MOCK_JSON;
    r.method = 'POST';
    r.protocol = 'http';
    r.hostname = 'localhost';
    r.url = `/index.html?${this.MOCK_QUERY_STRING}`;
    return r;
  },

  mockRequestWithJson2() {
    const r = this.mockRequestWithJson();
    r.headers.ABC = '123';
    r.addHeader('A', '1');
    r.addHeader('A', '2');
    r.addQueryParam('ABC', '123');
    r.addQueryParam('ABC', '234');
    return r;
  },

  mockResponse() {
    const r = new HttpResponseImpl();
    r.statusCode = 200;
    return r;
  },

  mockResponseWithHtml() {
    const r = this.mockResponse();
    r.headers['content-type'] = 'text/html; charset=utf-8';
    return r;
  },

  parseable: (msg) => {
    if (msg == undefined || !msg.startsWith('[') || !msg.endsWith(']') || msg.includes('[]') || msg.includes(',,')) return false;
    try {
      JSON.parse(msg);
      return true;
    } catch (e) {
      return false;
    }
  },
};
