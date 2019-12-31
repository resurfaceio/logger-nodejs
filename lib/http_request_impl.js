// © 2016-2020 Resurface Labs Inc.

/**
 * Mock request implementation.
 */
class HttpRequestImpl {

    constructor() {
        this._body = {};
        this._headers = {};
        this._query = {};
        this._session = {};
        Object.defineProperty(this, '_body', {configurable: false, writable: false});
        Object.defineProperty(this, '_headers', {configurable: false, writable: false});
        Object.defineProperty(this, '_query', {configurable: false, writable: false});
        Object.defineProperty(this, '_session', {configurable: false, writable: false});
    }

    addHeader(key, value) {
        if (value != undefined) {
            const existing = this._headers[key];
            if (typeof existing === 'undefined') {
                this._headers[key] = value;
            } else {
                this._headers[key] = `${existing}, ${value}`;
            }
        }
    }

    addQueryParam(key, value) {
        if (value != undefined) {
            const existing = this._query[key];
            if (typeof existing === 'undefined') {
                this._query[key] = value;
            } else {
                this._query[key] = `${existing}, ${value}`;
            }
        }
    }

    get body() {
        return this._body;
    }

    get headers() {
        return this._headers;
    }

    get hostname() {
        return this._hostname;
    }

    set hostname(value) {
        this._hostname = value;
    }

    get method() {
        return this._method;
    }

    set method(value) {
        this._method = value;
    }

    get protocol() {
        return this._protocol;
    }

    set protocol(value) {
        this._protocol = value;
    }

    get query() {
        return this._query;
    }

    get session() {
        return this._session;
    }

    get url() {
        return this._url;
    }

    set url(value) {
        this._url = value;
    }

}

module.exports = HttpRequestImpl;
