// © 2016-2017 Resurface Labs LLC

const chai = require('chai');
const expect = chai.expect;
const helper = require('./helper');
const parseable = helper.parseable;

describe('Helper', () => {

    it('detects good json', () => {
        expect(parseable('[]')).to.be.true;
        expect(parseable('[ ]')).to.be.true;
        expect(parseable('[\n]')).to.be.true;
        expect(parseable('[\n\t\n]')).to.be.true;
        expect(parseable('[\"A\"]')).to.be.true;
        expect(parseable('[\"A\",\"B\"]')).to.be.true;
    });

    it('detects invalid json', () => {
        expect(parseable(null)).to.be.false;
        expect(parseable('')).to.be.false;
        expect(parseable(' ')).to.be.false;
        expect(parseable("\n\n\n\n")).to.be.false;
        expect(parseable('1234')).to.be.false;
        expect(parseable('archer')).to.be.false;
        expect(parseable("\"sterling archer\"")).to.be.false;
        expect(parseable("[\"]")).to.be.false;
        expect(parseable('[:,]')).to.be.false;
        expect(parseable(',')).to.be.false;
        expect(parseable('exact words')).to.be.false;
        expect(parseable('his exact words')).to.be.false;
        expect(parseable("\"exact words")).to.be.false;
        expect(parseable("his exact words\"")).to.be.false;
        expect(parseable("\"hello\":\"world\" }")).to.be.false;
        expect(parseable("{ \"hello\":\"world\"")).to.be.false;
        expect(parseable("{ \"hello world\"}")).to.be.false;
    });

});
