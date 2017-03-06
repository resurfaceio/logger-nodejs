// © 2016-2017 Resurface Labs LLC

/**
 * Abstract base class for all usage loggers.
 */
class BaseLogger {

    /**
     * Initialize logger.
     */
    constructor() {
        if (new.target === BaseLogger) {
            throw new TypeError("Cannot construct BaseLogger instances directly");
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
