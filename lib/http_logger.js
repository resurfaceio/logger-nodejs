// © 2016-2017 Resurface Labs LLC

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
     * Initialize a new logger.
     */
    constructor(options = {}) {
        super(HttpLogger.AGENT, options);
    }

    /**
     * Formats HTTP request and response as JSON message.
     */
    format(request, request_body, response, response_body, now = Date.now().toString()) {
        const message = [];
        message.push(['request_method', request.method]);
        message.push(['request_url', `${request.protocol}://${request.hostname}${request.url}`]);
        message.push(['response_code', `${response.statusCode}`]);
        // todo append request headers
        // todo append response headers
        // todo append request body
        // todo append response body
        message.push(['agent', this._agent]);
        message.push(['version', this._version]);
        message.push(['now', now]);
        return JSON.stringify(message);
    }

    /**
     * Logs HTTP request and response to intended destination.
     */
    log(request, request_body, response, response_body) {
        if (!this.enabled) {
            return new Promise((resolve, reject) => resolve(true));
        } else {
            return this.submit(this.format(request, request_body, response, response_body));
        }
    }

}

module.exports = HttpLogger;
