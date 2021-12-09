// © 2016-2021 Resurface Labs Inc.

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));

const { expect } = chai;

const helper = require('./helper');

const { DEMO_URL } = helper;
const { MOCK_AGENT } = helper;
const { MOCK_NOW } = helper;
const { parseable } = helper;

const resurfaceio = require('../lib/all');

const { BaseLogger } = resurfaceio;
const { UsageLoggers } = resurfaceio;

/**
 * Tests against basic usage logger to embed or extend.
 */
describe('BaseLogger', () => {
  it('creates instance', () => {
    const logger = new BaseLogger(MOCK_AGENT);
    expect(logger).to.exist;
    expect(logger.agent).to.equal(MOCK_AGENT);
    expect(logger.constructor.name).to.equal('BaseLogger');
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.queue).not.to.exist;
    expect(logger.url).not.to.exist;
  });

  it('creates multiple instances', () => {
    const agent1 = 'agent1';
    const agent2 = 'AGENT2';
    const agent3 = 'aGeNt3';
    const url1 = 'http://resurface.io';
    const url2 = 'http://whatever.com';
    const logger1 = new BaseLogger(agent1, url1);
    const logger2 = new BaseLogger(agent2, { url: url2 });
    const logger3 = new BaseLogger(agent3, { url: DEMO_URL });

    expect(logger1.agent).to.equal(agent1);
    expect(logger1.enableable).to.be.true;
    expect(logger1.enabled).to.be.true;
    expect(logger1.url).to.equal(url1);
    expect(logger2.agent).to.equal(agent2);
    expect(logger2.enableable).to.be.true;
    expect(logger2.enabled).to.be.true;
    expect(logger2.url).to.equal(url2);
    expect(logger3.agent).to.equal(agent3);
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

  it('has valid host', () => {
    const host = BaseLogger.host_lookup();
    expect(host).to.exist;
    expect(host).to.be.a('string');
    expect(host.length).to.be.above(0);
    expect(host).not.to.equal('unknown');

    const logger = new BaseLogger();
    expect(logger.host).to.equal(BaseLogger.host_lookup());
    expect(logger._host).to.equal(BaseLogger.host_lookup());
    expect(logger.host).to.equal(BaseLogger.host_lookup());
    expect(logger._host).to.equal(BaseLogger.host_lookup());
  });

  it('has valid version', () => {
    const version = BaseLogger.version_lookup();
    expect(version).to.exist;
    expect(version).to.be.a('string');
    expect(version.length).to.be.above(0);
    expect(version).to.startsWith('2.2.');
    expect(version).not.to.contain('\\');
    expect(version).not.to.contain('"');
    expect(version).not.to.contain("'");

    const logger = new BaseLogger();
    expect(logger.version).to.equal(BaseLogger.version_lookup());
    expect(logger._version).to.equal(BaseLogger.version_lookup());
    expect(logger.version).to.equal(BaseLogger.version_lookup());
    expect(logger._version).to.equal(BaseLogger.version_lookup());
  });

  it('performs enabling when expected', () => {
    let logger = new BaseLogger(MOCK_AGENT, { url: DEMO_URL, enabled: false });
    expect(logger.enableable).to.be.true;
    expect(logger.enabled).to.be.false;
    expect(logger.url).to.equal(DEMO_URL);
    logger.enable();
    expect(logger.enabled).to.be.true;

    logger = new BaseLogger(MOCK_AGENT, { queue: [], enabled: false });
    expect(logger.enableable).to.be.true;
    expect(logger.enabled).to.be.false;
    expect(logger.url).to.be.null;
    logger.enable().disable().enable();
    expect(logger.enabled).to.be.true;
  });

  it('skips enabling for invalid urls', () => {
    for (const url of helper.MOCK_URLS_INVALID) {
      const logger = new BaseLogger(MOCK_AGENT, { url });
      expect(logger.enableable).to.be.false;
      expect(logger.enabled).to.be.false;
      expect(logger.url).to.be.null;
      logger.enable();
      expect(logger.enabled).to.be.false;
    }
  });

  it('skips enabling for missing url', () => {
    const logger = new BaseLogger(MOCK_AGENT);
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.url).to.be.null;
    logger.enable();
    expect(logger.enabled).to.be.false;
  });

  it('skips enabling for null url', () => {
    const logger = new BaseLogger(MOCK_AGENT, { url: null });
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.url).to.be.null;
    logger.enable();
    expect(logger.enabled).to.be.false;
  });

  it('skips enabling for undefined url', () => {
    const logger = new BaseLogger(MOCK_AGENT, { url: undefined });
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.url).to.be.null;
    logger.enable();
    expect(logger.enabled).to.be.false;
  });

  it('submits to denied url', () => {
    for (const url of helper.MOCK_URLS_DENIED) {
      const logger = new BaseLogger(MOCK_AGENT, { url });
      expect(logger.enableable).to.be.true;
      expect(logger.enabled).to.be.true;
      logger.submit('{}').then(() => {
        expect(logger.submit_failures).to.equal(1);
        expect(logger.submit_successes).to.equal(0);
      });
    }
  });

  it('submits to queue', () => {
    const queue = [];
    const logger = new BaseLogger(MOCK_AGENT, {
      queue,
      url: helper.MOCK_URLS_DENIED[0],
    });
    expect(logger.queue).to.equal(queue);
    expect(logger.url).to.be.null;
    expect(logger.enableable).to.be.true;
    expect(logger.enabled).to.be.true;
    expect(queue.length).to.equal(0);
    expect(logger.submit('{}')).to.be.fulfilled;
    expect(queue.length).to.equal(1);
    expect(logger.submit('{}')).to.be.fulfilled;
    expect(queue.length).to.equal(2);
    expect(logger.submit_failures).to.equal(0);
    expect(logger.submit_successes).to.equal(2);
  });

  it('silently ignores unexpected option classes', () => {
    let logger = new BaseLogger(MOCK_AGENT, { queue: new Set() });
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.queue).to.be.null;
    expect(logger.url).to.be.null;

    logger = new BaseLogger(MOCK_AGENT, { queue: 'ASDF' });
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.queue).to.be.null;
    expect(logger.url).to.be.null;

    logger = new BaseLogger(MOCK_AGENT, { url: [] });
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.queue).to.be.null;
    expect(logger.url).to.be.null;

    logger = new BaseLogger(MOCK_AGENT, []);
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.queue).to.be.null;
    expect(logger.url).to.be.null;

    logger = new BaseLogger(MOCK_AGENT, new Set());
    expect(logger.enableable).to.be.false;
    expect(logger.enabled).to.be.false;
    expect(logger.queue).to.be.null;
    expect(logger.url).to.be.null;
  });

  it('silently ignores writes to agent', () => {
    const logger = new BaseLogger(MOCK_AGENT);
    logger._agent = '1234';
    logger._agent = '1234';
    expect(logger.agent).to.equal(MOCK_AGENT);
    logger.agent = '1234';
    logger.agent = '1234';
    expect(logger.agent).to.equal(MOCK_AGENT);
  });

  it('silently ignores writes to host', () => {
    const logger = new BaseLogger(MOCK_AGENT);
    logger._host = '1234';
    logger._host = '1234';
    expect(logger.host).to.equal(BaseLogger.host_lookup());
    logger.host = '1234';
    logger.host = '1234';
    expect(logger.host).to.equal(BaseLogger.host_lookup());
  });

  it('silently ignores writes to queue', () => {
    const queue = [];
    const logger = new BaseLogger(MOCK_AGENT, { queue });
    logger.queue = '1234';
    logger._queue = '1234';
    logger._queue = '1234';
    expect(logger._queue).to.equal(queue);
  });

  it('silently ignores writes to url', () => {
    const logger = new BaseLogger(MOCK_AGENT, { url: DEMO_URL });
    logger._url = '1234';
    logger._url = '1234';
    expect(logger.url).to.equal(DEMO_URL);
    logger.url = '1234';
    logger.url = '1234';
    expect(logger.url).to.equal(DEMO_URL);
  });

  it('silently ignores writes to version', () => {
    const logger = new BaseLogger();
    logger._version = 'X.Y.Z';
    logger._version = 'X.Y.Z';
    expect(logger.version).to.equal(BaseLogger.version_lookup());
    logger.version = 'X.Y.Z';
    logger.version = 'X.Y.Z';
    expect(logger.version).to.equal(BaseLogger.version_lookup());
  });

  it('uses skip options', () => {
    const logger = new BaseLogger(MOCK_AGENT, DEMO_URL);
    expect(logger.skip_compression).to.be.false;
    expect(logger.skip_submission).to.be.false;

    logger.skip_compression = true;
    expect(logger.skip_compression).to.be.true;
    expect(logger.skip_submission).to.be.false;

    logger.skip_compression = false;
    logger.skip_submission = true;
    expect(logger.skip_compression).to.be.false;
    expect(logger.skip_submission).to.be.true;
  });
});
