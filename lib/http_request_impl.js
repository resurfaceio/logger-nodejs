// © 2016-2017 Resurface Labs LLC

/**
 * Mock request implementation.
 */
class HttpRequestImpl {

    constructor() {
        this._headers = {};
        Object.defineProperty(this, '_headers', {configurable: false, writable: false});
    }

    addHeader(key, value) {
        if (typeof value !== 'undefined') {
            const existing = this._headers[key];
            if (typeof existing === 'undefined') {
                this._headers[key] = value;
            } else {
                this._headers[key] = `${existing}, ${value}`;
            }
        }
    }

    // todo add 'body' for parsed key-value pairs

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

    // todo add 'query' for URL key-value pairs

    get url() {
        return this._url;
    }

    set url(value) {
        this._url = value;
    }

}

module.exports = HttpRequestImpl;
