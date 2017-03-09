// © 2016-2017 Resurface Labs LLC

let DISABLED = ('true' === process.env.USAGE_LOGGERS_DISABLE);

let disabled = DISABLED;

/**
 * Utilities for all usage loggers.
 */
class UsageLoggers {

    /**
     * Disable all usage loggers.
     */
    static disable() {
        disabled = true;
    }

    /**
     * Enable all usage loggers, except those explicitly disabled.
     */
    static enable() {
        if (!DISABLED) disabled = false;
    }

    /**
     * Returns true if usage loggers are generally enabled.
     */
    static isEnabled() {
        return !disabled;
    }

    /**
     * Returns url to use by default.
     */
    static urlByDefault() {
        return process.env.USAGE_LOGGERS_URL;
    }

    /**
     * Returns url for official demo.
     */
    static urlForDemo() {
        return "https://demo-resurfaceio.herokuapp.com/messages";
    }

}

module.exports = UsageLoggers;
