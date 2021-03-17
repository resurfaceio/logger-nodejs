// © 2016-2021 Resurface Labs Inc.

const os = require('os');
const usage_loggers = require('./usage_loggers');
const zlib = require('zlib');
const axios = require('axios');

const DEFAULT_MAX_TRANSMIT = 128;

/**
 * Basic usage logger to embed or extend.
 */
class BaseLogger {

    /**
     * Initialize logger.
     */
    constructor(agent, options = {}) {
        this._agent = agent;
        this._host = BaseLogger.host_lookup();
        this._queue = null;
        this._url = null;
        this._version = BaseLogger.version_lookup();

        // read provided options
        const enabled = options['enabled'];
        const enabled_exists = (typeof enabled === 'boolean');
        const queue = options['queue'];
        const queue_exists = (typeof queue === 'object') && Array.isArray(queue);
        const url = (typeof options === 'string') ? options : options['url'];
        const url_exists = (typeof url === 'string');
        const skip_compression = options['skip_compression'];
        const skip_submission = options['skip_submission'];
        const max_transmit = options['max_transmit'];

        // set options in priority order
        this._enabled = !enabled_exists || (enabled_exists && enabled === true);
        this._skip_compression = (typeof skip_compression === 'boolean') ? skip_compression : false;
        this._skip_submission = (typeof skip_submission === 'boolean') ? skip_submission : false;
        if (queue_exists) {
            this._queue = queue;
        } else if (url_exists) {
            this._url = url;
        } else {
            this._url = usage_loggers.urlByDefault();
            this._enabled = (typeof this._url === 'string') && (this._url.length > 0);
        }

        // validate url when present
        if (typeof this._url === 'undefined' || ((this._url !== null) && !BaseLogger.valid_url(this._url))) {
            this._url = null;
            this._enabled = false;
        }

        // parse and cache url properties
        if (this._url != null) {
            try {
                this._url_options = {
                    url: this._url,
                    method: 'post',
                    // timeout: ,
                    headers: {
                        'Content-Encoding': this._skip_compression ? 'identity' : 'deflated',
                        'Content-Type': 'application/json; charset=UTF-8',
                        'User-Agent': `Resurface/${this.version} (${this._agent})`
                    }
                }
            } catch (e) {
                this._url = null;
                this._url_options = null;
                this._enabled = false;
            }
        }

        // create transmission queue
        this._max_transmit = (typeof max_transmit === 'number') ? max_transmit : DEFAULT_MAX_TRANSMIT;
        this._transmit_queue = [];

        // finalize internal properties
        this._enableable = (this._queue !== null) || (this._url !== null);
        this._submit_failures = new Uint32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        this._submit_successes = new Uint32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));

        // mark immutable properties
        Object.defineProperty(this, '_agent', {configurable: false, writable: false});
        Object.defineProperty(this, '_host', {configurable: false, writable: false});
        Object.defineProperty(this, '_queue', {configurable: false, writable: false});
        Object.defineProperty(this, '_submit_failures', {configurable: false, writable: false});
        Object.defineProperty(this, '_submit_successes', {configurable: false, writable: false});
        Object.defineProperty(this, '_url', {configurable: false, writable: false});
        Object.defineProperty(this, '_url_options', {configurable: false, writable: false});
        Object.defineProperty(this, '_version', {configurable: false, writable: false});
        Object.defineProperty(this, '_max_transmit', {configurable: false, writable: false});
    }

    /**
     * Returns agent string identifying this logger.
     */
    get agent() {
        return this._agent;
    }

    /**
     * Disable this logger.
     */
    disable() {
        this._enabled = false;
        return this;
    }

    /**
     * Enable this logger.
     */
    enable() {
        this._enabled = this._enableable;
        return this;
    }

    /**
     * Returns true if this logger can ever be enabled.
     */
    get enableable() {
        return this._enableable;
    }

    /**
     * Returns true if this logger is currently enabled.
     */
    get enabled() {
        return this._enableable && this._enabled && usage_loggers.enabled;
    }

    /**
     * Returns cached host identifier.
     */
    get host() {
        return this._host;
    }

    /**
     * Returns high-resolution time in milliseconds.
     */
    get hrmillis() {
        const [seconds, nanos] = process.hrtime();
        return seconds * 1000 + nanos / 1000000;
    }

    /**
     * Returns queue destination where messages are sent.
     */
    get queue() {
        return this._queue;
    }

    /**
     * Returns true if message compression is being skipped.
     */
    get skip_compression() {
        return this._skip_compression;
    }

    /**
     * Sets if message compression will be skipped.
     */
    set skip_compression(value) {
        this._skip_compression = value;
        this._url_options.headers['Content-Encoding'] = value ? 'identity' : 'deflated';
    }

    /**
     * Returns true if message submission is being skipped.
     */
    get skip_submission() {
        return this._skip_submission;
    }

    /**
     * Sets if message submission will be skipped.
     */
    set skip_submission(value) {
        this._skip_submission = value;
    }

    /**
     * Returns promise to submit JSON message to intended destination.
     */
    submit(msg) {
        if (msg == null || this._skip_submission || !this.enabled) {
            return new Promise((resolve, reject) => resolve(true));
        } else if (this._queue !== null) {
            this._queue.push(msg);
            Atomics.add(this._submit_successes, 0, 1);
            return new Promise((resolve, reject) => resolve(true));
        } else {
            return new Promise((resolve, reject) => {
                if (this._skip_compression) {
                    this.hermes(msg).then(resolve(true));
                } else {
                    zlib.deflate(msg, (err, buffer) => {
                        if (err != null) {
                            Atomics.add(this._submit_failures, 0, 1);
                            reject(true);
                        } else {
                            this.hermes(buffer).then(resolve(true));
                        }
                    });
                }
            });
        }
    }

    /**
     * Creates promise to submit JSON message to intended destination.
     */
    async hermes(message) {
        while (this._transmit_queue.length >= this._max_transmit) await Promise.race(this._transmit_queue);
        let p = axios.post(this.url, message, this._url_options)
        .then((response) => {
            if (response.status === 204) {
                Atomics.add(this._submit_successes, 0, 1);
            } else {
                Atomics.add(this._submit_failures, 0, 1);
            }
            this._transmit_queue.splice(this._transmit_queue.indexOf(p), 1);
        })
        .catch(() => Atomics.add(this._submit_failures, 0, 1));
        this._transmit_queue.push(p);
    }

    /**
     * Returns count of submissions that failed.
     */
    get submit_failures() {
        return Atomics.load(this._submit_failures, 0);
    }

    /**
     * Returns count of submissions that succeeded.
     */
    get submit_successes() {
        return Atomics.load(this._submit_successes, 0);
    }

    /**
     * Returns url destination where messages are sent.
     */
    get url() {
        return this._url;
    }

    /**
     * Checks if provided value is a valid URL string.
     * Copied from https://github.com/ogt/valid-url/blob/8d1fc52b21ceab99b68f415838035859b7237949/index.js#L22
     */
    static valid_url(value) {
        if (!value) return;

        // check for illegal characters
        if (/[^a-z0-9\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\.\-\_\~\%]/i.test(value)) return;

        // check for hex escapes that aren't complete
        if (/%[^0-9a-f]/i.test(value)) return;
        if (/%[0-9a-f](:?[^0-9a-f]|$)/i.test(value)) return;

        // from RFC 3986
        let splitted = value.match(/(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/);
        let scheme = splitted[1];
        let authority = splitted[2];
        let path = splitted[3];
        let query = splitted[4];
        let fragment = splitted[5];
        let out = '';

        // scheme and path are required, though the path can be empty
        if (!(scheme && scheme.length && path.length >= 0)) return;

        // if authority is present, the path must be empty or begin with a /
        if (authority && authority.length) {
            if (!(path.length === 0 || /^\//.test(path))) return;
        } else {
            // if authority is not present, the path must not start with //
            if (/^\/\//.test(path)) return;
        }

        // scheme must begin with a letter, then consist of letters, digits, +, ., or -
        if (!/^[a-z][a-z0-9\+\-\.]*$/.test(scheme.toLowerCase())) return;

        // re-assemble the URL per section 5.3 in RFC 3986
        out += scheme + ':';
        if (authority && authority.length) {
            out += '//' + authority;
        }
        out += path;
        if (query && query.length) out += '?' + query;
        if (fragment && fragment.length) out += '#' + fragment;
        return out;
    }

    /**
     * Returns cached version number.
     */
    get version() {
        return this._version;
    }

    /**
     * Retrieves host identifier.
     */
    static host_lookup() {
        const dyno = process.env.DYNO;
        if (typeof dyno !== 'undefined') return dyno;
        try {
            return os.hostname();
        } catch (e) {
            return 'unknown';
        }
    }

    /**
     * Retrieves version number from package file.
     */
    static version_lookup() {
        return require('../package.json').version;
    }

}

module.exports = BaseLogger;
