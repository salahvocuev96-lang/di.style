// быстрые проверочные кадры: node shots.js out_dir t1 t2 ...
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [out, ...ts] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => document.fonts.load('600 40px "Inter Display"'));
  for (const t of ts) {
    const t0 = Date.now();
    const data = await p.evaluate(tt => { renderFrame(+tt); return document.getElementById('c').toDataURL('image/jpeg', .85); }, t);
    fs.writeFileSync(path.join(out, `t${(+t).toFixed(2).padStart(5, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
    console.log(t, Date.now() - t0, 'ms');
  }
  await b.close();
})();
