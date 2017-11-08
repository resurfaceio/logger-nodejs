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
        if (request.method != undefined) message.push(['request_method', request.method]);
        if ((request.hostname != undefined) && (request.protocol != undefined) && (request.url != undefined)) {
            message.push(['request_url', `${request.protocol}://${request.hostname}${request.url}`]);
        }
        if (response.statusCode != undefined) message.push(['response_code', `${response.statusCode}`]);
        HttpLogger.appendRequestHeaders(message, request);
        HttpLogger.appendRequestParams(message, request);
        HttpLogger.appendResponseHeaders(message, response);
        if (request_body != undefined && request_body !== '') message.push(['request_body', request_body]);
        if (response_body != undefined && response_body !== '') message.push(['response_body', response_body]);
        message.push(['agent', this._agent]);
        message.push(['version', this._version]);
        message.push(['now', now]);
        return JSON.stringify(message);
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
    static appendRequestHeaders(message, request) {
        const headers = ('headers' in request) ? request.headers : request._headers;
        if (headers != undefined) {
            for (let key of Object.keys(headers)) {
                message.push([`request_header.${key.toLowerCase()}`, headers[key]]);
            }
        }
    }

    /**
     * Adds request params to message.
     */
    static appendRequestParams(message, request) {
        const body = request.body;
        if (body != undefined) {
            for (const key in body) {
                if (body.hasOwnProperty(key)) {
                    message.push([`request_param.${key.toLowerCase()}`, body[key]]);
                }
            }
        }
        const query = request.query;
        if (query != undefined) {
            for (const key in query) {
                if (query.hasOwnProperty(key)) {
                    message.push([`request_param.${key.toLowerCase()}`, query[key]]);
                }
            }
        }
    }

    /**
     * Adds response headers to message.
     */
    static appendResponseHeaders(message, response) {
        const headers = ('headers' in response) ? response.headers : response._headers;
        if (headers != undefined) {
            for (let key of Object.keys(headers)) {
                message.push([`response_header.${key.toLowerCase()}`, headers[key]]);
            }
        }
    }

}

module.exports = HttpLogger;
