// © 2016-2020 Resurface Labs Inc.

const chai = require('chai');
const expect = chai.expect;

const UsageLoggers = require('../lib/all').UsageLoggers;

/**
 * Tests against utilities for all usage loggers.
 */
describe('UsageLogger', () => {

    it('provides default url', () => {
        const url = UsageLoggers.urlByDefault();
        expect(url).not.to.exist;
    });

});
