// © 2016-2017 Resurface Labs LLC

const HttpMessageImpl = require('./http_message_impl');

/**
 * Usage logger for HTTP/HTTPS protocol.
 */
class HttpLogger extends require('./base_logger') {

    /**
     * Agent string identifying this logger.
     * @return string
     */
    static get AGENT() {
        return 'http_logger.js';
    }

    /**
     * Returns true if content type indicates string data.
     */
    static isStringContentType(s) {
        if (s != undefined) {
            return (s.match(/^(text\/(html|plain|xml))|(application\/(json|soap|xml|x-www-form-urlencoded))/i) !== null);
        } else {
            return false;
        }
    }

    /**
     * Initialize a new logger.
     */
    constructor(options = {}) {
        super(HttpLogger.AGENT, options);
    }

    /**
     * Formats HTTP request and response as JSON message.
     */
    format(request, response, response_body = undefined, request_body = undefined, now = Date.now().toString()) {
        const message = HttpMessageImpl.build(request, response, response_body, request_body);
        message.push(['agent', this._agent]);
        message.push(['version', this._version]);
        message.push(['now', now]);
        return JSON.stringify(message);
    }

    /**
     * Logs HTTP request and response to intended destination.
     */
    log(request, response, response_body = undefined, request_body = undefined) {
        if (!this.enabled) {
            return new Promise((resolve, reject) => resolve(true));
        } else {
            return this.submit(this.format(request, response, response_body, request_body));
        }
    }

}

module.exports = HttpLogger;
