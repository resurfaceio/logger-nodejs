// © 2016-2021 Resurface Labs Inc.

const HttpLogger = require('./http_logger');
const HttpMessage = require('./http_message');

/**
 * Koa middleware for HTTP usage logging.
 */
class HttpLoggerForKoa {
  /**
   * Add new logger to the specified Koa app.
   */
  static add(app, options = {}) {
    app.use(this.build(options));
  }

  /**
   * Builds and initializes logger as Express middleware.
   */
  static build(options = {}) {
    const logger = new HttpLoggerForKoa(options);
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
  async handle(ctx, next) {
    ctx.started = this._logger.hrmillis;
    if (this._logger.enabled) {
      this.log(ctx);
    }
    await next();
  }

  /**
   * Logs the request/response from within middleware.
   */
  log(ctx) {
    const logger = this._logger;

    // declare event handler
    function afterResponse() {
      ctx.res.removeListener('finish', afterResponse);
      ctx.response.statusCode = ctx.status;
      let body;
      if (ctx.body && ctx.body instanceof Buffer) {
        body = ctx.body.toString();
      } else if (ctx.body && (typeof ctx.body === 'string' || ctx.body instanceof String)) {
        body = ctx.body;
      } else {
        body = JSON.stringify(ctx.body);
      }
      const now = Date.now().toString();
      const interval = (logger.hrmillis - ctx.started).toString();
      return HttpMessage.send(logger, ctx.request, ctx.response, body, undefined, now, interval);
    }

    // register event handler
    ctx.res.on('finish', afterResponse);
  }
}

module.exports = HttpLoggerForKoa;
