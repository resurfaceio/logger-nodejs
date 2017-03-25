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
     * Initialize logger.
     */
    constructor(options = {}) {
        super(HttpLogger.AGENT, options);
    }

    /**
     * Appends HTTP request and response at the end of the supplied JSON buffer.
     */
    append_to_buffer(json, now, request, response) {
        let message = super.message('http', now);
        message.request_method = request.method;
        message.request_url = `${request.protocol}://${request.hostname}${request.url}`;
        message.response_code = `${response.statusCode}`;
        json += JSON.stringify(message);
        return json;
    }

}

module.exports = HttpLogger;
