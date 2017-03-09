// © 2016-2017 Resurface Labs LLC

const UsageLoggers = require('../lib/all').UsageLoggers;

const chai = require('chai');
const expect = chai.expect;

/**
 * Tests against utilities for all usage loggers.
 */
describe('UsageLogger', function () {

    it('enables and disables all loggers', function () {
        // todo create HttpLogger with demo url
        // todo expect logger to be enabled
        UsageLoggers.disable();
        expect(UsageLoggers.isEnabled()).to.be.false;
        // todo expect logger to be disabled
        UsageLoggers.enable();
        expect(UsageLoggers.isEnabled()).to.be.true;
        // todo expect logger to be enabled
    });

    it('provides demo url', function () {
        const url = UsageLoggers.urlForDemo();
        expect(url).to.exist;
        expect(url).to.be.a('string');
        expect(url.length).to.be.above(0);
        expect(url).to.startsWith('https://');
        // todo missing parsing test
    });

    it('provides empty default url', function () {
        const url = UsageLoggers.urlByDefault();
        expect(url).not.to.exist;
    });

});
