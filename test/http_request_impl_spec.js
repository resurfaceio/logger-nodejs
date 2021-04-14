// © 2016-2021 Resurface Labs Inc.

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));

const {expect} = chai;

const {HttpRequestImpl} = require('../lib/all');

/**
 * Tests against mock request implementation.
 */
describe('HttpRequestImpl', () => {
  it('uses body', () => {
    const key = '3456';
    const key2 = 'egret';
    const val = 'u-turn!';
    const val2 = 'swell?';

    const r = new HttpRequestImpl();
    expect(Object.keys(r.body).length).to.equal(0);
    expect(r.body[key]).not.to.exist;

    r.body[key] = val;
    expect(Object.keys(r.body).length).to.equal(1);
    expect(r.body[key]).to.equal(val);

    r.body[key] = val2;
    expect(Object.keys(r.body).length).to.equal(1);
    expect(r.body[key]).to.equal(val2);

    r.body[key2] = val2;
    expect(Object.keys(r.body).length).to.equal(2);
    expect(r.body[key2]).to.equal(val2);
    expect(r.body[key2.toUpperCase()]).not.to.exist;
  });

  it('uses headers', () => {
    const key = '2345';
    const key2 = 'fish';
    const val = 'u-turn';
    const val2 = 'swell';

    const r = new HttpRequestImpl();
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

  it('uses query', () => {
    const key = '4567';
    const key2 = 'gracious';
    const val = 'forever-more';
    const val2 = 'carson';

    const r = new HttpRequestImpl();
    expect(Object.keys(r.query).length).to.equal(0);
    expect(r.query[key]).not.to.exist;

    r.query[key] = val;
    expect(Object.keys(r.query).length).to.equal(1);
    expect(r.query[key]).to.equal(val);

    r.query[key] = val2;
    expect(Object.keys(r.query).length).to.equal(1);
    expect(r.query[key]).to.equal(val2);

    r.query[key2] = val2;
    expect(Object.keys(r.query).length).to.equal(2);
    expect(r.query[key2]).to.equal(val2);
    expect(r.query[key2.toUpperCase()]).not.to.exist;
  });

  it('uses url', () => {
    const val = '/index.html?boo=yah';
    const r = new HttpRequestImpl();
    r.url = val;
    expect(r.url).to.equal(val);
  });
});
