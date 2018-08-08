'use strict';
const wD = require('./weatherData.js');
const LEDStrip = require('./LEDStrip.js');
const WeatherData = wD.WeatherData;
const MetaData = wD.MetaData;

module.exports.setKeys = function (apiKeys) {
    wD.setKeys(apiKeys);
}
module.exports.loaded = wD.loaded;

class WeatherMap {
    constructor(opt = {}) {
        let locOpt = opt.locOpt || { mode: '>>' };
        this.locs = opt.locs ? opt.locs.map(id => new Location(id, locOpt)) : [];
        this.leds = new LEDStrip(this.locs.length, false);

    }

    render() {
        this.locs.forEach((l, i) => {
            let w = l.weather;
            //console.log(w);
            let b = w.hum || 0;
            this.leds.set(i, 0, 0, b);
        });
        this.leds.render();
    }

    display() {
        this.locs.forEach(l => l.display());
    }
}

class Location {
    constructor(id, opt = {}) {
        this.id = id;
        this.maxage = opt.maxage || 3600000;
        this._time = opt.time || 'now';
        this.mode = opt.mode || '~';

        this._meta = MetaData.fromID(this.id);
        this._weather = null;
        this.loadWeather()
            .then(loaded => {
                if (!loaded || this._weather.time < this.time - this.maxage) {
                    this._weather = WeatherData.fromID(this.id, this.time, '~');
                }
            });
        setInterval(() => this.loadWeather(), this.maxage);
    }

    get time() {
        return (this._time === 'now' ? Date.now() : this._time) - (this.mode === '>>' ? this.maxage : 0);
    }

    loadWeather() {
        let w = WeatherData.fromID(this.id, this.time, this.mode);
        if (!this._weather) this._weather = w;
        return w.loaded.then(loaded => {
            if (loaded) this._weather = w;
            return loaded;
        });
    }

    get weather() {
        return this._weather;
    }

    get meta() {
        return this._meta;
    }

    weatherAt(time = Date.now(), mode = '~') {
        if (this.time - time < 100 && this.mode === mode) return this.weather;
        else return WeatherData.fromID(this.id, time, mode);
    }

    display() {
        console.log(this.meta);
        console.log(this.weather);
    }
}

module.exports.WeatherMap = WeatherMap;
module.exports.Location = Location;