// © 2016-2017 Resurface Labs LLC

const UsageLoggers = require('../lib/all').UsageLoggers;

module.exports = {
    MOCK_AGENT: 'helper.js',
    URLS_DENIED: [`${UsageLoggers.urlForDemo()}/noway3is5this1valid2`, 'https://www.noway3is5this1valid2.com/'],
    URLS_INVALID: ['', 'noway3is5this1valid2', 'ftp:\\www.noway3is5this1valid2.com/', 'urn:ISSN:1535–3613']
};