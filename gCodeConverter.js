"use strict";
module.exports = gCodeConverter;
var svgpath = require('svgpath');

/*
	the exported interface
*/
function gCodeConverter(){

    /** 
     * helper to trick pronterface for visualization of the Beam-Ways
    */

    this.travelTime = 0;
    this.laserTime = 0;
    this.lastcoord = {x:0, y:0};

    this.getExtruderMove = function()
    {    
        return "E0.001\nG1 E-0.001"
    }
    
    this.getPath = function(content)
    {
        var po = content.indexOf("path");
        content = content.slice(po+8);
        po = content.indexOf('"');
        var result = content.slice(0,po-1);
        return result;
    }

    this.getDefaultConversionOptions = function()
    {
        return {
            moveTo00 : true, 
            translateX : 0,  
            translateY : 0,
            before: "",
            after: "",
            laserOn : "M3 S255",
            laserOff : "M5",
            feedRateMove : 100,
            feedrateLaser :10,
            loops : 1, // number of loops the whole thing should run
            loopChangeGCode : ["G1 X0 Y0"], // gcode to add when changing the loop,
            blockloop : false,        
        }
    }

    this.getBlocks = function(svg, conversionOptions)
    {
        if (typeof(conversionOptions) === "undefined")
        {
            conversionOptions = this.getDefaultConversionOptions();
        }
        let lastcoord = {};
        let blocks=[];
        let block={};
        for (var i = 0, len = svg.segments.length; i < len; i++) {
            let element = svg.segments[i];
            let code = element[0];
            let x = element[1]+conversionOptions.translateX;
            let y = element[2]+conversionOptions.translateY;        
            switch(code)
            {
                case "M":
                    block = {
                        start : {x:x,y:y},                    
                        end : {x:x,y:y},
                        coords : [],
                        travels : [],
                        processed : false,
                        startindex : 0
                    }     
                    //block.coords.push(block.start);
                    break;
                case "L":
                    lastcoord = {x:x,y:y};
                    block.coords.push(lastcoord)
                    break;
                case "z":
                    block.end = lastcoord;           
                    block.coords.push(block.start);     
                    blocks.push(block);
                    break;            
            }
        
        }    
        return blocks;
    }
    

    this.getNextBlock2 = function(coord, blocks)
    {        
        let minD = 1000000000;
        let minDBlock = -1;
        let minDIndex = -1;

        for (var i = 0, len = blocks.length; i<len; i++)
        {   
            let block = blocks[i];         
            if (block.processed)
                continue;

            for(var j=0; j<block.coords.length; j++)
            {
                let distance = this.getDistance(block.coords[j].x-coord.x,block.coords[j].y-coord.y)
                if (distance < minD)
                {
                    minD = distance;
                    minDBlock = i;
                    minDIndex = j;
                }
            }                        
        }     
        if (minDIndex <0)       
            return null;

        let result = blocks[minDBlock];
        result.startindex=minDIndex;
        return result;
    }

    this.getNextBlock = function(coord, blocks)
    {
        let minD = 1000000000;
        let minDIdx = -1;
        for (var i = 0, len = blocks.length; i<len; i++)
        {
            var block = blocks[i];
            if (blocks[i].processed)
                continue;
            
            if (block.travels[i]<minD)
            {
                minD = block.travels[i];
                minDIdx = i;
            }        
        }
    
        if (minDIdx>=0)
            return blocks[minDIdx];
        return null;    
    }
    
    this.calculateTravels = function (blocks)
    {
        for (var s = 0, slen = blocks.length; s<slen; s++)
        {
            let sb = blocks[s];
            for (var d = 0, dlen = blocks.length; d<dlen; d++)
            {
                let db = blocks[d];
                
                let dx = sb.end.x - db.start.x;
                let dy = sb.end.y - db.start.y;
    
                let distance = this.getDistance(dx,dy);
    
                sb.travels.push(distance);
            }
        }
    }
    
    this.getDistance = function(x,y)
    {
        return Math.sqrt(x*x + y*y)
    }

    this.updateStats = function (coord, travel)
    {
        var distance = this.getDistance(coord.x-this.lastcoord.x, coord.y - this.lastcoord.y);
        this.lastcoord = coord;
        if (travel)
        {
            this.travelTime += distance;
        }
        else
        {
            this.laserTime += distance;
        }
    }

    this.getCode2 = function(block,conversionOptions)
    {


        var output = "";
        
        for (var loop = 0;loop<conversionOptions.loops; loop++)
        {
            if (conversionOptions.blockloop)
            {
                output+=conversionOptions.loopChangeGCode[loop]+"\n";
            }
            var coords = block.coords[block.startindex];
            this.updateStats(coords,true);
            output += "G1 X"+coords.x+" Y"+coords.y+" F"+conversionOptions.feedRateMove+"\n";
            output += conversionOptions.laserOn+"\n";        

            let idx = (block.startindex+1) % block.coords.length;
            while (idx != block.startindex)        
            {

                coords = block.coords[idx];
                this.updateStats(coords, false);
                output += "G1 X"+coords.x+" Y"+coords.y+" F"+conversionOptions.feedrateLaser+" "+this.getExtruderMove()+"\n";        

                idx++;
                if (idx>=block.coords.length)
                    idx=0;
            }
            coords = block.coords[idx];
            this.updateStats(coords, false);
            output += "G1 X"+coords.x+" Y"+coords.y+" F"+conversionOptions.feedrateLaser+" "+this.getExtruderMove()+"\n";        

            output +=conversionOptions.laserOff+"\n";
            if (!conversionOptions.blockloop)
                break;
        }
    
        return output;
    }

    this.getCode = function(block,conversionOptions)
    {
        var output = "";

        this.updateStats(block.start, true);

        output += "G1 X"+block.start.x+" Y"+block.start.y+" F"+conversionOptions.feedRateMove+"\n";
    
        output += conversionOptions.laserOn+"\n";        
        for(var b = 0, blen = block.coords.length; b<blen;b++)
        {
            var t = block.coords[b];        
            this.updateStats(t, false);
            output += "G1 X"+t.x+" Y"+t.y+" F"+conversionOptions.feedrateLaser+" "+this.getExtruderMove()+"\n";        
    
        }
        output +=conversionOptions.laserOff+"\n";
    
        return output;
    }

    this.formatDuration = function (duration)
    {
        let result = "";
        if (duration >= 3600)
        {
            result += Math.trunc(duration / 3600)+":";
            duration = duration % 3600
        }
        /*
        if (duration > 60)
        {
            result += Math.trunc(duration / 60)+"m ";
            duration = duration % 60            
        }
        */
        result += (Math.trunc(duration / 60)+":").padStart(3,'0');
        duration = duration % 60            

        result+=(Math.trunc(duration)+"").padStart(2,'0');

        return result;
    }

    /*
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
      }
      */
    
    this.create = function(blocks, conversionOptions)
    {
        var output = ";gCodeConverter v0.1\n";
        output += ";conversionOptions: "+ JSON.stringify(conversionOptions)+"\n";
        output += conversionOptions.before+"\n";
        var counter = 1;        
    
        for (var loop = 0;loop<conversionOptions.loops; loop++)
        {                
            output += conversionOptions.loopChangeGCode[loop]+"\n";
    
            for (var s = 0, slen = blocks.length; s<slen; s++)
            {
                blocks[s].processed=false;
            }
            

            var block = this.getNextBlock2({x:0,y:0},blocks);
            //var block = blocks[getRandomInt(blocks.length)];


            block.processed = true;
            output += this.getCode2(block, conversionOptions);
    
            while ((block = this.getNextBlock2(block.coords[block.startindex], blocks)) != null)
            {
                output += this.getCode2(block, conversionOptions);

                let currentDuration = (this.travelTime*60 / conversionOptions.feedRateMove) + (this.laserTime*60 / conversionOptions.feedrateLaser);
                output += "M118 Done Block "+counter+
                          " from " + (blocks.length * (conversionOptions.blockloop ? 1 : conversionOptions.loops ))+ 
                          " - about "+this.formatDuration(currentDuration)+" over \n";

                block.processed = true;        
                counter++;
            }
            // handle the block internally
            if (conversionOptions.blockloop)    
                break;
        }
        output+=conversionOptions.after+"\n";
        output+="M118 processing complete :-)\n";
        let travelDuration = this.travelTime / conversionOptions.feedRateMove;
        let laserDuration = this.laserTime / conversionOptions.feedrateLaser;
        let totalDuration = (travelDuration + laserDuration)*60;

        let blockDuration = totalDuration / counter;
        console.log("traveldistance "+Math.trunc(this.travelTime)+"mm");
        console.log("laser distance: "+Math.trunc(this.laserTime)+"mm");
        console.log("laser production time ~ "+ this.formatDuration(totalDuration));
        console.log(counter+" blocks processed");        
        console.log("block duration ~ "+this.formatDuration(blockDuration));        
        return output;
    }
        
    this.convert = function(svgPath, conversionOptions)
    {        
        let convertionStart = new Date()

        let content = this.getPath(svgPath);
        let svg = svgpath(content);


        let output = "";

        let mix = 1000000000000;
        let miy = 1000000000000;

        for (var i = 0, len = svg.segments.length; i < len; i++) {
            let element = svg.segments[i];    
            if (element[1] < mix)
                mix = element[1];
            if (element[2] < miy)
                miy = element[2];    
        }
        console.log("min x = "+mix);
        console.log("min y = "+miy);
        

        if (conversionOptions.moveTo00)
        {
            translateX+= -mix;
            translateY+= -miy;
        }

        var blocks = this.getBlocks(svg, conversionOptions);
        this.calculateTravels(blocks);
        
        output = this.create(blocks,conversionOptions);

        let convertionDuration = new Date() -  convertionStart;
        console.info('Execution time: %dms', convertionDuration)
        return output;
    }	
}
