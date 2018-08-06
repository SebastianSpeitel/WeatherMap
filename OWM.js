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

    static parse(json, types = this.ALL) {
        let parsed = { id: json.id, time: json.dt * 1000 };
        if ((types & this.WEATHER) === this.WEATHER) {
            parsed.weather = json.weather[0].id;
            parsed.temp = json.main.temp;
            parsed.hum = json.main.humidity;
            parsed.pressure = json.main.pressure;
            parsed.windspeed = json.wind.speed;
            parsed.windangle = json.wind.deg;
            parsed.clouds = json.clouds ? json.clouds.all : 0;
            parsed.rain = json.rain ? json.rain['3h'] : 0;
            parsed.snow = json.snow ? json.snow['3h'] : 0;
        }
        if ((types & this.META) === this.META) {
            parsed.lat = json.coord.lat;
            parsed.lon = json.coord.lon;
            parsed.base = json.base;
            parsed.name = json.name;
            parsed.country = json.sys.country;
        }
        if ((types & this.SUN) === this.SUN) {
            parsed.sunset = json.sys.sunset;
            parsed.sunrise = json.sys.sunrise;
        }
        return parsed;
    }

    get apiKey() {
        if (typeof this.apiKeyIndex !== 'undefined')
            this.apiKeyIndex = (this.apiKeyIndex + 1) % this.apiKeys.length;
        else this.apiKeyIndex = 0;
        console.log(`Used API-Key #${this.apiKeyIndex+1}/${this.apiKeys.length}`);
        return this.apiKeys[this.apiKeyIndex];
    }

    weather(params = {}) {
        let url = `${this.apiRoot}weather?APPID=${this.apiKey}`;
        for (let p in params) url += `&${p}=${encodeURIComponent(params[p])}`;
        return fetch(url).then(res => res.json());
    }
}

module.exports.OWM = OWM;