// © 2016-2019 Resurface Labs Inc.

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;

const helper = require('./helper');
const DEMO_URL = helper.DEMO_URL;
const MOCK_AGENT = helper.MOCK_AGENT;
const MOCK_NOW = helper.MOCK_NOW;
const parseable = helper.parseable;

const resurfaceio = require('../lib/all');
const BaseLogger = resurfaceio.BaseLogger;
const UsageLoggers = resurfaceio.UsageLoggers;

/**
 * Tests against basic usage logger to embed or extend.
 */
describe('BaseLogger', () => {

    it('creates instance', () => {
        const logger = new BaseLogger(MOCK_AGENT);
        expect(logger).to.exist;
        expect(logger.agent).to.equal(MOCK_AGENT);
        expect(logger.constructor['name']).to.equal('BaseLogger');
        expect(logger.enableable).to.be.false;
        expect(logger.enabled).to.be.false;
    });

    it('creates multiple instances', () => {
        const agent1 = 'agent1';
        const agent2 = 'AGENT2';
        const agent3 = 'aGeNt3';
        const url1 = 'http://resurface.io';
        const url2 = 'http://whatever.com';
        const logger1 = new BaseLogger(agent1, url1);
        const logger2 = new BaseLogger(agent2, {url: url2});
        const logger3 = new BaseLogger(agent3, {url: DEMO_URL});

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

    it('has valid version', () => {
        const version = BaseLogger.version_lookup();
        expect(version).to.exist;
        expect(version).to.be.a('string');
        expect(version.length).to.be.above(0);
        expect(version).to.startsWith('1.9.');
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
        let logger = new BaseLogger(MOCK_AGENT, {url: DEMO_URL, enabled: false});
        expect(logger.enableable).to.be.true;
        expect(logger.enabled).to.be.false;
        expect(logger.url).to.equal(DEMO_URL);
        logger.enable();
        expect(logger.enabled).to.be.true;

        logger = new BaseLogger(MOCK_AGENT, {queue: [], enabled: false});
        expect(logger.enableable).to.be.true;
        expect(logger.enabled).to.be.false;
        expect(logger.url).to.be.null;
        logger.enable().disable().enable();
        expect(logger.enabled).to.be.true;
    });

    it('skips enabling for invalid urls', () => {
        for (let url of helper.MOCK_URLS_INVALID) {
            const logger = new BaseLogger(MOCK_AGENT, {url: url});
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
        const logger = new BaseLogger(MOCK_AGENT, {url: null});
        expect(logger.enableable).to.be.false;
        expect(logger.enabled).to.be.false;
        expect(logger.url).to.be.null;
        logger.enable();
        expect(logger.enabled).to.be.false;
    });

    it('skips enabling for undefined url', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: undefined});
        expect(logger.enableable).to.be.false;
        expect(logger.enabled).to.be.false;
        expect(logger.url).to.be.null;
        logger.enable();
        expect(logger.enabled).to.be.false;
    });

    it('skips logging when disabled', () => {
        for (let url of helper.MOCK_URLS_DENIED) {
            const logger = new BaseLogger(MOCK_AGENT, {url: url}).disable();
            expect(logger.enableable).to.be.true;
            expect(logger.enabled).to.be.false;
            expect(logger.submit(null)).to.be.fulfilled;  // would be rejected if enabled
        }
    });

    it('submits to demo url', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: DEMO_URL});
        const message = [
            ['agent', logger.agent],
            ['version', logger.version],
            ['now', MOCK_NOW],
            ['protocol', 'https']
        ];
        const json = JSON.stringify(message);
        expect(parseable(json)).to.be.true;
        return logger.submit(json);
    });

    it('submits to demo url via http', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: DEMO_URL.replace('https://', 'http://')});
        expect(logger.url).to.startsWith('http://');
        const message = [
            ['agent', logger.agent],
            ['version', logger.version],
            ['now', MOCK_NOW],
            ['protocol', 'http']
        ];
        const json = JSON.stringify(message);
        expect(parseable(json)).to.be.true;
        return logger.submit(json);
    });

    it('submits to demo url without compression', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: DEMO_URL});
        logger.skip_compression = true;
        expect(logger.skip_compression).to.be.true;
        const message = [
            ['agent', logger.agent],
            ['version', logger.version],
            ['now', MOCK_NOW],
            ['protocol', 'https'],
            ['skip_compression', 'true']
        ];
        const json = JSON.stringify(message);
        expect(parseable(json)).to.be.true;
        return logger.submit(json);
    });

    it('submits to denied url and fails', () => {
        for (let url of helper.MOCK_URLS_DENIED) {
            const logger = new BaseLogger(MOCK_AGENT, {url: url});
            expect(logger.enableable).to.be.true;
            expect(logger.enabled).to.be.true;
            expect(logger.submit('{}')).to.be.rejected;
        }
    });

    it('submits to queue', () => {
        let queue = [];
        const logger = new BaseLogger(MOCK_AGENT, {queue: queue, url: helper.MOCK_URLS_DENIED[0]});
        expect(logger.url).to.be.null;
        expect(logger.enableable).to.be.true;
        expect(logger.enabled).to.be.true;
        expect(queue.length).to.equal(0);
        expect(logger.submit('{}')).to.be.fulfilled;
        expect(queue.length).to.equal(1);
        expect(logger.submit('{}')).to.be.fulfilled;
        expect(queue.length).to.equal(2);
    });

    it('silently ignores unexpected option classes', () => {
        let logger = new BaseLogger(MOCK_AGENT, {queue: new Set()});
        expect(logger.enableable).to.be.false;
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;

        logger = new BaseLogger(MOCK_AGENT, {queue: 'ASDF'});
        expect(logger.enableable).to.be.false;
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;

        logger = new BaseLogger(MOCK_AGENT, {url: []});
        expect(logger.enableable).to.be.false;
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;

        logger = new BaseLogger(MOCK_AGENT, []);
        expect(logger.enableable).to.be.false;
        expect(logger.enabled).to.be.false;
        expect(logger._queue).to.be.null;
        expect(logger.url).to.be.null;

        logger = new BaseLogger(MOCK_AGENT, new Set());
        expect(logger.enableable).to.be.false;
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

    it('silently ignores writes to queue', () => {
        let queue = [];
        const logger = new BaseLogger(MOCK_AGENT, {queue: queue});
        logger._queue = '1234';
        logger['_queue'] = '1234';
        expect(logger._queue).to.equal(queue);
    });

    it('silently ignores writes to url', () => {
        const logger = new BaseLogger(MOCK_AGENT, {url: DEMO_URL});
        logger._url = '1234';
        logger['_url'] = '1234';
        expect(logger.url).to.equal(DEMO_URL);
        logger.url = '1234';
        logger['url'] = '1234';
        expect(logger.url).to.equal(DEMO_URL);
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
