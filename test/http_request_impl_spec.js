// © 2016-2017 Resurface Labs LLC

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;

const HttpRequestImpl = require('../lib/all').HttpRequestImpl;

/**
 * Tests against mock request implementation.
 */
describe('HttpRequestImpl', () => {

    it('uses hostname', () => {
        const val = '!HOSTNAME!';
        const r = new HttpRequestImpl();
        r.hostname = val;
        expect(r.hostname).to.equal(val);
    });

    it('uses method', () => {
        const val = '!METHOD!';
        const r = new HttpRequestImpl();
        r.method = val;
        expect(r.method).to.equal(val);
    });

    it('uses protocol', () => {
        const val = '!PROTOCOL!';
        const r = new HttpRequestImpl();
        r.protocol = val;
        expect(r.protocol).to.equal(val);
    });

    it('uses url', () => {
        const val = '/index.html?boo=yah';
        const r = new HttpRequestImpl();
        r.url = val;
        expect(r.url).to.equal(val);
    });

});
