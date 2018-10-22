'use strict';
const wD = require('./weatherData.js');
const LEDStrip = require('./LEDStrip.js');
const WeatherData = wD.WeatherData;
const MetaData = wD.MetaData;

module.exports.setKeys = function (apiKeys) {
    wD.setKeys(apiKeys);
};
module.exports.loaded = wD.loaded;

function map(i, im = 0, iM = 1, om = 0, oM = 1) {
    return (i - im) / (iM - im) * (oM - om) + om;
}
const cmapping = {
    bluetored: function (p) {
        return {
            r: map(p, 0, 1, 0, 255),
            g: 0,
            b: map(p, 0, 1, 255, 0)
        };
    },
    blacktowhite: function (p) {
        return {
            r: map(p, 0, 1, 0, 255),
            g: map(p, 0, 1, 0, 255),
            b: map(p, 0, 1, 0, 255)
        };
    },
    blacktored: function (p) {
        return {
            r: map(p, 0, 1, 0, 255),
            g: 0,
            b: 0
        };
    },
    whitetoblue: function (p) {
        return {
            r: map(p, 0, 1, 255, 0),
            g: map(p, 0, 1, 255, 0),
            b: 255
        };
    },
    greentored: function (p) {
        return {
            r: map(p, 0, 1, 0, 255),
            g: map(p, 0, 1, 255, 0),
            b: 0
        };
    },
    blacktoyellow: function (p) {
        return {
            r: map(p, 0, 1, 0, 255),
            g: map(p, 0, 1, 0, 255),
            b: 0
        };
    },
    redtoblack: function (p) {
        return {
            r: map(p, 0, 1, 255, 0),
            g: 0,
            b: 0
        };
    },
    redtoyellow: function (p) {
        return {
            r: 255,
            g: map(p, 0, 1, 0, 255),
            b: 0
        };
    },
    yellowtored: function (p) {
        return {
            r: 255,
            g: map(p, 0, 1, 255, 0),
            b: 0
        };
    }
};

const mapping = {
    temp: function (t) {
        return cmapping.bluetored(map(t, 207, 307));
    },
    hum: function (h) {
        return cmapping.whitetoblue(map(h, 0, 100));
    },
    clouds: function (c) {
        return cmapping.blacktowhite(c);
    },
    windspeed: function (w) {
        return cmapping.greentored(map(w, 0, 10));
    },
    pressure: function (p) {
        return cmapping.bluetored(map(p, 900, 1100));
    },
    rain: function (r) {
        return cmapping.whitetoblue(map(r, 0, 30));
    },
    snow: function (s) {
        return cmapping.blacktowhite(map(s, 0, 30));
    },
    sunrise1: function (t) {
        return cmapping.blacktored(map(t, 60 * 5, 0));
    },
    sunrise2: function (t) {
        return cmapping.redtoyellow(map(t, 0, 60 * 5));
    },
    sunset1: function (t) {
        return cmapping.yellowtored(map(t, 60 * 5, 0));
    },
    sunset2: function (t) {
        return cmapping.redtoblack(map(t, 0, 60 * 5));
    }
};

class WeatherMap {
    constructor(opt = {}) {
        let locOpt = opt.locOpt || { mode: '>>' };
        /**@type Location[] */
        this.locs = opt.locs ? opt.locs.map(id => new Location(id, locOpt)) : [];
        this.leds = new LEDStrip(this.locs.length, !!opt.verbose);
        this.type = opt.type || 'rain';
    }

    render() {
        this.locs.forEach((l, i) => {
            /**value */
            /**color */
            let c = { r: 0, g: 0, b: 0 };
            switch (this.type) {
                case 'sunlight':
                    let { sunrise, sunset } = l.weather;
                    if (!sunrise) sunrise = 0;
                    if (!sunset) sunset = 0;
                    const now = Date.now() / 1000;

                    const set = Math.abs(sunset - now);
                    const rise = Math.abs(sunrise - now);
                    let nearest = rise < set ? 'rise' : 'set';

                    if (sunset > sunrise) {
                        if (sunrise > now)
                            c = mapping.sunrise1(rise);
                        else if (sunset > now && nearest === 'rise')
                            c = mapping.sunrise2(rise);
                        else if (sunset > now && nearest === 'set')
                            c = mapping.sunset1(set);
                        else if (sunset < now)
                            c = mapping.sunset2(set);
                    }
                    break;
                default:
                    if (mapping[this.type]) {
                        let v = l.weather[this.type];
                        c = mapping[this.type](v);
                    }
            }
            this.leds.set(i, c);
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