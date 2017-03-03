// © 2016-2017 Resurface Labs LLC

const assert = require('chai').assert;
let HttpLogger = require('../http_logger');

describe('HttpLogger', function () {

    describe('#default', function () {
        it('calls default method', function () {
            HttpLogger();
            assert.equal(1, 1);
        });
    });

});
