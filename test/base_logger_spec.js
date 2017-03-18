// © 2016-2017 Resurface Labs LLC

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;
const helper = require('./helper');
const MOCK_AGENT = helper.MOCK_AGENT;

const BaseLogger = require('../lib/all').BaseLogger;
const UsageLoggers = require('../lib/all').UsageLoggers;

/**
 * Tests against basic usage logger to embed or extend.
 */
describe('BaseLogger', () => {

    it('creates a valid object', () => {
        const logger = new BaseLogger();
        expect(logger).to.exist;
        expect(logger.constructor['name']).to.equal('BaseLogger');
    });

    it('manages multiple instances', () => {
        const agent1 = 'agent1';
        const agent2 = 'AGENT2';
        const agent3 = 'aGeNt3';
        const url1 = 'http://resurface.io';
        const url2 = 'http://whatever.com';
        const logger1 = new BaseLogger(agent1, url1);
        const logger2 = new BaseLogger(agent2, {url: url2});
        const logger3 = new BaseLogger(agent3, {url: 'DEMO'});

        expect(logger1.agent).to.equal(agent1);
        expect(logger1.enabled).to.be.true;
        expect(logger1.url).to.equal(url1);
        expect(logger2.agent).to.equal(agent2);
        expect(logger2.enabled).to.be.true;
        expect(logger2.url).to.equal(url2);
        expect(logger3.agent).to.equal(agent3);
        expect(logger3.enabled).to.be.true;
        expect(logger3.url).to.equal(UsageLoggers.urlForDemo());

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

    it('provides valid version', () => {
        const version = BaseLogger.version_lookup();
        expect(version).to.exist;
        expect(version).to.be.a('string');
        expect(version.length).to.be.above(0);
        expect(version).to.startsWith('1.0.');
        expect(version).not.to.contain('\\');
        expect(version).not.to.contain('\"');
        expect(version).not.to.contain('\'');
        const logger = new BaseLogger();
        expect(logger.version).to.equal(BaseLogger.version_lookup());
        expect(logger._version).to.equal(BaseLogger.version_lookup());
        expect(logger['version']).to.equal(BaseLogger.version_lookup());
        expect(logger['_version']).to.equal(BaseLogger.version_lookup());
    });

    it('performs enabling when expected', () => {
        let logger = new BaseLogger(MOCK_AGENT, {url: 'DEMO', enabled: false});
        expect(logger.enabled).to.be.false;
        expect(logger.url).to.equal(UsageLoggers.urlForDemo());
        logger.enable();
        expect(logger.enabled).to.be.true;

        logger = new BaseLogger(MOCK_AGENT, {url: UsageLoggers.urlForDemo(), enabled: true});
        expect(logger.enabled).to.be.true;
        expect(logger.url).to.equal(UsageLoggers.urlForDemo());
        logger.enable().disable().enable().disable().disable().disable().enable();
        expect(logger.enabled).to.be.true;

        logger = new BaseLogger(MOCK_AGENT, {queue: [], enabled: false});
        expect(logger.enabled).to.be.false;
        expect(logger.url).to.be.null;
        logger.enable().disable().enable();
        expect(logger.enabled).to.be.true;
    });

    it('skips enabling for invalid urls', () => {
        for (let i = 0; i < helper.URLS_INVALID.length; i++) {
            const logger = new BaseLogger(MOCK_AGENT, {url: helper.URLS_INVALID[i]});
            expect(logger.enabled).to.be.false;
            expect(logger.url).to.be.null;
            logger.enable();
            expect(logger.enabled).to.be.false;
        }
    });

    it('skips enabling for missing url', () => {
        const logger = new BaseLogger(MOCK_AGENT);
        expect(logger.enabled).to.be.false;
        expect(logger.url).to.be.null;
        logger.enable();
        expect(logger.enabled).to.be.false;
    });

    it('skips enabling for null url', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: null});
        expect(logger.enabled).to.be.false;
        expect(logger.url).to.be.null;
        logger.enable();
        expect(logger.enabled).to.be.false;
    });

    it('skips logging when disabled', () => {
        for (let i = 0; i < helper.URLS_DENIED.length; i++) {
            const logger = new BaseLogger(MOCK_AGENT, {url: helper.URLS_DENIED[i]}).disable();
            expect(logger.enabled).to.be.false;
            expect(logger.submit(null)).to.be.fulfilled.and.to.eventually.be.true;  // would fail if enabled
        }
    });

    it('submits to demo url', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: 'DEMO'});
        // todo use JsonMessage to format message
        return logger.submit('{}');
    });

    it('submits to demo url via http', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: UsageLoggers.urlForDemo().replace('https:', 'http:')});
        expect(logger.url).to.startsWith('http://');
        // todo use JsonMessage to format message
        return logger.submit('{}');
    });

    it('submits to denied url and fails', () => {
        for (let i = 0; i < helper.URLS_DENIED.length; i++) {
            const logger = new BaseLogger(MOCK_AGENT, {url: helper.URLS_DENIED[i]});
            expect(logger.enabled).to.be.true;
            expect(logger.submit('{}')).to.be.fulfilled.and.to.eventually.be.false;
        }
    });

    it('submits to queue', () => {
        let queue = [];
        const logger = new BaseLogger(MOCK_AGENT, {queue: queue, url: helper.URLS_DENIED[0]});
        expect(logger.url).to.be.null;
        expect(logger.enabled).to.be.true;
        expect(queue.length).to.equal(0);
        expect(logger.submit('{}')).to.be.fulfilled.and.to.eventually.be.true;
        expect(queue.length).to.equal(1);
        expect(logger.submit('{}')).to.be.fulfilled.and.to.eventually.be.true;
        expect(queue.length).to.equal(2);
    });

    it('silently ignores unexpected option classes', () => {
        let logger = new BaseLogger(MOCK_AGENT, {queue: new Set()});
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;

        logger = new BaseLogger(MOCK_AGENT, {queue: 'ASDF'});
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;

        logger = new BaseLogger(MOCK_AGENT, {url: []});
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;

        logger = new BaseLogger(MOCK_AGENT, []);
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;

        logger = new BaseLogger(MOCK_AGENT, new Set());
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;
    });

    it('silently ignores writes to agent', () => {
        const logger = new BaseLogger(MOCK_AGENT);
        logger._agent = '1234';
        logger['_agent'] = '1234';
        expect(logger.agent).to.equal(MOCK_AGENT);
        logger.agent = '1234';
        logger['agent'] = '1234';
        expect(logger.agent).to.equal(MOCK_AGENT);
    });

    it('silently ignores writes to enabled', () => {
        const logger = new BaseLogger();
        logger._enableable = true;
        logger['_enableable'] = true;
        logger['_enabled'] = true;
        logger._enabled = true;
        logger['_enabled'] = true;
        expect(logger.enabled).to.be.false;
    });

    it('silently ignores writes to queue', () => {
        let queue = [];
        const logger = new BaseLogger(MOCK_AGENT, {queue: queue});
        logger._queue = '1234';
        logger['_queue'] = '1234';
        expect(logger._queue).to.equal(queue);
    });

    it('silently ignores writes to url', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: UsageLoggers.urlForDemo()});
        logger._url = '1234';
        logger['_url'] = '1234';
        expect(logger.url).to.equal(UsageLoggers.urlForDemo());
        logger.url = '1234';
        logger['url'] = '1234';
        expect(logger.url).to.equal(UsageLoggers.urlForDemo());
    });

    it('silently ignores writes to version', () => {
        const logger = new BaseLogger();
        logger._version = 'X.Y.Z';
        logger['_version'] = 'X.Y.Z';
        expect(logger.version).to.equal(BaseLogger.version_lookup());
        logger.version = 'X.Y.Z';
        logger['version'] = 'X.Y.Z';
        expect(logger.version).to.equal(BaseLogger.version_lookup());
    });

});
