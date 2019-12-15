// © 2016-2019 Resurface Labs Inc.

const HttpLogger = require('./http_logger');
const HttpMessage = require('./http_message');

/**
 * Express middleware for HTTP usage logging.
 */
class HttpLoggerForExpress {

    /**
     * Add new logger to the specified Express app.
     */
    static add(app, options = {}) {
        app.use(this.build(options));
    }

    /**
     * Builds and initializes logger as Express middleware.
     */
    static build(options = {}) {
        const logger = new HttpLoggerForExpress(options);
        return logger.handle.bind(logger);
    }

    /**
     * Initialize a new logger with specified options.
     */
    constructor(options = {}) {
        this._logger = new HttpLogger(options);
        Object.defineProperty(this, '_logger', {configurable: false, writable: false});
    }

    /**
     * Returns wrapped logger instance.
     */
    get logger() {
        return this._logger;
    }

    /**
     * Called when request/response is passed through middleware.
     */
    handle(request, response, next) {
        if (this._logger.enabled) {
            this.log(request, response, next);
        } else {
            next();
        }
    };

    /**
     * Logs the request/response from within middleware.
     */
    log(request, response, next) {
        let body = undefined;
        const logger = this._logger;
        const started = logger.hrmillis;

        // wrap send method
        const original_send = response.send;
        response.send = function sendAndLog(response_body) {
            body = response_body;
            original_send.call(this, response_body);
        };

        // wrap json method
        const original_json = response.json;
        response.json = function jsonAndLog(response_body) {
            body = response_body;
            original_json.call(this, response_body);
        };

        // wrap jsonp method
        const original_jsonp = response.jsonp;
        response.jsonp = function jsonpAndLog(response_body) {
            body = response_body;
            original_jsonp.call(this, response_body);
        };

        // wrap write method
        const original_write = response.write;
        response.write = function writeAndLog(chunk, encoding, callback) {
            if (chunk instanceof Buffer) {
                body = (body == undefined) ? chunk.toString() : body + chunk.toString();
            } else if (typeof chunk === 'string' || chunk instanceof String) {
                body = (body == undefined) ? chunk : body + chunk;
            } else {
                body = (body == undefined) ? JSON.stringify(body) : body + JSON.stringify(body);
            }
            original_write.call(this, chunk, encoding, callback);
        };

        // declare event handler
        function afterResponse() {
            response.removeListener('finish', afterResponse);
            const status = response.statusCode;
            if (status < 300 || status === 302) {
                const headers = ('headers' in response) ? response.headers : response._headers;
                if ((headers != undefined) && HttpLogger.isStringContentType(headers['content-type'])) {
                    const now = Date.now().toString();
                    const interval = (logger.hrmillis - started).toString();
                    return HttpMessage.send(logger, request, response, body, undefined, now, interval);
                }
            }
        }

        // register event handler
        response.on('finish', afterResponse);

        next();
    }

}

module.exports = HttpLoggerForExpress;
