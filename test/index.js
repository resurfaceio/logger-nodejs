// © 2016-2017 Resurface Labs LLC

const assert = require('chai').assert;
let index = require('../index');

describe('Index', function () {
    describe('#default', function () {
        it('calls default method', function () {
            index();
            assert.equal(1, 1);
        });
    });
});
