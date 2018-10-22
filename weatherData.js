'use strict';
const fs = require("fs");
const { OWM } = require('./OWM.js');

const api = new OWM();
module.exports.setKeys = function (apiKeys) {
    api.apiKeys.push(...apiKeys);
};

function readJSON(file, options = {}, fallback) {
    return new Promise(function (resolve, reject) {
        fs.readFile(file, options, (err, data) => {
            if (err) {
                if (typeof fallback !== 'undefined') resolve(fallback);
                else reject(err);
                return;
            }

            let json;
            try {
                json = JSON.parse(data);
            } catch (e) {
                if (typeof fallback !== 'undefined') resolve(fallback);
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

const loadedMetaData = {
    data: new Map(),
    get: function (id) {
        return this.data.get(id);
    },
    add: function (data) {
        if (!data.id) return;
        this.data.set(data.id, data);
        if (this.loaded) this.save().catch(err => console.log(err));
    },
    load: function () {
        let p = readJSON('./metaData.json', {}, [])
            .then(json => {
                json.forEach(d => this.add(new MetaData({ id: d.id, json: d })));
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
            return Promise.reject('Already saving metaData').catch(err => console.log(err));
        }
        if (!this.loaded) return Promise.reject('metaData not loaded yet').catch(err => console.log(err));
        if (this.saving) clearTimeout(this.saving);
        this.saving = setTimeout(() => this.saving = false, 1000);
        let json = Array.from(this.data.values());
        writeJSON(`./backupData/metaData${Math.floor(Date.now() / 1000)}.json`, json);
        return writeJSON('./metaData.json', json)
            .then(() => this.saving = false)
            .then(() => console.log(`Saved ${json.length} metaData points.`));
    }
};

class MetaData {
    constructor(opt = {}) {
        this.id = opt.id;
        if (opt.json) Object.assign(this, opt.json);
        else api
            .weather({ id: this.id })
            .then(json => {
                Object.assign(this, OWM.parse(json, OWM.META));
                loadedMetaData.add(this);
            });
    }

    static fromID(id) {
        return loadedMetaData.get(id) || new MetaData({ id: id });
    }
}

const loadedWeatherData = {
    data: new Map(),
    get: function (id, time, mode = '=') {
        let arr = this.data.get(id);
        if (!arr) return undefined;
        switch (mode) {
            case '~': return arr.sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time))[0];
            case '<<': {
                let oldest = arr.sort((a, b) => a.time - b.time)[0];
                return !time || oldest.time < time ? oldest : undefined;
            }
            case '>>': {
                let newest = arr.sort((a, b) => b.time - a.time)[0];
                return !time || newest.time > time ? newest : undefined;
            }
            case '=': return arr.find(d => d.time === time);
            default: return arr.find(d => d.time === time);
        }
    },
    add: function (data) {
        if (this.get(data.id, data.time)) return;
        let arr = this.data.get(data.id) || [];
        arr.push(data);
        if (arr.length === 1) this.data.set(data.id, arr);
        console.log(`Added 1 weatherData point, now ${this.data.size} different IDs`);
        if (this.loaded) this.save().catch(err => console.log(err));
    },
    load: function () {
        let p = readJSON('./weatherData.json', {}, [])
            .then(json => {
                json.forEach(d => WeatherData.fromJSON(d));
                console.log(`Loaded ${json.length} weatherData points.`);
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
            return Promise.reject('Already saving weatherData').catch(err => console.log(err));
        }
        if (!this.loaded) return Promise.reject('weatherData not loaded yet').catch(err => console.log(err));
        if (this.saving) clearTimeout(this.saving);
        this.saving = setTimeout(() => this.saving = false, 1000);
        let json = [];
        this.data.forEach(arr => arr.forEach(d => json.push(d)));
        writeJSON(`./backupData/weatherData${Math.floor(Date.now() / 1000)}.json`, json);
        return writeJSON('./weatherData.json', json)
            .then(() => this.saving = false)
            .then(() => console.log(`Saved ${json.length} data points.`));
    }
};
module.exports.loaded = Promise.all([loadedWeatherData.load(), loadedMetaData.load()]);

const loadedSymbol = Symbol('loaded');
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
                        Object.assign(this, OWM.parse(json, OWM.WEATHER + OWM.SUN));
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
}
module.exports.WeatherData = WeatherData;
module.exports.MetaData = MetaData;