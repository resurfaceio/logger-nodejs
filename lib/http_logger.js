// © 2016-2017 Resurface Labs LLC

/**
 * Usage logger for HTTP/HTTPS protocol.
 */
class HttpLogger extends require('./base_logger') {

    /**
     * Agent string identifying this logger.
     * @return string
     */
    static get AGENT() {
        return 'http_logger.js';
    }

    /**
     * Initialize logger.
     */
    constructor(options = {}) {
        super(HttpLogger.AGENT, options);
    }

}

module.exports = HttpLogger;
