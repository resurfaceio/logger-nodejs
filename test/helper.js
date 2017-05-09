// © 2016-2017 Resurface Labs LLC

const resurfaceio = require('../lib/all');
const HttpRequestImpl = resurfaceio.HttpRequestImpl;
const HttpResponseImpl = resurfaceio.HttpResponseImpl;
const UsageLoggers = resurfaceio.UsageLoggers;

module.exports = {

    MOCK_AGENT: 'helper.js',

    MOCK_JSON: '{ "hello" : "world" }',

    MOCK_NOW: '1455908640173',

    MOCK_URL: 'http://localhost/index.html?boo=yah',

    MOCK_URLS_DENIED: [`${UsageLoggers.urlForDemo()}/noway3is5this1valid2`, 'https://www.noway3is5this1valid2.com/'],

    MOCK_URLS_INVALID: ['', 'noway3is5this1valid2', 'ftp:\\www.noway3is5this1valid2.com/', 'urn:ISSN:1535–3613'],

    mockRequest() {
        const r = new HttpRequestImpl();
        r.hostname = 'localhost';
        r.method = 'GET';
        r.protocol = 'http';
        r.url = '/index.html?boo=yah';
        return r;
    },

    mockResponse() {
        const r = new HttpResponseImpl();
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