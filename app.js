'use strict';
const wD = require('./weatherData.js');

console.log('Hello world');

let loc = new wD.Location(707860);
setTimeout(() => console.log(loc.currentWeather), 1000);

wD.loaded.then(console.log('loaded')).catch(err => console.log(err));
