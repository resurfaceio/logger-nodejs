// © 2016-2017 Resurface Labs LLC

const resurfaceio = require('../lib/all');
const HttpRequestImpl = resurfaceio.HttpRequestImpl;
const HttpResponseImpl = resurfaceio.HttpResponseImpl;
const UsageLoggers = resurfaceio.UsageLoggers;

module.exports = {

    MOCK_AGENT: 'helper.js',

    MOCK_JSON: '{ "hello" : "world" }',

    MOCK_NOW: '1455908640173',

    MOCK_QUERY_STRING: 'boo=yah',

    MOCK_URL: 'http://localhost/index.html',  // todo should have port?

    MOCK_URLS_DENIED: [`${UsageLoggers.urlForDemo()}/noway3is5this1valid2`, 'https://www.noway3is5this1valid2.com/'],

    MOCK_URLS_INVALID: ['', 'noway3is5this1valid2', 'ftp:\\www.noway3is5this1valid2.com/', 'urn:ISSN:1535–3613'],

    mockRequest() {
        const r = new HttpRequestImpl();
        r.hostname = 'localhost';
        r.method = 'GET';
        r.protocol = 'http';
        r.url = '/index.html';
        return r;
    },

    mockRequestWithBody() {
        const r = new HttpRequestImpl();
        r.headers['content-type'] = 'Application/JSON';
        r.hostname = 'localhost';
        r.method = 'POST';
        r.protocol = 'http';
        r.url = `/index.html?boo=yah`;
        return r;
    },

    mockRequestWithBody2() {
        const r = new HttpRequestImpl();
        r.headers['content-type'] = 'Application/JSON';
        r.hostname = 'localhost';
        r.method = 'POST';
        r.protocol = 'http';
        r.url = `/index.html?boo=yah`;
        r.headers['ABC'] = '123';
        r.add_header('A', '1');
        r.add_header('A', '2');
        return r;
    },

    mockResponse() {
        const r = new HttpResponseImpl();
        r.statusCode = 200;
        return r;
    },

    mockResponseWithBody() {
        const r = new HttpResponseImpl();
        r.headers['content-type'] = 'text/html; charset=utf-8';
        r.statusCode = 200;
        return r;
    },

    parseable: (json) => {
        if (json === null || !json.startsWith('[') || !json.endsWith(']')) return false;
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }
};