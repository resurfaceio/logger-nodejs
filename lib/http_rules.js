// © 2016-2018 Resurface Labs LLC

const HttpRule = require('./http_rule');

/**
 * Rules implementation for HTTP logger.
 */
class HttpRules {

    /**
     * Rules used by default when no other rules are provided.
     */
    static get standardRules() {
        return `/request_header:cookie|response_header:set-cookie/ remove
/(request|response)_body|request_param/ replace /[a-zA-Z0-9.!#$%&’*+\\/=?^_\`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)/, /x@y.com/
/request_body|request_param|response_body/ replace /[0-9\\.\\-\\/]{9,}/, /xyxy/\n`
    }

    /**
     * Rules providing all details for debugging an application.
     */
    static get debugRules() {
        return "allow_http_url\ncopy_session_field /.*/\n"
    }

    /**
     * Rules providing details for a traditional weblog.
     */
    static get weblogRules() {
        return `/request_url/ replace /([^\\?;]+).*/, /$1/
/request_body|response_body|request_param:.*|request_header:(?!user-agent).*|response_header:(?!(content-length)|(content-type)).*/ remove\n`
    }

    /**
     * Parses rules from multi-line string.
     */
    static parse(rules) {
        const result = [];
        if ((typeof rules !== 'undefined') && (rules !== null)) {
            rules = rules.replace(/^\s*include debug\s*$/gm, this.debugRules);
            rules = rules.replace(/^\s*include standard\s*$/gm, this.standardRules);
            rules = rules.replace(/^\s*include weblog\s*$/gm, this.weblogRules);
            for (let rule of rules.split("\n")) {
                const parsed = this.parseRule(rule);
                if (parsed !== null) result.push(parsed);
            }
        }
        return result;
    }

    /**
     * Parses rule from single line.
     */
    static parseRule(r) {
        if ((typeof r === 'undefined') || (r === null) || r.match(REGEX_BLANK_OR_COMMENT)) return null;
        let m = r.match(REGEX_ALLOW_HTTP_URL);
        if (m) return new HttpRule('allow_http_url');
        m = r.match(REGEX_COPY_SESSION_FIELD);
        if (m) return new HttpRule('copy_session_field', null, this._parseRegex(r, m[1]));
        m = r.match(REGEX_REMOVE);
        if (m) return new HttpRule('remove', this._parseRegex(r, m[1]));
        m = r.match(REGEX_REMOVE_IF);
        if (m) return new HttpRule('remove_if', this._parseRegex(r, m[1]), this._parseRegex(r, m[2]));
        m = r.match(REGEX_REMOVE_IF_FOUND);
        if (m) return new HttpRule('remove_if_found', this._parseRegex(r, m[1]), this._parseRegexFind(r, m[2]));
        m = r.match(REGEX_REMOVE_UNLESS);
        if (m) return new HttpRule('remove_unless', this._parseRegex(r, m[1]), this._parseRegex(r, m[2]));
        m = r.match(REGEX_REMOVE_UNLESS_FOUND);
        if (m) return new HttpRule('remove_unless_found', this._parseRegex(r, m[1]), this._parseRegexFind(r, m[2]));
        m = r.match(REGEX_REPLACE);
        if (m) return new HttpRule('replace', this._parseRegex(r, m[1]), this._parseRegexFind(r, m[2]),
            this._parseString(r, m[3]));
        m = r.match(REGEX_SAMPLE);
        if (m) {
            const m1 = parseInt(m[1]);
            if (m1 < 1 || m1 > 99) throw new EvalError(`Invalid sample percent: ${m1}`);
            return new HttpRule('sample', null, m1)
        }
        m = r.match(REGEX_SKIP_COMPRESSION);
        if (m) return new HttpRule('skip_compression');
        m = r.match(REGEX_SKIP_SUBMISSION);
        if (m) return new HttpRule('skip_submission');
        m = r.match(REGEX_STOP);
        if (m) return new HttpRule('stop', this._parseRegex(r, m[1]));
        m = r.match(REGEX_STOP_IF);
        if (m) return new HttpRule('stop_if', this._parseRegex(r, m[1]), this._parseRegex(r, m[2]));
        m = r.match(REGEX_STOP_IF_FOUND);
        if (m) return new HttpRule('stop_if_found', this._parseRegex(r, m[1]), this._parseRegexFind(r, m[2]));
        m = r.match(REGEX_STOP_UNLESS);
        if (m) return new HttpRule('stop_unless', this._parseRegex(r, m[1]), this._parseRegex(r, m[2]));
        m = r.match(REGEX_STOP_UNLESS_FOUND);
        if (m) return new HttpRule('stop_unless_found', this._parseRegex(r, m[1]), this._parseRegexFind(r, m[2]));
        throw new EvalError(`Invalid rule: ${r}`);
    }

    /**
     * Parses regex for matching.
     */
    static _parseRegex(r, regex) {
        let str = this._parseString(r, regex);
        if (!str.startsWith('^')) str = `^${str}`;
        if (!str.endsWith('$')) str = `${str}$`;
        try {
            return new RegExp(str);
        } catch (e) {
            throw (e instanceof EvalError) ? e : new SyntaxError(`Invalid regex (${regex}) in rule: ${r}`);
        }
    }

    /**
     * Parses regex for finding.
     */
    static _parseRegexFind(r, regex) {
        try {
            return new RegExp(this._parseString(r, regex), 'g');
        } catch (e) {
            throw (e instanceof EvalError) ? e : new SyntaxError(`Invalid regex (${regex}) in rule: ${r}`);
        }
    }

    /**
     * Parses delimited string expression.
     */
    static _parseString(r, str) {
        for (let sep of ['~', '!', '%', '|', '/']) {
            const m = str.match(new RegExp(`^[${sep}](.*)[${sep}]$`));
            if (m) {
                let m1 = m[1];
                if (m1.match(new RegExp(`^[${sep}].*|.*[^\\\\][${sep}].*`)))
                    throw new EvalError(`Unescaped separator (${sep}) in rule: ${r}`);
                return m1.split(`\\${sep}`).join(sep);
            }
        }
        throw new EvalError(`Invalid expression (${str}) in rule: ${r}`);
    }

}

const REGEX_ALLOW_HTTP_URL = /^\s*allow_http_url\s*(#.*)?$/;
const REGEX_BLANK_OR_COMMENT = /^\s*([#].*)*$/;
const REGEX_COPY_SESSION_FIELD = /^\s*copy_session_field\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;
const REGEX_REMOVE = /^\s*([~!%|\/].+[~!%|\/])\s*remove\s*(#.*)?$/;
const REGEX_REMOVE_IF = /^\s*([~!%|\/].+[~!%|\/])\s*remove_if\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;
const REGEX_REMOVE_IF_FOUND = /^\s*([~!%|\/].+[~!%|\/])\s*remove_if_found\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;
const REGEX_REMOVE_UNLESS = /^\s*([~!%|\/].+[~!%|\/])\s*remove_unless\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;
const REGEX_REMOVE_UNLESS_FOUND = /^\s*([~!%|\/].+[~!%|\/])\s*remove_unless_found\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;
const REGEX_REPLACE = /^\s*([~!%|\/].+[~!%|\/])\s*replace[\s]+([~!%|\/].+[~!%|\/]),[\s]+([~!%|\/].*[~!%|\/])\s*(#.*)?$/;
const REGEX_SAMPLE = /^\s*sample\s+(\d+)\s*(#.*)?$/;
const REGEX_SKIP_COMPRESSION = /^\s*skip_compression\s*(#.*)?$/;
const REGEX_SKIP_SUBMISSION = /^\s*skip_submission\s*(#.*)?$/;
const REGEX_STOP = /^\s*([~!%|\/].+[~!%|\/])\s*stop\s*(#.*)?$/;
const REGEX_STOP_IF = /^\s*([~!%|\/].+[~!%|\/])\s*stop_if\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;
const REGEX_STOP_IF_FOUND = /^\s*([~!%|\/].+[~!%|\/])\s*stop_if_found\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;
const REGEX_STOP_UNLESS = /^\s*([~!%|\/].+[~!%|\/])\s*stop_unless\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;
const REGEX_STOP_UNLESS_FOUND = /^\s*([~!%|\/].+[~!%|\/])\s*stop_unless_found\s+([~!%|\/].+[~!%|\/])\s*(#.*)?$/;

module.exports = HttpRules;
