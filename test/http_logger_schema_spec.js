// © 2016-2020 Resurface Labs Inc.

const chai = require('chai');
const expect = chai.expect;
const helper = require('./helper');
const parseable = helper.parseable;

const resurfaceio = require('../lib/all');
const HttpLogger = resurfaceio.HttpLogger;

/**
 * Tests against schemas for HTTP loggers.
 */
describe('HttpLogger', () => {

    it('loads default schema', () => {
        const queue = [];
        const logger = new HttpLogger({queue: queue});
        expect(logger.schema).to.be.null;
    });

    it('loads schema', () => {
        const myschema = 'type Foo { bar: String }';

        const queue = [];
        const logger = new HttpLogger({queue: queue, schema: myschema});
        expect(logger.schema).to.equal(myschema);

        expect(queue.length).to.equal(1);
        const msg = queue[0];
        expect(parseable(msg)).to.be.true;
        expect(msg).to.contain(`[\"graphql_schema\",\"${myschema}\"]`);
    });

    it('loads schema from file', () => {
        const myschema = 'type Query { hello: String }';

        const queue = [];
        const logger = new HttpLogger({queue: queue, schema: 'file://./test/schema1.txt'});
        expect(logger.schema).to.equal(myschema);

        expect(queue.length).to.equal(1);
        const msg = queue[0];
        expect(parseable(msg)).to.be.true;
        expect(msg).to.contain(`[\"graphql_schema\",\"${myschema}\"]`);
    });

    it('raises expected errors', () => {
        try {
            const queue = [];
            new HttpLogger({queue: queue, schema: 'file://~/bleepblorpbleepblorp12345'});
            expect(false).to.be.true;
        } catch (e) {
            expect(e.constructor.name).to.equal('EvalError');
            expect(e.message).to.equal('Failed to load schema: ~/bleepblorpbleepblorp12345');
        }
    });

    it('silently ignores writes to schema', () => {
        const myschema = 'type Foo { bar: String }';

        const queue = [];
        const logger = new HttpLogger({queue: queue, schema: myschema});
        logger._schema = null;
        logger['_schema'] = null;

        expect(logger.schema).to.equal(myschema);
    });

});
