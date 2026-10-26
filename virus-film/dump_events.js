// выгружает реальные таймкоды событий анимации для звукового дизайна
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, 'index.html'));
  const ev = await p.evaluate(() => ({ buds: BUDS.map(b => ({ pinch: b.pinch, snip: b.snip, lead: !!b.lead })), abs: ABS.map(a => a.tb) }));
  fs.writeFileSync(path.join(__dirname, 'events.json'), JSON.stringify(ev)); await b.close();
})();
