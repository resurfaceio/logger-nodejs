// © 2016-2017 Resurface Labs LLC

const UsageLoggers = require('../lib/all').UsageLoggers;

module.exports = {

    MOCK_AGENT: 'helper.js',

    MOCK_NOW: 1455908640173,

    MOCK_URL: 'http://localhost/index.html?boo=yah',

    URLS_DENIED: [`${UsageLoggers.urlForDemo()}/noway3is5this1valid2`, 'https://www.noway3is5this1valid2.com/'],

    URLS_INVALID: ['', 'noway3is5this1valid2', 'ftp:\\www.noway3is5this1valid2.com/', 'urn:ISSN:1535–3613'],

    mockRequest() {
        return {                                // todo: missing headers, port, body
            hostname: 'localhost',
            method: 'GET',
            protocol: 'http',
            url: '/index.html?boo=yah'
        }
    },

    mockResponse() {
        return {                               // todo: missing headers, body
            statusCode: 200
        }
    },

    parseable: (json) => {
        if (json === null || !json.startsWith('{') || !json.endsWith('}')) return false;
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }
};