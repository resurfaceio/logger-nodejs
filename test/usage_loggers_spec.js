// © 2016-2024 Graylog, Inc.

const chai = require('chai');

const { expect } = chai;

const { UsageLoggers } = require('../lib/all');

/**
 * Tests against utilities for all usage loggers.
 */
describe('UsageLogger', () => {
  it('provides default url', () => {
    const url = UsageLoggers.urlByDefault();
    expect(url).not.to.exist;
  });
});
