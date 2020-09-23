// Code Review - Chris Anderson 2020-09-24
// © 2016-2020 Resurface Labs Inc.

const fs = require('fs');

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
        this._rules = new HttpRules(options['rules']);

        // apply configuration rules
        this._skip_compression = this._rules.skip_compression;
        this._skip_submission = this._rules.skip_submission;
        if ((this._url != null) && (this._url.startsWith('http:')) && !this._rules.allow_http_url) {
            this._enableable = false;
            this._enabled = false;
        }

        // load schema if present
        const schema = options['schema'];
        const schema_exists = (typeof schema === 'string');
        if (schema_exists) {
            if (schema.startsWith('file://')) {
                const rfile = schema.substring(7).trim();
                try {
                    this._schema = fs.readFileSync(rfile).toString();
                } catch (e) {
                    throw new EvalError(`Failed to load schema: ${rfile}`);
                }
            } else {
                this._schema = schema;
            }
        } else {
            this._schema = null;
        }

        // mark immutable properties
        Object.defineProperty(this, '_enableable', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules', {configurable: false, writable: false});
        Object.defineProperty(this, '_schema', {configurable: false, writable: false});

        // submit metadata message
        if (this._enabled) {
            const details = [];
            details.push(['message_type', 'metadata']);
            details.push(['agent', this._agent]);
            details.push(['host', this._host]);
            details.push(['version', this._version]);
            details.push(['metadata_id', this._metadata_id]);
            if (schema_exists) details.push(['graphql_schema', this._schema]);
            this.submit(JSON.stringify(details)).then(() => {
                // logger now ready for use
            });
        }
    }

    /**
     * Returns rules specified when creating this logger.
     */
    get rules() {
        return this._rules;
    }

    /**
     * Returns schema specified when creating this logger.
     */
    get schema() {
        return this._schema;
    }

    /**
     * Returns promise to apply logging rules to message details and submit JSON message.
     */
    submit_if_passing(details) {
        return new Promise((resolve, reject) => {
            try {
                details = this._rules.apply(details);
                if (details == null) return null;
                details.push(['metadata_id', this._metadata_id]);
                return this.submit(JSON.stringify(details));
            } catch (e) {
                resolve(true);
            }
        });
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
}

module.exports = HttpLogger;
