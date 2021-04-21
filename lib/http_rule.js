// © 2016-2021 Resurface Labs Inc.

/**
 * Parsed rule for HTTP logger.
 */
class HttpRule {
  constructor(verb, scope = null, param1 = null, param2 = null) {
    this._verb = verb;
    this._scope = scope;
    this._param1 = param1;
    this._param2 = param2;

    // mark immutable properties
    Object.defineProperty(this, '_verb', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, '_scope', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, '_param1', {
      configurable: false,
      writable: false,
    });
    Object.defineProperty(this, '_param2', {
      configurable: false,
      writable: false,
    });
  }

  get verb() {
    return this._verb;
  }

  get scope() {
    return this._scope;
  }

  get param1() {
    return this._param1;
  }

  get param2() {
    return this._param2;
  }
}

module.exports = HttpRule;
