// Покадровый рендер диапазона кадров в MP4-сегмент: node render.js <from> <to> <sub> <out.mp4>
const { chromium } = require('playwright'); const path = require('path'); const { spawn } = require('child_process');
(async () => {
  const [from, to, sub, out] = process.argv.slice(2); const FPS = 60;
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => { console.error('ERR', e.message); process.exit(1); });
  await p.goto('file://' + path.resolve(__dirname, 'index.html'));
  await p.evaluate(() => document.fonts.load('600 40px "Inter Display"'));
  await p.evaluate(() => document.fonts.load('800 40px "Inter Display"'));
  for (let i = +from; i < +to; i++) {
    const data = await p.evaluate(([t, s]) => { renderFrame(t, s); return document.getElementById('c').toDataURL('image/jpeg', .95); }, [i / FPS, +sub]);
    const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 100 === 0) console.log(out, i);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
})();
