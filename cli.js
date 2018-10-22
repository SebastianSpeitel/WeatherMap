#!/usr/bin/env node
const weatherMap = require('./weatherMap.js');

const apiKeys = ['01f36d619f504e0c3cb4e5d759ddea6e', '9075ef9dc883280499c44f891a2d2d77', '4d3ac2bef472d9e0292107b5fa4592ff', '02a0553a3a2abee59faf576d4c93ff3a', '0e6f6583bc6917b91266ef7f69f9e0c3', 'e92ab83de1f613f3edb779bb4464708e', 'dba07699bb103b2f6eb8408ae79d2527', 'b7b6faeb5676f88d4e4601518b099b9d', 'b45cff4bd861482938039b62774cc0ac', '61c1d0531e5438d1847d59ff19716310', '132a560491db8742f4a8ab1c4d1d6f85', 'c5cfa032c69d991806c97ddd667a7b3c', '6e414016a58de60f116665b0306ec9f5', '427659fa11d014944d302734e230d9b9', 'ac532b30cbb7a851fd068088c7b0ff50', '1f5994e32468d5210cfa373171ef5009', '6354a8a61a80dc2fc378b52958a44d5a', 'c9748c3d8d3f4386a458d7bc91d502fe', '0b5ecc7354b6ffe2047bb11a2c20509a', '1cb509630c5397150c44a634c5f65f0f']

weatherMap.setKeys(apiKeys);
const locations = [707860, 2878044, 803611, 874652, 2347078, 2822542, 2896514];
weatherMap.loaded.then(main);

async function main() {
    const map = new weatherMap.WeatherMap({ locs: locations, verbose: true });

    setInterval(() => map.render(), 1000);
    setTimeout(() => map.display(), 1000);
}
