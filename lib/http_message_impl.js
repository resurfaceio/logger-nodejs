// © 2016-2017 Resurface Labs LLC

/**
 * Message implementation for HTTP/HTTPS protocol.
 */
class HttpMessageImpl {

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
        HttpMessageImpl.appendRequestHeaders(message, request);
        HttpMessageImpl.appendRequestParams(message, request);
        HttpMessageImpl.appendResponseHeaders(message, response);
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
                message.push([`response_header:${key.toLowerCase()}`, headers[key]]);
            }
        }
    }

}

module.exports = HttpMessageImpl;
