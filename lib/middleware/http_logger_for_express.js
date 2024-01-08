// © 2016-2024 Graylog, Inc.

const HttpLogger = require('../http_logger');
const HttpMessage = require('../http_message');
const WriterWrapper = require('../logged_response_wrapper');

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
    const wrapped = new WriterWrapper(response);

    // declare event handler
    function afterResponse() {
      response.removeListener('finish', afterResponse);
      const now = Date.now().toString();
      const interval = (HttpLogger.hrmillis - started).toString();
      return HttpMessage.send(logger, request, response, wrapped.logged(), undefined, now, interval);
    }

    // register event handler
    response.on('finish', afterResponse);

    next();
  }
}

module.exports = HttpLoggerForExpress;
