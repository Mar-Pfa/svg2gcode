# svg2gcode

svg2cgode is a small helper tool for converting svg-export from OpenSCAD to gcode for my laser cutter
it does not support the full SVG features but only what is needed to create gcode based on a OpenSCAD "projection"
outputs estimated production times based on the calculated feedrates
supports M118 / Progressinformation during the production process

## Usage

supports a range of parameters (can be all configured in index.js)

beside input- and output filename you can specify the following things:

`moveTo00`
move the corner to zero and have only positive coordinates (so if you're smallest x = -10 every coordinate will be translated x+=10)

`translateX, translateY`
add the given value to the coordinates

`before`
gcode that should be executed before the whole thing starts

`after`
gcode that should be executed after finishing the job

`laserOn`
gcode for activating the laser

`laserOff`
gcode for deactivating the laser

`feedRateMove`
feedrate for motion without laser - could be normally really fast

`feedrateLaser`
feedrate when having the laser active

`loops`
number of loops the whole thing should run -> if you set 2 than the whole thing will run two times

`loopChangeGCode`
gcode to add when changing the loop, this is an array, you can specify for every loop a gcode e.g. changing the z-height (if you burn through thick material you probably want two loops with different height because of laser focus)

`blockloop`
loop a single svg blocks or loop the whole file?

## Example config

`
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
`
