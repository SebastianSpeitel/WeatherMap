const chalk = require('chalk');

let ws281x;
try {
    ws281x = require('rpi-ws281x-native');
} catch (e) {
    ws281x = null;
}

const black = { r: 0, g: 0, b: 0 };

class LEDStrip {
    constructor(len = 1, log = false) {
        this.len = len || 1;
        this.pixel = new Uint32Array(this.len);
        this.pixelRGB = Array(this.len).fill(black);
        this.log = log;
        if (ws281x) ws281x.init(this.len);
    }

    resize(len) {
        this.len = len;
        let pixel = new Uint32Array(this.len);
        this.pixel.forEach((p, i) => { if (i < this.len) pixel[i] = p; });
        while (this.pixelRGB.length < this.len) this.pixelRGB.push(black);
        this.pixelRGB = this.pixelRGB.slice(0, this.len);
        if (ws281x) {
            ws281x.reset();
            ws281x.init(this.len);
        }
    }

    set(i, r, g, b, render = false) {
        if (i < 0 || i >= this.len) throw new RangeError('Index out of bounds');
        if (typeof i !== 'number' || typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') throw TypeError('Parameter not a number');
        i = Math.round(i);
        r = Math.round(Math.min(Math.max(0, r), 255));
        g = Math.round(Math.min(Math.max(0, g), 255));
        b = Math.round(Math.min(Math.max(0, b), 255));

        let c = ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
        this.pixelRGB[i] = { r: r, g: g, b: b };
        this.pixel[i] = c;
        if (render) this.render();
    }

    get text() {
        return this.pixelRGB.reduce((s, c) => s += chalk.rgb(c.r, c.g, c.b)('█'), '');
    }

    render() {
        if (ws281x) ws281x.render(this.pixel);
        if (this.log) console.log(this.text);
    }
}

module.exports = LEDStrip;