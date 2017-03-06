// © 2016-2017 Resurface Labs LLC

const BaseLogger = require('../lib/base_logger');

const chai = require('chai');
const expect = chai.expect;

describe('BaseLogger', function () {

    describe('#constructor', function () {
        it('prevents construction', function () {
            try {
                expect(new BaseLogger()).to.not.exist;
            } catch (TypeError) {
                // this is expected
            }
        });
    });

});
