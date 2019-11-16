// © 2016-2019 Resurface Labs Inc.

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
     * Initialize a new logger.
     */
    constructor(options = {}) {
        super(HttpLogger.AGENT, options);

        // parse specified rules
        this._parsed_rules = new HttpRules(options['rules']);

        // apply configuration rules
        this._skip_compression = this._parsed_rules.skip_compression;
        this._skip_submission = this._parsed_rules.skip_submission;
        if ((this._url != null) && (this._url.startsWith('http:')) && !this._parsed_rules.rules_allow_http_url) {
            this._enableable = false;
            this._enabled = false;
        }

        // mark immutable properties
        Object.defineProperty(this, '_enableable', {configurable: false, writable: false});
        Object.defineProperty(this, '_parsed_rules', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules', {configurable: false, writable: false});
    }

    /**
     * Returns parsed rules built when this logger was created.
     */
    get parsed_rules() {
        return this._parsed_rules;
    }

    /**
     * Returns rules specified when creating this logger.
     */
    get rules() {
        return this._parsed_rules.rules;
    }

}

module.exports = HttpLogger;
