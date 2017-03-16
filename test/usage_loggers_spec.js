// © 2016-2017 Resurface Labs LLC

const UsageLoggers = require('../lib/all').UsageLoggers;

const chai = require('chai');
const expect = chai.expect;

/**
 * Tests against utilities for all usage loggers.
 */
describe('UsageLogger', () => {

    it('provides default url', () => {
        const url = UsageLoggers.urlByDefault();
        expect(url).not.to.exist;
    });

    it('provides demo url', () => {
        const url = UsageLoggers.urlForDemo();
        expect(url).to.exist;
        expect(url).to.be.a('string');
        expect(url.length).to.be.above(0);
        expect(url).to.startsWith('https://');
    });

});
