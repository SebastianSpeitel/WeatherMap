'use strict';
const fetch = require('node-fetch');

class OWM {
    constructor(opt = {}) {
        this.apiKeys = opt.apiKeys || [];
        if (opt.apiKey) this.apiKeys.push(opt.apiKey);
        if (this.apiKeys.length === 0) this.apiKeys.push('6b65e4f425913ce51afa43f377eee63d');
        this.apiRoot = opt.apiRoot || 'http://api.openweathermap.org/data/2.5/';
    }

    static get WEATHER() { return 1; }
    static get META() { return 2; }
    static get SUN() { return 4; }
    static get ALL() { return this.WEATHER + this.META + this.SUN; }

    static flatten(json, types = this.ALL) {
        let flat = { id: json.id, time: json.dt };
        if ((types & this.WEATHER) === this.WEATHER) {
            flat.weather = json.weather[0].id;
            flat.temp = json.main.temp;
            flat.hum = json.main.humidity;
            flat.pressure = json.main.pressure;
            flat.windspeed = json.wind.speed;
            flat.windangle = json.wind.deg;
            flat.clouds = json.clouds ? json.clouds.all : 0;
            flat.rain = json.rain ? json.rain['3h'] : 0;
            flat.snow = json.snow ? json.snow['3h'] : 0;
        }
        if ((types & this.META) === this.META) {
            flat.lat = json.coord.lat;
            flat.lon = json.coord.lon;
            flat.base = json.base;
            flat.name = json.name;
            flat.country = json.sys.country;
        }
        if ((types & this.SUN) === this.SUN) {
            flat.sunset = json.sys.sunset;
            flat.sunrise = json.sys.sunrise;
        }
        return flat;
    }

    get apiKey() {
        if (this.apiKeyIndex)
            this.apiKeyIndex = (this.apiKeyIndex + 1) % this.apiKeys.length;
        else this.apiKeyIndex = 0;
        return this.apiKeys[this.apiKeyIndex];
    }

    weather(params = {}) {
        let url = `${this.apiRoot}weather?APPID=${this.apiKey}`;
        for (let p in params) url += `&${p}=${encodeURIComponent(params[p])}`;
        return fetch(url).then(res => res.json());
    }
}

module.exports.OWM = OWM;