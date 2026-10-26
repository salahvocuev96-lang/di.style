'use strict';
// ---------- общие помощники для 2D-камеры с глубиной ----------
function camT(ctx, c, d = 1) { ctx.translate(W / 2, H / 2); ctx.rotate(c.r || 0); ctx.scale(c.z / d, c.z / d); ctx.translate(-c.x, -c.y); }
function camSpline(t, keys) { const k = spline(t, keys); return { x: k[0], y: k[1], z: Math.exp(k[2]), r: k[3] || 0 }; }
const small = mk(480, 270), small2 = mk(480, 270);
// слой, отрисованный в 1/4 разрешения и размытый — дешёвая глубина резкости
function softLayer(ctx, fn, blurPx = 2, alpha = 1) {
  const s = small.getContext('2d'), s2 = small2.getContext('2d');
  s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, 480, 270);
  s.save(); s.scale(.25, .25); fn(s); s.restore();
  s2.setTransform(1, 0, 0, 1, 0, 0); s2.clearRect(0, 0, 480, 270);
  s2.filter = `blur(${blurPx}px)`; s2.drawImage(small, 0, 0); s2.filter = 'none';
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(small2, 0, 0, W, H); ctx.restore();
}
function chaikin(p, it = 2) {
  for (let k = 0; k < it; k++) {
    const o = [p[0]];
    for (let i = 0; i < p.length - 1; i++) { const [ax, ay] = p[i], [bx, by] = p[i + 1]; o.push([ax * .75 + bx * .25, ay * .75 + by * .25], [ax * .25 + bx * .75, ay * .25 + by * .75]); }
    o.push(p[p.length - 1]); p = o;
  }
  return p;
}
// рецептор: гликановая цепочка с сиаловой кислотой на конце
function receptor(ctx, bx, by, tx, ty, t, bound) {
  const n = 4, mx = (bx + tx) / 2 + Math.sin(t * 1.4 + bx) * 10, my = (by + ty) / 2;
  ctx.strokeStyle = 'rgba(150,220,255,.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
  for (let i = 1; i <= n; i++) {
    const u = i / n, x = (1 - u) * (1 - u) * bx + 2 * (1 - u) * u * mx + u * u * tx, y = (1 - u) * (1 - u) * by + 2 * (1 - u) * u * my + u * u * ty;
    const col = i === n ? (bound ? [255, 255, 255] : PAL.pink) : [120, 200, 255];
    ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(x, y, i === n ? 9 : 6, 0, TAU); ctx.fill();
    if (i === 2) { ctx.beginPath(); ctx.arc(x + 14, y - 6, 5, 0, TAU); ctx.fill(); ctx.fillStyle = rgba(PAL.pink, 1); ctx.beginPath(); ctx.arc(x + 22, y - 14, 6, 0, TAU); ctx.fill(); }
  }
}

// ===================== СЦЕНА 3: клетка-мишень, связывание, эндоцитоз, слияние =====================
const RP = 168;
const yM3 = x => x * x / 16000;
const cam3 = t => camSpline(t, [[13.8, [0, -470, 0, .02]], [15.0, [10, -300, .25, -.02]], [15.9, [0, -170, .34, .02]], [16.7, [0, -110, .3, 0]], [18.0, [-20, 170, .12, -.03]], [19.5, [-60, 380, .22, .02]], [21.0, [-90, 520, .3, -.02]], [22.4, [-60, 650, .2, .04]]]);
const pocketP = t => E.io(seg(t, 16.3, 18.0));
const endoC = t => spline(t, [[18.0, [0, RP * 1.02]], [19.5, [-50, 380]], [21.0, [-90, 520]], [22.4, [-110, 590]]]);
function hero3(t) {
  if (t < 16.3) { const k = spline(t, [[13.8, [0, -380]], [15.0, [-10, -280]], [15.6, [-6, -220]], [16.0, [0, -176]]]); if (t > 15.6) k[1] += Math.sin(seg(t, 15.6, 16.3) * Math.PI * 2) * 6 * (1 - seg(t, 15.9, 16.3)); return k; }
  if (t < 18.0) { const p = pocketP(t); return [0, lerp(-RP, RP * 1.02, p) - 8 * (1 - p)]; }
  const c = endoC(t); return [c[0] + Math.sin(t * 2) * 6, c[1] + Math.cos(t * 1.7) * 6];
}
const S3REC = (() => { const a = []; for (let x = -1520; x <= 1520; x += 95) a.push({ x, h: 105 + hash(x) * 40, ph: hash(x + 7) * 6 }); return a; })();
const CITY = (() => {
  const r = rng(41), mito = [], ves = [], mt = [], er = [];
  for (let i = 0; i < 9; i++) mito.push({ x: -1600 + r() * 3200, y: 300 + r() * 900, a: r() * 3, l: 90 + r() * 70, ph: r() * 6 });
  for (let i = 0; i < 12; i++) { const a = -2.6 + r() * 2.2, pts = []; for (let k = 0; k < 8; k++) pts.push([-200 + Math.cos(a) * k * 260 + Math.sin(k + i) * 40, 1300 + Math.sin(a) * k * 260 + Math.cos(k * 1.3 + i) * 40]); mt.push(pts); }
  for (let i = 0; i < 40; i++) ves.push({ m: i % 12, ph: r(), sp: .05 + r() * .08, s: 8 + r() * 10 });
  for (let i = 0; i < 6; i++) er.push({ r: 820 + i * 90, a0: -2.9 + r() * .4, a1: -.3 - r() * .5 });
  return { mito, ves, mt, er };
})();
function city3(ctx, t, take = 0) { // «живой город»: задний план цитоплазмы (рисуется в мировых координатах слоя)
  const nuc = [200, 1500];
  const g = ctx.createRadialGradient(nuc[0], nuc[1], 100, nuc[0], nuc[1], 760);
  g.addColorStop(0, 'rgba(120,60,200,.9)'); g.addColorStop(.85, 'rgba(90,40,170,.8)'); g.addColorStop(1, 'rgba(160,120,255,.9)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nuc[0], nuc[1], 700, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(80,200,255,.35)'; ctx.lineWidth = 26;
  for (const e of CITY.er) { ctx.beginPath(); for (let a = e.a0; a < e.a1; a += .05) { const rr = e.r + Math.sin(a * 9 + t) * 18; const x = nuc[0] + Math.cos(a) * rr, y = nuc[1] + Math.sin(a) * rr; a === e.a0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,255,230,.35)'; ctx.lineWidth = 6;
  for (const m of CITY.mt) { ctx.beginPath(); m.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
  for (const v of CITY.ves) {
    const m = CITY.mt[v.m], u = ((v.ph + t * v.sp) % 1) * (m.length - 1), i = Math.floor(u), f = u - i;
    const x = lerp(m[i][0], m[i + 1][0], f), y = lerp(m[i][1], m[i + 1][1], f);
    ctx.fillStyle = 'rgba(140,255,240,.9)'; ctx.beginPath(); ctx.arc(x, y, v.s * 2, 0, TAU); ctx.fill();
  }
  for (const m of CITY.mito) {
    ctx.save(); ctx.translate(m.x + Math.sin(t * .5 + m.ph) * 20, m.y); ctx.rotate(m.a + Math.sin(t * .3 + m.ph) * .2);
    ctx.fillStyle = 'rgba(255,140,110,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, m.l, m.l * .42, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,180,.8)'; ctx.lineWidth = 7; ctx.beginPath();
    for (let k = -4; k <= 4; k++) { ctx.moveTo(k * m.l * .2, -m.l * .3); ctx.lineTo(k * m.l * .2 + m.l * .08, m.l * .3); } ctx.stroke(); ctx.restore();
  }
}
function scene3(ctx, t) {
  const c = cam3(t);
  ctx.fillStyle = '#120a35'; ctx.fillRect(0, 0, W, H);
  // задний план: внутренности клетки (глубже, с параллаксом и размытием)
  softLayer(ctx, s => { camT(s, c, 1.7); s.translate(c.x * (1 - 1 / 1.7), c.y * (1 - 1 / 1.7)); city3(s, t); }, 2.2, .85);
  ctx.save(); camT(ctx, c);
  const hx = 0, p = pocketP(t), pinched = t >= 18.0;
  const yc = lerp(-RP, RP * 1.02, p);
  // путь мембраны
  let mem = [];
  const ripple = x => pinched ? 34 * Math.exp(-((x - hx) ** 2) / 50000) * Math.sin((t - 18) * 14) * Math.exp(-(t - 18) * 2.2) : 0;
  const half = !pinched && Math.abs(yc) < RP ? Math.sqrt(RP * RP - yc * yc) : 0;
  for (let x = -2800; x <= hx - half; x += 24) mem.push([x, yM3(x) + ripple(x)]);
  if (half > 0) {
    let aL = Math.atan2(-yc, -half); if (aL < 0) aL += TAU;
    const aR = Math.atan2(-yc, half);
    for (let a = aL; a > aR; a -= .06) mem.push([hx + Math.cos(a) * RP, yc + Math.sin(a) * RP]);
    mem.push([hx + half, 0]);
  }
  for (let x = Math.ceil((hx + half) / 24) * 24; x <= 2800; x += 24) mem.push([x, yM3(x) + ripple(x)]);
  mem = chaikin(mem, 2);
  // внеклеточное пространство поверх «города»
  ctx.beginPath(); ctx.moveTo(-3000, -3000); mem.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(3000, -3000); ctx.closePath();
  const eg = ctx.createLinearGradient(0, -900, 0, 0); eg.addColorStop(0, 'rgba(8,14,46,1)'); eg.addColorStop(1, 'rgba(18,26,80,.93)');
  ctx.fillStyle = eg; ctx.fill();
  // цитоплазма — лёгкая вуаль
  ctx.beginPath(); ctx.moveTo(-3000, 3000); mem.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(3000, 3000); ctx.closePath();
  ctx.fillStyle = 'rgba(90,50,180,.18)'; ctx.fill();
  // частицы-рибосомы среднего плана
  const r = rng(77);
  for (let i = 0; i < 120; i++) {
    const x = -1800 + r() * 3600, y = 60 + r() * 1400 + Math.sin(t + i) * 10;
    drawSprite(ctx, 'ball', [170, 140, 255], x + Math.sin(t * .7 + i) * 12, y, 5 + r() * 5, 0, .7);
  }
  // рецепторы
  for (const R of S3REC) {
    if (Math.abs(R.x - hx) < 140 && t > 15.75) continue;
    const by = yM3(R.x) + ripple(R.x), sw = Math.sin(t * 1.3 + R.ph) * .25;
    receptor(ctx, R.x, by, R.x + Math.sin(sw) * R.h, by - Math.cos(sw) * R.h, t, false);
  }
  // клатриновая «шуба» на цитоплазматической стороне кармана
  const coatA = seg(t, 16.4, 16.9) * (1 - seg(t, 18.1, 18.9));
  const [ex, ey] = pinched ? endoC(t) : [hx, yc];
  if (coatA > 0) {
    ctx.strokeStyle = `rgba(120,255,200,${.8 * coatA})`; ctx.lineWidth = 4;
    for (let a = 0; a < TAU; a += .21) {
      const y0 = ey + Math.sin(a) * (RP + 26); if (!pinched && y0 < 8) continue;
      const x0 = ex + Math.cos(a) * (RP + 26 + (1 - coatA) * 30);
      ctx.beginPath(); for (let k = 0; k < 3; k++) { const b = a + k * TAU / 3 + t; ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.cos(b) * 13, y0 + Math.sin(b) * 13); } ctx.stroke();
    }
  }
  bilayer(ctx, mem, false, { col: [120, 210, 255], head: [170, 235, 255], w: 18, bead: 5.5, glow: 1 });
  // эндосома после отшнуровки
  const fus = seg(t, 20.75, 21.25);
  if (pinched) {
    const acid = E.s(seg(t, 18.6, 20.2));
    const fc = mix([90, 220, 255], [255, 140, 60], acid);
    ctx.fillStyle = rgba(fc, .16 + .12 * acid); ctx.beginPath(); ctx.arc(ex, ey, RP, 0, TAU); ctx.fill();
    // протонные насосы и H+
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * TAU + .4, px = ex + Math.cos(a) * RP, py = ey + Math.sin(a) * RP;
      ctx.fillStyle = 'rgba(255,200,120,.95)'; ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillRect(-14, -12, 28, 24); ctx.restore();
      for (let j = 0; j < 7; j++) {
        const u = ((t - 18.5) * 1.4 + j / 7) % 1; if (t < 18.5 || t > 21) continue;
        const rr = RP * (1 - u * .75);
        drawSprite(ctx, 'glow', PAL.orange, ex + Math.cos(a + u * .4) * rr, ey + Math.sin(a + u * .4) * rr, 9, 0, .9 * (1 - u) * (1 - fus));
      }
    }
    if (t > 18.7 && t < 20.4) { ctx.font = `700 26px ${FONT}`; ctx.fillStyle = `rgba(255,200,120,${seg(t, 18.7, 19) * (1 - seg(t, 20.1, 20.4))})`; ctx.fillText('H⁺', ex + RP + 30, ey - RP * .4); }
    // мембрана эндосомы с порой слияния
    const gap = fus * 1.1, pa = .75;
    const pts = []; for (let a = pa + gap; a < pa + TAU - gap; a += .05) pts.push([ex + Math.cos(a) * RP, ey + Math.sin(a) * RP]);
    bilayer(ctx, pts, gap <= 0.001, { col: mix([120, 210, 255], [255, 170, 90], acid * .6), head: [180, 235, 255], w: 16, bead: 5 });
  }
  // связанные рецепторы
  const hp = hero3(t);
  if (t > 15.75 && t < 20.4) {
    for (const k of [-1, 0, 1]) {
      const a = Math.PI / 2 + k * .55;
      const flat = [hx + k * 95, yM3(k * 95)], arc = [ex + Math.cos(a) * RP, ey + Math.sin(a) * RP];
      const b = pinched ? arc : [lerp(flat[0], arc[0], clamp(p * 3)), lerp(flat[1], arc[1], clamp(p * 3))];
      const att = [hp[0] + Math.cos(a) * 150, hp[1] + Math.sin(a) * 150];
      receptor(ctx, b[0], b[1], att[0], att[1], t, true);
    }
  }
  // герой
  const ext = 1 + .55 * E.back(seg(t, 20.15, 20.6));
  const fadeH = 1 - E.i2(fus);
  if (fadeH > 0) {
    drawSprite(ctx, 'glow', PAL.magenta, hp[0], hp[1], 170, 0, .35 * fadeH);
    drawVirus(ctx, hp[0], hp[1], 120 * (1 + fus * .3), { t, ...heroRot(t), ext, glow: .7, alpha: fadeH, face: heroLook(t),
      squash: t > 15.9 && t < 16.4 ? [1 - .08 * Math.sin(seg(t, 15.9, 16.4) * Math.PI), Math.PI / 2] : null });
  }
  // вспышки сцепления
  if (t > 15.9 && t < 16.6) {
    const u = seg(t, 15.95, 16.6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const k of [-1, 0, 1]) { const a = Math.PI / 2 + k * .55; drawSprite(ctx, 'glow', PAL.lime, hp[0] + Math.cos(a) * 150, hp[1] + Math.sin(a) * 150, 30 + u * 40, 0, 1 - u); }
    ctx.strokeStyle = `rgba(210,255,120,${(1 - u) * .7})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hp[0], hp[1] + 120, 40 + u * 220, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  // выход 8 сегментов РНП через пору
  if (t > 20.9) rnpBurst(ctx, t, ex, ey);
  ctx.restore();
  caption(ctx, t, 15.5, 17.6, 'гемагглютинин + сиаловая кислота', 'Связывание с рецептором', 130, 960, { size: 40 });
  caption(ctx, t, 17.7, 19.4, 'эндоцитоз', 'Клетка сама втягивает вирус', 130, 960, { size: 40 });
  caption(ctx, t, 19.5, 21.9, 'pH падает', 'Кислая среда запускает слияние мембран', 130, 960, { size: 40, col: PAL.orange });
  vignette(ctx, .55);
}
// РНП: общий трек (используется в сценах 3 и 4, в мировых координатах сцены 3)
function rnpState(t, ex, ey) {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const u = Math.max(0, t - 20.95 - i * .03);
    const a = .75 + (i - 3.5) * .16, sp = 260 * (1 - Math.exp(-u * 3)) + u * 60;
    out.push({ x: ex + Math.cos(a) * (40 + sp) + Math.sin(t * 2 + i) * 10, y: ey + Math.sin(a) * (40 + sp), ang: a + Math.sin(t * 3 + i) * .4, i });
  }
  return out;
}
function rnpBurst(ctx, t, ex, ey) {
  const st = rnpState(t, ex, ey), k = E.o(seg(t, 20.95, 21.4));
  for (const s of st) drawRNP(ctx, snake(s.x, s.y, s.ang + Math.PI, 40 + 60 * k, 9, t, s.i), RNP_COLS[s.i], 14, t);
  const lead = st[3];
  drawFace(ctxSave(ctx, lead.x, lead.y), 48, { lx: Math.cos(lead.ang) * .6, ly: .3, lid: .4, mood: 'smug' }, t); ctx.restore();
}
function ctxSave(ctx, x, y) { ctx.save(); ctx.translate(x, y); return ctx; }

// ===================== СЦЕНА 4: захват клетки =====================
const CELL = { rx: 1700, ry: 1050 };
const NUC = { x: 220, y: 180, r: 430 };
const RIB = [-350, 140]; // рибосома для сверхкрупного плана
const BUD = [60, -1050];
const cam4 = t => camSpline(t, [[21.9, [-700, -520, .26, .03]], [23.3, [-430, -280, .1, -.02]], [24.6, [-180, -60, -.15, .02]], [25.9, [40, 0, -.72, -.03]], [26.7, [-160, 80, -.55, 0]], [27.35, [RIB[0], RIB[1] - 10, 1.45, .02]], [28.15, [RIB[0], RIB[1] - 25, 1.55, -.02]], [28.95, [-80, -560, -.05, .03]], [30.1, [BUD[0], BUD[1] + 20, .72, 0]], [32.1, [BUD[0], BUD[1] - 80, .83, 0]]]);
const C4 = (() => {
  const r = rng(51), mito = [], mt = [], ves = [], pores = [], er = [], ribos = [], gol = [];
  for (let i = 0; i < 12; i++) pores.push(-Math.PI + i / 12 * TAU + .13);
  for (let i = 0; i < 8; i++) { let x, y; do { x = (r() - .5) * 2900; y = (r() - .5) * 1700; } while (Math.hypot(x - NUC.x, y - NUC.y) < 820 || (x / 1550) ** 2 + (y / 950) ** 2 > 1); mito.push({ x, y, a: r() * 3, l: 90 + r() * 50, ph: r() * 6 }); }
  const cen = [-560, -260];
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + r() * .3, pts = []; for (let k = 0; k < 9; k++) { const rr = k * 190; pts.push([cen[0] + Math.cos(a + Math.sin(k * .7 + i) * .12) * rr, cen[1] + Math.sin(a + Math.sin(k * .7 + i) * .12) * rr * .7]); } mt.push(pts.filter(p => (p[0] / 1650) ** 2 + (p[1] / 1000) ** 2 < 1)); }
  for (let i = 0; i < 60; i++) ves.push({ m: i % 16, ph: r(), sp: .06 + r() * .1, s: 9 + r() * 8 });
  for (let i = 0; i < 6; i++) { const rr = 540 + i * 62, a0 = -3.0 + r() * .5, a1 = a0 + 1.6 + r() * 1.6; er.push({ rr, a0, a1 }); for (let a = a0; a < a1; a += .09) ribos.push({ x: NUC.x + Math.cos(a) * (rr + 16), y: NUC.y + Math.sin(a) * (rr + 16), a, ph: r() }); }
  for (let i = 0; i < 5; i++) gol.push(i);
  return { mito, mt, ves, pores, er, ribos, gol, cen };
})();
const GOLGI = [-380, -620];
const SITES = [[-300, -1018], [BUD[0], BUD[1]], [420, -1000]];
function ellY(x) { return -CELL.ry * Math.sqrt(Math.max(0, 1 - (x / CELL.rx) ** 2)); }
function budH(t) { return 125 * E.io(seg(t, 29.6, 32.0)); }
function cellPath(t) {
  const pts = [];
  for (let i = 0; i < 260; i++) {
    const a = i / 260 * TAU, x0 = Math.cos(a) * CELL.rx, y0 = Math.sin(a) * CELL.ry;
    let r = 1 + .006 * Math.sin(a * 7 + t * 1.3);
    pts.push([x0 * r, y0 * r]);
  }
  return pts;
}
// бугорок почки: локальная деформация верхней мембраны
function budMem(t, x0) {
  const h = budH(t), pts = [];
  for (let x = x0 - 1300; x <= x0 + 1300; x += 14) {
    const d = x - x0, base = ellY(x);
    pts.push([x, base - h * Math.exp(-(d * d) / (2 * 62 * 62))]);
  }
  return chaikin(pts, 1);
}
function scene4(ctx, t) {
  const c = cam4(t), take = E.s(seg(t, 25.2, 29.5));
  ctx.fillStyle = '#0d0a2e'; ctx.fillRect(0, 0, W, H);
  ctx.save(); camT(ctx, c);
  // цитоплазма (окрас постепенно «перехватывается» вирусной палитрой)
  const cp = cellPath(t);
  ctx.beginPath(); cp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  const cg = ctx.createRadialGradient(0, 0, 200, 0, 0, 1800);
  cg.addColorStop(0, rgba(mix([60, 50, 150], [120, 40, 140], take), 1)); cg.addColorStop(1, rgba(mix([40, 30, 110], [80, 20, 90], take), 1));
  ctx.fillStyle = cg; ctx.fill();
  // ЭР с рибосомами
  ctx.lineCap = 'round';
  for (const e of C4.er) {
    ctx.strokeStyle = 'rgba(90,200,255,.32)'; ctx.lineWidth = 34; ctx.beginPath();
    for (let a = e.a0; a < e.a1; a += .03) { const rr = e.rr + Math.sin(a * 11 + t * .8) * 10; const x = NUC.x + Math.cos(a) * rr, y = NUC.y + Math.sin(a) * rr; a === e.a0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke(); ctx.strokeStyle = 'rgba(150,230,255,.55)'; ctx.lineWidth = 5; ctx.stroke();
  }
  for (const b of C4.ribos) {
    const act = take > 0 && b.ph < .75 * take;
    ctx.fillStyle = act ? 'rgba(220,255,120,1)' : 'rgba(190,170,255,.95)';
    ctx.beginPath(); ctx.arc(b.x, b.y, act ? 9 + Math.sin(t * 12 + b.ph * 9) * 2 : 7, 0, TAU); ctx.fill();
  }
  // Гольджи
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = rgba(mix([255, 190, 120], [255, 140, 200], take), .8); ctx.lineWidth = 22 - i * 2;
    ctx.beginPath(); ctx.arc(GOLGI[0], GOLGI[1] + 330 + i * 36, 300 - i * 18, -2.2 + i * .05, -.95 - i * .05); ctx.stroke();
  }
  // микротрубочки и собственный транспорт клетки (затухает при захвате)
  ctx.strokeStyle = 'rgba(120,255,230,.22)'; ctx.lineWidth = 5;
  for (const m of C4.mt) { if (m.length < 2) continue; ctx.beginPath(); m.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }
  for (const v of C4.ves) {
    const m = C4.mt[v.m]; if (m.length < 2) continue;
    const ph = (v.ph + (t - 22) * v.sp * (1 - .85 * take)) % 1, u = ph * (m.length - 1), i = Math.floor(u), f = u - i;
    const x = lerp(m[i][0], m[Math.min(m.length - 1, i + 1)][0], f), y = lerp(m[i][1], m[Math.min(m.length - 1, i + 1)][1], f);
    drawSprite(ctx, 'ball', PAL.teal, x, y, v.s, 0, 1 - .7 * take);
  }
  for (const m of C4.mito) {
    ctx.save(); ctx.translate(m.x + Math.sin(t * .5 + m.ph) * 16, m.y); ctx.rotate(m.a + Math.sin(t * .3 + m.ph) * .15);
    ctx.fillStyle = rgba(mix([255, 130, 100], [120, 90, 110], take * .8), .95); ctx.beginPath(); ctx.ellipse(0, 0, m.l, m.l * .42, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(mix([255, 225, 180], [150, 130, 140], take * .8), .9); ctx.lineWidth = 7; ctx.beginPath();
    for (let k = -4; k <= 4; k++) { ctx.moveTo(k * m.l * .19, -m.l * .3); ctx.lineTo(k * m.l * .19 + m.l * .08, m.l * .3); } ctx.stroke(); ctx.restore();
  }
  // ядро: двойная мембрана с порами
  const nucGlow = E.s(seg(t, 24.6, 25.4)) * (1 - .3 * seg(t, 28, 30));
  const ng = ctx.createRadialGradient(NUC.x - 120, NUC.y - 120, 50, NUC.x, NUC.y, NUC.r);
  ng.addColorStop(0, rgba(mix([150, 90, 230], [255, 120, 210], nucGlow), 1)); ng.addColorStop(1, rgba(mix([80, 40, 170], [150, 40, 150], nucGlow), 1));
  ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(NUC.x, NUC.y, NUC.r, 0, TAU); ctx.fill();
  const r = rng(61);
  for (let i = 0; i < 26; i++) { const a = r() * TAU, rr = r() * NUC.r * .8; ctx.fillStyle = 'rgba(60,20,120,.35)'; ctx.beginPath(); ctx.arc(NUC.x + Math.cos(a) * rr, NUC.y + Math.sin(a) * rr, 30 + r() * 50, 0, TAU); ctx.fill(); }
  // копии РНП внутри ядра
  const nCopies = Math.floor(48 * E.o(seg(t, 24.9, 27.6)));
  for (let i = 0; i < nCopies; i++) {
    const a = hash(i) * TAU + t * (.3 + hash(i + 3) * .4), rr = 80 + hash(i + 9) * 260;
    const x = NUC.x + Math.cos(a) * rr, y = NUC.y + Math.sin(a) * rr;
    const born = seg(t, 24.9 + i * .055, 25.2 + i * .055);
    drawRNP(ctx, snake(x, y, a + 1.6, 46 * born, 6, t, i), RNP_COLS[i % 8], 10, t, born);
  }
  for (let ring = 0; ring < 2; ring++) {
    const rr = NUC.r + ring * 22, pts = [];
    for (let a = 0; a < TAU; a += .02) pts.push([NUC.x + Math.cos(a) * rr, NUC.y + Math.sin(a) * rr]);
    bilayer(ctx, pts, true, { col: [180, 140, 255], head: [210, 190, 255], w: 12, bead: 4 });
  }
  for (const a of C4.pores) {
    const x = NUC.x + Math.cos(a) * (NUC.r + 11), y = NUC.y + Math.sin(a) * (NUC.r + 11);
    ctx.fillStyle = 'rgba(30,10,60,1)'; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(230,220,255,.95)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.stroke();
  }
  // вирусная мРНК: из пор к рибосомам ЭР
  if (t > 25.2) {
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,240,110,.9)';
    for (let i = 0; i < 40; i++) {
      const born = 25.2 + i * .07, u = seg(t, born, born + 1.1); if (u <= 0 || u >= 1) continue;
      const pa = C4.pores[i % 12], rb = C4.ribos[(i * 7) % C4.ribos.length];
      const sx = NUC.x + Math.cos(pa) * NUC.r, sy = NUC.y + Math.sin(pa) * NUC.r;
      const x = lerp(sx, rb.x, E.io(u)), y = lerp(sy, rb.y, E.io(u)), a = Math.atan2(rb.y - sy, rb.x - sx);
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const px = x - Math.cos(a) * k * 9 + Math.sin(k * 1.7 + t * 10) * 5, py = y - Math.sin(a) * k * 9; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    }
  }
  // вирусные белки: ЭР → Гольджи → места сборки на мембране
  if (t > 26.0) {
    for (let i = 0; i < 70; i++) {
      const born = 26 + i * .065, u = seg(t, born, born + 2.4); if (u <= 0 || u >= 1) continue;
      const rb = C4.ribos[(i * 11) % C4.ribos.length], site = SITES[i % 3];
      const p = spline(u, [[0, [rb.x, rb.y]], [.45, [GOLGI[0] + 40 * Math.sin(i), GOLGI[1] + 160]], [1, [site[0] + (hash(i) - .5) * 160, site[1] + 26]]]);
      const na = i % 5 === 0;
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(-Math.PI / 2 + Math.sin(t * 3 + i) * .4);
      ctx.strokeStyle = rgba(na ? PAL.orange : PAL.lime, 1); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(28, 0); ctx.stroke();
      ctx.fillStyle = rgba(na ? PAL.orange : PAL.lime, 1); ctx.beginPath(); ctx.ellipse(32, 0, 11, 8, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    // новые РНП уходят из ядра к местам сборки
    for (let i = 0; i < 24; i++) {
      const born = 27.4 + i * .1, u = seg(t, born, born + 2.0); if (u <= 0) continue;
      const pa = C4.pores[(i % 4) + 7], site = SITES[i % 3];
      const sx = NUC.x + Math.cos(pa) * NUC.r, sy = NUC.y + Math.sin(pa) * NUC.r;
      const tx = site[0] + ((i >> 1) % 4 - 1.5) * 18, ty = site[1] + 120 + (i % 2) * 18;
      const x = lerp(sx, tx, E.io(u)), y = lerp(sy, ty, E.io(u));
      drawRNP(ctx, snake(x, y, -Math.PI / 2 + Math.sin(i) * .3, 40, 6, t, i), RNP_COLS[i % 8], 10, t);
    }
  }
  // РНП героя: из эндосомы к ядерным порам
  if (t < 25.2) {
    for (let i = 0; i < 8; i++) {
      const pa = C4.pores[(i % 4) + 6] + (i > 3 ? .04 : -.04);
      const st = [-700 + Math.cos(.75 + (i - 3.5) * .16) * 300, -520 + Math.sin(.75 + (i - 3.5) * .16) * 300];
      const en = [NUC.x + Math.cos(pa) * NUC.r, NUC.y + Math.sin(pa) * NUC.r];
      const u = E.io(seg(t, 21.9 + i * .05, 24.6 + i * .06));
      const mid = [lerp(st[0], en[0], .5) - 120, lerp(st[1], en[1], .5) - 60];
      const p = spline(u, [[0, st], [.5, mid], [1, en]]), p2 = spline(Math.max(0, u - .02), [[0, st], [.5, mid], [1, en]]);
      const ang = Math.atan2(p[1] - p2[1], p[0] - p2[0]) + Math.PI;
      const a = 1 - seg(u, .94, 1);
      drawRNP(ctx, snake(p[0], p[1], ang, 100, 9, t, i), RNP_COLS[i], 14, t, a);
      if (i === 3 && a > 0) { ctx.save(); ctx.globalAlpha = a; drawFace(ctxSave(ctx, p[0], p[1]), 48, { lx: Math.cos(ang + Math.PI) * .7, ly: Math.sin(ang + Math.PI) * .7, lid: .4, mood: 'smug' }, t); ctx.restore(); ctx.restore(); }
    }
  }
  // сверхкрупный план: рибосома синтезирует белок и он сворачивается в шип
  ribosomeCU(ctx, t);
  // мембрана клетки (низ/бока — общий контур; верх у почки — с бугорком)
  bilayer(ctx, cp, true, { col: [120, 210, 255], head: [170, 235, 255], w: 18, bead: 5.5, glow: 1 });
  assembly(ctx, t);
  ctx.restore();
  caption(ctx, t, 23.0, 24.9, 'ядро клетки', 'Геном вируса проникает в ядро', 130, 960, { size: 40 });
  caption(ctx, t, 25.3, 28.0, 'захват клетки', 'Клетка копирует РНК вируса и синтезирует его белки', 130, 960, { size: 40 });
  caption(ctx, t, 29.4, 31.7, 'сборка', 'Новые частицы собираются у мембраны', 130, 960, { size: 40 });
  vignette(ctx, .55);
}
function ribosomeCU(ctx, t) {
  if (t < 26.4 || t > 29.2) return;
  const [x, y] = RIB, k = E.o(seg(t, 26.4, 26.9)) * (1 - seg(t, 28.9, 29.2));
  // воздушная перспектива: всё за рибосомой уходит в дымку, пока камера близко
  const haze = seg(cam4(t).z, 1.2, 3.5) * k;
  if (haze > 0) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const hg = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * .7);
    hg.addColorStop(0, `rgba(70,25,130,${.62 * haze})`); hg.addColorStop(1, `rgba(20,6,50,${.85 * haze})`);
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { // размытые частицы переднего плана
      const px = (hash(i) * W + t * (40 + hash(i + 2) * 80)) % (W + 200) - 100, py = hash(i + 5) * H + Math.sin(t + i) * 30;
      drawSprite(ctx, i % 4 ? 'disc' : 'ball', i % 3 ? [150, 110, 255] : PAL.teal, px, py, 10 + hash(i + 8) * 40, 30, .35 * haze);
    }
    ctx.restore();
  }
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = k;
  // тРНК подносят аминокислоты
  for (let j = 0; j < 4; j++) {
    const u = ((t - 26.5) * .9 + j / 4) % 1; if (t < 26.5) continue;
    const px = u < .5 ? lerp(-140, -6, E.o(u * 2)) : lerp(-6, 150, E.i2((u - .5) * 2)), py = u < .5 ? lerp(-70, 6, E.o(u * 2)) : lerp(6, -60, E.i2((u - .5) * 2));
    ctx.strokeStyle = 'rgba(120,255,220,.9)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px - 8, py + 10); ctx.lineTo(px, py - 6); ctx.lineTo(px + 10, py - 4); ctx.stroke();
    if (u < .5) { ctx.fillStyle = '#d7ff5a'; ctx.beginPath(); ctx.arc(px + 12, py - 8, 3.4, 0, TAU); ctx.fill(); }
  }
  // мРНК проходит сквозь рибосому
  const shift = (t * 40) % 12;
  ctx.strokeStyle = 'rgba(255,240,110,1)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-90, 18); for (let i = -90; i <= 90; i += 6) ctx.lineTo(i, 18 + Math.sin(i * .2 + t * 6) * 1.5); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = -90 - shift; i <= 90; i += 12) { ctx.moveTo(i, 14); ctx.lineTo(i, 22); } ctx.stroke();
  // субъединицы
  const g1 = ctx.createRadialGradient(-8, -18, 2, 0, -6, 34); g1.addColorStop(0, '#f0e6ff'); g1.addColorStop(1, '#7b5ad6');
  ctx.fillStyle = g1; ctx.beginPath(); ctx.ellipse(0, -6, 30, 22, 0, 0, TAU); ctx.fill();
  const g2 = ctx.createRadialGradient(-6, 26, 2, 0, 30, 22); g2.addColorStop(0, '#e0f0ff'); g2.addColorStop(1, '#5a7ad6');
  ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(0, 30, 22, 12, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(140,240,255,.7)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(0, -6, 30, 22, 0, -.2, 1.9); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 30, 22, 12, 0, -.2, 1.9); ctx.stroke();
  // растущая цепочка аминокислот → сворачивается в шип гемагглютинина
  const grow = seg(t, 26.7, 27.75), fold = E.io(seg(t, 27.75, 28.35)), leave = E.i2(seg(t, 28.35, 29.0));
  const n = 16;
  for (let i = 0; i < n; i++) {
    if (i / n > grow) break;
    const chain = [Math.sin(i * .9 + t * 3) * 7 + i * 1.5, -28 - i * 5];
    const ang = i < 9 ? 0 : (i - 9) / 7 * TAU;
    const spike = i < 9 ? [0, -30 - i * 4] : [Math.cos(ang) * 9, -76 + Math.sin(ang) * 6 - 6];
    const px = lerp(chain[0], spike[0], fold), py = lerp(chain[1], spike[1], fold) - leave * 120;
    ctx.fillStyle = fold > .5 ? '#d7ff5a' : RNP_COLS[i % 8].length ? rgba(mix(PAL.lime, [255, 255, 255], .3 * (1 - fold)), 1) : '#fff';
    ctx.beginPath(); ctx.arc(px, py, 3.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function assembly(ctx, t) {
  if (t < 28.6) return;
  const a = E.o(seg(t, 28.6, 29.4));
  for (const [i, s] of SITES.entries()) {
    const main = i === 1, sx = s[0];
    const h = main ? budH(t) : budH(t) * .45;
    // бугорок мембраны
    if (h > 1) {
      const pts = [];
      for (let x = sx - 220; x <= sx + 220; x += 10) { const d = x - sx; pts.push([x, ellY(x) - h * Math.exp(-(d * d) / (2 * 70 * 70))]); }
      ctx.save(); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(70,40,130,1)'; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.lineTo(sx + 220, ellY(sx + 220) + 30); ctx.lineTo(sx - 220, ellY(sx - 220) + 30); ctx.fill();
      bilayer(ctx, pts, false, { col: [120, 210, 255], head: [170, 235, 255], w: 18, bead: 5.5 }); ctx.restore();
    }
    // шипы на наружной стороне участка сборки
    const nSp = Math.floor(14 * E.o(seg(t, 28.6 + i * .2, 30.6 + i * .2)));
    for (let k = 0; k < nSp; k++) {
      const x = sx + (k - 6.5) * 17;
      const d = x - sx, y = ellY(x) - h * Math.exp(-(d * d) / (2 * 70 * 70));
      const sl = -h * Math.exp(-(d * d) / (2 * 70 * 70)) * (-d / (70 * 70));
      const ang = Math.atan2(-1, -sl * 0.9 + (ellY(x + 1) - ellY(x)));
      const na = k % 5 === 2, col = na ? PAL.orange : PAL.lime;
      const ex = x + Math.cos(ang) * 40, ey = y + Math.sin(ang) * 40;
      ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * 10, y + Math.sin(ang) * 10); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.ellipse(ex, ey, 10, 8, ang, 0, TAU); ctx.fill();
    }
    // матрица М1 и пучок из 8 РНП под мембраной
    if (main && t > 29.4) {
      const k = E.o(seg(t, 29.4, 30.6));
      for (let j = 0; j < 12; j++) { const x = sx + (j - 5.5) * 14, d = x - sx; const y = ellY(x) - h * Math.exp(-(d * d) / (2 * 70 * 70)) + 18; ctx.fillStyle = `rgba(80,30,160,${k})`; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }
      const cy = ellY(sx) - h * .55 + 30 * (1 - k);
      for (let j = 0; j < 8; j++) {
        const ox = j === 7 ? 0 : Math.cos(j / 7 * TAU) * 22, oy = j === 7 ? 0 : Math.sin(j / 7 * TAU) * 14;
        drawRNP(ctx, snake(sx + ox, cy + oy + 34, -Math.PI / 2, 54, 6, t * .3, j, .08), RNP_COLS[j], 8, t, k);
      }
    }
  }
}
