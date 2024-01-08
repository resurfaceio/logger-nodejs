// © 2016-2024 Graylog, Inc.

const chai = require('chai');
chai.use(require('chai-string'));

const { expect } = chai;

const resurfaceio = require('../lib/all');

const { HttpRules } = resurfaceio;

/**
 * Tests against rules implementation for HTTP logger.
 */
describe('HttpRules', () => {
  it('changes default rules', () => {
    expect(HttpRules.defaultRules).to.equal(HttpRules.strictRules);
    try {
      HttpRules.defaultRules = '';
      expect(HttpRules.defaultRules).to.equal('');
      expect(new HttpRules(HttpRules.defaultRules).length).to.equal(0);

      HttpRules.defaultRules = ' include default';
      expect(HttpRules.defaultRules).to.equal('');

      HttpRules.defaultRules = 'include default\n';
      expect(HttpRules.defaultRules).to.equal('');

      HttpRules.defaultRules = ' include default\ninclude default\n';
      expect(new HttpRules(HttpRules.defaultRules).length).to.equal(0);

      HttpRules.defaultRules = ' include default\ninclude default\nsample 42';
      const rules = new HttpRules(HttpRules.defaultRules);
      expect(rules.length).to.equal(1);
      expect(rules.sample.length).to.equal(1);
    } finally {
      HttpRules.defaultRules = HttpRules.strictRules;
    }
  });

  it('includes debug rules', () => {
    let rules = new HttpRules('include debug');
    expect(rules.length).to.equal(2);
    expect(rules.allow_http_url).to.equal(true);
    expect(rules.copy_session_field.length).to.equal(1);

    rules = new HttpRules('include debug\n');
    expect(rules.length).to.equal(2);
    rules = new HttpRules('include debug\nsample 50');
    expect(rules.length).to.equal(3);
    expect(rules.sample.length).to.equal(1);

    rules = new HttpRules('include debug\ninclude debug\n');
    expect(rules.length).to.equal(4);
    rules = new HttpRules('include debug\nsample 50\ninclude debug\n');
    expect(rules.length).to.equal(5);

    expect(HttpRules.defaultRules).to.equal(HttpRules.strictRules);
    try {
      HttpRules.defaultRules = 'include debug';
      rules = new HttpRules('');
      expect(rules.length).to.equal(2);
      expect(rules.allow_http_url).to.equal(true);
      expect(rules.copy_session_field.length).to.equal(1);
    } finally {
      HttpRules.defaultRules = HttpRules.strictRules;
    }
  });

  it('includes standard rules', () => {
    let rules = new HttpRules('include standard');
    expect(rules.length).to.equal(3);
    expect(rules.remove.length).to.equal(1);
    expect(rules.replace.length).to.equal(2);

    rules = new HttpRules('include standard\n');
    expect(rules.length).to.equal(3);
    rules = new HttpRules('include standard\nsample 50');
    expect(rules.length).to.equal(4);
    expect(rules.sample.length).to.equal(1);

    rules = new HttpRules('include standard\ninclude standard\n');
    expect(rules.length).to.equal(6);
    rules = new HttpRules('include standard\nsample 50\ninclude standard\n');
    expect(rules.length).to.equal(7);

    expect(HttpRules.defaultRules).to.equal(HttpRules.strictRules);
    try {
      HttpRules.defaultRules = 'include standard';
      rules = new HttpRules('');
      expect(rules.length).to.equal(3);
      expect(rules.remove.length).to.equal(1);
      expect(rules.replace.length).to.equal(2);
    } finally {
      HttpRules.defaultRules = HttpRules.strictRules;
    }
  });

  it('includes strict rules', () => {
    let rules = new HttpRules('include strict');
    expect(rules.length).to.equal(2);
    expect(rules.remove.length).to.equal(1);
    expect(rules.replace.length).to.equal(1);

    rules = new HttpRules('include strict\n');
    expect(rules.length).to.equal(2);
    rules = new HttpRules('include strict\nsample 50');
    expect(rules.length).to.equal(3);
    expect(rules.sample.length).to.equal(1);

    rules = new HttpRules('include strict\ninclude strict\n');
    expect(rules.length).to.equal(4);
    rules = new HttpRules('include strict\nsample 50\ninclude strict\n');
    expect(rules.length).to.equal(5);

    expect(HttpRules.defaultRules).to.equal(HttpRules.strictRules);
    try {
      HttpRules.defaultRules = 'include strict';
      rules = new HttpRules('');
      expect(rules.length).to.equal(2);
      expect(rules.remove.length).to.equal(1);
      expect(rules.replace.length).to.equal(1);
    } finally {
      HttpRules.defaultRules = HttpRules.strictRules;
    }
  });

  it('loads rules from file', () => {
    let rules = new HttpRules('file://./test/rules1.txt');
    expect(rules.length).to.equal(1);
    expect(rules.sample.length).to.equal(1);
    expect(rules.sample[0].param1).to.equal(55);

    rules = new HttpRules('file://./test/rules2.txt');
    expect(rules.length).to.equal(3);
    expect(rules.allow_http_url).to.equal(true);
    expect(rules.copy_session_field.length).to.equal(1);
    expect(rules.sample.length).to.equal(1);
    expect(rules.sample[0].param1).to.equal(56);

    rules = new HttpRules('file://./test/rules3.txt ');
    expect(rules.length).to.equal(3);
    expect(rules.remove.length).to.equal(1);
    expect(rules.replace.length).to.equal(1);
    expect(rules.sample.length).to.equal(1);
    expect(rules.sample[0].param1).to.equal(57);
  });

  function parse_fail(line) {
    try {
      HttpRules.parseRule(line);
    } catch (e) {
      return;
    }
    expect(false).to.be.true;
  }

  function parse_ok(line, verb, scope, param1, param2) {
    const rule = HttpRules.parseRule(line);
    expect(rule.verb).to.equal(verb);

    if (rule.scope === null) {
      expect(scope).to.be.null;
    } else {
      expect(rule.scope.source).to.equal(new RegExp(scope).source);
    }

    if (rule.param1 === null) {
      expect(param1).to.be.null;
    } else if (rule.param1.constructor.name === 'RegExp') {
      expect(rule.param1.source).to.equal(new RegExp(param1).source);
    } else {
      expect(rule.param1).to.equal(param1);
    }

    if (rule.param2 === null) {
      expect(param2).to.be.null;
    } else if (rule.param2.constructor.name === 'RegExp') {
      expect(rule.param2.source).to.equal(new RegExp(param2).source);
    } else {
      expect(rule.param2).to.equal(param2);
    }
  }

  it('parses empty rules', () => {
    expect(new HttpRules(undefined).length).to.equal(2);
    expect(new HttpRules(null).length).to.equal(2);
    expect(new HttpRules('').length).to.equal(2);
    expect(new HttpRules(' ').length).to.equal(2);
    expect(new HttpRules('\t').length).to.equal(2);
    expect(new HttpRules('\n').length).to.equal(2);

    expect(HttpRules.parseRule(undefined)).to.be.null;
    expect(HttpRules.parseRule(null)).to.be.null;
    expect(HttpRules.parseRule('')).to.be.null;
    expect(HttpRules.parseRule(' ')).to.be.null;
    expect(HttpRules.parseRule('\t')).to.be.null;
    expect(HttpRules.parseRule('\n')).to.be.null;
  });

  it('parses rules with bad verbs', () => {
    for (const v of ['b', 'bozo', '*', '.*']) {
      parse_fail(`${v}`);
      parse_fail(`!.*! ${v}`);
      parse_fail(`/.*/ ${v}`);
      parse_fail(`%request_body% ${v}`);
      parse_fail(`/^request_header:.*/ ${v}`);
    }
  });

  it('parses rules with invalid scopes', () => {
    for (const s of ['request_body', '*', '.*']) {
      parse_fail(`/${s}`);
      parse_fail(`/${s}# 1`);
      parse_fail(`/${s} # 1`);
      parse_fail(`/${s}/`);
      parse_fail(`/${s}/ # 1`);
      parse_fail(` / ${s}`);
      parse_fail(`// ${s}`);
      parse_fail(`/// ${s}`);
      parse_fail(`/* ${s}`);
      parse_fail(`/? ${s}`);
      parse_fail(`/+ ${s}`);
      parse_fail(`/( ${s}`);
      parse_fail(`/(.* ${s}`);
      parse_fail(`/(.*)) ${s}`);

      parse_fail(`~${s}`);
      parse_fail(`!${s}# 1`);
      parse_fail(`|${s} # 1`);
      parse_fail(`|${s}|`);
      parse_fail(`%${s}% # 1`);
      parse_fail(` % ${s}`);
      parse_fail(`%% ${s}`);
      parse_fail(`%%% ${s}`);
      parse_fail(`%* ${s}`);
      parse_fail(`%? ${s}`);
      parse_fail(`%+ ${s}`);
      parse_fail(`%( ${s}`);
      parse_fail(`%(.* ${s}`);
      parse_fail(`%(.*)) ${s}`);

      parse_fail(`~${s}%`);
      parse_fail(`!${s}%# 1`);
      parse_fail(`|${s}% # 1`);
      parse_fail(`|${s}%`);
      parse_fail(`%${s}| # 1`);
      parse_fail(`~(.*! ${s}`);
      parse_fail(`~(.*))! ${s}`);
      parse_fail(`/(.*! ${s}`);
      parse_fail(`/(.*))! ${s}`);
    }
  });

  it('parses allow_http_url rules', () => {
    parse_fail('allow_http_url whaa');
    parse_ok('allow_http_url', 'allow_http_url', null, null, null);
    parse_ok('allow_http_url # be safe bro!', 'allow_http_url', null, null, null);
  });

  it('parses copy_session_field rules', () => {
    // with extra params
    parse_fail('|.*| copy_session_field %1%, %2%');
    parse_fail('!.*! copy_session_field /1/, 2');
    parse_fail('/.*/ copy_session_field /1/, /2');
    parse_fail('/.*/ copy_session_field /1/, /2/');
    parse_fail('/.*/ copy_session_field /1/, /2/, /3/ # blah');
    parse_fail('!.*! copy_session_field %1%, %2%, %3%');
    parse_fail('/.*/ copy_session_field /1/, /2/, 3');
    parse_fail('/.*/ copy_session_field /1/, /2/, /3');
    parse_fail('/.*/ copy_session_field /1/, /2/, /3/');
    parse_fail('%.*% copy_session_field /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! copy_session_field');
    parse_fail('/.*/ copy_session_field');
    parse_fail('/.*/ copy_session_field /');
    parse_fail('/.*/ copy_session_field //');
    parse_fail('/.*/ copy_session_field blah');
    parse_fail('/.*/ copy_session_field # bleep');
    parse_fail('/.*/ copy_session_field blah # bleep');

    // with invalid params
    parse_fail('/.*/ copy_session_field /');
    parse_fail('/.*/ copy_session_field //');
    parse_fail('/.*/ copy_session_field ///');
    parse_fail('/.*/ copy_session_field /*/');
    parse_fail('/.*/ copy_session_field /?/');
    parse_fail('/.*/ copy_session_field /+/');
    parse_fail('/.*/ copy_session_field /(/');
    parse_fail('/.*/ copy_session_field /(.*/');
    parse_fail('/.*/ copy_session_field /(.*))/');

    // with valid regexes
    parse_ok('copy_session_field !.*!', 'copy_session_field', null, '^.*$', null);
    parse_ok('copy_session_field /.*/', 'copy_session_field', null, '^.*$', null);
    parse_ok('copy_session_field /^.*/', 'copy_session_field', null, '^.*$', null);
    parse_ok('copy_session_field /.*$/', 'copy_session_field', null, '^.*$', null);
    parse_ok('copy_session_field /^.*$/', 'copy_session_field', null, '^.*$', null);

    // with valid regexes and escape sequences
    parse_ok('copy_session_field !A\\!|B!', 'copy_session_field', null, '^A!|B$', null);
    parse_ok('copy_session_field |A\\|B|', 'copy_session_field', null, '^A|B$', null);
    parse_ok('copy_session_field |A\\|B\\|C|', 'copy_session_field', null, '^A|B|C$', null);
    parse_ok('copy_session_field /A\\/B\\/C/', 'copy_session_field', null, '^A/B/C$', null);
  });

  it('parses remove rules', () => {
    // with extra params
    parse_fail('|.*| remove %1%');
    parse_fail('~.*~ remove 1');
    parse_fail('/.*/ remove /1/');
    parse_fail('/.*/ remove 1 # bleep');
    parse_fail('|.*| remove %1%, %2%');
    parse_fail('!.*! remove /1/, 2');
    parse_fail('/.*/ remove /1/, /2');
    parse_fail('/.*/ remove /1/, /2/');
    parse_fail('/.*/ remove /1/, /2/, /3/ # blah');
    parse_fail('!.*! remove %1%, %2%, %3%');
    parse_fail('/.*/ remove /1/, /2/, 3');
    parse_fail('/.*/ remove /1/, /2/, /3');
    parse_fail('/.*/ remove /1/, /2/, /3/');
    parse_fail('%.*% remove /1/, /2/, /3/ # blah');

    // with valid regexes
    parse_ok('%request_header:cookie|response_header:set-cookie% remove', 'remove', '^request_header:cookie|response_header:set-cookie$', null, null);
    parse_ok('/request_header:cookie|response_header:set-cookie/ remove', 'remove', '^request_header:cookie|response_header:set-cookie$', null, null);

    // with valid regexes and escape sequences
    parse_ok('!request_header\\!|response_header:set-cookie! remove', 'remove', '^request_header!|response_header:set-cookie$', null, null);
    parse_ok('|request_header:cookie\\|response_header:set-cookie| remove', 'remove', '^request_header:cookie|response_header:set-cookie$', null, null);
    parse_ok('|request_header:cookie\\|response_header:set-cookie\\|boo| remove', 'remove', '^request_header:cookie|response_header:set-cookie|boo$', null, null);
    parse_ok('/request_header:cookie\\/response_header:set-cookie\\/boo/ remove', 'remove', '^request_header:cookie/response_header:set-cookie/boo$', null, null);
  });

  it('parses remove_if rules', () => {
    // with extra params
    parse_fail('|.*| remove_if %1%, %2%');
    parse_fail('!.*! remove_if /1/, 2');
    parse_fail('/.*/ remove_if /1/, /2');
    parse_fail('/.*/ remove_if /1/, /2/');
    parse_fail('/.*/ remove_if /1/, /2/, /3/ # blah');
    parse_fail('!.*! remove_if %1%, %2%, %3%');
    parse_fail('/.*/ remove_if /1/, /2/, 3');
    parse_fail('/.*/ remove_if /1/, /2/, /3');
    parse_fail('/.*/ remove_if /1/, /2/, /3/');
    parse_fail('%.*% remove_if /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! remove_if');
    parse_fail('/.*/ remove_if');
    parse_fail('/.*/ remove_if /');
    parse_fail('/.*/ remove_if //');
    parse_fail('/.*/ remove_if blah');
    parse_fail('/.*/ remove_if # bleep');
    parse_fail('/.*/ remove_if blah # bleep');

    // with invalid params
    parse_fail('/.*/ remove_if /');
    parse_fail('/.*/ remove_if //');
    parse_fail('/.*/ remove_if ///');
    parse_fail('/.*/ remove_if /*/');
    parse_fail('/.*/ remove_if /?/');
    parse_fail('/.*/ remove_if /+/');
    parse_fail('/.*/ remove_if /(/');
    parse_fail('/.*/ remove_if /(.*/');
    parse_fail('/.*/ remove_if /(.*))/');

    // with valid regexes
    parse_ok('%response_body% remove_if %<!--SKIP_BODY_LOGGING-->%', 'remove_if', '^response_body$', '^<!--SKIP_BODY_LOGGING-->$', null);
    parse_ok('/response_body/ remove_if /<!--SKIP_BODY_LOGGING-->/', 'remove_if', '^response_body$', '^<!--SKIP_BODY_LOGGING-->$', null);

    // with valid regexes and escape sequences
    parse_ok('!request_body|response_body! remove_if |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'remove_if', '^request_body|response_body$', '^<!--IGNORE_LOGGING-->|<!-SKIP-->$', null);
    parse_ok('|request_body\\|response_body| remove_if |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'remove_if', '^request_body|response_body$', '^<!--IGNORE_LOGGING-->|<!-SKIP-->$', null);
    parse_ok('|request_body\\|response_body\\|boo| remove_if |<!--IGNORE_LOGGING-->\\|<!-SKIP-->\\|asdf|', 'remove_if', '^request_body|response_body|boo$', '^<!--IGNORE_LOGGING-->|<!-SKIP-->|asdf$', null);
    parse_ok('/request_body\\/response_body\\/boo/ remove_if |<!--IGNORE_LOGGING-->\\|<!-SKIP-->\\|asdf|', 'remove_if', '^request_body/response_body/boo$', '^<!--IGNORE_LOGGING-->|<!-SKIP-->|asdf$', null);
  });

  it('parses remove_if_found rules', () => {
    // with extra params
    parse_fail('|.*| remove_if_found %1%, %2%');
    parse_fail('!.*! remove_if_found /1/, 2');
    parse_fail('/.*/ remove_if_found /1/, /2');
    parse_fail('/.*/ remove_if_found /1/, /2/');
    parse_fail('/.*/ remove_if_found /1/, /2/, /3/ # blah');
    parse_fail('!.*! remove_if_found %1%, %2%, %3%');
    parse_fail('/.*/ remove_if_found /1/, /2/, 3');
    parse_fail('/.*/ remove_if_found /1/, /2/, /3');
    parse_fail('/.*/ remove_if_found /1/, /2/, /3/');
    parse_fail('%.*% remove_if_found /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! remove_if_found');
    parse_fail('/.*/ remove_if_found');
    parse_fail('/.*/ remove_if_found /');
    parse_fail('/.*/ remove_if_found //');
    parse_fail('/.*/ remove_if_found blah');
    parse_fail('/.*/ remove_if_found # bleep');
    parse_fail('/.*/ remove_if_found blah # bleep');

    // with invalid params
    parse_fail('/.*/ remove_if_found /');
    parse_fail('/.*/ remove_if_found //');
    parse_fail('/.*/ remove_if_found ///');
    parse_fail('/.*/ remove_if_found /*/');
    parse_fail('/.*/ remove_if_found /?/');
    parse_fail('/.*/ remove_if_found /+/');
    parse_fail('/.*/ remove_if_found /(/');
    parse_fail('/.*/ remove_if_found /(.*/');
    parse_fail('/.*/ remove_if_found /(.*))/');

    // with valid regexes
    parse_ok('%response_body% remove_if_found %<!--SKIP_BODY_LOGGING-->%', 'remove_if_found', '^response_body$', '<!--SKIP_BODY_LOGGING-->', null);
    parse_ok('/response_body/ remove_if_found /<!--SKIP_BODY_LOGGING-->/', 'remove_if_found', '^response_body$', '<!--SKIP_BODY_LOGGING-->', null);

    // with valid regexes and escape sequences
    parse_ok('!request_body|response_body! remove_if_found |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'remove_if_found', '^request_body|response_body$', '<!--IGNORE_LOGGING-->|<!-SKIP-->', null);
    parse_ok('|request_body\\|response_body| remove_if_found |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'remove_if_found', '^request_body|response_body$', '<!--IGNORE_LOGGING-->|<!-SKIP-->', null);
    parse_ok('|request_body\\|response_body\\|boo| remove_if_found |<!--IGNORE_LOGGING-->\\|<!-SKIP-->\\|asdf|', 'remove_if_found', '^request_body|response_body|boo$', '<!--IGNORE_LOGGING-->|<!-SKIP-->|asdf', null);
    parse_ok('/request_body\\/response_body\\/boo/ remove_if_found |<!--IGNORE_LOGGING-->\\|<!-SKIP-->\\|asdf|', 'remove_if_found', '^request_body/response_body/boo$', '<!--IGNORE_LOGGING-->|<!-SKIP-->|asdf', null);
  });

  it('parses remove_unless rules', () => {
    // with extra params
    parse_fail('|.*| remove_unless %1%, %2%');
    parse_fail('!.*! remove_unless /1/, 2');
    parse_fail('/.*/ remove_unless /1/, /2');
    parse_fail('/.*/ remove_unless /1/, /2/');
    parse_fail('/.*/ remove_unless /1/, /2/, /3/ # blah');
    parse_fail('!.*! remove_unless %1%, %2%, %3%');
    parse_fail('/.*/ remove_unless /1/, /2/, 3');
    parse_fail('/.*/ remove_unless /1/, /2/, /3');
    parse_fail('/.*/ remove_unless /1/, /2/, /3/');
    parse_fail('%.*% remove_unless /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! remove_unless');
    parse_fail('/.*/ remove_unless');
    parse_fail('/.*/ remove_unless /');
    parse_fail('/.*/ remove_unless //');
    parse_fail('/.*/ remove_unless blah');
    parse_fail('/.*/ remove_unless # bleep');
    parse_fail('/.*/ remove_unless blah # bleep');

    // with invalid params
    parse_fail('/.*/ remove_unless /');
    parse_fail('/.*/ remove_unless //');
    parse_fail('/.*/ remove_unless ///');
    parse_fail('/.*/ remove_unless /*/');
    parse_fail('/.*/ remove_unless /?/');
    parse_fail('/.*/ remove_unless /+/');
    parse_fail('/.*/ remove_unless /(/');
    parse_fail('/.*/ remove_unless /(.*/');
    parse_fail('/.*/ remove_unless /(.*))/');

    // with valid regexes
    parse_ok('%response_body% remove_unless %<!--PERFORM_BODY_LOGGING-->%', 'remove_unless', '^response_body$', '^<!--PERFORM_BODY_LOGGING-->$', null);
    parse_ok('/response_body/ remove_unless /<!--PERFORM_BODY_LOGGING-->/', 'remove_unless', '^response_body$', '^<!--PERFORM_BODY_LOGGING-->$', null);

    // with valid regexes and escape sequences
    parse_ok('!request_body|response_body! remove_unless |<!--PERFORM_LOGGING-->\\|<!-SKIP-->|', 'remove_unless', '^request_body|response_body$', '^<!--PERFORM_LOGGING-->|<!-SKIP-->$', null);
    parse_ok('|request_body\\|response_body| remove_unless |<!--PERFORM_LOGGING-->\\|<!-SKIP-->|', 'remove_unless', '^request_body|response_body$', '^<!--PERFORM_LOGGING-->|<!-SKIP-->$', null);
    parse_ok('|request_body\\|response_body\\|boo| remove_unless |<!--PERFORM_LOGGING-->\\|<!-SKIP-->\\|skipit|', 'remove_unless', '^request_body|response_body|boo$', '^<!--PERFORM_LOGGING-->|<!-SKIP-->|skipit$', null);
    parse_ok('/request_body\\/response_body\\/boo/ remove_unless |<!--PERFORM_LOGGING-->\\|<!-SKIP-->\\|skipit|', 'remove_unless', '^request_body/response_body/boo$', '^<!--PERFORM_LOGGING-->|<!-SKIP-->|skipit$', null);
  });

  it('parses remove_unless_found rules', () => {
    // with extra params
    parse_fail('|.*| remove_unless_found %1%, %2%');
    parse_fail('!.*! remove_unless_found /1/, 2');
    parse_fail('/.*/ remove_unless_found /1/, /2');
    parse_fail('/.*/ remove_unless_found /1/, /2/');
    parse_fail('/.*/ remove_unless_found /1/, /2/, /3/ # blah');
    parse_fail('!.*! remove_unless_found %1%, %2%, %3%');
    parse_fail('/.*/ remove_unless_found /1/, /2/, 3');
    parse_fail('/.*/ remove_unless_found /1/, /2/, /3');
    parse_fail('/.*/ remove_unless_found /1/, /2/, /3/');
    parse_fail('%.*% remove_unless_found /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! remove_unless_found');
    parse_fail('/.*/ remove_unless_found');
    parse_fail('/.*/ remove_unless_found /');
    parse_fail('/.*/ remove_unless_found //');
    parse_fail('/.*/ remove_unless_found blah');
    parse_fail('/.*/ remove_unless_found # bleep');
    parse_fail('/.*/ remove_unless_found blah # bleep');

    // with invalid params
    parse_fail('/.*/ remove_unless_found /');
    parse_fail('/.*/ remove_unless_found //');
    parse_fail('/.*/ remove_unless_found ///');
    parse_fail('/.*/ remove_unless_found /*/');
    parse_fail('/.*/ remove_unless_found /?/');
    parse_fail('/.*/ remove_unless_found /+/');
    parse_fail('/.*/ remove_unless_found /(/');
    parse_fail('/.*/ remove_unless_found /(.*/');
    parse_fail('/.*/ remove_unless_found /(.*))/');

    // with valid regexes
    parse_ok('%response_body% remove_unless_found %<!--PERFORM_BODY_LOGGING-->%', 'remove_unless_found', '^response_body$', '<!--PERFORM_BODY_LOGGING-->', null);
    parse_ok('/response_body/ remove_unless_found /<!--PERFORM_BODY_LOGGING-->/', 'remove_unless_found', '^response_body$', '<!--PERFORM_BODY_LOGGING-->', null);

    // with valid regexes and escape sequences
    parse_ok('!request_body|response_body! remove_unless_found |<!--PERFORM_LOGGING-->\\|<!-SKIP-->|', 'remove_unless_found', '^request_body|response_body$', '<!--PERFORM_LOGGING-->|<!-SKIP-->', null);
    parse_ok('|request_body\\|response_body| remove_unless_found |<!--PERFORM_LOGGING-->\\|<!-SKIP-->|', 'remove_unless_found', '^request_body|response_body$', '<!--PERFORM_LOGGING-->|<!-SKIP-->', null);
    parse_ok('|request_body\\|response_body\\|boo| remove_unless_found |<!--PERFORM_LOGGING-->\\|<!-SKIP-->\\|skipit|', 'remove_unless_found', '^request_body|response_body|boo$', '<!--PERFORM_LOGGING-->|<!-SKIP-->|skipit', null);
    parse_ok('/request_body\\/response_body\\/boo/ remove_unless_found |<!--PERFORM_LOGGING-->\\|<!-SKIP-->\\|skipit|', 'remove_unless_found', '^request_body/response_body/boo$', '<!--PERFORM_LOGGING-->|<!-SKIP-->|skipit', null);
  });

  it('parses replace rules', () => {
    // with extra params
    parse_fail('!.*! replace %1%, %2%, %3%');
    parse_fail('/.*/ replace /1/, /2/, 3');
    parse_fail('/.*/ replace /1/, /2/, /3');
    parse_fail('/.*/ replace /1/, /2/, /3/');
    parse_fail('%.*% replace /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! replace');
    parse_fail('/.*/ replace');
    parse_fail('/.*/ replace /');
    parse_fail('/.*/ replace //');
    parse_fail('/.*/ replace blah');
    parse_fail('/.*/ replace # bleep');
    parse_fail('/.*/ replace blah # bleep');
    parse_fail('!.*! replace boo yah');
    parse_fail('/.*/ replace boo yah');
    parse_fail('/.*/ replace boo yah # bro');
    parse_fail('/.*/ replace /.*/ # bleep');
    parse_fail('/.*/ replace /.*/, # bleep');
    parse_fail('/.*/ replace /.*/, /# bleep');
    parse_fail('/.*/ replace // # bleep');
    parse_fail('/.*/ replace // // # bleep');

    // with invalid params
    parse_fail('/.*/ replace /');
    parse_fail('/.*/ replace //');
    parse_fail('/.*/ replace ///');
    parse_fail('/.*/ replace /*/');
    parse_fail('/.*/ replace /?/');
    parse_fail('/.*/ replace /+/');
    parse_fail('/.*/ replace /(/');
    parse_fail('/.*/ replace /(.*/');
    parse_fail('/.*/ replace /(.*))/');
    parse_fail('/.*/ replace /1/, ~');
    parse_fail('/.*/ replace /1/, !');
    parse_fail('/.*/ replace /1/, %');
    parse_fail('/.*/ replace /1/, |');
    parse_fail('/.*/ replace /1/, /');

    // with valid regexes
    parse_ok('%response_body% replace %kurt%, %vagner%', 'replace', '^response_body$', 'kurt', 'vagner');
    parse_ok('/response_body/ replace /kurt/, /vagner/', 'replace', '^response_body$', 'kurt', 'vagner');
    parse_ok('%response_body|.+_header:.+% replace %kurt%, %vagner%', 'replace', '^response_body|.+_header:.+$', 'kurt', 'vagner');
    parse_ok('|response_body\\|.+_header:.+| replace |kurt|, |vagner\\|frazier|', 'replace', '^response_body|.+_header:.+$', 'kurt', 'vagner|frazier');

    // with valid regexes and escape sequences
    parse_ok('|response_body\\|.+_header:.+| replace |kurt|, |vagner|', 'replace', '^response_body|.+_header:.+$', 'kurt', 'vagner');
    parse_ok('|response_body\\|.+_header:.+\\|boo| replace |kurt|, |vagner|', 'replace', '^response_body|.+_header:.+|boo$', 'kurt', 'vagner');
    parse_ok('|response_body| replace |kurt\\|bruce|, |vagner|', 'replace', '^response_body$', 'kurt|bruce', 'vagner');
    parse_ok('|response_body| replace |kurt\\|bruce\\|kevin|, |vagner|', 'replace', '^response_body$', 'kurt|bruce|kevin', 'vagner');
    parse_ok('|response_body| replace /kurt\\/bruce\\/kevin/, |vagner|', 'replace', '^response_body$', 'kurt/bruce/kevin', 'vagner');
  });

  it('parses sample rules', () => {
    parse_fail('sample');
    parse_fail('sample 50 50');
    parse_fail('sample 0');
    parse_fail('sample 100');
    parse_fail('sample 105');
    parse_fail('sample 10.5');
    parse_fail('sample blue');
    parse_fail('sample # bleep');
    parse_fail('sample blue # bleep');
    parse_fail('sample //');
    parse_fail('sample /42/');
    parse_ok('sample 50', 'sample', null, 50, null);
    parse_ok('sample 72 # comment', 'sample', null, 72, null);
  });

  it('parses skip_compression rules', () => {
    parse_fail('skip_compression whaa');
    parse_ok('skip_compression', 'skip_compression', null, null, null);
    parse_ok('skip_compression # slightly faster!', 'skip_compression', null, null, null);
  });

  it('parses skip_submission rules', () => {
    parse_fail('skip_submission whaa');
    parse_ok('skip_submission', 'skip_submission', null, null, null);
    parse_ok('skip_submission # slightly faster!', 'skip_submission', null, null, null);
  });

  it('parses stop rules', () => {
    // with extra params
    parse_fail('|.*| stop %1%');
    parse_fail('~.*~ stop 1');
    parse_fail('/.*/ stop /1/');
    parse_fail('/.*/ stop 1 # bleep');
    parse_fail('|.*| stop %1%, %2%');
    parse_fail('!.*! stop /1/, 2');
    parse_fail('/.*/ stop /1/, /2');
    parse_fail('/.*/ stop /1/, /2/');
    parse_fail('/.*/ stop /1/, /2/, /3/ # blah');
    parse_fail('!.*! stop %1%, %2%, %3%');
    parse_fail('/.*/ stop /1/, /2/, 3');
    parse_fail('/.*/ stop /1/, /2/, /3');
    parse_fail('/.*/ stop /1/, /2/, /3/');
    parse_fail('%.*% stop /1/, /2/, /3/ # blah');

    // with valid regexes
    parse_ok('%request_header:skip_usage_logging% stop', 'stop', '^request_header:skip_usage_logging$', null, null);
    parse_ok('|request_header:skip_usage_logging| stop', 'stop', '^request_header:skip_usage_logging$', null, null);
    parse_ok('/request_header:skip_usage_logging/ stop', 'stop', '^request_header:skip_usage_logging$', null, null);

    // with valid regexes and escape sequences
    parse_ok('!request_header\\!! stop', 'stop', '^request_header!$', null, null);
    parse_ok('|request_header\\|response_header| stop', 'stop', '^request_header|response_header$', null, null);
    parse_ok('|request_header\\|response_header\\|boo| stop', 'stop', '^request_header|response_header|boo$', null, null);
    parse_ok('/request_header\\/response_header\\/boo/ stop', 'stop', '^request_header/response_header/boo$', null, null);
  });

  it('parses stop_if rules', () => {
    // with extra params
    parse_fail('|.*| stop_if %1%, %2%');
    parse_fail('!.*! stop_if /1/, 2');
    parse_fail('/.*/ stop_if /1/, /2');
    parse_fail('/.*/ stop_if /1/, /2/');
    parse_fail('/.*/ stop_if /1/, /2/, /3/ # blah');
    parse_fail('!.*! stop_if %1%, %2%, %3%');
    parse_fail('/.*/ stop_if /1/, /2/, 3');
    parse_fail('/.*/ stop_if /1/, /2/, /3');
    parse_fail('/.*/ stop_if /1/, /2/, /3/');
    parse_fail('%.*% stop_if /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! stop_if');
    parse_fail('/.*/ stop_if');
    parse_fail('/.*/ stop_if /');
    parse_fail('/.*/ stop_if //');
    parse_fail('/.*/ stop_if blah');
    parse_fail('/.*/ stop_if # bleep');
    parse_fail('/.*/ stop_if blah # bleep');

    // with invalid params
    parse_fail('/.*/ stop_if /');
    parse_fail('/.*/ stop_if //');
    parse_fail('/.*/ stop_if ///');
    parse_fail('/.*/ stop_if /*/');
    parse_fail('/.*/ stop_if /?/');
    parse_fail('/.*/ stop_if /+/');
    parse_fail('/.*/ stop_if /(/');
    parse_fail('/.*/ stop_if /(.*/');
    parse_fail('/.*/ stop_if /(.*))/');

    // with valid regexes
    parse_ok('%response_body% stop_if %<!--IGNORE_LOGGING-->%', 'stop_if', '^response_body$', '^<!--IGNORE_LOGGING-->$', null);
    parse_ok('/response_body/ stop_if /<!--IGNORE_LOGGING-->/', 'stop_if', '^response_body$', '^<!--IGNORE_LOGGING-->$', null);

    // with valid regexes and escape sequences
    parse_ok('!request_body|response_body! stop_if |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'stop_if', '^request_body|response_body$', '^<!--IGNORE_LOGGING-->|<!-SKIP-->$', null);
    parse_ok('!request_body|response_body|boo\\!! stop_if |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'stop_if', '^request_body|response_body|boo!$', '^<!--IGNORE_LOGGING-->|<!-SKIP-->$', null);
    parse_ok('|request_body\\|response_body| stop_if |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'stop_if', '^request_body|response_body$', '^<!--IGNORE_LOGGING-->|<!-SKIP-->$', null);
    parse_ok('/request_body\\/response_body/ stop_if |<!--IGNORE_LOGGING-->\\|<!-SKIP-->\\|pipe\\||', 'stop_if', '^request_body/response_body$', '^<!--IGNORE_LOGGING-->|<!-SKIP-->|pipe|$', null);
  });

  it('parses stop_if_found rules', () => {
    // with extra params
    parse_fail('|.*| stop_if_found %1%, %2%');
    parse_fail('!.*! stop_if_found /1/, 2');
    parse_fail('/.*/ stop_if_found /1/, /2');
    parse_fail('/.*/ stop_if_found /1/, /2/');
    parse_fail('/.*/ stop_if_found /1/, /2/, /3/ # blah');
    parse_fail('!.*! stop_if_found %1%, %2%, %3%');
    parse_fail('/.*/ stop_if_found /1/, /2/, 3');
    parse_fail('/.*/ stop_if_found /1/, /2/, /3');
    parse_fail('/.*/ stop_if_found /1/, /2/, /3/');
    parse_fail('%.*% stop_if_found /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! stop_if_found');
    parse_fail('/.*/ stop_if_found');
    parse_fail('/.*/ stop_if_found /');
    parse_fail('/.*/ stop_if_found //');
    parse_fail('/.*/ stop_if_found blah');
    parse_fail('/.*/ stop_if_found # bleep');
    parse_fail('/.*/ stop_if_found blah # bleep');

    // with invalid params
    parse_fail('/.*/ stop_if_found /');
    parse_fail('/.*/ stop_if_found //');
    parse_fail('/.*/ stop_if_found ///');
    parse_fail('/.*/ stop_if_found /*/');
    parse_fail('/.*/ stop_if_found /?/');
    parse_fail('/.*/ stop_if_found /+/');
    parse_fail('/.*/ stop_if_found /(/');
    parse_fail('/.*/ stop_if_found /(.*/');
    parse_fail('/.*/ stop_if_found /(.*))/');

    // with valid regexes
    parse_ok('%response_body% stop_if_found %<!--IGNORE_LOGGING-->%', 'stop_if_found', '^response_body$', '<!--IGNORE_LOGGING-->', null);
    parse_ok('/response_body/ stop_if_found /<!--IGNORE_LOGGING-->/', 'stop_if_found', '^response_body$', '<!--IGNORE_LOGGING-->', null);

    // with valid regexes and escape sequences
    parse_ok('!request_body|response_body! stop_if_found |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'stop_if_found', '^request_body|response_body$', '<!--IGNORE_LOGGING-->|<!-SKIP-->', null);
    parse_ok('!request_body|response_body|boo\\!! stop_if_found |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'stop_if_found', '^request_body|response_body|boo!$', '<!--IGNORE_LOGGING-->|<!-SKIP-->', null);
    parse_ok('|request_body\\|response_body| stop_if_found |<!--IGNORE_LOGGING-->\\|<!-SKIP-->|', 'stop_if_found', '^request_body|response_body$', '<!--IGNORE_LOGGING-->|<!-SKIP-->', null);
    parse_ok('/request_body\\/response_body/ stop_if_found |<!--IGNORE_LOGGING-->\\|<!-SKIP-->\\|pipe\\||', 'stop_if_found', '^request_body/response_body$', '<!--IGNORE_LOGGING-->|<!-SKIP-->|pipe|', null);
  });

  it('parses stop_unless rules', () => {
    // with extra params
    parse_fail('|.*| stop_unless %1%, %2%');
    parse_fail('!.*! stop_unless /1/, 2');
    parse_fail('/.*/ stop_unless /1/, /2');
    parse_fail('/.*/ stop_unless /1/, /2/');
    parse_fail('/.*/ stop_unless /1/, /2/, /3/ # blah');
    parse_fail('!.*! stop_unless %1%, %2%, %3%');
    parse_fail('/.*/ stop_unless /1/, /2/, 3');
    parse_fail('/.*/ stop_unless /1/, /2/, /3');
    parse_fail('/.*/ stop_unless /1/, /2/, /3/');
    parse_fail('%.*% stop_unless /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! stop_unless');
    parse_fail('/.*/ stop_unless');
    parse_fail('/.*/ stop_unless /');
    parse_fail('/.*/ stop_unless //');
    parse_fail('/.*/ stop_unless blah');
    parse_fail('/.*/ stop_unless # bleep');
    parse_fail('/.*/ stop_unless blah # bleep');

    // with invalid params
    parse_fail('/.*/ stop_unless /');
    parse_fail('/.*/ stop_unless //');
    parse_fail('/.*/ stop_unless ///');
    parse_fail('/.*/ stop_unless /*/');
    parse_fail('/.*/ stop_unless /?/');
    parse_fail('/.*/ stop_unless /+/');
    parse_fail('/.*/ stop_unless /(/');
    parse_fail('/.*/ stop_unless /(.*/');
    parse_fail('/.*/ stop_unless /(.*))/');

    // with valid regexes
    parse_ok('%response_body% stop_unless %<!--DO_LOGGING-->%', 'stop_unless', '^response_body$', '^<!--DO_LOGGING-->$', null);
    parse_ok('/response_body/ stop_unless /<!--DO_LOGGING-->/', 'stop_unless', '^response_body$', '^<!--DO_LOGGING-->$', null);

    // with valid regexes and escape sequences
    parse_ok('!request_body|response_body! stop_unless |<!--DO_LOGGING-->\\|<!-NOSKIP-->|', 'stop_unless', '^request_body|response_body$', '^<!--DO_LOGGING-->|<!-NOSKIP-->$', null);
    parse_ok('!request_body|response_body|boo\\!! stop_unless |<!--DO_LOGGING-->\\|<!-NOSKIP-->|', 'stop_unless', '^request_body|response_body|boo!$', '^<!--DO_LOGGING-->|<!-NOSKIP-->$', null);
    parse_ok('|request_body\\|response_body| stop_unless |<!--DO_LOGGING-->\\|<!-NOSKIP-->|', 'stop_unless', '^request_body|response_body$', '^<!--DO_LOGGING-->|<!-NOSKIP-->$', null);
    parse_ok('|request_body\\|response_body| stop_unless |<!--DO_LOGGING-->\\|<!-NOSKIP-->\\|pipe\\||', 'stop_unless', '^request_body|response_body$', '^<!--DO_LOGGING-->|<!-NOSKIP-->|pipe|$', null);
    parse_ok('/request_body\\/response_body/ stop_unless |<!--DO_LOGGING-->\\|<!-NOSKIP-->\\|pipe\\||', 'stop_unless', '^request_body/response_body$', '^<!--DO_LOGGING-->|<!-NOSKIP-->|pipe|$', null);
  });

  it('parses stop_unless_found rules', () => {
    // with extra params
    parse_fail('|.*| stop_unless_found %1%, %2%');
    parse_fail('!.*! stop_unless_found /1/, 2');
    parse_fail('/.*/ stop_unless_found /1/, /2');
    parse_fail('/.*/ stop_unless_found /1/, /2/');
    parse_fail('/.*/ stop_unless_found /1/, /2/, /3/ # blah');
    parse_fail('!.*! stop_unless_found %1%, %2%, %3%');
    parse_fail('/.*/ stop_unless_found /1/, /2/, 3');
    parse_fail('/.*/ stop_unless_found /1/, /2/, /3');
    parse_fail('/.*/ stop_unless_found /1/, /2/, /3/');
    parse_fail('%.*% stop_unless_found /1/, /2/, /3/ # blah');

    // with missing params
    parse_fail('!.*! stop_unless_found');
    parse_fail('/.*/ stop_unless_found');
    parse_fail('/.*/ stop_unless_found /');
    parse_fail('/.*/ stop_unless_found //');
    parse_fail('/.*/ stop_unless_found blah');
    parse_fail('/.*/ stop_unless_found # bleep');
    parse_fail('/.*/ stop_unless_found blah # bleep');

    // with invalid params
    parse_fail('/.*/ stop_unless_found /');
    parse_fail('/.*/ stop_unless_found //');
    parse_fail('/.*/ stop_unless_found ///');
    parse_fail('/.*/ stop_unless_found /*/');
    parse_fail('/.*/ stop_unless_found /?/');
    parse_fail('/.*/ stop_unless_found /+/');
    parse_fail('/.*/ stop_unless_found /(/');
    parse_fail('/.*/ stop_unless_found /(.*/');
    parse_fail('/.*/ stop_unless_found /(.*))/');

    // with valid regexes
    parse_ok('%response_body% stop_unless_found %<!--DO_LOGGING-->%', 'stop_unless_found', '^response_body$', '<!--DO_LOGGING-->', null);
    parse_ok('/response_body/ stop_unless_found /<!--DO_LOGGING-->/', 'stop_unless_found', '^response_body$', '<!--DO_LOGGING-->', null);

    // with valid regexes and escape sequences
    parse_ok('!request_body|response_body! stop_unless_found |<!--DO_LOGGING-->\\|<!-NOSKIP-->|', 'stop_unless_found', '^request_body|response_body$', '<!--DO_LOGGING-->|<!-NOSKIP-->', null);
    parse_ok('!request_body|response_body|boo\\!! stop_unless_found |<!--DO_LOGGING-->\\|<!-NOSKIP-->|', 'stop_unless_found', '^request_body|response_body|boo!$', '<!--DO_LOGGING-->|<!-NOSKIP-->', null);
    parse_ok('|request_body\\|response_body| stop_unless_found |<!--DO_LOGGING-->\\|<!-NOSKIP-->|', 'stop_unless_found', '^request_body|response_body$', '<!--DO_LOGGING-->|<!-NOSKIP-->', null);
    parse_ok('|request_body\\|response_body| stop_unless_found |<!--DO_LOGGING-->\\|<!-NOSKIP-->\\|pipe\\||', 'stop_unless_found', '^request_body|response_body$', '<!--DO_LOGGING-->|<!-NOSKIP-->|pipe|', null);
    parse_ok('/request_body\\/response_body/ stop_unless_found |<!--DO_LOGGING-->\\|<!-NOSKIP-->\\|pipe\\||', 'stop_unless_found', '^request_body/response_body$', '<!--DO_LOGGING-->|<!-NOSKIP-->|pipe|', null);
  });

  it('raises expected errors', () => {
    try {
      new HttpRules('file://~/bleepblorpbleepblorp12345');
      expect(false).to.be.true;
    } catch (e) {
      expect(e.constructor.name).to.equal('EvalError');
      expect(e.message).to.equal('Failed to load rules: ~/bleepblorpbleepblorp12345');
    }

    try {
      new HttpRules('/*! stop');
      expect(false).to.be.true;
    } catch (e) {
      expect(e.constructor.name).to.equal('EvalError');
      expect(e.message).to.equal('Invalid expression (/*!) in rule: /*! stop');
    }

    try {
      new HttpRules('/*/ stop');
      expect(false).to.be.true;
    } catch (e) {
      expect(e.constructor.name).to.equal('SyntaxError');
      expect(e.message).to.equal('Invalid regex (/*/) in rule: /*/ stop');
    }

    try {
      new HttpRules('/boo');
      expect(false).to.be.true;
    } catch (e) {
      expect(e.constructor.name).to.equal('EvalError');
      expect(e.message).to.equal('Invalid rule: /boo');
    }

    try {
      new HttpRules('sample 123');
      expect(false).to.be.true;
    } catch (e) {
      expect(e.constructor.name).to.equal('EvalError');
      expect(e.message).to.equal('Invalid sample percent: 123');
    }

    try {
      new HttpRules('!!! stop');
      expect(false).to.be.true;
    } catch (e) {
      expect(e.constructor.name).to.equal('EvalError');
      expect(e.message).to.equal('Unescaped separator (!) in rule: !!! stop');
    }
  });
});
