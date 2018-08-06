'use strict';
const wD = require('./weatherData.js');

const locations = new Set();

wD.loaded.then(() => {

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

}).catch(err => console.log(err));
