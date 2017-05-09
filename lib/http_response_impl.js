// © 2016-2017 Resurface Labs LLC

/**
 * Mock response implementation.
 */
class HttpResponseImpl {

    get statusCode() {
        return this._statusCode;
    }

    set statusCode(value) {
        this._statusCode = value;
    }

}

module.exports = HttpResponseImpl;
