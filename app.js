'use strict';
const wD = require('./weatherData.js');

console.log('Hello world');

const locations = new Set();

wD.loaded.then(() => {

    console.log('loaded');
    locations.add(new wD.Location(707860));
    locations.add(new wD.Location(2878044));
    locations.add(new wD.Location(803611));
    locations.add(new wD.Location(874652));
    locations.add(new wD.Location(2347078));
    setTimeout(() => {
        locations.forEach(l => console.log(l.weather()));
    }, 1000);

}).catch(err => console.log(err));
