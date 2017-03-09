// © 2016-2017 Resurface Labs LLC

/**
 * Basic usage logger to embed or extend.
 */
class BaseLogger {

    /**
     * Initialize logger.
     */
    constructor() {
        this._version = BaseLogger.version_lookup();
        Object.freeze(this);
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
