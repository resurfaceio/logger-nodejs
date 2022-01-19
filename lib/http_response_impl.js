// © 2016-2022 Resurface Labs Inc.

/**
 * Mock response implementation.
 */
class HttpResponseImpl {
  constructor() {
    this._headers = {};
    Object.defineProperty(this, '_headers', {
      configurable: false,
      writable: false,
    });
  }

  addHeader(key, value) {
    if (value) {
      const existing = this._headers[key];
      if (typeof existing === 'undefined') {
        this._headers[key] = value;
      } else {
        this._headers[key] = `${existing}, ${value}`;
      }
    }
  }

  get headers() {
    return this._headers;
  }

  get statusCode() {
    return this._statusCode;
  }

  set statusCode(value) {
    this._statusCode = value;
  }
}

module.exports = HttpResponseImpl;
