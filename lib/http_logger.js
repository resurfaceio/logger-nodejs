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
        if (typeof request.method !== 'undefined') message.push(['request_method', request.method]);
        if ((typeof request.hostname !== 'undefined') && (typeof request.protocol !== 'undefined')
            && (typeof request.url !== 'undefined')) {
            message.push(['request_url', `${request.protocol}://${request.hostname}${request.url}`]);
        }
        if (typeof response.statusCode !== 'undefined') message.push(['response_code', `${response.statusCode}`]);
        HttpLogger.append_request_headers(message, request);
        HttpLogger.append_response_headers(message, response);
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

    /**
     * Adds request headers to message.
     */
    static append_request_headers(message, request) {
        const headers = ('headers' in request) ? request.headers : request._headers;
        if (typeof headers !== 'undefined') {
            for (let key of Object.keys(headers)) {
                message.push([`request_header.${key.toLowerCase()}`, headers[key]]);
            }
        }
    }

    /**
     * Adds response headers to message.
     */
    static append_response_headers(message, response) {
        const headers = ('headers' in response) ? response.headers : response._headers;
        if (typeof headers !== 'undefined') {
            for (let key of Object.keys(headers)) {
                message.push([`response_header.${key.toLowerCase()}`, headers[key]]);
            }
        }
    }

}

module.exports = HttpLogger;
