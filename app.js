'use strict';
const wD = require('./weatherData.js');
const leds = new (require('./LEDStrip.js'))(60);

wD.loaded.then(main).catch(err => console.log(err));
const locations = new Set();

function main() {

    console.log('starting app.js');
    locations.add(new wD.Location(707860, { mode: '>>' }));
    locations.add(new wD.Location(2878044, { mode: '>>' }));
    locations.add(new wD.Location(803611, { mode: '>>' }));
    locations.add(new wD.Location(874652, { mode: '>>' }));
    locations.add(new wD.Location(2347078, { mode: '>>' }));
    locations.add(new wD.Location(2822542, { mode: '>>' })); //Thüringen
    locations.add(new wD.Location(2896514, { mode: '>>' })); //Ilmenau
    //setTimeout(() => {
    //    locations.forEach(l => console.log(l.weather()));

    //}, 1000);
    let i = 0;
    locations.forEach((l) => {
        let w = l.weather();
        leds.set(i++, 0, 0, w.hum);
    });
    console.log(`LEDS:${leds.text}`);


}

