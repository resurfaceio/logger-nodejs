// © 2016-2017 Resurface Labs LLC

const UsageLoggers = require('./usage_loggers');
const ValidUrl = require('valid-url');

/**
 * Basic usage logger to embed or extend.
 */
class BaseLogger {

    /**
     * Initialize logger.
     */
    constructor(agent, options = {}) {
        this._agent = agent;
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

        // set options in priority order
        this._enabled = !enabled_exists || (enabled_exists && enabled === true);
        if (queue_exists) {
            this._queue = queue;
        } else if (url_exists) {
            this._url = (url === 'DEMO') ? UsageLoggers.urlForDemo() : url;
        } else {
            this._url = UsageLoggers.urlByDefault();
            this._enabled = (typeof this._url === 'string') && (this._url.length > 0);
        }

        // validate url when present
        if (typeof this._url === 'undefined' || ((this._url != null) && !ValidUrl.is_uri(this._url))) {
            this._url = null;
            this._enabled = false;
        }

        // mark immutable properties
        this._enableable = (this._queue != null) || (this._url != null);
        Object.defineProperty(this, '_agent', {configurable: false, writable: false});
        Object.defineProperty(this, '_enableable', {configurable: false, writable: false});
        Object.defineProperty(this, '_queue', {configurable: false, writable: false});
        Object.defineProperty(this, '_url', {configurable: false, writable: false});
        Object.defineProperty(this, '_version', {configurable: false, writable: false});
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
     * Returns true if this logger is enabled.
     */
    get enabled() {
        return this._enableable && this._enabled && UsageLoggers.enabled;
    }

    /**
     * Submits JSON message to intended destination.
     */
    submit(json) {
        if (!this.enabled) {
            return true;
        } else if (this._queue != null) {
            this._queue.push(json);
            return true;
        } else {
            // todo send data to url
            return false;
        }
    }

    /**
     * Returns url destination where messages are sent.
     */
    get url() {
        return this._url;
    }

    /**
     * Returns cached version number.
     */
    get version() {
        return this._version;
    }

    /**
     * Retrieves version number from package file.
     */
    static version_lookup() {
        return require('../package.json').version;
    }

}

module.exports = BaseLogger;
