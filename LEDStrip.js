const chalk = require('chalk');

let ws281x;
try {
    ws281x = require('rpi-ws281x-native');
} catch (er) {
    ws281x = null;
}

class LEDStrip {
    constructor(cnt = 1, toConsole = false) {
        this.cnt = cnt || 1;
        this.pixel = new Uint32Array(this.cnt);
        this.pixelRGB = Array(this.cnt).fill({ r: 0, g: 0, b: 0 });
        this.toConsole = toConsole;
        if (ws281x) ws281x.init(this.NUM_LEDS);
    }

    set(i, r, g, b, update = true) {
        if (i < 0 || i >= this.pixel.length) throw new Error('IndexOutOfBounds');
        r = Math.round(Math.min(Math.max(0, r), 255));
        g = Math.round(Math.min(Math.max(0, g), 255));
        b = Math.round(Math.min(Math.max(0, b), 255));
        
        let c = ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
        this.pixelRGB[i] = { r: r, g: g, b: b };
        this.pixel[i] = c;
        if (update) this.update();
    }

    get text() {
        return this.pixelRGB.reduce((s, c) => s += chalk.rgb(c.r, c.g, c.b)('█'), '');
    }

    update() {
        if (ws281x) ws281x.render(this.pixel);
        if (this.toConsole) console.log(this.text);
    }
}

module.exports = LEDStrip;