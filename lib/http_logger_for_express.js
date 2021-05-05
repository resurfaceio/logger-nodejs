// © 2016-2021 Resurface Labs Inc.

const HttpLogger = require('./http_logger');
const HttpMessage = require('./http_message');

const LIMIT = 1024 * 1024;

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
    Object.defineProperty(this, '_logger', {
      configurable: false,
      writable: false,
    });
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
  }

  /**
   * Logs the request/response from within middleware.
   */
  log(request, response, next) {
    const logger = this._logger;
    const started = HttpLogger.hrmillis;
    
    let body, stringified_chunk, overflowed = false, logged_bytes = 0;
    
    function wrapper(original_method, chunk, encoding, callback) {
      logged_bytes += (chunk instanceof Buffer || typeof chunk === 'string' || chunk instanceof String) ?
       Buffer.byteLength(chunk) : Buffer.byteLength(stringified_chunk =  JSON.stringify(chunk) || '');
      if (!overflowed) {
        if (logged_bytes > LIMIT) {
          overflowed = true;
          body = undefined;
        } else {
          if (chunk instanceof Buffer) {
            body = body === undefined ? chunk.toString() : body + chunk.toString();
          } else if (typeof chunk === 'string' || chunk instanceof String) {
            body = body === undefined ? chunk : body + chunk;
          } else {
            body = body === undefined ? stringified_chunk : body + stringified_chunk;
          }
        }
      }
      original_method.call(this, chunk, encoding, callback);
    }

    response.write = wrapper.bind(response, response.write);
    response.end = wrapper.bind(response, response.end);

    // declare event handler
    function afterResponse() {
      response.removeListener('finish', afterResponse);
      if (overflowed) body = `{"overflowed: ${logged_bytes}"}`;
      logged_bytes = 0;
      const now = Date.now().toString();
      const interval = (HttpLogger.hrmillis - started).toString();
      return HttpMessage.send(logger, request, response, body, undefined, now, interval);
    }

    // register event handler
    response.on('finish', afterResponse);

    next();
  }
}

module.exports = HttpLoggerForExpress;
