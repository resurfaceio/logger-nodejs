// © 2016-2017 Resurface Labs LLC

/**
 * Mock request implementation.
 */
class HttpRequestImpl {

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

    get url() {
        return this._url;
    }

    set url(value) {
        this._url = value;
    }

}

module.exports = HttpRequestImpl;
