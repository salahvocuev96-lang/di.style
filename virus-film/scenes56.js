'use strict';
// ===================== СЦЕНА 5: почкование, распространение, иммунный ответ =====================
const RB = 95;
const cellTop5 = (x, cx = 0) => 650 - 650 * Math.sqrt(Math.max(0, 1 - ((x - cx) / 800) ** 2));
const cam5 = t => camSpline(t, [[31.8, [0, -80, .83, 0]], [32.0, [0, -80, .83, 0]], [33.4, [-10, -190, .3, .02]], [35.0, [-110, -250, -.42, -.04]], [36.8, [-260, -170, -.8, .03]], [38.6, [-600, -250, -.5, -.02]], [40.2, [-900, -270, -.08, .02]], [41.9, [-1010, -270, .12, 0]], [42.4, [-1020, -270, .15, 0]]]);
const BUDS = (() => {
  const r = rng(81), a = [{ x: 0, tb: 30.6, lead: true }];
  const xs = [-300, 290, -560, 520, -150, 160, -420, 400, -650, 640, -60, 240, -300, 470, -520, 90, -230, 330, -600, 560];
  xs.forEach((x, i) => a.push({ x: x + (r() - .5) * 40, tb: 31.6 + i * .3 + r() * .15 }));
  for (const b of a) {
    b.pinch = b.tb + 2.0; b.snip = b.pinch + (b.lead ? .45 : .35);
    const left = b.lead || r() < .6, far = r();
    b.path = b.lead ? [[0, [0, -RB]], [.2, [-60, -300]], [.45, [-380, -420]], [.7, [-700, -360]], [1, [-1000, -260]]]
      : [[0, [b.x, cellTop5(b.x) - RB]], [.3, [b.x * 1.4 + (left ? -200 : 200), -380 - far * 300]], [1, [(left ? -1 : 1) * (1300 + far * 700), -150 - far * 500 + (r() < .5 ? 300 : 0)]]];
    b.dur = b.lead ? 7.0 : 4 + r() * 3; b.ph = r() * 6;
  }
  return a;
})();
const ABS = (() => {
  const r = rng(91), a = [];
  const flying = BUDS.filter(b => !b.lead);
  for (let i = 0; i < 44; i++) {
    const b = flying[i % flying.length], tb = 38.2 + r() * 2.2;
    a.push({ b, tb, sx: -2700 - r() * 600, sy: -1300 + r() * 1500, off: r() * TAU, rot: r() * 6 });
  }
  for (let k = 0; k < 4; k++) a.push({ b: BUDS[0], tb: 40.35 + k * .1, sx: -2400, sy: -800 + k * 300, off: 2.2 + k * .55, rot: k });
  for (const b of BUDS) { const m = a.filter(x => x.b === b).map(x => x.tb); b.bind = m.length ? Math.min(...m) : 1e9; }
  return a;
})();
function budPos(b, t) {
  if (t < b.snip) { const y0 = cellTop5(b.x); const g = E.io(seg(t, b.tb + .4, b.pinch)); return [b.x, y0 - RB * 1.3 * g + RB * .3 + (t > b.pinch ? -8 * seg(t, b.pinch, b.snip) : 0)]; }
  const tt = Math.min(t, b.bind);
  let u = seg(tt, b.snip, b.snip + b.dur); u = b.lead ? u : E.o(u) * .4 + u * .6;
  const p = spline(u, b.path);
  if (t > b.bind) { const k = t - b.bind; p[0] += Math.sin(k * 2 + b.ph) * 10 + k * 20; p[1] += k * 25; }
  return [p[0] + Math.sin(t * 1.3 + b.ph) * 12, p[1] + Math.cos(t * 1.1 + b.ph) * 12];
}
function domes(ctx, xs, tint, alpha, glowT) {
  for (const cx of xs) {
    const g = ctx.createLinearGradient(0, 0, 0, 1300);
    g.addColorStop(0, rgba(mix([90, 60, 190], tint, .3), alpha)); g.addColorStop(1, rgba([30, 16, 70], alpha));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, 650, 800, 650, 0, Math.PI, TAU); ctx.lineTo(cx + 800, 2400); ctx.lineTo(cx - 800, 2400); ctx.fill();
  }
}
function scene5(ctx, t) {
  const c = cam5(t);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#070c30'); bg.addColorStop(1, '#130838');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  shafts(ctx, t, -c.x * .1, [120, 140, 255], .8);
  // задний ряд клеток
  softLayer(ctx, s => { camT(s, c, 1.7); s.translate(c.x * (1 - 1 / 1.7), c.y * (1 - 1 / 1.7)); domes(s, [-2475, -825, 825, 2475], [60, 120, 255], .8); }, 2.5, .8);
  ctx.save(); camT(ctx, c);
  const ifn = t - 36.4;
  // клетки переднего ряда: в центре заражённая, по бокам соседи
  domes(ctx, [-1650, 1650, -3300, 3300], [70, 140, 255], 1);
  domes(ctx, [0], [255, 60, 160], 1);
  // антивирусное состояние соседей после сигнала интерферона
  if (ifn > .3) {
    for (const cx of [-1650, 1650]) {
      const k = E.o(seg(ifn, .3 + Math.abs(cx) / 4000, 1.2 + Math.abs(cx) / 4000));
      ctx.strokeStyle = rgba(PAL.cyan, .35 * k); ctx.lineWidth = 60;
      ctx.beginPath(); ctx.ellipse(cx, 650, 800, 650, 0, Math.PI, TAU); ctx.stroke();
    }
  }
  // мембраны клеток
  for (const cx of [-3300, -1650, 0, 1650, 3300]) {
    const pts = []; for (let x = cx - 790; x <= cx + 790; x += 16) {
      let y = cellTop5(x, cx);
      if (cx === 0) for (const b of BUDS) { if (t < b.tb || t > b.snip + .8) continue; const h = (t < b.pinch ? RB * 1.1 * E.io(seg(t, b.tb, b.pinch)) : RB * 1.1 * (1 - E.el(seg(t, b.pinch, b.pinch + .8)))); y -= h * Math.exp(-((x - b.x) ** 2) / (2 * 55 * 55)); }
      pts.push([x, y]);
    }
    bilayer(ctx, pts, false, { col: [120, 210, 255], head: [170, 235, 255], w: 18, bead: 5.5, glow: cx ? 1 : 1.6 });
  }
  // рецепторы на соседях (точки посадки)
  for (const cx of [-1650, 1650]) for (let x = cx - 640; x <= cx + 640; x += 110) { const y = cellTop5(x, cx), a = Math.atan2(-(cellTop5(x + 1, cx) - y), 1) - Math.PI / 2; receptor(ctx, x, y, x + Math.cos(a) * 80 + Math.sin(t + x) * 10, y + Math.sin(a) * 80, t, false); }
  // волны интерферона
  if (ifn > 0 && ifn < 2.4) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const rr = (ifn - k * .25) * 1700; if (rr < 0) continue; ctx.strokeStyle = rgba(PAL.cyan, .5 * (1 - seg(ifn, 0, 2.4))); ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(0, 500, rr, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke(); }
    ctx.restore();
  }
  // новые вирионы — копии героя
  for (const b of BUDS) {
    if (t < b.tb + .2) continue;
    const [x, y] = budPos(b, t), [xp, yp] = budPos(b, t - 1 / FPS);
    const dim = b.bind < 1e8 ? E.o(seg(t, b.bind, b.bind + .6)) : 0;
    const R = RB * (b.lead ? 1.05 : .92);
    const v = Math.hypot(x - xp, y - yp) * c.z;
    const face = { lx: clamp((x - xp) * .2, -1, 1), ly: clamp((y - yp) * .2, -1, 1), lid: .38, mood: dim > .1 ? 'worry' : 'smug', blink: Math.sin(Math.PI * seg((t + b.ph) % 3.1, 0, .16)) * .6 };
    if (b.lead && t > 39.9 && t < b.bind + .1) face.mood = 'shock', face.lx = -.9, face.ly = .1;
    if (b.lead && t > 41.0) face.mood = 'worry';
    if (t < b.pinch) {
      // ещё в мембране: клип по линии мембраны
      ctx.save(); ctx.beginPath(); ctx.rect(x - 400, y - 400, 800, cellTop5(b.x) - y + 400 + 8); ctx.clip();
      drawVirus(ctx, x, y, R, { t: t + b.ph, rx: .2, ry: b.ph, face: seg(t, b.pinch - .6, b.pinch) > 0 ? { ...face, lid: lerp(1, .38, seg(t, b.pinch - .5, b.pinch - .1)) } : null });
      ctx.restore();
    } else {
      // «привязь»: гемагглютинин держится за сиаловую кислоту, пока нейраминидаза не отрежет
      if (t < b.snip) { const yb = cellTop5(b.x); ctx.strokeStyle = 'rgba(255,140,200,.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y + R * 1.1); ctx.lineTo(b.x, yb); ctx.stroke(); }
      if (t > b.snip && t < b.snip + .3) { const u = seg(t, b.snip, b.snip + .3), yb = cellTop5(b.x); drawSprite(ctx, 'glow', PAL.orange, b.x, yb - 30, 40 + 60 * u, 0, 1 - u); }
      drawVirus(ctx, x, y, R, { t: t + b.ph, rx: t * .5 + b.ph, ry: t * .7 + b.ph, glow: .5 * (1 - dim), dim, face, naGlow: t > b.snip - .25 && t < b.snip + .1 ? 1.5 : 0,
        squash: [1 + Math.min(.15, v * .006) * (1 - dim), Math.atan2(y - yp, x - xp)], simple: c.z < .6 && !b.lead });
    }
  }
  // антитела
  for (const a of ABS) {
    const st = a.tb - 1.6; if (t < st) continue;
    const bp = budPos(a.b, Math.min(t, a.tb)), R = RB * 1.15;
    const tgt = [bp[0] + Math.cos(a.off) * R, bp[1] + Math.sin(a.off) * R];
    let x, y, ang;
    if (t < a.tb) { const u = E.io(seg(t, st, a.tb)); x = lerp(a.sx, tgt[0], u) + Math.sin(u * 9 + a.rot) * 40 * (1 - u); y = lerp(a.sy, tgt[1], u); ang = a.rot + t * 3 * (1 - u) + a.off * u; }
    else { const p = budPos(a.b, t); x = p[0] + Math.cos(a.off) * R; y = p[1] + Math.sin(a.off) * R; ang = a.off; }
    antibody(ctx, x, y, ang + Math.PI / 2, 1);
    if (t > a.tb && t < a.tb + .25) drawSprite(ctx, 'glow', PAL.white, x, y, 30 + 80 * seg(t, a.tb, a.tb + .25), 0, 1 - seg(t, a.tb, a.tb + .25));
  }
  // макрофаг
  if (t > 39.0) macrophage(ctx, t);
  ctx.restore();
  // передний план — размытые клетки/частицы
  softLayer(ctx, s => { camT(s, c, .6); s.translate(c.x * (1 - 1 / .6), c.y * (1 - 1 / .6)); for (let i = 0; i < 18; i++) { const x = -2400 + i * 300 + Math.sin(t * .4 + i) * 60, y = -900 + hash(i) * 1600 + Math.cos(t * .3 + i) * 50; s.fillStyle = rgba(i % 3 ? PAL.violet : PAL.teal, .5); s.beginPath(); s.arc(x, y, 20 + hash(i + 4) * 40, 0, TAU); s.fill(); } }, 3, .8);
  caption(ctx, t, 33.4, 35.6, 'выход', 'Нейраминидаза освобождает новые частицы', 130, 960, { size: 40, col: PAL.orange });
  caption(ctx, t, 36.7, 39.7, 'иммунный ответ', 'Интерферон, антитела и макрофаги', 130, 960, { size: 40, col: PAL.cyan });
  vignette(ctx, .55);
}
function antibody(ctx, x, y, ang, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#2b4c8f'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(0, 0); ctx.lineTo(-32, -38); ctx.moveTo(0, 0); ctx.lineTo(32, -38); ctx.stroke();
  ctx.strokeStyle = '#bfe4ff'; ctx.lineWidth = 12; ctx.stroke();
  ctx.fillStyle = '#ffffff'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 34, -40, 8, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function macrophage(ctx, t) {
  const k = E.io(seg(t, 39.0, 41.6));
  const cx = lerp(-2500, -1380, k), cy = lerp(-120, -230, k), R = 560;
  const lead = budPos(BUDS[0], t), la = Math.atan2(lead[1] - cy, lead[0] - cx);
  const arm = E.o(seg(t, 40.7, 41.7));
  const pts = [];
  for (let i = 0; i < 120; i++) {
    const a = i / 120 * TAU;
    let r = R * (1 + .06 * Math.sin(a * 5 + t * 2) + .04 * Math.sin(a * 9 - t * 3));
    const da = Math.atan2(Math.sin(a - la), Math.cos(a - la));
    r += arm * 380 * Math.exp(-(da * da) / .12) * (1 - .5 * Math.exp(-(da * da) / .01) * (1 - arm));
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  ctx.save();
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  const g = ctx.createRadialGradient(cx - 150, cy - 150, 50, cx, cy, R * 1.3);
  g.addColorStop(0, 'rgba(255,200,180,.55)'); g.addColorStop(1, 'rgba(255,120,130,.38)');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,200,.85)'; ctx.lineWidth = 12; ctx.stroke();
  ctx.clip();
  const r = rng(3);
  for (let i = 0; i < 30; i++) { const a = r() * TAU, rr = r() * R * .8; ctx.fillStyle = 'rgba(255,240,200,.6)'; ctx.beginPath(); ctx.arc(cx + Math.cos(a + t * .2) * rr, cy + Math.sin(a + t * .2) * rr, 8 + r() * 10, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(160,60,140,.6)';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(cx - 120 + i * 90, cy + 60 + Math.sin(i * 2) * 50, 95, 70, i, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ===================== СЦЕНА 6: отъезд «степени десяти» и финал =====================
const TREE = (() => {
  const segs = [], leaves = [];
  const grow = (x, y, a, len, d, side) => {
    const x2 = x + Math.sin(a) * len, y2 = y + Math.cos(a) * len;
    segs.push([x, y, x2, y2, d]);
    if (d >= 6) { leaves.push([x2, y2, side]); return; }
    const j = Math.sin(x * 13.1 + y * 7.7) * .15;
    grow(x2, y2, a - .42 + j, len * .74, d + 1, side); grow(x2, y2, a + .38 + j, len * .7, d + 1, side);
  };
  segs.push([960, 255, 960, 430, 0]);
  grow(960, 430, -1.05, 110, 1, -1); grow(960, 430, 1.05, 105, 1, 1);
  return { segs, leaves };
})();
const P6 = TREE.leaves.reduce((b, l) => Math.hypot(l[0] - 1110, l[1] - 600) < Math.hypot(b[0] - 1110, b[1] - 600) ? l : b, TREE.leaves[0]);
const s5buf = mk(), s5ctx = s5buf.getContext('2d');
function body6(ctx, t, z, draw) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // силуэт
  ctx.strokeStyle = `rgba(110,220,255,${.55 * draw})`; ctx.lineWidth = 3 / z;
  ctx.setLineDash([2400, 2400]); ctx.lineDashOffset = 2400 * (1 - draw);
  ctx.beginPath(); ctx.arc(960, 165, 72, 0, TAU);
  ctx.moveTo(925, 232); ctx.lineTo(925, 280); ctx.bezierCurveTo(880, 300, 760, 300, 720, 360); ctx.bezierCurveTo(690, 420, 700, 700, 690, 1100);
  ctx.moveTo(995, 232); ctx.lineTo(995, 280); ctx.bezierCurveTo(1040, 300, 1160, 300, 1200, 360); ctx.bezierCurveTo(1230, 420, 1220, 700, 1230, 1100);
  ctx.stroke(); ctx.setLineDash([]);
  // лёгкие
  for (const s of [-1, 1]) {
    const lx = 960 + s * 125;
    const g = ctx.createRadialGradient(lx, 560, 20, lx, 600, 260);
    g.addColorStop(0, `rgba(120,80,230,${.45 * draw})`); g.addColorStop(1, `rgba(60,30,140,${.15 * draw})`);
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(960 + s * 40, 390); ctx.bezierCurveTo(960 + s * 210, 330, 960 + s * 250, 560, 960 + s * 240, 760);
    ctx.bezierCurveTo(960 + s * 200, 800, 960 + s * 90, 790, 960 + s * 45, 740); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(160,200,255,${.4 * draw})`; ctx.lineWidth = 2 / z; ctx.stroke();
  }
  // бронхиальное дерево
  for (const [x1, y1, x2, y2, d] of TREE.segs) {
    ctx.strokeStyle = `rgba(150,240,255,${(.85 - d * .08) * draw})`; ctx.lineWidth = Math.max(.5 / z, (9 - d * 1.2) * .9);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
}
function tissue6(ctx, z, a) { // ткань вокруг точки — соты клеток, видна только на большом увеличении
  if (a <= 0) return;
  const s = .9, r = rng(1);
  ctx.strokeStyle = `rgba(150,120,255,${.5 * a})`; ctx.lineWidth = 1.2 / z;
  ctx.beginPath();
  for (let i = -26; i <= 26; i++) for (let j = -16; j <= 16; j++) {
    const x = P6[0] + i * s * 1.5, y = P6[1] + j * s * 1.73 + (i & 1) * s * .86;
    for (let k = 0; k < 6; k++) { const a1 = k / 6 * TAU, a2 = (k + 1) / 6 * TAU; ctx.moveTo(x + Math.cos(a1) * s, y + Math.sin(a1) * s); ctx.lineTo(x + Math.cos(a2) * s, y + Math.sin(a2) * s); }
  }
  ctx.stroke();
}
function scene6(ctx, t, renderS5) {
  ctx.fillStyle = '#060818'; ctx.fillRect(0, 0, W, H);
  const zIn = 1 / .0035;
  const s = Math.exp(Math.log(.0035) * E.o(seg(t, 42.0, 43.9)));  // масштаб кадра сцены 5
  const z = Math.max(1, s * zIn) * lerp(1, .93, E.s(seg(t, 43.9, 46)));
  const cc = [lerp(P6[0], 960, E.io(seg(t, 42.5, 44.2))), lerp(P6[1], 560, E.io(seg(t, 42.5, 44.2)))];
  const draw = 1 - E.io(seg(t, 45.0, 46.0));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cc[0], -cc[1]);
  tissue6(ctx, z, seg(z, 6, 30) * seg(t, 42.05, 42.4));
  body6(ctx, t, z, draw);
  // очаги инфекции и иммунный контроль
  const hot = TREE.leaves.filter(l => Math.hypot(l[0] - P6[0], l[1] - P6[1]) < 90);
  for (const [i, l] of hot.entries()) {
    const ctl = E.s(seg(t, 43.8 + i * .08, 45.2));
    drawSprite(ctx, 'glow', PAL.magenta, l[0], l[1], (10 + 6 * Math.sin(t * 6 + i)) * (1 - ctl) / Math.sqrt(z), 0, .9 * draw * seg(z, 30, 3));
    drawSprite(ctx, 'glow', PAL.cyan, l[0], l[1], 16 * ctl / Math.sqrt(z), 0, .7 * draw * (1 - seg(t, 45.4, 46)));
  }
  ctx.restore();
  // кадр сцены 5, сжимающийся в точку (с радиальным смазом)
  if (t < 43.95 && renderS5) {
    renderS5(s5ctx, Math.min(t, 42.4));
    // мягкая маска краёв
    s5ctx.save(); s5ctx.globalCompositeOperation = 'destination-in';
    const mg = s5ctx.createRadialGradient(W / 2, H / 2, H * .35 * seg(t, 42.0, 42.25) + H * .65 * (1 - seg(t, 42.0, 42.25)), W / 2, H / 2, H * .75 + (1 - seg(t, 42, 42.25)) * H);
    mg.addColorStop(0, '#000'); mg.addColorStop(1, 'rgba(0,0,0,0)'); s5ctx.fillStyle = mg; s5ctx.fillRect(0, 0, W, H); s5ctx.restore();
    const px = W / 2 + (P6[0] - cc[0]) * z, py = H / 2 + (P6[1] - cc[1]) * z;
    const vel = Math.abs(Math.log(s) - Math.log(Math.exp(Math.log(.0035) * E.o(seg(t - 1 / FPS, 42.0, 43.9)))));
    const taps = vel > .01 ? 4 : 1;
    for (let k = 0; k < taps; k++) {
      const sc = s * (1 + k * vel * 1.4);
      ctx.globalAlpha = (k === 0 ? 1 : .22) * (1 - seg(t, 43.5, 43.95));
      ctx.drawImage(s5buf, px - W * sc / 2, py - H * sc / 2, W * sc, H * sc);
    }
    ctx.globalAlpha = 1;
  }
  // точка собирается и становится точкой финальной фразы
  finalText(ctx, t);
  vignette(ctx, .5);
}
function finalText(ctx, t) {
  if (t < 44.9) return;
  const l1 = 'Понимая, как передаётся инфекция,', l2 = 'мы можем её остановить';
  ctx.save();
  ctx.font = `600 64px ${FONT}`;
  const w1 = ctx.measureText(l1).width, w2 = ctx.measureText(l2).width;
  const x1 = W / 2 - w1 / 2, y1 = 500, x2 = W / 2 - w2 / 2 - 10, y2 = 590;
  const dotX = x2 + w2 + 14, dotY = y2 - 8;
  // точка-«очаг»: из лёгкого к месту точки
  const pu = E.io(seg(t, 45.4, 47.2));
  const sx = lerp(P6[0], dotX, pu), sy = lerp(P6[1], dotY, pu) - Math.sin(pu * Math.PI) * 160;
  const land = seg(t, 47.2, 47.6);
  drawSprite(ctx, 'glow', mix(PAL.magenta, PAL.cyan, pu), sx, sy, 22 - 8 * land, 0, seg(t, 44.9, 45.4));
  ctx.fillStyle = rgba(mix(PAL.magenta, PAL.cyan, pu), seg(t, 44.9, 45.4)); ctx.beginPath(); ctx.arc(sx, sy, 7, 0, TAU); ctx.fill();
  if (land > 0 && land < 1) { ctx.strokeStyle = rgba(PAL.cyan, 1 - land); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dotX, dotY, 10 + land * 60, 0, TAU); ctx.stroke(); }
  // слова поднимаются из-под маски
  const words = [[l1, x1, y1, 46.0], [l2, x2, y2, 46.5]];
  for (const [line, lx, ly, t0] of words) {
    const ws = line.split(' '); let x = lx;
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i] + (i < ws.length - 1 ? ' ' : ''), ww = ctx.measureText(w).width;
      const u = E.o5(seg(t, t0 + i * .1, t0 + i * .1 + .8));
      ctx.save(); ctx.beginPath(); ctx.rect(x - 4, ly - 70, ww + 8, 92); ctx.clip();
      ctx.globalAlpha = u; ctx.fillStyle = '#f2f4ff';
      ctx.letterSpacing = `${(1 - u) * 6}px`;
      ctx.fillText(w, x, ly + (1 - u) * 80);
      ctx.restore(); x += ww;
    }
  }
  ctx.font = `500 22px ${FONT}`; ctx.fillStyle = `rgba(170,180,220,${seg(t, 47.6, 48.3) * .9})`;
  const fn = 'Условная визуализация на примере вируса гриппа A · масштабы и цвета изменены';
  ctx.fillText(fn, W / 2 - ctx.measureText(fn).width / 2, 900);
  ctx.restore();
}
