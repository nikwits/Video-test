// Tile out/still-*.png into one contact sheet (out/sheet.png) for quick review.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('/opt/node22/lib/node_modules/');
const {chromium} = require('playwright');

const files = fs.readdirSync('out').filter((f) => /^still-\d+\.png$/.test(f)).sort();
const cells = files
  .map((f) => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join('out', f)).toString('base64')}"><figcaption>${f}</figcaption></figure>`)
  .join('');
const cols = 3;
const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},432px);gap:6px">
<style>figure{margin:0;color:#fff;font:20px sans-serif}img{width:432px;height:768px;display:block}</style>${cells}</body>`;
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'});
const page = await browser.newPage({viewport: {width: cols * 438, height: 800}});
await page.setContent(html);
await page.screenshot({path: 'out/sheet.png', fullPage: true});
await browser.close();
console.log('out/sheet.png');
