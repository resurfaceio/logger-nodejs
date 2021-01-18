// © 2016-2021 Resurface Labs Inc.

const util = require('util');

/**
 * Message formatter for HTTP logger.
 */
class HttpMessage {

    /**
     * Returns promise to submit request and response through logger.
     */
    static send(logger, request, response, response_body = undefined, request_body = undefined,
                now = undefined, interval = undefined) {

        if (!logger.enabled) return new Promise((resolve, reject) => resolve(true));

        // copy details from request & response
        let message = HttpMessage.build(request, response, response_body, request_body);

        // copy details from active session
        if (!logger.rules.copy_session_field.empty) {
            const ssn = request.session;
            if (ssn != null)
                for (let r of logger.rules.copy_session_field)
                    for (let d0 in ssn)
                        if (d0.match(r.param1)) {
                            const d1 = ssn[d0];
                            message.push([`session_field:${d0}`, (typeof d1 === 'string') ? d1 : util.inspect(d1)]);
                        }
        }

        // add timing details
        message.push(['now', now != undefined ? now : Date.now().toString()]);
        if (interval != undefined) message.push(['interval', interval]);

        return logger.submit_if_passing(message);
    }

    /**
     * Builds list of key/value pairs for HTTP request and response.
     */
    static build(request, response, response_body = undefined, request_body = undefined) {
        const message = [];
        if (request.method != undefined) message.push(['request_method', request.method]);
        if ((request.hostname != undefined) && (request.protocol != undefined) && (request.url != undefined)) {
            message.push(['request_url', `${request.protocol}://${request.hostname}${request.url}`]);
        }
        if (response.statusCode != undefined) message.push(['response_code', `${response.statusCode}`]);
        this.appendRequestHeaders(message, request);
        this.appendRequestParams(message, request);
        this.appendResponseHeaders(message, response);
        if (request_body != undefined && request_body !== '') message.push(['request_body', request_body]);
        if (response_body != undefined && response_body !== '') message.push(['response_body', response_body]);
        return message;
    }

    /**
     * Adds request headers to message.
     */
    static appendRequestHeaders(message, request) {
        const headers = ('headers' in request) ? request.headers : request._headers;
        if (headers != undefined) {
            for (let key of Object.keys(headers)) {
                message.push([`request_header:${key.toLowerCase()}`, headers[key]]);
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
                    message.push([`request_param:${key.toLowerCase()}`, body[key]]);
                }
            }
        }
        const query = request.query;
        if (query != undefined) {
            for (const key in query) {
                if (query.hasOwnProperty(key)) {
                    message.push([`request_param:${key.toLowerCase()}`, query[key]]);
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
                let value = headers[key];
                if (Array.isArray(value)) value = value.join('');
                message.push([`response_header:${key.toLowerCase()}`, value]);
            }
        }
    }

}

module.exports = HttpMessage;
