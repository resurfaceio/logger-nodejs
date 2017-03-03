// © 2016-2017 Resurface Labs LLC

class HttpLogger {

    /**
     * Retrieves version number from package file.
     */
    static version_lookup() {
        return require('../package.json').version;
    }

}

module.exports = HttpLogger;
