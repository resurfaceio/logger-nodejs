// © 2016-2017 Resurface Labs LLC

const HttpLogger = require('../lib/all').HttpLogger;
const UsageLoggers = require('../lib/all').UsageLoggers;

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-string'));
const helper = require('./helper');

/**
 * Tests against usage logger for HTTP/HTTPS protocol.
 */
describe('HttpLogger', () => {

    it('creates a valid object', () => {
        const logger = new HttpLogger();
        expect(logger).to.exist;
        expect(logger.constructor['name']).to.equal('HttpLogger');
    });

    it('manages multiple instances', () => {
        const url1 = 'http://resurface.io';
        const url2 = 'http://whatever.com';
        const logger1 = new HttpLogger({url: url1});
        const logger2 = new HttpLogger({url: url2});
        const logger3 = new HttpLogger({url: 'DEMO'});

        expect(logger1.agent).to.equal(HttpLogger.AGENT);
        expect(logger1.enabled).to.be.true;
        expect(logger1.url).to.equal(url1);
        expect(logger2.agent).to.equal(HttpLogger.AGENT);
        expect(logger2.enabled).to.be.true;
        expect(logger2.url).to.equal(url2);
        expect(logger3.agent).to.equal(HttpLogger.AGENT);
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

    it('provides valid agent', () => {
        const agent = HttpLogger.AGENT;
        expect(agent).to.exist;
        expect(agent).to.be.a('string');
        expect(agent.length).to.be.above(0);
        expect(agent).to.endsWith('.js');
        expect(agent.indexOf('\\')).to.be.below(0);
        expect(agent.indexOf('\"')).to.be.below(0);
        expect(agent.indexOf('\'')).to.be.below(0);
        expect(new HttpLogger().agent).to.equal(agent);
    });

    it('skips logging when disabled', () => {
        for (let i = 0; i < helper.URLS_DENIED.length; i++) {
            const logger = new HttpLogger({url: helper.URLS_DENIED[i]}).disable();
            expect(logger.enabled).to.be.false;
            expect(logger.submit(null)).to.be.true;  // would fail if enabled
            // todo convert submit() to log() above
        }
    });

});
