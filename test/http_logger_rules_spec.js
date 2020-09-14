// © 2016-2020 Resurface Labs Inc.

const chai = require('chai');
const expect = chai.expect;
const helper = require('./helper');

const resurfaceio = require('../lib/all');
const HttpLogger = resurfaceio.HttpLogger;
const HttpMessage = resurfaceio.HttpMessage;
const HttpRules = resurfaceio.HttpRules;

/**
 * Tests against usage logger for HTTP/HTTPS protocol.
 */
describe('HttpLogger', () => {

    it('overrides default rules', () => {
        expect(HttpRules.defaultRules).to.equal(HttpRules.strictRules);
        try {
            let logger = new HttpLogger({url: "https://mysite.com"});
            expect(logger.rules.text).to.equal(HttpRules.strictRules);
            logger = new HttpLogger({url: "https://mysite.com", rules: '# 123'});
            expect(logger.rules.text).to.equal('# 123');

            HttpRules.defaultRules = "";
            logger = new HttpLogger({url: "https://mysite.com"});
            expect(logger.rules.text).to.equal("");
            logger = new HttpLogger({url: "https://mysite.com", rules: '   '});
            expect(logger.rules.text).to.equal("");
            logger = new HttpLogger({url: "https://mysite.com", rules: ' sample 42'});
            expect(logger.rules.text).to.equal(' sample 42');

            HttpRules.defaultRules = "skip_compression";
            logger = new HttpLogger({url: "https://mysite.com"});
            expect(logger.rules.text).to.equal("skip_compression");
            logger = new HttpLogger({url: "https://mysite.com", rules: 'include default\nskip_submission\n'});
            expect(logger.rules.text).to.equal("skip_compression\nskip_submission\n");

            HttpRules.defaultRules = "sample 42\n";
            logger = new HttpLogger({url: "https://mysite.com"});
            expect(logger.rules.text).to.equal("sample 42\n");
            logger = new HttpLogger({url: "https://mysite.com", rules: '   '});
            expect(logger.rules.text).to.equal("sample 42\n");
            logger = new HttpLogger({url: "https://mysite.com", rules: 'include default\nskip_submission\n'});
            expect(logger.rules.text).to.equal("sample 42\n\nskip_submission\n");

            HttpRules.defaultRules = "include debug";
            logger = new HttpLogger({url: "https://mysite.com", rules: HttpRules.strictRules});
            expect(logger.rules.text).to.equal(HttpRules.strictRules);
        } finally {
            HttpRules.defaultRules = HttpRules.strictRules;
        }
    });

    it('silently ignores writes to rules', () => {
        const logger = new HttpLogger();
        logger._rules = null;
        logger['_rules'] = null;
        expect(logger.rules.text).to.equal(HttpRules.defaultRules);
    });

    it('uses allow_http_url rules', () => {
        let logger = new HttpLogger("http://mysite.com");
        expect(logger.enableable).to.equal(false);
        logger = new HttpLogger({url: "http://mysite.com", rules: ""});
        expect(logger.enableable).to.equal(false);
        logger = new HttpLogger("https://mysite.com");
        expect(logger.enableable).to.equal(true);
        logger = new HttpLogger({url: "http://mysite.com", rules: "allow_http_url"});
        expect(logger.enableable).to.equal(true);
        logger = new HttpLogger({url: "http://mysite.com", rules: "allow_http_url\nallow_http_url"});
        expect(logger.enableable).to.equal(true);
    });

    it('uses copy_session_field rules', () => {
        const request = helper.mockRequestWithJson2();
        request.session['butterfly'] = 'poison';
        request.session['session_id'] = 'asdf1234';

        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: 'copy_session_field /.*/'});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"session_field:butterfly\",\"poison\"]");
        expect(queue[1]).to.contain("[\"session_field:session_id\",\"asdf1234\"]");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: 'copy_session_field /session_id/'});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"session_field:butterfly\",");
        expect(queue[1]).to.contain("[\"session_field:session_id\",\"asdf1234\"]");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: 'copy_session_field /blah/'});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"session_field:");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "copy_session_field /butterfly/\ncopy_session_field /session_id/"});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"session_field:butterfly\",\"poison\"]");
        expect(queue[1]).to.contain("[\"session_field:session_id\",\"asdf1234\"]");
    });

    it('uses copy_session_field and remove rules', () => {
        const request = helper.mockRequestWithJson2();
        request.session['butterfly'] = 'poison';
        request.session['session_id'] = 'asdf1234';

        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: "copy_session_field !.*!\n!session_field:.*! remove"});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"session_field:");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "copy_session_field !.*!\n!session_field:butterfly! remove"});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"session_field:butterfly\",");
        expect(queue[1]).to.contain("[\"session_field:session_id\",\"asdf1234\"]");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "copy_session_field !.*!\n!session_field:.*! remove_if !poi.*!"});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"session_field:butterfly\",");
        expect(queue[1]).to.contain("[\"session_field:session_id\",\"asdf1234\"]");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "copy_session_field !.*!\n!session_field:.*! remove_unless !sugar!"});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"session_field:");
    });

    it('uses copy_session_field and stop rules', () => {
        const request = helper.mockRequestWithJson2();
        request.session['butterfly'] = 'poison';
        request.session['session_id'] = 'asdf1234';

        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: "copy_session_field !.*!\n!session_field:butterfly! stop"});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "copy_session_field !.*!\n!session_field:butterfly! stop_if !poi.*!"});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "copy_session_field !.*!\n!session_field:butterfly! stop_unless !sugar!"});
        HttpMessage.send(logger, request, helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);
    });

    it('uses remove rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!.*! remove'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_body! remove'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! remove'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_body|response_body! remove'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_header:.*! remove'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"request_header:");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "!request_header:abc! remove\n!response_body! remove"});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"request_header:");
        expect(queue[1]).not.to.contain("[\"request_header:abc\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");
    });

    it('uses remove_if rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! remove_if !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!.*! remove_if !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_body! remove_if !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! remove_if !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_if !.*World.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_if !.*blahblahblah.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "!request_body! remove_if !.*!\n!response_body! remove_if !.*!"});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");
    });

    it('uses remove_if_found rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! remove_if_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!.*! remove_if_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_body! remove_if_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! remove_if_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_if_found !World!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_if_found !.*World.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_if_found !blahblahblah!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");
    });

    it('uses remove_unless rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! remove_unless !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!.*! remove_unless !.*blahblahblah.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_body! remove_unless !.*blahblahblah.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! remove_unless !.*blahblahblah.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_unless !.*World.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_unless !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "!response_body! remove_unless !.*!\n!request_body! remove_unless !.*!"});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");
    });

    it('uses remove_unless_found rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! remove_unless_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!.*! remove_unless_found !blahblahblah!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_body! remove_unless_found !blahblahblah!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! remove_unless_found !blahblahblah!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_unless_found !World!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_unless_found !.*World.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body|request_body! remove_unless_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",");
        expect(queue[1]).to.contain("[\"response_body\",");
    });

    it('uses replace rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_body! replace !blahblahblah!, !ZZZZZ!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("World");
        expect(queue[1]).not.to.contain("ZZZZZ");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! replace !World!, !Mundo!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>Hello Mundo!</html>\"],");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_body|response_body! replace !^.*!, !ZZZZZ!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",\"ZZZZZ\"],");
        expect(queue[1]).to.contain("[\"response_body\",\"ZZZZZ\"],");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "!request_body! replace !^.*!, !QQ!\n!response_body! replace !^.*!, !SS!"});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"request_body\",\"QQ\"],");
        expect(queue[1]).to.contain("[\"response_body\",\"SS\"],");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! replace !World!, !!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>Hello !</html>\"],");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! replace !.*!, !!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).not.to.contain("[\"response_body\",");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! replace !World!, !Z!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML3, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>1 Z 2 Z Red Z Blue Z!</html>\"],");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! replace !World!, !Z!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML4, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>1 Z\\n2 Z\\nRed Z \\nBlue Z!\\n</html>\"],");
    });

    it('uses replace rules with complex expressions', () => {
        let queue = [];
        let logger = new HttpLogger({
            queue: queue,
            rules: `/response_body/ replace /[a-zA-Z0-9.!#$%&’*+\\/=?^_\`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)/, /x@y.com/`
        });
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(),
            helper.MOCK_HTML.replace('World', 'rob@resurface.io'), helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>Hello x@y.com!</html>\"],");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: `/response_body/ replace /[0-9\\.\\-\\/]{9,}/, /xyxy/`});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(),
            helper.MOCK_HTML.replace('World', '123-45-1343'), helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>Hello xyxy!</html>\"],");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "!response_body! replace !World!, !<b>$&</b>!"});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>Hello <b>World</b>!</html>\"],");

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "!response_body! replace !(World)!, !<b>$1</b>!"});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>Hello <b>World</b>!</html>\"],");

        queue = [];
        logger = new HttpLogger({
            queue: queue, rules: "!response_body! replace !<input([^>]*)>([^<]*)</input>!, !<input$1></input>!"
        });
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML5, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
        expect(queue[1]).to.contain("[\"response_body\",\"<html>\\n<input type=\\\"hidden\\\"></input>\\n<input class='foo' type=\\\"hidden\\\"></input>\\n</html>\"],");
    });

    it('uses sample rules', () => {
        let queue = [];

        try {
            new HttpLogger({queue: queue, rules: 'sample 10\nsample 99'});
            expect(false).to.be.true;
        } catch (e) {
            expect(e.constructor.name).to.equal("EvalError");
            expect(e.message).to.equal("Multiple sample rules");
        }

        const logger = new HttpLogger({queue: queue, rules: 'sample 10'});
        for (let i = 1; i <= 100; i++) {
            HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml());
        }
        expect(queue.length).to.be.above(2);
        expect(queue.length).to.be.below(30);
    });

    it('uses skip_compression rules', () => {
        let logger = new HttpLogger("http://mysite.com");
        expect(logger.skip_compression).to.equal(false);
        logger = new HttpLogger({url: "http://mysite.com", rules: ""});
        expect(logger.skip_compression).to.equal(false);
        logger = new HttpLogger({url: "http://mysite.com", rules: "skip_compression"});
        expect(logger.skip_compression).to.equal(true);
    });

    it('uses skip_submission rules', () => {
        let logger = new HttpLogger("http://mysite.com");
        expect(logger.skip_submission).to.equal(false);
        logger = new HttpLogger({url: "http://mysite.com", rules: ""});
        expect(logger.skip_submission).to.equal(false);
        logger = new HttpLogger({url: "http://mysite.com", rules: "skip_submission"});
        expect(logger.skip_submission).to.equal(true);
    });

    it('uses stop rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! stop'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!.*! stop'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!request_body! stop'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), null, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: "!request_body! stop\n!response_body! stop"});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), null, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);
    });

    it('uses stop_if rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! stop_if !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_if !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_if !.*World.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_if !.*blahblahblah.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
    });

    it('uses stop_if_found rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! stop_if_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_if_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_if_found !World!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_if_found !.*World.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_if_found !blahblahblah!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, helper.MOCK_JSON);
        expect(queue.length).to.equal(2);
    });

    it('uses stop_unless rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! stop_unless !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_unless !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_unless !.*World.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_unless !.*blahblahblah.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(1);
    });

    it('uses stop_unless_found rules', () => {
        let queue = [];
        let logger = new HttpLogger({queue: queue, rules: '!response_header:blahblahblah! stop_unless_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(1);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_unless_found !.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_unless_found !World!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_unless_found !.*World.*!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(2);

        queue = [];
        logger = new HttpLogger({queue: queue, rules: '!response_body! stop_unless_found !blahblahblah!'});
        HttpMessage.send(logger, helper.mockRequestWithJson2(), helper.mockResponseWithHtml(), helper.MOCK_HTML, null);
        expect(queue.length).to.equal(1);
    });

});
