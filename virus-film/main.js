'use strict';
// ---------- монтаж: сцены и переходы ----------
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const mainCtx = canvas.getContext('2d');
const bufA = mk(), ctxA = bufA.getContext('2d'), subBuf = mk(), subCtx = subBuf.getContext('2d');
const CUTS = [ // [начало перехода, конец, сцена A, сцена B]
  [6.0, 6.4, scene1, scene2a], [9.15, 9.45, scene2a, scene2b], [13.75, 14.15, scene2b, scene3],
  [21.95, 22.35, scene3, scene4], [31.85, 32.08, scene4, scene5],
];
function sceneAt(t) {
  if (t < 6.0) return scene1; if (t < 9.15) return scene2a; if (t < 13.75) return scene2b;
  if (t < 21.95) return scene3; if (t < 31.85) return scene4; if (t < 42.0) return scene5; return null;
}
function renderAt(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  if (t >= 42.0) { scene6(ctx, t, (c, tt) => { c.setTransform(1, 0, 0, 1, 0, 0); scene5(c, tt); }); return; }
  for (const [a, b, A, B] of CUTS) {
    if (t >= a && t < b) {
      ctxA.setTransform(1, 0, 0, 1, 0, 0); A(ctxA, t);
      B(ctx, t);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - E.s(seg(t, a, b)); ctx.drawImage(bufA, 0, 0); ctx.globalAlpha = 1;
      return;
    }
  }
  sceneAt(t)(ctx, t);
}
// sub > 1 — накопление субкадров (временной motion blur, затвор 180°)
window.renderFrame = (t, sub = 1, shutter = .5) => {
  if (sub <= 1) { renderAt(mainCtx, t); return; }
  for (let k = 0; k < sub; k++) {
    const tk = t + ((k + .5) / sub - .5) * shutter / FPS;
    renderAt(subCtx, Math.max(0, tk));
    mainCtx.setTransform(1, 0, 0, 1, 0, 0); mainCtx.globalAlpha = 1 / (k + 1); mainCtx.drawImage(subBuf, 0, 0);
  }
  mainCtx.globalAlpha = 1;
};
window.DUR = DUR; window.FPS = FPS;
