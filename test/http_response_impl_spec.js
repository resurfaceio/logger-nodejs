// © 2016-2017 Resurface Labs LLC

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
const expect = chai.expect;
const helper = require('./helper');

const HttpResponseImpl = require('../lib/all').HttpResponseImpl;

/**
 * Tests against mock response implementation.
 */
describe('HttpResponseImpl', () => {

    it('uses statusCode', () => {
        const val = '299';
        const r = new HttpResponseImpl();
        r.statusCode = val;
        expect(r.statusCode).to.equal(val);
    });

});
