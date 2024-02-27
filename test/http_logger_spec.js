// © 2016-2022 Resurface Labs Inc.

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));

const { expect } = chai;
const helper = require('./helper');

const { DEMO_URL } = helper;

const resurfaceio = require('../lib/all');

const { HttpLogger } = resurfaceio;
const { UsageLoggers } = resurfaceio;

/**
 * Tests against usage logger for HTTP/HTTPS protocol.
 */
describe('HttpLogger', () => {
  it('creates instance', () => {
    const logger = new HttpLogger();
    expect(logger).to.exist;
    expect(logger.agent).to.equal(HttpLogger.AGENT);
    expect(logger.constructor.name).to.equal('HttpLogger');
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.queue).not.to.exist;
    expect(logger.url).not.to.exist;
  });

  it('creates multiple instances', () => {
    const url1 = 'https://resurface.io';
    const url2 = 'https://whatever.com';
    const logger1 = new HttpLogger(url1);
    const logger2 = new HttpLogger({ url: url2 });
    const logger3 = new HttpLogger({ url: DEMO_URL });

    expect(logger1.agent).to.equal(HttpLogger.AGENT);
    expect(logger1.enableable).to.be.true;
    expect(logger1.enabled).to.be.true;
    expect(logger1.url).to.equal(url1);
    expect(logger2.agent).to.equal(HttpLogger.AGENT);
    expect(logger2.enableable).to.be.true;
    expect(logger2.enabled).to.be.true;
    expect(logger2.url).to.equal(url2);
    expect(logger3.agent).to.equal(HttpLogger.AGENT);
    expect(logger3.enableable).to.be.true;
    expect(logger3.enabled).to.be.true;
    expect(logger3.url).to.equal(DEMO_URL);

    UsageLoggers.disable();
    expect(UsageLoggers.enabled).to.be.false;
    expect(logger1.enabled).to.be.false;
    expect(logger2.enabled).to.be.false;
    expect(logger3.enabled).to.be.false;
    UsageLoggers.enable();
    expect(UsageLoggers.enabled).to.be.true;
    expect(logger1.enabled).to.be.true;
    expect(logger2.enabled).to.be.true;
    expect(logger3.enabled).to.be.true;
  });

  it('has valid agent', () => {
    const agent = HttpLogger.AGENT;
    expect(agent).to.exist;
    expect(agent).to.be.a('string');
    expect(agent.length).to.be.above(0);
    expect(agent).to.endsWith('.js');
    expect(agent).not.to.contain('\\');
    expect(agent).not.to.contain('"');
    expect(agent).not.to.contain("'");
    expect(new HttpLogger().agent).to.equal(agent);
  });

  it('silently ignores writes to enabled', () => {
    const logger = new HttpLogger();
    logger._enableable = true;
    logger._enableable = true;
    logger._enabled = true;
    logger._enabled = true;
    logger._enabled = true;
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
  });
});
