// run the tests: node ./node_modules/mocha/bin/mocha
'use strict';
var gCodeConverter = require('../gCodeConverter.js');
var converter = new gCodeConverter();

var assert = require('assert');

function getTestSvg()
{
    return {
        segments:[
            ['M',1,1],
            ['L',2,2],
            ['z']
        ]
    }
}

describe('gCode Converter Testclass', function() {
    describe('logging', function() {
        it('format one hour', function() {
            assert.equal(converter.formatDuration(3600),'1:00:00');
        });
        it('format one minute', function() {
            assert.equal(converter.formatDuration(60),'01:00');
        });
    }); 
    describe('svg transformation', function() {
        it('get blocks simple test', function() {
            var result = converter.getBlocks(getTestSvg);
            console.log(result);
        })
    })   
    describe('pathfinding', function() {        
    })
});