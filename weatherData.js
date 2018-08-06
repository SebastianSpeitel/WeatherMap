'use strict';
const fs = require("fs");
const { OWM } = require('./OWM.js');

const api = new OWM({
    apiKeys: ['01f36d619f504e0c3cb4e5d759ddea6e', '9075ef9dc883280499c44f891a2d2d77', '4d3ac2bef472d9e0292107b5fa4592ff', '02a0553a3a2abee59faf576d4c93ff3a', '0e6f6583bc6917b91266ef7f69f9e0c3', 'e92ab83de1f613f3edb779bb4464708e', 'dba07699bb103b2f6eb8408ae79d2527', 'b7b6faeb5676f88d4e4601518b099b9d', 'b45cff4bd861482938039b62774cc0ac', '61c1d0531e5438d1847d59ff19716310', '132a560491db8742f4a8ab1c4d1d6f85', 'c5cfa032c69d991806c97ddd667a7b3c', '6e414016a58de60f116665b0306ec9f5', '427659fa11d014944d302734e230d9b9', 'ac532b30cbb7a851fd068088c7b0ff50', '1f5994e32468d5210cfa373171ef5009', '6354a8a61a80dc2fc378b52958a44d5a', 'c9748c3d8d3f4386a458d7bc91d502fe', '0b5ecc7354b6ffe2047bb11a2c20509a', '1cb509630c5397150c44a634c5f65f0f']
});

function readJSON(file, options = {}, fallback) {
    return new Promise(function (resolve, reject) {
        fs.readFile(file, options, (err, data) => {
            if (err) reject(err);
            let json;
            try {
                json = JSON.parse(data);
            } catch (e) {
                if (fallback) resolve(fallback);
                else reject(e);
                return;
            }
            resolve(json);
        });
    });
}

function writeJSON(file, json) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(file, JSON.stringify(json), err => err ? reject(err) : resolve());
    });
}

const loadedWeatherData = {
    data: new Map(),
    get: function (id, time, mode = '=') {
        if (!this.data.has(id)) return undefined;
        let arr = this.data.get(id);
        switch (mode) {
            case '~': return arr.sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time))[0];
            case '<<': {
                let oldest = arr.sort((a, b) => a.time - b.time)[0];
                return (!time || oldest.time < time) ? oldest : undefined;
            };
            case '>>': {
                let newest = arr.sort((a, b) => b.time - a.time)[0];
                return (!time || newest.time > time) ? newest : undefined;
            };
            case '=': return arr.find(d => d.time === time);
            default: return arr.find(d => d.time === time);
        }
    },
    add: function (data) {
        if (this.get(data.id, data.time)) return;
        let arr = this.data.get(data.id) || [];
        arr.push(data);
        if (arr.length === 1) this.data.set(data.id, arr);
        console.log(`Added 1 data point, now ${this.data.size} different IDs`);
        if (this.loaded) this.save().catch(err => console.log(err));
    },
    load: function () {
        this;
        let p = readJSON('./weatherData.json', {}, [])
            .then(json => {
                json.forEach(d => WeatherData.fromJSON(d));
                console.log(`Loaded ${json.length} data points.`);
            });
        p.then(() => {
            this.loaded = true;
            this.save();
        });
        return p;
    },
    save: function () {
        if (this.retrySaving) clearTimeout(this.retrySaving);
        if (this.saving) {
            this.retrySaving = setTimeout(() => this.save(), 1000);
            return Promise.reject('Already saving').catch(err => console.log(err));
        }
        if (!this.loaded) return Promise.reject('Not loaded yet').catch(err => console.log(err));
        if (this.saving) clearTimeout(this.saving);
        this.saving = setTimeout(() => this.saving = false, 1000);
        let json = [];
        this.data.forEach(arr => arr.forEach(d => json.push(d)));
        writeJSON(`./backupData/weatherData${Math.floor(Date.now() / 1000)}.json`, json);
        return writeJSON('./weatherData.json', json)
            .then(() => this.saving = false)
            .then(() => console.log(`Saved ${json.length} data points.`));
    }
}
module.exports.loaded = loadedWeatherData.load();

let loadedSymbol = Symbol('loaded');
class WeatherData {
    constructor(opt = {}) {
        this.id = opt.id;
        this[loadedSymbol] = (() => {
            if (opt.json) {
                Object.assign(this, opt.json);
                loadedWeatherData.add(this);
                return Promise.resolve(true);
            }
            else if (this.id && opt.fromAPI) {
                return api
                    .weather({ id: this.id })
                    .then(json => {
                        if (json.cod !== 200) throw 'Invalid API response';
                        Object.assign(this, OWM.parse(json, OWM.WEATHER));
                        loadedWeatherData.add(this);
                        return true;
                    })
                    .catch(err => {
                        console.log('WeatherData couldn\'t load from API:' + err);
                        return false;
                    });
            }
            return Promise.resolve(false);
        })();
    }

    get loaded() {
        return this[loadedSymbol];
    }

    static fromJSON(json) {
        return loadedWeatherData.get(json.id, json.time, '=') || new WeatherData({ id: json.id, json: json });
    }

    static fromAPI(id) {
        return new WeatherData({ id: id, fromAPI: true });
    }

    static fromID(id, time, mode = '>>') {
        return loadedWeatherData.get(id, time, mode) || WeatherData.fromAPI(id);
    }



    //get json() {
    //    return this._json;
    //}

    //get lat() { return this.json.lat || 0; }
    //get lon() { return this.json.lon || 0; }
    //get temp() { return this.json.temp; }
    //get hum() { return this.json.hum; }
    //get pressure() { return this.json.pressure; }
    //get rain() { return this.json.rain || 0; }
    //get snow() { return this.json.snow || 0; }
    //get clouds() { return this.json.clouds || 0; }
    //get windspd() { return this.json.windspd || 0; }
    //get windang() { return this.json.windang || 0; }
    //get sunrise() { return this.json.sunrise; }
    //get sunset() { return this.json.sunset; }
    //get name() { return this.json.name || 'City'; }
    //get time() { return this.json.time || 0; }
}

class Location {
    constructor(id, opt = {}) {
        this.id = id;
        this.maxage = opt.maxage || 3600000;
        this._time = opt.time || 'now';
        this.mode = opt.mode || '~';
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

    weather(time = Date.now(), mode = '~') {
        if (this.time - time < 100 && this.mode === mode) return this._weather;
        else return WeatherData.fromID(this.id, time, mode);
    }
}

module.exports.Location = Location;