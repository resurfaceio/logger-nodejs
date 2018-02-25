// © 2016-2018 Resurface Labs LLC

const HttpMessage = require('./http_message');
const HttpRules = require('./http_rules');
const util = require('util');

let _defaultRules = HttpRules.strictRules;

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
     * Returns rules used by default when none are declared.
     */
    static get defaultRules() {
        return _defaultRules;
    }

    /**
     * Updates rules used by default when none are declared.
     */
    static set defaultRules(value) {
        _defaultRules = value.replace(/^\s*include default\s*$/gm, '');
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

        // read rules from param or defaults
        const rules = options['rules'];
        const rules_exist = (typeof rules === 'string');
        if (rules_exist) {
            this._rules = rules.replace(/^\s*include default\s*$/gm, _defaultRules);
        } else {
            this._rules = _defaultRules;
        }

        // parse and break out rules by verb
        let prs = HttpRules.parse(this._rules);
        this._rules_allow_http_url = prs.filter(r => 'allow_http_url' === r.verb).length > 0;
        this._rules_copy_session_field = prs.filter(r => 'copy_session_field' === r.verb);
        this._rules_remove = prs.filter(r => 'remove' === r.verb);
        this._rules_remove_if = prs.filter(r => 'remove_if' === r.verb);
        this._rules_remove_if_found = prs.filter(r => 'remove_if_found' === r.verb);
        this._rules_remove_unless = prs.filter(r => 'remove_unless' === r.verb);
        this._rules_remove_unless_found = prs.filter(r => 'remove_unless_found' === r.verb);
        this._rules_replace = prs.filter(r => 'replace' === r.verb);
        this._rules_sample = prs.filter(r => 'sample' === r.verb);
        this._rules_stop = prs.filter(r => 'stop' === r.verb);
        this._rules_stop_if = prs.filter(r => 'stop_if' === r.verb);
        this._rules_stop_if_found = prs.filter(r => 'stop_if_found' === r.verb);
        this._rules_stop_unless = prs.filter(r => 'stop_unless' === r.verb);
        this._rules_stop_unless_found = prs.filter(r => 'stop_unless_found' === r.verb);
        this._skip_compression = prs.filter(r => 'skip_compression' === r.verb).length > 0;
        this._skip_submission = prs.filter(r => 'skip_submission' === r.verb).length > 0;

        // finish validating rules
        if (this._rules_sample.length > 1) throw new EvalError('Multiple sample rules');
        if ((this._url != null) && (this._url.startsWith('http:')) && !this._rules_allow_http_url) {
            this._enableable = false;
            this._enabled = false;
        }

        // mark immutable properties
        Object.defineProperty(this, '_enableable', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_allow_http_url', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_copy_session_field', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_remove', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_remove_if', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_remove_if_found', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_remove_unless', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_remove_unless_found', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_replace', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_sample', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_stop', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_stop_if', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_stop_if_found', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_stop_unless', {configurable: false, writable: false});
        Object.defineProperty(this, '_rules_stop_unless_found', {configurable: false, writable: false});
    }

    /**
     * Returns rules specified when creating this logger.
     */
    get rules() {
        return this._rules;
    }

    /**
     * Logs HTTP request and response to intended destination.
     */
    log(request, response, response_body = undefined, request_body = undefined) {
        if (!this.enabled) {
            return new Promise((resolve, reject) => resolve(true));
        } else {
            return this.submit(this.format(request, response, response_body, request_body));
        }
    }

    /**
     * Formats HTTP request and response as JSON message.
     */
    format(request, response, response_body = undefined, request_body = undefined, now = Date.now().toString()) {
        let details = HttpMessage.build(request, response, response_body, request_body);

        // copy data from session if configured
        if (!this._rules_copy_session_field.empty) {
            const ssn = request.session;
            if (ssn != null)
                for (let r of this._rules_copy_session_field)
                    for (let d0 in ssn)
                        if (d0.match(r.param1)) {
                            const d1 = ssn[d0];
                            details.push([`session_field:${d0}`, (typeof d1 === 'string') ? d1 : util.inspect(d1)]);
                        }
        }

        // quit early based on stop rules if configured
        for (let r of this._rules_stop)
            for (let d of details)
                if (d[0].match(r.scope)) return null;
        for (let r of this._rules_stop_if_found)
            for (let d of details)
                if (d[0].match(r.scope) && d[1].match(r.param1)) return null;
        for (let r of this._rules_stop_if)
            for (let d of details)
                if (d[0].match(r.scope) && d[1].match(r.param1)) return null;
        let passed = 0;
        for (let r of this._rules_stop_unless_found)
            for (let d of details)
                if (d[0].match(r.scope) && d[1].match(r.param1)) passed++;
        if (passed !== this._rules_stop_unless_found.length) return null;
        passed = 0;
        for (let r of this._rules_stop_unless)
            for (let d of details)
                if (d[0].match(r.scope) && d[1].match(r.param1)) passed++;
        if (passed !== this._rules_stop_unless.length) return null;

        // do sampling if configured
        if ((this._rules_sample.length === 1) && (Math.random() * 100 >= this._rules_sample[0].param1)) return null;

        // winnow sensitive details based on remove rules if configured
        for (let r of this._rules_remove)
            details = details.filter(d => !d[0].match(r.scope));
        for (let r of this._rules_remove_unless_found)
            details = details.filter(d => !d[0].match(r.scope) || d[1].match(r.param1));
        for (let r of this._rules_remove_if_found)
            details = details.filter(d => !d[0].match(r.scope) || !d[1].match(r.param1));
        for (let r of this._rules_remove_unless)
            details = details.filter(d => !d[0].match(r.scope) || d[1].match(r.param1));
        for (let r of this._rules_remove_if)
            details = details.filter(d => !d[0].match(r.scope) || !d[1].match(r.param1));
        if (details.length === 0) return null;

        // mask sensitive details based on replace rules if configured
        for (let r of this._rules_replace)
            for (let d of details)
                if (d[0].match(r.scope)) d[1] = d[1].replace(r.param1, r.param2);

        // remove any details with empty values
        details = details.filter(d => '' !== d[1]);
        if (details.length === 0) return null;

        // finish message
        details.push(['now', now]);
        details.push(['agent', this._agent]);
        details.push(['version', this._version]);
        return JSON.stringify(details);
    }

}

module.exports = HttpLogger;
