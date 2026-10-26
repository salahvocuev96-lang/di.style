'use strict';
// ===================== общий «актёрский» трек героя =====================
function heroLook(t) {
  // взгляд и мимика героя по времени (используется во всех сценах, где он есть)
  const k = spline(t, [[0, [0, 0]], [4.3, [0, 0]], [4.7, [-.85, .25]], [5.3, [-.85, .25]], [5.7, [.7, -.15]], [6.6, [.2, .6]],
    [7.6, [.8, .3]], [8.6, [.4, .9]], [10.4, [0, .4]], [10.8, [-.6, -.4]], [11.1, [.6, -.4]], [11.6, [.3, .9]], [13.2, [.5, .8]], [14.6, [-.2, .9]], [15.2, [.6, .8]]]);
  let lid = t < 3.9 ? 1 : lerp(1, .38, E.back(seg(t, 3.9, 4.25)));
  const blink = (tb) => { const u = seg(t, tb, tb + .16); return Math.sin(u * Math.PI) * .7; };
  let mood = 'smug';
  if (t > 10.3 && t < 11.2) mood = 'shock';
  if (t >= 11.2 && t < 11.8) mood = 'focus';
  if (t > 15.4 && t < 16.4) mood = 'focus';
  if (t > 18.6) mood = 'focus';
  return { lx: k[0], ly: k[1], lid: mood === 'focus' ? .5 : lid, blink: blink(5.1) + blink(8.0) + blink(12.6) + blink(17.2), mood };
}
function heroRot(t) { return { rx: .3 * Math.sin(t * .6) + .2, ry: 2.4 * (1 - E.o(seg(t, .6, 4.4))) + t * .16, rz: .12 * Math.sin(t * .43) }; }

// ===================== СЦЕНА 1: микромир, появление героя =====================
const S1P = (() => {
  const r = rng(11), a = [];
  for (let i = 0; i < 520; i++) {
    const k = r();
    a.push({ x: (r() - .5) * 5600, y: (r() - .5) * 3400, z: r() * 7000, k: k < .62 ? 0 : k < .9 ? 1 : 2, s: k < .62 ? 2.5 + r() * 4 : k < .9 ? 9 + r() * 26 : 16 + r() * 30, c: (r() * 4) | 0, ph: r() * TAU });
  }
  return a;
})();
const S1COL = [PAL.teal, PAL.magenta, PAL.violet, PAL.cyan];
const spd1 = u => lerp(1700, 230, E.s(seg(u, .6, 3.6))) + 3800 * E.i2(seg(u, 5.55, 6.4));
function camZ1(t) { let z = 0; const N = 160, dt = t / N; for (let i = 0; i < N; i++) z += spd1((i + .5) * dt) * dt; return z; }
const H1K = [[0, [1700, -800, 7000]], [.9, [1500, -650, 6000]], [2.0, [880, -330, 3000]], [3.2, [420, -20, 1150]], [4.2, [330, 40, 760]], [5.2, [290, 30, 660]], [6.0, [0, 0, 470]], [6.6, [0, 0, 470]]];
const heroP1 = t => spline(t, H1K);
function cam1(t) {
  const z = camZ1(t), hz = heroP1(t)[2];
  const yaw = .1 * Math.sin(t * .45) - .06 + .06 * E.s(seg(t, 2, 4.5));
  const roll = .07 * Math.sin(t * .5) - .05;
  return camera(0, 0, z, yaw, .05 * Math.sin(t * .37), roll, 1100, lerp(1500, hz, E.s(seg(t, 2.0, 3.4))), 75);
}
const FAR1 = [[-900, -500, 5400, .2], [1200, 380, 6200, 1.3], [2300, -900, 5000, 2.1], [-2000, 600, 6600, 3.3], [400, 900, 5800, 4.1]];

function scene1(ctx, t) {
  const c = cam1(t), cp = cam1(t - .5 / FPS);
  // фон: глубокий градиент + туманности с параллаксом
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0d34'); bg.addColorStop(.6, '#0b0626'); bg.addColorStop(1, '#14052a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(c.roll); ctx.translate(-W / 2, -H / 2);
  const par = -Math.asin(c.sy) * 1100 * .25;
  ctx.globalCompositeOperation = 'lighter';
  for (const [nx, ny, nr, col, a] of [[300, 300, 700, PAL.magenta, .16], [1500, 760, 800, PAL.teal, .13], [1100, 200, 500, PAL.violet, .2]]) {
    const g = ctx.createRadialGradient(nx + par, ny, 0, nx + par, ny, nr);
    g.addColorStop(0, rgba(col, a * (1 + .3 * Math.sin(t * .7 + nx)))); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400);
  }
  ctx.globalCompositeOperation = 'source-over';
  shafts(ctx, t, par * 2, [140, 120, 255], 1.2);
  // частицы + дальние вирионы + герой, сортировка по глубине
  const items = [];
  for (const p of S1P) {
    const rel = ((p.z - c.z) % 7000 + 7000) % 7000, relp = ((p.z - cp.z) % 7000 + 7000) % 7000;
    if (rel < 40) continue;
    const wob = Math.sin(t * .8 + p.ph) * 30;
    const q = project(c, p.x + wob, p.y + Math.cos(t * .6 + p.ph) * 25, c.z + rel); if (!q) continue;
    if (q.x < -300 || q.x > W + 300 || q.y < -300 || q.y > H + 300) continue;
    let vx = 0, vy = 0;
    if (Math.abs(relp - rel) < 2000) { const qp = project(cp, p.x + wob, p.y + Math.cos(t * .6 + p.ph) * 25, cp.z + relp); if (qp) { vx = q.x - qp.x; vy = q.y - qp.y; } }
    const fog = seg(rel, 6800, 4600) * seg(rel, 40, 260);
    items.push({ z: q.z, f: () => {
      const col = S1COL[p.c], r = p.s * q.s, cc = coc(c, q.z) * (p.k === 0 ? .6 : 1);
      if (p.k === 0) drawSprite(ctx, 'disc', col, q.x, q.y, Math.max(1.2, r), cc, fog * .9, vx, vy);
      else if (p.k === 1) drawSprite(ctx, 'ball', mix(col, [60, 40, 120], .35), q.x, q.y, r, cc, fog * .85, vx, vy);
      else drawSprite(ctx, 'drop', PAL.cyan, q.x, q.y, r, cc, fog * .8, vx, vy);
    } });
  }
  for (const [x, y, z0, ph] of FAR1) {
    const z = z0 - t * 260;
    const q = project(c, x + Math.sin(t + ph) * 60, y, c.z + z); if (!q) continue;
    items.push({ z: q.z, f: () => {
      const R = 160 * q.s;
      drawSprite(ctx, 'glow', PAL.magenta, q.x, q.y, R * 1.6, 0, .35);
      drawVirus(ctx, q.x, q.y, R, { t: t + ph, rx: t * .4 + ph, ry: t * .6, simple: true, alpha: .55 * seg(t, 0, 1.2) });
    } });
  }
  // герой (координаты относительно камеры — ведём его как оператор)
  const hp = heroP1(t), hpp = heroP1(t - 1 / FPS);
  const hs = 1100 / hp[2], hx = W / 2 + hp[0] * hs, hy = H / 2 + hp[1] * hs, R = 160 * hs;
  const hv = Math.hypot(hx - (W / 2 + hpp[0] * 1100 / hpp[2]), hy - (H / 2 + hpp[1] * 1100 / hpp[2]));
  if (t < 6.0) items.push({ z: hp[2], f: () => { // после 6.0 героя рисует сцена 2а поверх перехода
    // орбитальные микрочастицы вокруг героя (задняя половина)
    orbit(ctx, hx, hy, R, t, -1);
    drawSprite(ctx, 'glow', PAL.magenta, hx, hy, R * 1.5, 0, .45);
    const r3 = heroRot(t);
    drawVirus(ctx, hx, hy, R, { t, ...r3, glow: 1, blur: Math.min(28, coc(c, hp[2]) * .8), face: t > 3.4 ? heroLook(t) : null,
      squash: [1 + Math.min(.12, hv * .004), Math.atan2(hy, hx)] });
    orbit(ctx, hx, hy, R, t, 1);
  } });
  items.sort((a, b) => b.z - a.z).forEach(i => i.f());
  ctx.restore();
  title1(ctx, t);
  vignette(ctx, .6);
}
function orbit(ctx, x, y, R, t, side) {
  for (let i = 0; i < 16; i++) {
    const a = t * (.7 + i * .05) + i * 2.1, tilt = .5 + (i % 4) * .25, rr = R * (1.55 + (i % 5) * .14);
    const z = Math.sin(a); if (Math.sign(z) !== side) continue;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * Math.sin(tilt) * .45 + Math.cos(a * .5) * R * .1;
    drawSprite(ctx, i % 3 ? 'disc' : 'ball', i % 2 ? PAL.cyan : PAL.lime, px, py, R * (.025 + (i % 3) * .012) * (1 + z * .3), side < 0 ? R * .03 : 0, .85);
  }
}
function title1(ctx, t) {
  if (t < 4.0 || t > 6.4) return;
  ctx.save();
  const lines = [{ s: 'ВИРУС:', x: 130, y: 560, f: `800 160px ${FONT}`, t0: 4.15, st: .05, ls: 4 }, { s: 'МИССИЯ ПО ЗАРАЖЕНИЮ', x: 138, y: 640, f: `600 46px ${FONT}`, t0: 4.5, st: .022, ls: 9 }];
  let gi = 0;
  for (const L of lines) {
    ctx.font = L.f; ctx.letterSpacing = L.ls + 'px';
    for (let i = 0; i < L.s.length; i++, gi++) {
      const ch = L.s[i]; if (ch === ' ') continue;
      const x = L.x + ctx.measureText(L.s.slice(0, i)).width, w = ctx.measureText(ch).width;
      const p = E.o5(seg(t, L.t0 + i * L.st, L.t0 + i * L.st + .75));
      const q = E.i(seg(t, 5.72 + gi * .008, 6.22 + gi * .008));
      if (p <= 0 || q >= 1) continue;
      const cx = x + w / 2, cy = L.y - 40;
      const sc = lerp(2.4, 1, p) * (1 + q * 2.2);
      const dx = (cx - W / 2) * q * 1.6, dy = (cy - H / 2) * q * 1.6;
      const bl = (1 - p) * 16 + q * 14;
      ctx.save(); ctx.translate(cx + dx, cy + dy + (1 - p) * 60); ctx.scale(sc, sc); ctx.rotate((1 - p) * (.4 - (i % 3) * .3));
      ctx.globalAlpha = p * (1 - q);
      if (bl > .6) ctx.filter = `blur(${bl.toFixed(1)}px)`;
      ctx.fillStyle = 'rgba(40,230,214,.55)'; ctx.fillText(ch, -w / 2 - 3, 40);
      ctx.fillStyle = 'rgba(255,61,160,.55)'; ctx.fillText(ch, -w / 2 + 3, 40);
      const g = ctx.createLinearGradient(0, -60, 0, 40); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d9c7ff');
      ctx.fillStyle = g; ctx.fillText(ch, -w / 2, 40);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ===================== СЦЕНА 2а: полёт в капле =====================
const S2P = (() => { const r = rng(21), a = []; for (let i = 0; i < 260; i++) a.push({ x: r() * 2400, y: r() * 1400, d: .35 + r() * 2.6, s: 2 + r() * 14, c: (r() * 4) | 0, k: r() < .7 ? 0 : 1 }); return a; })();
const dropC = t => spline(t, [[6.0, [960, 540]], [6.4, [960, 540]], [7.3, [880, 470]], [8.2, [930, 520]], [9.0, [980, 690]], [9.3, [1000, 760]]]);
const dropR = t => t < 6.38 ? lerp(380, 760, E.o(seg(t, 5.98, 6.38))) : lerp(760, 335, E.io(seg(t, 6.38, 7.35)));
const heroR2 = t => lerp(374, 124, E.io(seg(t, 6.3, 7.35)));
const wallY = t => lerp(1500, 690 + 335 * .9, E.o(seg(t, 7.5, 9.0)));
function flow2(t) { // накопленный сдвиг среды (частицы летят мимо)
  return [-(t - 6) * 2100 - 600 * E.i2(seg(t, 6, 6.6)), -(t - 6) * 380 - 900 * E.s(seg(t, 7.6, 9.2))];
}
function scene2a(ctx, t) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0b1240'); bg.addColorStop(1, '#1a0a3a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const roll = roll2a(t);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.translate(-W / 2, -H / 2);
  shafts(ctx, t, -(t - 6) * 400, [120, 160, 255], .9);
  const [fx, fy] = flow2(t), [fxp, fyp] = flow2(t - .5 / FPS);
  const wy = wallY(t);
  const layer = (front) => {
    for (const p of S2P) {
      if ((p.d < 1) !== front) continue;
      const x = ((p.x + fx / p.d) % 2400 + 2400) % 2400 - 240, y = ((p.y + fy / p.d) % 1400 + 1400) % 1400 - 160;
      const vx = (fx - fxp) / p.d, vy = (fy - fyp) / p.d;
      const r = p.s / p.d, cc = Math.abs(1 - p.d) * 22;
      drawSprite(ctx, p.k ? 'ball' : 'disc', S1COL[p.c], x, y, r, cc, front ? .55 : .75 / p.d, vx, vy);
    }
  };
  layer(false);
  // стенка дыхательных путей (слизь) поднимается снизу
  if (wy < H + 200) drawMucusWall(ctx, t, wy);
  // капля
  const [dx, dy] = dropC(t), Rd = dropR(t);
  const imp = seg(t, 9.0, 9.3);
  ctx.save(); ctx.translate(dx, dy);
  const wob = .05 * Math.sin(t * 9) * (1 - imp), sqY = 1 - .35 * E.o(imp), sqX = 1 + .3 * E.o(imp);
  ctx.scale((1 + wob) * sqX, (1 - wob) * sqY);
  const dg = ctx.createRadialGradient(-Rd * .2, -Rd * .25, Rd * .1, 0, 0, Rd);
  dg.addColorStop(0, 'rgba(150,230,255,.10)'); dg.addColorStop(.8, 'rgba(110,200,255,.16)'); dg.addColorStop(.97, 'rgba(190,240,255,.55)'); dg.addColorStop(1, 'rgba(190,240,255,0)');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(0, 0, Rd, 0, TAU); ctx.fill();
  ctx.restore();
  // попутчики внутри капли
  const hr = heroR2(t);
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + t * .5, rr = Rd * .74;
    const ap = E.o(seg(t, 6.25 + i * .12, 6.9 + i * .12));
    drawVirus(ctx, dx + Math.cos(a) * rr * (.9 + .1 * Math.sin(t * 2 + i)), dy + Math.sin(a) * rr * .8, hr * .36, { t: t + i, rx: t + i, ry: t * .8 + i, simple: true, alpha: ap * (1 - imp) });
  }
  if (t >= 6.4 && HERO !== 'skip') hero2a(ctx, t);
  // блики и френелевский край капли поверх
  ctx.save(); ctx.translate(dx, dy); ctx.scale((1 + wob) * sqX, (1 - wob) * sqY);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(200,245,255,.55)'; ctx.lineWidth = Math.max(2, Rd * .012);
  ctx.beginPath(); ctx.arc(0, 0, Rd * .985, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Rd * .03; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, Rd * .86, -2.55, -1.85); ctx.stroke();
  ctx.lineWidth = Rd * .015; ctx.beginPath(); ctx.arc(0, 0, Rd * .86, -1.7, -1.5); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,220,255,.35)'; ctx.lineWidth = Rd * .02; ctx.beginPath(); ctx.arc(0, 0, Rd * .9, .4, 1.3); ctx.stroke();
  ctx.restore();
  // брызги «короной» при ударе
  if (t > 9.0) {
    const r = rng(5);
    for (let i = 0; i < 18; i++) {
      const a = -Math.PI * (.12 + .76 * r()), sp = 500 + r() * 700, u = t - 9.0;
      const x = dx + Math.cos(a) * (Rd * .9 + sp * u), y = dy + Rd * .35 + Math.sin(a) * sp * u + 1400 * u * u;
      drawSprite(ctx, 'drop', PAL.cyan, x, y, 10 + r() * 16, 0, 1 - seg(u, .1, .35), Math.cos(a) * sp * .01, (Math.sin(a) * sp + 2800 * u) * .01);
    }
  }
  layer(true);
  ctx.restore();
  caption(ctx, t, 7.0, 8.9, 'путь передачи', 'Респираторная капля', 130, 960, { size: 40 });
  vignette(ctx, .55);
}
// плавный переход крена из сцены 1 (её крен в 6.0 = -0.040)
function roll2a(t) { return .05 * Math.sin(t * 1.3) - .06 * E.s(seg(t, 7.4, 8.8)) - .0899 * (1 - E.s(seg(t, 6.0, 7.0))); }
function hero2a(ctx, t, rolled) {
  const [dx, dy] = dropC(t), Rd = dropR(t), hr = heroR2(t), imp = seg(t, 9.0, 9.3);
  if (rolled) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(roll2a(t)); ctx.translate(-W / 2, -H / 2); }
  const hx = dx + (t > 6.3 ? Math.sin(t * 1.7) * Rd * .08 * seg(t, 6.3, 6.8) : 0), hy = dy - Rd * .06 * seg(t, 6.3, 7);
  drawSprite(ctx, 'glow', PAL.magenta, hx, hy, hr * 1.5, 0, .4);
  drawVirus(ctx, hx, hy, hr, { t, ...heroRot(t), glow: .8, face: heroLook(t), squash: [1 + .1 * E.o(imp) - .05 * imp * imp, Math.PI / 2] });
  if (rolled) ctx.restore();
}
function drawMucusWall(ctx, t, wy) {
  ctx.save();
  const yf = x => wy + Math.sin(x * .004 + t * 1.5) * 14 + Math.sin(x * .011 - t * 2) * 6 + Math.pow((x - 960) / 960, 2) * 90;
  ctx.beginPath(); ctx.moveTo(-300, H + 300);
  for (let x = -300; x <= W + 300; x += 30) ctx.lineTo(x, yf(x));
  ctx.lineTo(W + 300, H + 300); ctx.closePath();
  const g = ctx.createLinearGradient(0, wy - 20, 0, wy + 500);
  g.addColorStop(0, 'rgba(230,220,130,.95)'); g.addColorStop(.12, 'rgba(150,170,90,.85)'); g.addColorStop(1, 'rgba(50,40,70,.98)');
  ctx.fillStyle = g; ctx.fill();
  ctx.clip();
  // реснички, просвечивающие под слизью, + полосы перспективы, бегущие навстречу
  ctx.strokeStyle = 'rgba(255,240,180,.16)'; ctx.lineWidth = 6;
  for (let i = 0; i < 40; i++) {
    const x = ((i * 70 - (t - 6) * 900) % 2800 + 2800) % 2800 - 400, base = wy + 420;
    const a = Math.sin(t * 6 - i * .5) * .4;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + Math.sin(a) * 90, base - 150, x + Math.sin(a) * 210, base - 300); ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const u = ((i / 8 + (t - 6) * .9) % 1);
    const y = wy + 30 + Math.pow(u, 2.2) * 500;
    ctx.strokeStyle = `rgba(255,250,200,${.15 * (1 - u)})`; ctx.lineWidth = 2 + u * 6;
    ctx.beginPath(); ctx.moveTo(-100, y); ctx.bezierCurveTo(600, y - 30, 1300, y + 30, W + 100, y); ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,255,220,.7)'; ctx.lineWidth = 5;
  ctx.beginPath(); for (let x = -300; x <= W + 300; x += 30) { const y = yf(x) + 6; x === -300 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  // кольцевая волна от удара
  if (t > 9.0) {
    const u = t - 9.0, [dx] = dropC(9.0);
    for (let k = 0; k < 3; k++) {
      const rr = (u - k * .07) * 1300; if (rr <= 0) continue;
      ctx.strokeStyle = `rgba(255,255,220,${.6 * (1 - seg(u, 0, .45))})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(dx, yf(dx) + 10, rr, rr * .18, 0, Math.PI, TAU); ctx.stroke();
    }
  }
  ctx.restore();
}

// ===================== СЦЕНА 2б: разрез слизи и ресничек =====================
const MUC = (() => {
  const r = rng(31), a = [];
  for (let i = 0; i < 40; i++) {
    const d = i < 14 ? 1 : i < 32 ? 1.9 : .6;
    a.push({ y: -50 + r() * 1150, x0: -1400 + r() * 1200, len: 1600 + r() * 2200, amp: 30 + r() * 70, fr: .002 + r() * .003, ph: r() * TAU, d, w: 5 + r() * 5 });
  }
  // нить, на которой застрянет герой
  a.push({ y: 470, x0: -1600, len: 4200, amp: 26, fr: .0028, ph: 1.2, d: 1, w: 9, hero: true });
  return a;
})();
const TRAP = [[-420, 260, .2], [380, 140, 1], [700, 620, 2], [-150, 760, 3], [1050, 380, 4], [-700, 520, 5], [1350, 820, 6], [250, 980, 7]];
const DRIFT = 70; // px/с — реснички двигают слизь
const camS2 = t => spline(t, [[9.1, [0, -260]], [10.4, [60, 300]], [11.5, [140, 380]], [12.7, [220, 900]], [14.2, [320, 1420]]]);
const heroS2 = t => {
  if (t < 10.35) return spline(t, [[9.1, [-20, -180]], [9.6, [10, 120]], [10.35, [50, 400]]]);
  if (t < 11.55) return [50 + (t - 10.35) * DRIFT + Math.sin(t * 22) * 6 * (t < 11.1 ? 1 : 0), 400 + Math.sin(t * 17) * 4];
  return spline(t, [[11.55, [134, 400]], [11.9, [150, 520]], [12.8, [230, 960]], [13.9, [300, 1380]], [14.4, [320, 1480]]]);
};
const CELLTOP = 1700, CILL = 560;
function scene2b(ctx, t) {
  const [cx, cy] = camS2(t);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  const deep = seg(cy, 0, 1400);
  g.addColorStop(0, rgba(mix([60, 62, 40], [30, 20, 50], deep), 1)); g.addColorStop(1, rgba(mix([40, 36, 56], [22, 12, 46], deep), 1));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const roll = .04 * Math.sin(t * .9);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(roll);
  const toS = (x, y, d) => [(x - cx) / d, (y - cy) / d];
  const heroB = () => {
    const [hx, hy] = heroS2(t), [sx, sy] = toS(hx, hy, 1);
    const na = Math.sin(Math.PI * seg(t, 11.0, 11.8));
    drawSprite(ctx, 'glow', PAL.magenta, sx, sy, 180, 0, .4);
    drawVirus(ctx, sx, sy, 124, { t, ...heroRot(t), glow: .7, naGlow: na * 1.5, face: heroLook(t),
      squash: t > 10.35 && t < 11.5 ? [1 + .05 * Math.sin(t * 20), 0] : [1, 0] });
  };
  if (HERO === 'only') { heroB(); ctx.restore(); return; }
  // поверхность слизи и свет сверху
  {
    const [, sy] = toS(0, 0, 1);
    const lg = ctx.createLinearGradient(0, sy - 400, 0, sy + 700);
    lg.addColorStop(0, 'rgba(10,20,60,1)'); lg.addColorStop(.36, 'rgba(10,20,60,1)'); lg.addColorStop(.37, 'rgba(230,220,140,.5)'); lg.addColorStop(.6, 'rgba(160,150,80,.18)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = 'rgba(10,20,60,1)'; ctx.fillRect(-W * 1.5, sy - 3000, W * 3, 2600); ctx.fillStyle = lg; ctx.fillRect(-W * 1.5, sy - 400, W * 3, 1100);
    if (t < 10.2) { // всплеск при входе
      const u = t - 9.0;
      for (let k = 0; k < 2; k++) { ctx.strokeStyle = `rgba(255,250,200,${.5 * (1 - seg(u, 0, 1.2))})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(-20 - cx, sy, (u - k * .1) * 700, 18, 0, 0, TAU); ctx.stroke(); }
    }
  }
  // пузырьки, поднимающиеся после погружения
  if (t < 11) for (let i = 0; i < 14; i++) {
    const u = (t - 9.2 - i * .04); if (u < 0) continue;
    const [bx, by] = toS(-20 + Math.sin(i * 3.3) * 120, 40 + i * 30 - u * 260, 1);
    drawSprite(ctx, 'drop', PAL.white, bx, by, 6 + (i % 4) * 4, 0, .8 * (1 - seg(u, .6, 1.6)));
  }
  const strands = (d, ctx) => {
    for (const s of MUC) {
      if (s.d !== d) continue;
      const cut = s.hero && t > 11.5;
      const drift = (t - 9) * DRIFT;
      const draw = (from, to, recoil, side) => {
        ctx.beginPath();
        for (let k = from; k <= to; k += 24) {
          let x = s.x0 + k + drift, y = s.y + Math.sin(k * s.fr + s.ph + t * .6) * s.amp;
          if (recoil) { // разрезанная нить пружинит и скручивается
            const dd = Math.abs(k - (side < 0 ? to : from));
            const u = E.el(seg(t, 11.5, 12.4)) , fall = Math.exp(-dd / 260);
            y += fall * u * 90 * (side < 0 ? -.4 : 1); x += -side * fall * u * 120;
          }
          const [px, py] = toS(x, y, d);
          k === from ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const a = d > 1.5 ? .25 : d < 1 ? .35 : .7;
      ctx.strokeStyle = `rgba(230,210,120,${a})`; ctx.lineWidth = s.w / d * (d < 1 ? 3 : 1);
      if (cut) {
        const ck = 134 - s.x0 - 2.5 * DRIFT + 0;
        draw(0, ck - 40, true, -1); draw(ck + 40, s.len, true, 1);
      } else draw(0, s.len, false, 0);
      // гликаны (сиаловые «приманки» на муцинах)
      if (d === 1) {
        ctx.fillStyle = 'rgba(255,120,190,.85)';
        for (let k = 60; k < s.len; k += 140) {
          if (cut && Math.abs(k - (134 - s.x0 - 2.5 * DRIFT)) < 60) continue;
          const x = s.x0 + k + drift, y = s.y + Math.sin(k * s.fr + s.ph + t * .6) * s.amp;
          const [px, py] = toS(x, y, d); if (px < -W || px > W) continue;
          ctx.beginPath(); ctx.arc(px, py - 9, 5, 0, TAU); ctx.fill();
        }
      }
    }
  };
  const soft = (fn, b) => softLayer(ctx, sc => { sc.translate(W / 2, H / 2); sc.rotate(roll); fn(sc); }, b);
  soft(sc => { strands(1.9, sc); cilia(sc, t, toS, 1.35, .35, 0); }, 1.2);
  strands(1, ctx);
  // застрявшие частицы уносятся потоком
  for (const [x, y, ph] of TRAP) {
    const wx = x + (t - 9) * DRIFT, [px, py] = toS(wx + Math.sin(t * 9 + ph) * 5, y + Math.cos(t * 7 + ph) * 4, 1);
    if (px < -W / 2 - 100 || px > W / 2 + 100 || py < -H / 2 - 100 || py > H / 2 + 100) continue;
    drawVirus(ctx, px, py, 62, { t: t + ph, rx: ph + t * .3, ry: ph + t * .5, simple: true, alpha: .95 });
    // нить-«захват» вокруг частицы
    ctx.strokeStyle = 'rgba(240,220,130,.6)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(px, py, 70, ph, ph + 2.2); ctx.stroke();
  }
  cilia(ctx, t, toS, 1, 1, 1);
  if (HERO !== 'skip') heroB();
  if (t > 11.45 && t < 11.75) { // вспышка «ножниц» нейраминидазы
    const u = seg(t, 11.45, 11.75), [qx, qy] = toS(134, 470, 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,190,90,${1 - u})`; ctx.lineWidth = 6;
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ctx.beginPath(); ctx.moveTo(qx + Math.cos(a) * 30 * u, qy + Math.sin(a) * 30 * u); ctx.lineTo(qx + Math.cos(a) * (60 + 90 * u), qy + Math.sin(a) * (60 + 90 * u)); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
  soft(sc => { strands(.6, sc); cilia(sc, t, toS, .62, .55, 2); }, 3);
  caption(ctx, t, 10.0, 12.6, 'барьер организма', 'Большинство частиц застревает в слизи', 130, 960, { size: 40 });
  caption(ctx, t, 11.7, 13.7, 'нейраминидаза', 'Вирус «разрезает» приманки на муцинах', 1060, 160, { size: 30, col: PAL.orange });
  vignette(ctx, .6);
}
// реснички: асимметричное биение (быстрый гребок, медленный возврат), волна вдоль ряда
function cilia(ctx, t, toS, d, alpha, layer) {
  const sp = 64 * d, [hx, hy] = heroS2(t);
  const [, top] = toS(0, CELLTOP, d);
  if (top > H / 2 + 300) return;
  ctx.save();
  // верх клеток
  for (let i = 0; i < 12; i++) {
    const cxw = -1800 + i * 420 + layer * 130, [px, py] = toS(cxw, CELLTOP, d);
    if (px < -W || px > W) continue;
    const g = ctx.createRadialGradient(px, py + 40, 20, px, py + 200, 360 / d);
    g.addColorStop(0, rgba(mix([120, 80, 200], [20, 10, 40], layer * .3), .9 * alpha)); g.addColorStop(1, rgba([40, 20, 80], .9 * alpha));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py + 160 / d, 230 / d, 190 / d, 0, Math.PI, TAU); ctx.lineTo(px + 230 / d, H); ctx.lineTo(px - 230 / d, H); ctx.fill();
  }
  ctx.lineCap = 'round';
  for (let k = -40; k < 40; k++) {
    const xw = Math.round(heroS2(9)[0] / sp) * sp + k * sp + layer * 21;
    const [bx, by] = toS(xw, CELLTOP + 6, d); if (bx < -W / 2 - 300 || bx > W / 2 + 300) continue;
    const ph = t * 7.5 - xw * .012 + layer;
    const s = Math.sin(ph), stroke = s > 0 ? Math.sin(ph) : Math.sin(ph) * .55; // асимметрия
    let ang = -.15 + stroke * .55 + .25 * Math.sin(ph * .5) * 0;
    if (layer === 1) { const dx = xw - hx, dy = CELLTOP - CILL * .5 - hy; const push = Math.exp(-(dx * dx) / 22000) * clamp(1 - Math.abs(dy) / 700); ang += Math.sign(dx || 1) * push * .9; }
    const L = CILL / d;
    const tx = bx + Math.sin(ang) * L, ty = by - Math.cos(ang) * L;
    const mx = bx + Math.sin(ang * .4) * L * .55, my = by - Math.cos(ang * .4) * L * .55;
    ctx.strokeStyle = rgba(mix([140, 220, 255], [60, 80, 140], layer === 0 ? .6 : 0), alpha * (layer === 2 ? .7 : .85)); ctx.lineWidth = 9 / d;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
    if (layer === 1) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx - 2, by); ctx.quadraticCurveTo(mx - 2, my, tx - 2, ty); ctx.stroke(); }
  }
  ctx.restore();
}
