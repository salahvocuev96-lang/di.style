'use strict';
// ---------- базовые утилиты ----------
const W = 1920, H = 1080, FPS = 60, DUR = 50;
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  o: t => 1 - Math.pow(1 - t, 3),
  o5: t => 1 - Math.pow(1 - t, 5),
  i: t => t * t * t,
  i2: t => t * t,
  s: t => -(Math.cos(Math.PI * t) - 1) / 2,
  back: t => { const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  el: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - .75) * TAU / 3) + 1,
};
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(k) { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function n1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 91.7), hash(i + 1 + seed * 91.7), u) * 2 - 1; }
function fbm(x, seed = 0) { return n1(x, seed) * .6 + n1(x * 2.1, seed + 3) * .3 + n1(x * 4.3, seed + 7) * .1; }
function mk(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// Catmull-Rom по ключам [[t,[...]],...] — непрерывная скорость на стыках ключей
function spline(t, keys, ease) {
  if (t <= keys[0][0]) return keys[0][1].slice();
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1].slice();
  let i = 0; while (t > keys[i + 1][0]) i++;
  let u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
  if (ease) u = ease(u);
  const p0 = keys[Math.max(0, i - 1)][1], p1 = keys[i][1], p2 = keys[i + 1][1], p3 = keys[Math.min(n - 1, i + 2)][1];
  const u2 = u * u, u3 = u2 * u;
  return p1.map((_, k) => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3));
}
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const PAL = {
  ink: [6, 8, 26], deep: [14, 10, 52], magenta: [255, 61, 160], violet: [150, 60, 255], teal: [40, 230, 214],
  cyan: [90, 220, 255], lime: [205, 255, 80], orange: [255, 150, 60], amber: [214, 196, 96], white: [240, 244, 255],
  pink: [255, 120, 190], blue: [80, 140, 255], coral: [255, 170, 150],
};
let HERO = 'all'; // режим отрисовки героя на переходах: 'all' | 'skip' | 'only'
const FONT = '"Inter Display", "Inter", sans-serif';

// ---------- спрайты с предварительным размытием (DOF без фильтров в каждом кадре) ----------
const spriteCache = new Map();
// kind: 'disc' — боке-диск, 'ball' — объёмный шарик, 'glow' — мягкое свечение
function sprite(kind, col, lvl) {
  const key = kind + col.join(',') + '|' + lvl;
  let c = spriteCache.get(key); if (c) return c;
  const S = 192, r = 48; c = mk(S, S); const g = c.getContext('2d');
  const blurPx = lvl * 5;
  if (blurPx > 0) g.filter = `blur(${blurPx}px)`;
  const cx = S / 2;
  if (kind === 'disc') {
    const gr = g.createRadialGradient(cx, cx, 0, cx, cx, r);
    gr.addColorStop(0, rgba(col, .55)); gr.addColorStop(.78, rgba(col, .7)); gr.addColorStop(.93, rgba(col, 1)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cx, r, 0, TAU); g.fill();
  } else if (kind === 'ball') {
    const gr = g.createRadialGradient(cx - r * .35, cx - r * .4, r * .05, cx, cx, r);
    gr.addColorStop(0, rgba(mix(col, [255, 255, 255], .7), 1)); gr.addColorStop(.35, rgba(col, 1)); gr.addColorStop(1, rgba(mix(col, [0, 0, 20], .7), 1));
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cx, r, 0, TAU); g.fill();
    const rim = g.createRadialGradient(cx + r * .1, cx + r * .15, r * .6, cx, cx, r);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, rgba(PAL.cyan, .55));
    g.fillStyle = rim; g.beginPath(); g.arc(cx, cx, r, 0, TAU); g.fill();
  } else if (kind === 'drop') {
    const gr = g.createRadialGradient(cx, cx, r * .5, cx, cx, r);
    gr.addColorStop(0, rgba(col, .05)); gr.addColorStop(.85, rgba(col, .25)); gr.addColorStop(.97, rgba(col, .9)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cx, r, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(cx - r * .38, cx - r * .45, r * .18, r * .09, -.7, 0, TAU); g.fill();
  } else { // glow
    const gr = g.createRadialGradient(cx, cx, 0, cx, cx, r * 1.6);
    gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(.25, rgba(col, .45)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }
  spriteCache.set(key, c); return c;
}
// рисует спрайт радиуса r с размытием coc (px) и смазом по вектору (vx,vy) в px за экспозицию
function drawSprite(ctx, kind, col, x, y, r, coc, alpha, vx = 0, vy = 0) {
  if (r < .3 || alpha <= .003) return;
  const lvl = Math.min(7, Math.round(coc / Math.max(2, r) * 4));
  const img = sprite(kind, col, lvl);
  const k = r / 48; // спрайт: радиус 48 в окне 192
  const sp = Math.hypot(vx, vy);
  ctx.globalAlpha = alpha * (lvl > 0 ? Math.max(.35, 1 / (1 + lvl * .25)) : 1);
  if (sp < 1.5) { ctx.drawImage(img, x - 96 * k, y - 96 * k, 192 * k, 192 * k); }
  else {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(vy, vx));
    const sx = (2 * r + sp) / (2 * r);
    ctx.scale(sx, 1); ctx.globalAlpha *= Math.max(.25, 1 / Math.sqrt(sx));
    ctx.drawImage(img, -96 * k, -96 * k, 192 * k, 192 * k); ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---------- перспективная камера ----------
function camera(x, y, z, yaw, pitch, roll, f, focus, ap) {
  return { x, y, z, cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch), roll, f, focus, ap };
}
function project(c, x, y, z) {
  const dx = x - c.x, dy = y - c.y, dz = z - c.z;
  const x1 = dx * c.cy - dz * c.sy, z1 = dx * c.sy + dz * c.cy;
  const y2 = dy * c.cp - z1 * c.sp, z2 = dy * c.sp + z1 * c.cp;
  if (z2 < 20) return null;
  const s = c.f / z2;
  return { x: W / 2 + x1 * s, y: H / 2 + y2 * s, s, z: z2 };
}
const coc = (c, z) => Math.min(70, c.ap * Math.abs(z - c.focus) / z);

// ---------- двойной липидный слой вдоль произвольной ломаной ----------
function resample(pts, step, closed) {
  const out = []; const P = closed ? pts.concat([pts[0]]) : pts;
  let acc = 0; out.push(P[0]);
  for (let i = 1; i < P.length; i++) {
    let [ax, ay] = P[i - 1]; const [bx, by] = P[i];
    let d = Math.hypot(bx - ax, by - ay);
    while (acc + d >= step) {
      const u = (step - acc) / d; ax = ax + (bx - ax) * u; ay = ay + (by - ay) * u;
      out.push([ax, ay]); d = Math.hypot(bx - ax, by - ay); acc = 0;
    }
    acc += d;
  }
  return out;
}
// opt: {col, head, w (толщина), bead, alpha, glow}
function bilayer(ctx, pts, closed, o) {
  const w = o.w || 16, bead = o.bead || 5.5;
  const R = resample(pts, o.step || bead * 2.2, closed);
  const n = R.length; if (n < 3) return;
  const nx = [], ny = [];
  for (let i = 0; i < n; i++) {
    const a = R[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = R[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1;
    nx.push(-dy / l); ny.push(dx / l);
  }
  ctx.globalAlpha = o.alpha ?? 1;
  // хвосты — полупрозрачная полоса
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(o.col, .35); ctx.lineWidth = w;
  ctx.beginPath(); R.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (closed) ctx.closePath(); ctx.stroke();
  if (o.glow) { ctx.strokeStyle = rgba(o.col, .12 * o.glow); ctx.lineWidth = w * 3.2; ctx.stroke(); }
  // головки — два ряда бусин
  ctx.fillStyle = rgba(o.head || o.col, 1);
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    for (const s of [-1, 1]) {
      const x = R[i][0] + nx[i] * s * w * .5, y = R[i][1] + ny[i] * s * w * .5;
      ctx.moveTo(x + bead, y); ctx.arc(x, y, bead, 0, TAU);
    }
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath();
  for (let i = 0; i < n; i += 1) {
    const x = R[i][0] - nx[i] * w * .5 - bead * .3, y = R[i][1] - ny[i] * w * .5 - bead * .35;
    ctx.moveTo(x + bead * .35, y); ctx.arc(x, y, bead * .35, 0, TAU);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ---------- персонаж-вирион (грипп A: гемагглютинин + нейраминидаза) ----------
const SPIKES = (() => {
  const r = rng(7), a = [], N = 78, ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + .5) / N * 2, rr = Math.sqrt(1 - y * y), th = ga * i;
    a.push({ d: [Math.cos(th) * rr, y, Math.sin(th) * rr], na: r() < .18, ph: r() * TAU, len: .9 + r() * .2 });
  }
  return a;
})();
const SURF = (() => { const r = rng(9), a = []; for (let i = 0; i < 110; i++) { const u = r() * 2 - 1, th = r() * TAU, rr = Math.sqrt(1 - u * u); a.push([Math.cos(th) * rr, u, Math.sin(th) * rr, .5 + r()]); } return a; })();
function rot3(v, rx, ry, rz) {
  let [x, y, z] = v;
  let c = Math.cos(ry), s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(rz); s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}
const virScratch = mk(900, 900);
/* o: {t, rx, ry, rz, ext, naGlow, alpha, face:{lx,ly,lid,blink,mood,brow}, squash:[sx,ang], simple, blur, glow, tint, dim} */
function drawVirus(ctx, x, y, R, o) {
  if (R < 1) return;
  const blur = o.blur || 0;
  if (blur > 1.2 && !o.simple) {
    const S = Math.min(900, Math.ceil(R * 3.4)); const g = virScratch.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S, S);
    drawVirusRaw(g, S / 2, S / 2, R, o);
    ctx.save(); ctx.filter = `blur(${blur.toFixed(1)}px)`; ctx.globalAlpha = o.alpha ?? 1;
    ctx.drawImage(virScratch, 0, 0, S, S, x - S / 2, y - S / 2, S, S); ctx.restore();
    return;
  }
  ctx.save(); ctx.globalAlpha = o.alpha ?? 1; drawVirusRaw(ctx, x, y, R, o); ctx.restore();
}
function drawVirusRaw(ctx, x, y, R, o) {
  const t = o.t || 0, ext = o.ext ?? 1, dim = o.dim || 0;
  ctx.save(); ctx.translate(x, y);
  if (o.squash) { const [sq, an] = o.squash; ctx.rotate(an); ctx.scale(sq, 1 / sq); ctx.rotate(-an); }
  const body = mix([170, 60, 240], o.tint || [170, 60, 240], .5), bodyD = mix(body, [20, 8, 50], .75);
  const ha = mix(PAL.lime, [90, 100, 110], dim), na = mix(PAL.orange, [90, 90, 100], dim);
  if (o.glow) {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, R * .6, 0, 0, R * 2.3);
    g.addColorStop(0, rgba(PAL.magenta, .35 * o.glow)); g.addColorStop(1, rgba(PAL.magenta, 0));
    ctx.fillStyle = g; ctx.fillRect(-R * 2.4, -R * 2.4, R * 4.8, R * 4.8);
    ctx.globalCompositeOperation = 'source-over';
  }
  const sp = SPIKES.map((s, i) => {
    const d = rot3(s.d, o.rx || 0, o.ry || 0, o.rz || 0);
    return { d, s, i };
  });
  const L = [-.5, -.6, .62];
  const nSp = o.simple ? 2 : 1;
  const drawSpike = (p) => {
    const { d, s } = p; if (o.simple && p.i % nSp) return;
    const wig = Math.sin(t * 3.1 + s.ph) * .05;
    const len = R * (.30 + wig) * s.len * (s.na ? .85 : 1) * ext;
    const bx = d[0] * R * .96, by = d[1] * R * .96, tx = d[0] * (R + len), ty = d[1] * (R + len);
    const sh = .45 + .55 * clamp(d[0] * L[0] + d[1] * L[1] + d[2] * L[2] + .35);
    const back = d[2] < 0;
    const col = mix(s.na ? na : ha, [10, 10, 30], back ? .55 : (1 - sh) * .6);
    ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = R * (o.simple ? .07 : .055); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    const hr = R * (s.na ? .07 : .085) * (o.simple ? 1.2 : 1);
    ctx.fillStyle = rgba(col, 1);
    if (s.na) {
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(Math.atan2(d[1], d[0]));
      ctx.fillRect(-hr, -hr, hr * 2, hr * 2); ctx.restore();
      if (o.naGlow && !back) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rgba(PAL.orange, .5 * o.naGlow); ctx.beginPath(); ctx.arc(tx, ty, hr * 2.6, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    } else {
      ctx.beginPath(); ctx.ellipse(tx, ty, hr * 1.25, hr * (.75 + .25 * Math.abs(d[2])), Math.atan2(d[1], d[0]), 0, TAU); ctx.fill();
      if (!back && !o.simple) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(tx - hr * .35, ty - hr * .35, hr * .35, 0, TAU); ctx.fill(); }
    }
  };
  sp.filter(p => p.d[2] < 0).forEach(drawSpike);
  // тело с дышащим контуром
  const pulse = 1 + .018 * Math.sin(t * 4.2);
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const a = i / 64 * TAU;
    const r = R * pulse * (1 + .022 * Math.sin(3 * a + t * 2.1) + .015 * Math.sin(5 * a - t * 3.3));
    i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(-R * .35, -R * .42, R * .04, 0, 0, R * 1.05);
  g.addColorStop(0, rgba(mix([255, 215, 245], [150, 150, 160], dim), 1)); g.addColorStop(.28, rgba(mix([226, 92, 255], [120, 110, 140], dim), 1));
  g.addColorStop(.72, rgba(mix(body, [70, 70, 90], dim), 1)); g.addColorStop(1, rgba(bodyD, 1));
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  if (!o.simple) {
    // матрица М1 / липидная фактура — точки, вращающиеся вместе с телом
    for (const s of SURF) {
      const d = rot3(s, o.rx || 0, o.ry || 0, o.rz || 0); if (d[2] < .05) continue;
      ctx.fillStyle = `rgba(60,10,110,${.25 * d[2]})`;
      ctx.beginPath(); ctx.ellipse(d[0] * R, d[1] * R, R * .045 * s[3], R * .045 * s[3] * (.3 + .7 * d[2]), Math.atan2(d[1], d[0]), 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createConicGradient(t * .7, 0, 0);
    cg.addColorStop(0, 'rgba(60,255,230,0)'); cg.addColorStop(.2, 'rgba(60,255,230,.10)'); cg.addColorStop(.45, 'rgba(255,80,200,0)');
    cg.addColorStop(.7, 'rgba(255,200,90,.08)'); cg.addColorStop(1, 'rgba(60,255,230,0)');
    ctx.fillStyle = cg; ctx.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
  }
  const rim = ctx.createRadialGradient(R * .12, R * .14, R * .62, 0, 0, R * 1.04);
  rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, rgba(mix(PAL.cyan, [120, 120, 130], dim), .75));
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rim; ctx.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
  ctx.restore();
  sp.filter(p => p.d[2] >= 0).forEach(drawSpike);
  if (o.face) drawFace(ctx, R, o.face, t);
  ctx.restore();
}
// лицо: самоуверенный прищур, брови, ухмылка
function drawFace(ctx, R, f, t) {
  const lx = (f.lx || 0) * R * .16, ly = (f.ly || 0) * R * .12;
  const er = R * .17 * (f.size || 1), gap = R * .25;
  const lidBase = clamp((f.lid ?? .35) + (f.blink || 0));
  const mood = f.mood || 'smug';
  for (const s of [-1, 1]) {
    const ex = lx + s * gap, ey = ly - R * .08;
    if (lidBase > .88 && mood !== 'shock') { // закрытый глаз — дуга ресниц, а не тёмный кружок
      ctx.strokeStyle = '#20063f'; ctx.lineWidth = er * .22; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(ex, ey - er * .2, er * .9, .25 * Math.PI, .75 * Math.PI); ctx.stroke();
      continue;
    }
    ctx.save(); ctx.translate(ex, ey);
    ctx.fillStyle = '#20063f'; ctx.beginPath(); ctx.ellipse(0, 0, er * 1.12, er * 1.22, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, er, er * 1.1, 0, 0, TAU); ctx.save(); ctx.clip();
    const wg = ctx.createLinearGradient(0, -er, 0, er); wg.addColorStop(0, '#ffffff'); wg.addColorStop(1, '#c9d4ff');
    ctx.fillStyle = wg; ctx.fillRect(-er * 2, -er * 2, er * 4, er * 4);
    const px = (f.lx || 0) * er * .45, py = (f.ly || 0) * er * .4;
    const ps = mood === 'shock' ? .4 : .55;
    ctx.fillStyle = '#9dff3a'; ctx.beginPath(); ctx.arc(px, py, er * ps * 1.05, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0b0420'; ctx.beginPath(); ctx.arc(px, py, er * ps * .6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - er * .2, py - er * .25, er * .16, 0, TAU); ctx.fill();
    // веко: наклон внутрь = хитрый прищур
    const tilt = (mood === 'smug' ? .32 : mood === 'focus' ? .45 : mood === 'worry' ? -.4 : 0) * s;
    const lid = mood === 'shock' ? Math.min(lidBase, .05) : lidBase;
    const ly2 = -er * 1.15 + lid * er * 2.3;
    ctx.fillStyle = '#7a26c9';
    ctx.beginPath(); ctx.moveTo(-er * 1.3, -er * 1.4); ctx.lineTo(er * 1.3, -er * 1.4);
    ctx.lineTo(er * 1.3, ly2 - tilt * er); ctx.lineTo(-er * 1.3, ly2 + tilt * er); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#20063f'; ctx.lineWidth = er * .14;
    ctx.beginPath(); ctx.moveTo(-er * 1.3, ly2 + tilt * er); ctx.lineTo(er * 1.3, ly2 - tilt * er); ctx.stroke();
    ctx.restore(); ctx.restore();
    // бровь
    const bt = (mood === 'smug' ? .35 : mood === 'focus' ? .5 : mood === 'worry' ? -.45 : mood === 'shock' ? -.15 : 0) * s;
    const by = ey - er * (mood === 'shock' ? 1.75 : 1.45) + (f.brow || 0) * er;
    ctx.strokeStyle = '#1a0438'; ctx.lineWidth = er * .3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex - er * .85, by - bt * er * .5); ctx.lineTo(ex + er * .85, by + bt * er * .5); ctx.stroke();
  }
  // рот
  ctx.strokeStyle = '#1a0438'; ctx.lineWidth = R * .045; ctx.lineCap = 'round';
  const mx = lx * .8, my = ly + R * .3;
  ctx.beginPath();
  if (mood === 'shock') { ctx.fillStyle = '#1a0438'; ctx.ellipse(mx, my + R * .02, R * .07, R * .095, 0, 0, TAU); ctx.fill(); }
  else if (mood === 'worry') { ctx.moveTo(mx - R * .14, my + R * .04); ctx.quadraticCurveTo(mx, my - R * .05, mx + R * .14, my + R * .05); ctx.stroke(); }
  else if (mood === 'focus') { ctx.moveTo(mx - R * .12, my); ctx.lineTo(mx + R * .12, my - R * .02); ctx.stroke(); }
  else { ctx.moveTo(mx - R * .16, my - R * .01); ctx.quadraticCurveTo(mx + R * .02, my + R * .1, mx + R * .2, my - R * .08); ctx.stroke(); }
}

// ---------- сегмент вирусного РНП (спиральная «лента») ----------
const RNP_COLS = [[255, 90, 170], [255, 170, 60], [200, 255, 80], [80, 240, 200], [90, 170, 255], [190, 120, 255], [255, 230, 120], [255, 120, 110]];
function drawRNP(ctx, pts, col, w, t, alpha = 1) {
  if (pts.length < 2) return;
  ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba(mix(col, [20, 10, 40], .45), 1); ctx.lineWidth = w * 1.25;
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = w * .8; ctx.stroke();
  // витки спирали
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = w * .22;
  ctx.beginPath();
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l * w * .38, ny = dx / l * w * .38;
    ctx.moveTo(ax - nx, ay - ny); ctx.lineTo(bx + nx, by + ny);
  }
  ctx.stroke(); ctx.globalAlpha = 1;
}
// путь «змейки» вдоль направления
function snake(x, y, ang, len, n, t, ph, amp = .22) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), s = u * len;
    const off = Math.sin(u * 7 + t * 5 + ph) * len * amp * .3;
    pts.push([x + Math.cos(ang) * s - Math.sin(ang) * off, y + Math.sin(ang) * s + Math.cos(ang) * off]);
  }
  return pts;
}

// ---------- текст ----------
function caption(ctx, t, a, b, kicker, text, x, y, o = {}) {
  const k = seg(t, a, a + .45), out = seg(t, b - .35, b);
  if (k <= 0 || out >= 1) return;
  const fs = o.size || 34;
  ctx.save();
  ctx.font = `600 ${fs}px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const vis = E.o(k) * (1 - E.i2(out));
  // вертикальная риска-маркер растёт, затем «открывает» текст маской
  ctx.globalAlpha = vis;
  ctx.fillStyle = rgba(o.col || PAL.lime, 1);
  ctx.fillRect(x - 18, y - fs * 1.75, 4, (fs * 2.3) * E.o(k));
  ctx.beginPath(); ctx.rect(x - 4, y - fs * 2.2, (tw + 40) * E.o5(seg(t, a + .1, a + .7)), fs * 3);
  ctx.clip();
  if (kicker) {
    ctx.font = `700 ${fs * .5}px ${FONT}`; ctx.letterSpacing = `${fs * .12}px`;
    ctx.fillStyle = rgba(o.col || PAL.lime, .95); ctx.fillText(kicker.toUpperCase(), x, y - fs * 1.05);
    ctx.letterSpacing = '0px';
  }
  ctx.font = `600 ${fs}px ${FONT}`;
  ctx.shadowColor = 'rgba(0,0,20,.8)'; ctx.shadowBlur = 18;
  ctx.fillStyle = '#f4f6ff';
  ctx.fillText(text, x + (1 - E.o5(seg(t, a + .1, a + .8))) * -30, y);
  ctx.restore();
}
function vignette(ctx, s = .55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,10,${s})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// кинематографичные световые лучи (аддитивно)
function shafts(ctx, t, off, col, strength = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x0 = (i * 520 - 300 + off + Math.sin(t * .3 + i) * 80) % 2600 - 300;
    const w = 140 + 90 * Math.sin(i * 2.3 + 1);
    const a = (.05 + .04 * Math.sin(t * .8 + i * 1.7)) * strength;
    const g = ctx.createLinearGradient(x0, 0, x0 + 600, H);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(x0, -50); ctx.lineTo(x0 + w, -50); ctx.lineTo(x0 + w + 700, H + 50); ctx.lineTo(x0 + 700 - w * .3, H + 50); ctx.fill();
  }
  ctx.restore();
}
