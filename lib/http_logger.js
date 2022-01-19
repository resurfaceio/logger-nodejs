// © 2016-2022 Resurface Labs Inc.

const HttpRules = require('./http_rules');

/**
 * Usage logger for HTTP/HTTPS protocol.
 */
class HttpLogger extends require('./base_logger') {
  /**
   * Agent string identifying this logger.
   */
  static get AGENT() {
    return 'http_logger.js';
  }

  /**
   * Initialize a new logger.
   */
  constructor(options = {}) {
    super(HttpLogger.AGENT, options);

    // parse specified rules
    this._rules = new HttpRules(options.rules);

    // apply configuration rules
    this._skip_compression = this._rules.skip_compression;
    this._skip_submission = this._rules.skip_submission;
    if (this._url !== null && this._url.startsWith('http:') && !this._rules.allow_http_url) {
      this._enableable = false;
      this._enabled = false;
    }

    // mark immutable properties
    Object.defineProperty(this, '_enableable', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, '_rules', {
      configurable: false,
      writable: false,
    });
  }

  /**
   * Returns rules specified when creating this logger.
   */
  get rules() {
    return this._rules;
  }

  /**
   * Returns promise to apply logging rules to message details and submit JSON message.
   */
  submit_if_passing(details, custom_fields) {
    return new Promise((resolve) => {
      try {
        // apply active rules
        const _details = this._rules.apply(details);
        if (_details == null) return null;

        // add custom fields
        if (custom_fields && typeof custom_fields === 'object') {
          for (const key in custom_fields) {
            _details.push([key, custom_fields[key]]);
          }
        }

        // finalize message
        _details.push(['host', this._host]);

        // let's do this thing
        return this.submit(JSON.stringify(_details));
      } catch (e) {
        resolve(true);
        return false;
      }
    });
  }
}

module.exports = HttpLogger;
