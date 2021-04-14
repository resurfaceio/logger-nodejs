// © 2016-2021 Resurface Labs Inc.

const fs = require('fs');
const HttpRule = require('./http_rule');

const DEBUG_RULES = 'allow_http_url\ncopy_session_field /.*/\n';

const STANDARD_RULES = `/request_header:cookie|response_header:set-cookie/ remove
/(request|response)_body|request_param/ replace /[a-zA-Z0-9.!#$%&’*+/=?^_\`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)/, /x@y.com/
/request_body|request_param|response_body/ replace /[0-9\\.\\-/]{9,}/, /xyxy/\n`;

const STRICT_RULES = `/request_url/ replace /([^\\?;]+).*/, /$1/
/request_body|response_body|request_param:.*|request_header:(?!user-agent).*|response_header:(?!(content-length)|(content-type)).*/ remove\n`;

const REGEX_ALLOW_HTTP_URL = /^\s*allow_http_url\s*(#.*)?$/;
const REGEX_BLANK_OR_COMMENT = /^\s*([#].*)*$/;
const REGEX_COPY_SESSION_FIELD = /^\s*copy_session_field\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;
const REGEX_REMOVE = /^\s*([~!%|/].+[~!%|/])\s*remove\s*(#.*)?$/;
const REGEX_REMOVE_IF = /^\s*([~!%|/].+[~!%|/])\s*remove_if\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;
const REGEX_REMOVE_IF_FOUND = /^\s*([~!%|/].+[~!%|/])\s*remove_if_found\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;
const REGEX_REMOVE_UNLESS = /^\s*([~!%|/].+[~!%|/])\s*remove_unless\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;
const REGEX_REMOVE_UNLESS_FOUND = /^\s*([~!%|/].+[~!%|/])\s*remove_unless_found\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;
const REGEX_REPLACE = /^\s*([~!%|/].+[~!%|/])\s*replace[\s]+([~!%|/].+[~!%|/]),[\s]+([~!%|/].*[~!%|/])\s*(#.*)?$/;
const REGEX_SAMPLE = /^\s*sample\s+(\d+)\s*(#.*)?$/;
const REGEX_SKIP_COMPRESSION = /^\s*skip_compression\s*(#.*)?$/;
const REGEX_SKIP_SUBMISSION = /^\s*skip_submission\s*(#.*)?$/;
const REGEX_STOP = /^\s*([~!%|/].+[~!%|/])\s*stop\s*(#.*)?$/;
const REGEX_STOP_IF = /^\s*([~!%|/].+[~!%|/])\s*stop_if\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;
const REGEX_STOP_IF_FOUND = /^\s*([~!%|/].+[~!%|/])\s*stop_if_found\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;
const REGEX_STOP_UNLESS = /^\s*([~!%|/].+[~!%|/])\s*stop_unless\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;
const REGEX_STOP_UNLESS_FOUND = /^\s*([~!%|/].+[~!%|/])\s*stop_unless_found\s+([~!%|/].+[~!%|/])\s*(#.*)?$/;



let _defaultRules = STRICT_RULES;

/**
 * Rules implementation for HTTP logger.
 */
class HttpRules {
  /**
   * Returns rules used by default when none are declared.
   */
  static get defaultRules() {
    return _defaultRules;
  }

  /**
   * Updates rules used by default when none are declared.
   */
  static set defaultRules(r) {
    _defaultRules = r.replace(/^\s*include default\s*$/gm, '');
  }

  /**
   * Rules providing all details for debugging an application.
   */
  static get debugRules() {
    return DEBUG_RULES;
  }

  /**
   * Rules that block common kinds of sensitive data.
   */
  static get standardRules() {
    return STANDARD_RULES;
  }

  /**
   * Rules providing minimal details, used by default.
   */
  static get strictRules() {
    return STRICT_RULES;
  }

  /**
   * Parses rule from single line.
   */
  static parseRule(r) {
    if (typeof r === 'undefined' || r === null || r.match(REGEX_BLANK_OR_COMMENT)) return null;
    let m = r.match(REGEX_ALLOW_HTTP_URL);
    if (m) return new HttpRule('allow_http_url');
    m = r.match(REGEX_COPY_SESSION_FIELD);
    if (m) return new HttpRule('copy_session_field', null, this.parseRegex(r, m[1]));
    m = r.match(REGEX_REMOVE);
    if (m) return new HttpRule('remove', this.parseRegex(r, m[1]));
    m = r.match(REGEX_REMOVE_IF);
    if (m) return new HttpRule('remove_if', this.parseRegex(r, m[1]), this.parseRegex(r, m[2]));
    m = r.match(REGEX_REMOVE_IF_FOUND);
    if (m) return new HttpRule('remove_if_found', this.parseRegex(r, m[1]), this.parseRegexFind(r, m[2]));
    m = r.match(REGEX_REMOVE_UNLESS);
    if (m) return new HttpRule('remove_unless', this.parseRegex(r, m[1]), this.parseRegex(r, m[2]));
    m = r.match(REGEX_REMOVE_UNLESS_FOUND);
    if (m) return new HttpRule('remove_unless_found', this.parseRegex(r, m[1]), this.parseRegexFind(r, m[2]));
    m = r.match(REGEX_REPLACE);
    if (m) return new HttpRule('replace', this.parseRegex(r, m[1]), this.parseRegexFind(r, m[2]), this.parseString(r, m[3]));
    m = r.match(REGEX_SAMPLE);
    if (m) {
      const m1 = parseInt(m[1]);
      if (m1 < 1 || m1 > 99) throw new EvalError(`Invalid sample percent: ${m1}`);
      return new HttpRule('sample', null, m1);
    }
    m = r.match(REGEX_SKIP_COMPRESSION);
    if (m) return new HttpRule('skip_compression');
    m = r.match(REGEX_SKIP_SUBMISSION);
    if (m) return new HttpRule('skip_submission');
    m = r.match(REGEX_STOP);
    if (m) return new HttpRule('stop', this.parseRegex(r, m[1]));
    m = r.match(REGEX_STOP_IF);
    if (m) return new HttpRule('stop_if', this.parseRegex(r, m[1]), this.parseRegex(r, m[2]));
    m = r.match(REGEX_STOP_IF_FOUND);
    if (m) return new HttpRule('stop_if_found', this.parseRegex(r, m[1]), this.parseRegexFind(r, m[2]));
    m = r.match(REGEX_STOP_UNLESS);
    if (m) return new HttpRule('stop_unless', this.parseRegex(r, m[1]), this.parseRegex(r, m[2]));
    m = r.match(REGEX_STOP_UNLESS_FOUND);
    if (m) return new HttpRule('stop_unless_found', this.parseRegex(r, m[1]), this.parseRegexFind(r, m[2]));
    throw new EvalError(`Invalid rule: ${r}`);
  }

  /**
   * Parses regex for matching.
   */
  static parseRegex(r, regex) {
    let s = this.parseString(r, regex);
    if (!s.startsWith('^')) s = `^${s}`;
    if (!s.endsWith('$')) s = `${s}$`;
    try {
      return new RegExp(s);
    } catch (e) {
      throw e instanceof EvalError ? e : new SyntaxError(`Invalid regex (${regex}) in rule: ${r}`);
    }
  }

  /**
   * Parses regex for finding.
   */
  static parseRegexFind(r, regex) {
    try {
      return new RegExp(this.parseString(r, regex), 'g');
    } catch (e) {
      throw e instanceof EvalError ? e : new SyntaxError(`Invalid regex (${regex}) in rule: ${r}`);
    }
  }

  /**
   * Parses delimited string expression.
   */
  static parseString(r, expr) {
    for (const sep of ['~', '!', '%', '|', '/']) {
      const m = expr.match(new RegExp(`^[${sep}](.*)[${sep}]$`));
      if (m) {
        const m1 = m[1];
        if (m1.match(new RegExp(`^[${sep}].*|.*[^\\\\][${sep}].*`))) throw new EvalError(`Unescaped separator (${sep}) in rule: ${r}`);
        return m1.split(`\\${sep}`).join(sep);
      }
    }
    throw new EvalError(`Invalid expression (${expr}) in rule: ${r}`);
  }

  /**
   * Initialize a new set of rules.
   */
  constructor(rules) {
    let _rules = rules;
    if (typeof _rules !== 'string') _rules = HttpRules.defaultRules;

    // load rules from external files
    if (_rules.startsWith('file://')) {
      const rfile = _rules.substring(7).trim();
      try {
        _rules = fs.readFileSync(rfile).toString();
      } catch (e) {
        throw new EvalError(`Failed to load rules: ${rfile}`);
      }
    }

    // force default rules if necessary
    _rules = _rules.replace(/^\s*include default\s*$/gm, HttpRules.defaultRules);
    if (_rules.trim().length === 0) _rules = HttpRules.defaultRules;

    // expand rule includes
    _rules = _rules.replace(/^\s*include debug\s*$/gm, HttpRules.debugRules);
    _rules = _rules.replace(/^\s*include standard\s*$/gm, HttpRules.standardRules);
    _rules = _rules.replace(/^\s*include strict\s*$/gm, HttpRules.strictRules);
    this.text = _rules;

    // parse all rules
    const prs = [];
    for (const rule of this.text.split(/[\r\n]/)) {
      const parsed = HttpRules.parseRule(rule);
      if (parsed !== null) prs.push(parsed);
    }
    this.length = prs.length;

    // break out rules by verb
    this.allow_http_url = prs.filter((r) => r.verb === 'allow_http_url').length > 0;
    this.copy_session_field = prs.filter((r) => r.verb === 'copy_session_field');
    this.remove = prs.filter((r) => r.verb === 'remove');
    this.remove_if = prs.filter((r) => r.verb === 'remove_if');
    this.remove_if_found = prs.filter((r) => r.verb === 'remove_if_found');
    this.remove_unless = prs.filter((r) => r.verb === 'remove_unless');
    this.remove_unless_found = prs.filter((r) => r.verb === 'remove_unless_found');
    this.replace = prs.filter((r) => r.verb === 'replace');
    this.sample = prs.filter((r) => r.verb === 'sample');
    this.skip_compression = prs.filter((r) => r.verb === 'skip_compression').length > 0;
    this.skip_submission = prs.filter((r) => r.verb === 'skip_submission').length > 0;
    this.stop = prs.filter((r) => r.verb === 'stop');
    this.stop_if = prs.filter((r) => r.verb === 'stop_if');
    this.stop_if_found = prs.filter((r) => r.verb === 'stop_if_found');
    this.stop_unless = prs.filter((r) => r.verb === 'stop_unless');
    this.stop_unless_found = prs.filter((r) => r.verb === 'stop_unless_found');

    // validate rules
    if (this.sample.length > 1) throw new EvalError('Multiple sample rules');

    // mark immutable properties
    Object.defineProperty(this, 'allow_http_url', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'copy_session_field', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'length', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'remove', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'remove_if', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'remove_if_found', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'remove_unless', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'remove_unless_found', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'replace', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'sample', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'skip_compression', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'skip_submission', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'stop', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'stop_if', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'stop_if_found', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'stop_unless', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'stop_unless_found', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, 'text', {
      configurable: false,
      writable: false,
    });
  }

  /**
   * Apply current rules to message details.
   */
  apply(details) {
    let _details = details;
    // stop rules come first
    for (const r of this.stop) for (const d of _details) if (d[0].match(r.scope)) return null;
    for (const r of this.stop_if_found) for (const d of _details) if (d[0].match(r.scope) && d[1].match(r.param1)) return null;
    for (const r of this.stop_if) for (const d of _details) if (d[0].match(r.scope) && d[1].match(r.param1)) return null;
    let passed = 0;
    for (const r of this.stop_unless_found) for (const d of _details) if (d[0].match(r.scope) && d[1].match(r.param1)) passed++;
    if (passed !== this.stop_unless_found.length) return null;
    passed = 0;
    for (const r of this.stop_unless) for (const d of _details) if (d[0].match(r.scope) && d[1].match(r.param1)) passed++;
    if (passed !== this.stop_unless.length) return null;

    // do sampling if configured
    if (this.sample.length === 1 && Math.random() * 100 >= this.sample[0].param1) return null;

    // winnow sensitive details based on remove rules if configured
    for (const r of this.remove) _details = _details.filter((d) => !d[0].match(r.scope));
    for (const r of this.remove_unless_found) _details = _details.filter((d) => !d[0].match(r.scope) || d[1].match(r.param1));
    for (const r of this.remove_if_found) _details = _details.filter((d) => !d[0].match(r.scope) || !d[1].match(r.param1));
    for (const r of this.remove_unless) _details = _details.filter((d) => !d[0].match(r.scope) || d[1].match(r.param1));
    for (const r of this.remove_if) _details = _details.filter((d) => !d[0].match(r.scope) || !d[1].match(r.param1));
    if (_details.length === 0) return null;

    // mask sensitive details based on replace rules if configured
    for (const r of this.replace) for (const d of _details) if (d[0].match(r.scope)) d[1] = d[1].replace(r.param1, r.param2);

    // remove any details with empty values
    _details = _details.filter((d) => d[1] !== '');
    if (_details.length === 0) return null;

    return _details;
  }
}


module.exports = HttpRules;
