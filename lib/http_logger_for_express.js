// © 2016-2019 Resurface Labs Inc.

const HttpLogger = require('./http_logger');

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
        const original_send = response.send;
        response.send = function sendAndLog(response_body) {
            original_send.call(this, response_body);
            body = response_body;
        };

        next();

        const status = response.statusCode;
        if (status < 300 || status === 302) {
            const headers = ('headers' in response) ? response.headers : response._headers;
            if (headers != undefined) {
                if (HttpLogger.isStringContentType(headers['content-type'])) {
                    if (body instanceof Buffer) {
                        this._logger.submit(this._logger.format(request, response, body.toString()));
                    } else if (typeof body === 'string' || body instanceof String) {
                        this._logger.submit(this._logger.format(request, response, body));
                    } else {
                        this._logger.submit(this._logger.format(request, response, JSON.stringify(body)));
                    }
                }
            }
        }
    }

}

module.exports = HttpLoggerForExpress;
