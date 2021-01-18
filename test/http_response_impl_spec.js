// © 2016-2021 Resurface Labs Inc.

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;

const HttpResponseImpl = require('../lib/all').HttpResponseImpl;

/**
 * Tests against mock response implementation.
 */
describe('HttpResponseImpl', () => {

    it('uses headers', () => {
        const key = '2345789';
        const key2 = 'jane fred';
        const val = 'bob';
        const val2 = 'swoosh';

        const r = new HttpResponseImpl();
        expect(Object.keys(r.headers).length).to.equal(0);
        expect(r.headers[key]).not.to.exist;

        r.headers[key] = val;
        expect(Object.keys(r.headers).length).to.equal(1);
        expect(r.headers[key]).to.equal(val);

        r.headers[key] = val2;
        expect(Object.keys(r.headers).length).to.equal(1);
        expect(r.headers[key]).to.equal(val2);

        r.addHeader(key, undefined);
        r.addHeader(key, null);
        expect(Object.keys(r.headers).length).to.equal(1);
        expect(r.headers[key]).to.equal(val2);

        r.addHeader(key, val);
        expect(Object.keys(r.headers).length).to.equal(1);
        expect(r.headers[key]).to.equal(`${val2}, ${val}`);

        r.headers[key2] = val2;
        expect(Object.keys(r.headers).length).to.equal(2);
        expect(r.headers[key2]).to.equal(val2);
        expect(r.headers[key2.toUpperCase()]).not.to.exist;
    });

    it('uses statusCode', () => {
        const val = '299';
        const r = new HttpResponseImpl();
        r.statusCode = val;
        expect(r.statusCode).to.equal(val);
    });

});
