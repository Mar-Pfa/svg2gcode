/* eslint-disable no-console */
'use strict';
var fs = require('fs');
var gCodeConverter = require('./gCodeConverter.js');
/*
    settings here
*/

// input file name
let srcFile = 'D:\\Install\\kosselsoftware\\eigene objekte\\wortuhr\\ziffernblatt_moos2.svg';

// output file name
let dstFile = 'D:\\Install\\kosselsoftware\\eigene objekte\\wortuhr\\ziffernblatt_moos3.gcode';

// conversion options
let gCode = {
    moveTo00 : false,  // move the corner to zero and have only positive coordinates
    translateX : 0,   
    translateY : 0,
    before: "",
    after: "",
    laserOn : "M3 S255",
    laserOff : "M5",
    feedRateMove : 2000,
    feedrateLaser :100,
    loops : 3, // number of loops the whole thing should run
    loopChangeGCode : ["G1 Z64 F1000","G1 Z63 F1000","G1 Z62 F1000"], // gcode to add before every loop
    blockloop : true
}

gCode.before+="M420 S"; // activate auto leveling
gCode.before+="M106 S255\n"; // start van
gCode.before+="M302 S0\n"; // allow cold extrusion
gCode.before+="M104 S200\n"; // set target temperatur (for starting the heater / power supply for laser module) on my special machine

/*
for (var i = 0;i<gCode.loops;i++)
{
    gCode.after+=gCode.loopChangeGCode[i];
    gCode.after+="\nG1 X0 Y0 F"+gCode.feedRateMove+"\n";
    gCode.after+=gCode.laserOn+"\n";
    gCode.after+="G1 X500 Y0 F"+gCode.feedrateLaser+"\n";
    gCode.after+="G1 X500 Y500 F"+gCode.feedrateLaser+"\n";
    gCode.after+="G1 X0 Y500 F"+gCode.feedrateLaser+"\n";
    gCode.after+="G1 X0 Y0 F"+gCode.feedrateLaser+"\n";    
    gCode.after+=gCode.laserOff+"\n";
}
*/

/*
    bigboy 150nm Laser 
    80g Papier -> Laser Feedrate = 100 = schneiden
    160g Karton -> Laser Feedrage = 50? = schneiden
    dicker Karton -> Laser Feedrate = 30 + 2 Layer
    
*/  

console.log('reading file '+srcFile+'...');
var content = fs.readFileSync(srcFile, 'utf8');

console.log('constructing file...');
var converter = new gCodeConverter();
var converted = converter.convert(content, gCode);

fs.writeFileSync(dstFile, converted, 'utf8');
console.log('output written to '+dstFile);
console.log('bye');

