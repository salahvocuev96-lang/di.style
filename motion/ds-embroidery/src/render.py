# DS embroidery film: deterministic frame renderer (frame i -> time i/FPS).
import numpy as np, cv2, json, math, sys, os
D = os.path.dirname(os.path.abspath(__file__))
meta = json.load(open(f'{D}/meta.json'))
TW, TH, TOTAL = meta['W'], meta['H'], meta['total']
ld = lambda n: np.load(f'{D}/{n}.npy', mmap_mode='r')
Nf, Ne, Te, G, WD, AE, AF, MK = (ld(n) for n in ['Nf8', 'Ne8', 'Te8', 'G', 'WD8', 'AE8', 'AF8', 'M8'])
from shade import shade
NEEDLE = np.load(f'{D}/needle.npy')
FPS, DUR = 60, 12.0
FOV = 35.0
DY = TH/2 - 1700  # camera keys were authored for a 3400-high texture

def sstep(a, b, x):
    t = np.clip((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t)

# ---------- stitch timeline ----------
T0, T1 = 2.45, 7.85
_tg = np.arange(0, DUR, 1/2400.0)
def _rate(rm):
    r = np.where(_tg < T0, 0, 4.5 + 5*sstep(T0, 3.3, _tg))
    r = r + (rm - r)*sstep(3.3, 5.1, _tg)
    r = r*(1 - 0.8*sstep(T1 - 0.35, T1, _tg)) + 0
    return np.where((_tg >= T0) & (_tg <= T1), r, 0)
lo, hi = 10, 2000
for _ in range(60):
    rm = (lo + hi)/2
    if np.sum(_rate(rm))/2400.0 < TOTAL: lo = rm
    else: hi = rm
RATE = _rate(rm); KCUM = np.cumsum(RATE)/2400.0
def stitches(t): return float(np.interp(t, _tg, KCUM))
def rate(t): return float(np.interp(t, _tg, RATE))

valid = NEEDLE[:, 2] > 0
_idx = np.arange(TOTAL)
NX = np.interp(_idx, _idx[valid], NEEDLE[valid, 0]); NY = np.interp(_idx, _idx[valid], NEEDLE[valid, 1])
def needle_xy(k):
    """needle ground position during stitch floor(k): hoop moves while the needle is up."""
    k0 = int(np.clip(math.floor(k), 0, TOTAL - 1)); f = k - math.floor(k)
    kp = max(k0 - 1, 0); m = float(sstep(0.12, 0.9, f))
    return NX[kp] + (NX[k0] - NX[kp])*m, NY[kp] + (NY[k0] - NY[kp])*m, f, k0

# smoothed needle track for the camera
_ts = np.arange(0, DUR, 1/120.0)
_trk = np.array([needle_xy(min(stitches(t), TOTAL - 1.001))[:2] for t in _ts])
for _ in range(3):
    _trk = cv2.GaussianBlur(_trk.reshape(-1, 1, 2).astype(np.float32), (1, 0), sigmaX=1, sigmaY=40,
                            borderType=cv2.BORDER_REPLICATE).reshape(-1, 2)
def track(t): return np.interp(t, _ts, _trk[:, 0]), np.interp(t, _ts, _trk[:, 1])

# ---------- camera ----------
# t, gx, gy, log(dist), elev, azim, roll, aperture
KEYS = np.array([
    [0.0, 2350, 1330, math.log(2900), 22, 58, -5, 70],
    [2.4, 2020, 1080, math.log(1500), 34, 75, -2.5, 75],
    [3.6, 2000, 1500, math.log(1600), 37, 80, -1.5, 70],
    [5.4, 2600, 1750, math.log(3000), 44, 86, 0, 60],
    [7.2, 3500, 1950, math.log(4300), 52, 96, 1.0, 50],
    [8.4, 3500, 1800, math.log(3100), 38, 100, 1.2, 58],
    [10.0, 3000, 1700, math.log(6900), 74, 90, 0, 22],
    [12.0, 3000, 1700, math.log(6900), 74, 90, 0, 22]])
def _interp_keys(t):
    ks = KEYS; n = len(ks)
    if t >= ks[-2, 0]: return ks[-1, 1:]
    i = np.searchsorted(ks[:, 0], t) - 1; i = max(0, min(i, n - 2))
    t0, t1 = ks[i, 0], ks[i + 1, 0]; h = t1 - t0; s = (t - t0)/h
    def vel(j):
        if j == 0 or j >= n - 2: return np.zeros(ks.shape[1] - 1)
        return (ks[j + 1, 1:] - ks[j - 1, 1:])/(ks[j + 1, 0] - ks[j - 1, 0])
    p0, p1 = ks[i, 1:], ks[i + 1, 1:]; m0, m1 = vel(i)*h, vel(i + 1)*h
    h00 = 2*s**3 - 3*s**2 + 1; h10 = s**3 - 2*s**2 + s; h01 = -2*s**3 + 3*s**2; h11 = s**3 - s**2
    return h00*p0 + h10*m0 + h01*p1 + h11*m1

def camera(t, W, H):
    gx, gy, ldist, el, az, roll, ap = _interp_keys(t)
    gy += DY
    cover = 1.0 if W/H > 1.5 else (0.9 if W/H > 0.8 else 0.8)
    if W/H < 1.5:  # taller frame: lift the camera so the far edge stays on the fabric
        vf = 2*math.degrees(math.atan(math.tan(math.radians(FOV)/2)*cover*H/W))
        el += (vf - 2*math.degrees(math.atan(math.tan(math.radians(FOV)/2)*1080/1920)))/2
    wt = float(sstep(1.6, 3.0, t)*(1 - sstep(6.0, 7.6, t)))*0.85
    tx, ty = track(t)
    gx += (tx - gx)*wt; gy += (ty - gy)*wt
    # aspect: keep framing by the shorter side relative to 16:9 reference
    dist = math.exp(ldist)
    el, az = math.radians(el), math.radians(az)
    C = np.array([gx + dist*math.cos(el)*math.cos(az), gy + dist*math.cos(el)*math.sin(az), dist*math.sin(el)])
    Gt = np.array([gx, gy, 0.0])
    f = Gt - C; f /= np.linalg.norm(f)
    upw = np.array([0, -1.0, 0]) if el < math.radians(85) else np.array([0, -1.0, 0])
    r = np.cross(upw, f); r /= np.linalg.norm(r); u = np.cross(f, r)
    rr = math.radians(roll); r, u = r*math.cos(rr) + u*math.sin(rr), -r*math.sin(rr) + u*math.cos(rr)
    F = (W*0.5)/math.tan(math.radians(FOV)*0.5)/cover
    d = -u
    Kc = np.array([[F, 0, W/2], [0, F, H/2], [0, 0, 1]])
    E = np.array([[r[0], r[1], -r @ C], [d[0], d[1], -d @ C], [f[0], f[1], -f @ C]])
    return dict(H=Kc @ E, C=C, f=f, r=r, d=d, F=F, dist=dist, ap=ap, G=Gt, cx=W/2, cy=H/2)

def project(cam, P):
    P = np.asarray(P, float); pc = P - cam['C']
    z = pc @ cam['f']; x = pc @ cam['r']; y = pc @ cam['d']
    return np.array([cam['F']*x/z + cam['cx'], cam['F']*y/z + cam['cy']]).T, z

# ---------- light ----------
def light(t):
    az = math.radians(-128 + 22*(1 - sstep(0.0, 2.2, t)) + 10*sstep(7.9, 9.3, t) - 6*sstep(9.3, 10.0, t) + 4*sstep(10.0, 12.0, t))
    el = math.radians(30 - 6*sstep(8.5, 10.0, t))
    L = np.array([math.cos(el)*math.cos(az), math.cos(el)*math.sin(az), math.sin(el)])
    inten = float(0.42 + 0.58*sstep(0.0, 1.4, t))
    return L, inten

# ---------- frame ----------
def render(i, W=1920, H=1080, aa=1.0):
    t = i/FPS
    cam = camera(t, W, H); Hm = cam['H']; Hinv = np.linalg.inv(Hm)
    # visible texture region
    m = 0.06
    cs = np.array([[-m*W, -m*H, 1], [W*(1 + m), -m*H, 1], [W*(1 + m), H*(1 + m), 1], [-m*W, H*(1 + m), 1],
                   [W/2, -m*H, 1], [W/2, H*(1 + m), 1]]).T
    pp = Hinv @ cs; pp = pp[:2]/pp[2]
    x0, y0 = [int(max(0, math.floor(v))) for v in pp.min(1)]
    x1, y1 = [int(min(lim, math.ceil(v))) for v, lim in zip(pp.max(1), (TW, TH))]
    # texel density at screen center -> downsample factor
    c = Hinv @ np.array([W/2, H/2, 1.0]); c = c[:2]/c[2]
    c2 = Hinv @ np.array([W/2 + 1, H/2, 1.0]); c2 = c2[:2]/c2[2]
    tpp = np.linalg.norm(c2 - c)
    ds = max(1.0, tpp/1.15)
    K = stitches(t); kf = math.floor(K); frac = K - kf
    L, inten = light(t)
    sh, sw = y1 - y0, x1 - x0
    g = np.asarray(G[y0:y1, x0:x1]); wd = np.asarray(WD[y0:y1, x0:x1])
    mk = np.asarray(MK[y0:y1, x0:x1])
    rev = ((g >= 0) & (g < math.floor(K + 0.06))).astype(np.float32)
    R = rev*np.clip(mk*(1.15/255), 0, 1)
    q = 4
    Rs = cv2.resize(R, (max(1, sw//q), max(1, sh//q)), interpolation=cv2.INTER_AREA)
    off = -L[:2]/max(L[2], 0.2)*7.0/q
    Mt = np.float32([[1, 0, off[0]], [0, 1, off[1]]])
    shd = cv2.GaussianBlur(cv2.warpAffine(Rs, Mt, (Rs.shape[1], Rs.shape[0])), (0, 0), 3.0)
    ao = cv2.GaussianBlur(Rs, (0, 0), 6.0)
    shd = cv2.resize(shd, (sw, sh)); ao = cv2.resize(ao, (sw, sh))
    sc = cam['G'][:2]*0.7 + np.array([3000, TH/2])*0.3 + np.array([-1400, -500])*(1 - float(sstep(0.0, 2.4, t)))
    img = np.empty((sh, sw, 3), np.float32)
    shade(img, y0, x0, Nf, Ne, Te, G, WD, AE, AF, MK, shd, ao,
          cam['C'].astype(np.float64), L.astype(np.float64), float(inten), float(sc[0]), float(sc[1]), float(math.floor(K + 0.06)))
    # to screen
    if ds > 1.0:
        nw, nh = max(2, int(round(sw/ds))), max(2, int(round(sh/ds)))
        img = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
        sx, sy = sw/nw, sh/nh
    else:
        sx = sy = 1.0
    A = np.array([[sx, 0, x0 + 0.5*sx - 0.5], [0, sy, y0 + 0.5*sy - 0.5], [0, 0, 1]])
    out = cv2.warpPerspective(img, Hm @ A, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    # depth of field
    sy_, sx_ = np.mgrid[0:H, 0:W].astype(np.float32)
    P = np.tensordot(Hinv, np.stack([sx_, sy_, np.ones_like(sx_)]), 1); P = P[:2]/P[2]
    z = (P[0] - cam['C'][0])*cam['f'][0] + (P[1] - cam['C'][1])*cam['f'][1] - cam['C'][2]*cam['f'][2]
    zf = cam['dist']
    wt = float(sstep(2.0, 2.7, t)*(1 - sstep(6.6, 8.0, t)))
    if wt > 0:
        nx_, ny_, _, _ = needle_xy(min(stitches(t), TOTAL - 1.001))
        zn = (np.array([nx_, ny_, 0.0]) - cam['C']) @ cam['f']
        zf = zf + (zn - zf)*wt
    coc = cam['ap']*cam['F']*np.abs(z - zf)/(z*zf)*(H/1080)
    out = dof(out, coc)
    # needle + thread
    out = needle_layer(out, t, cam, W, H, coc)
    return finish(out, t, W, H)

SIG = [0, 1.2, 2.5, 4.5, 8.0, 13.0]
def dof(img, coc):
    c = np.clip(coc*0.5, 0, SIG[-1])
    layers = [img] + [cv2.GaussianBlur(img, (0, 0), s) for s in SIG[1:]]
    out = np.zeros_like(img)
    for k in range(len(SIG) - 1):
        a, b = SIG[k], SIG[k + 1]
        w = np.clip((c - a)/(b - a), 0, 1)
        sel = (c >= a) & (c <= b) if k < len(SIG) - 2 else (c >= a)
        mix = layers[k]*(1 - w[..., None]) + layers[k + 1]*w[..., None]
        out = np.where(sel[..., None], mix, out)
    return out

def _needle_state(ts):
    K = stitches(ts)
    if ts < T0 or K >= TOTAL - 1:
        x, y, _, k0 = needle_xy(min(max(K, 0.0), TOTAL - 1.001))
        zt = 40 + 2600*(1 - sstep(1.75, T0, ts)) if ts < T0 else 40 + 2600*sstep(T1, 8.6, ts)
        return x, y, zt, None
    x, y, f, k0 = needle_xy(K)
    zt = -30 + 230*(0.5 - 0.5*math.cos(2*math.pi*f))
    return x, y, zt, max(k0 - 1, 0)

def needle_layer(img, t, cam, W, H, coc):
    if t < 1.75 or t > T1: return img
    vis = 1 - float(sstep(7, 16, rate(t))) if t > T0 else 1.0
    if vis <= 0.01: return img
    L, inten = light(t)
    sh_ = 0.1/FPS
    probe = []
    for j in range(9):
        x, y, zt, _ = _needle_state(t + (j/8 - 0.5)*sh_)
        probe.append(project(cam, [[x, y, max(zt, 0) + 60]])[0][0])
    travel = sum(np.linalg.norm(probe[j + 1] - probe[j]) for j in range(8))
    nsub = int(np.clip(travel/2.5, 6, 48))
    # geometry pass
    items = []
    for j in range(nsub):
        ts = t + ((j + 0.5)/nsub - 0.5)*sh_
        x, y, zt, kp = _needle_state(ts)
        ztip = max(zt, 0.0)
        top = None
        for hgt in (2400, 1600, 1100, 800, 600, 450):
            if project(cam, [[x, y, zt + hgt]])[1][0] > 120: top = zt + hgt; break
        if top is None: continue
        pts, z = project(cam, [[x, y, ztip], [x, y, top]])
        if np.any(z <= 50): continue
        a, b = pts[0], pts[1]
        dvec = b - a; ln = np.linalg.norm(dvec)
        if ln < 1: continue
        n = np.array([-dvec[1], dvec[0]])/ln
        w0 = 7.0*cam['F']/z[0]; w1 = 7.0*cam['F']/z[1]
        tip = a - dvec/ln*w0*(2.5 if zt > -1 else 0.0)
        strips = [(np.array([tip, a + n*w0*hi_, b + n*w1*hi_, b + n*w1*lo, a + n*w0*lo]), sh)
                  for lo, hi_, sh in [(-1, -0.55, 0.10), (-0.55, -0.15, 0.32), (-0.15, 0.15, 1.10), (0.15, 0.55, 0.42), (0.55, 1, 0.12)]]
        outline = np.array([tip, a + n*w0, b + n*w1, b - n*w1, a - n*w0])
        thr = None
        if kp is not None:
            p2, z2 = project(cam, [[NX[kp], NY[kp], 0], [x, y, ztip + 28]])
            if np.all(z2 > 50): thr = (p2, 3.4*cam['F']/z2[0])
        items.append((strips, outline, thr))
    if not items: return img
    allp = np.vstack([it[1] for it in items] + [it[2][0] for it in items if it[2] is not None])
    bx0 = int(max(0, np.floor(allp[:, 0].min()) - 8)); by0 = int(max(0, np.floor(allp[:, 1].min()) - 8))
    bx1 = int(min(W, np.ceil(allp[:, 0].max()) + 8)); by1 = int(min(H, np.ceil(allp[:, 1].max()) + 8))
    if bx1 - bx0 < 2 or by1 - by0 < 2: return img
    ss = 2; S16 = ss*16; o = np.array([bx0, by0], float)
    rw, rh = (bx1 - bx0)*ss, (by1 - by0)*ss
    col = np.zeros((rh, rw, 3), np.float32); al = np.zeros((rh, rw), np.float32)
    c1 = np.zeros((rh, rw), np.float32); m1 = np.zeros_like(c1); tm = np.zeros_like(c1)
    lum = inten*(0.55 + 0.45*max(L[2], 0))
    q = lambda p: np.round((p - o)*S16).astype(np.int32)
    for strips, outline, thr in items:
        c1[:] = 0; m1[:] = 0
        for poly, shv in strips:
            cv2.fillPoly(c1, [q(poly)], shv, cv2.LINE_AA, 4)
        cv2.fillPoly(m1, [q(outline)], 1.0, cv2.LINE_AA, 4)
        np.minimum(c1, m1*1.2, out=c1)
        col[..., 0] += c1*(0.86*lum/nsub); col[..., 1] += c1*(0.87*lum/nsub); col[..., 2] += c1*(0.92*lum/nsub)
        al += m1/nsub
        if thr is not None:
            p2, wpx = thr; tm[:] = 0
            cv2.line(tm, tuple(q(p2[0])), tuple(q(p2[1])), 1.0, max(1, int(round(wpx*ss))), cv2.LINE_AA, 4)
            tm = np.maximum(tm - m1, 0)
            col[..., 0] += tm*(0.55*inten/nsub); col[..., 1] += tm*(0.39*inten/nsub); col[..., 2] += tm*(0.16*inten/nsub)
            al += tm/nsub
    col = cv2.resize(col, (bx1 - bx0, by1 - by0), interpolation=cv2.INTER_AREA)
    a_ = np.clip(cv2.resize(al, (bx1 - bx0, by1 - by0), interpolation=cv2.INTER_AREA), 0, 1)*vis
    col *= vis
    col = cv2.GaussianBlur(col, (0, 0), 0.6); a_ = cv2.GaussianBlur(a_, (0, 0), 0.6)
    img = img.copy()
    img[by0:by1, bx0:bx1] = img[by0:by1, bx0:bx1]*(1 - a_[..., None]) + col
    return img

def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x*(a*x + b))/(x*(c*x + d) + e), 0, 1)

_grain_rng = np.random.default_rng(3)
def finish(img, t, W, H):
    expo = 2.2
    br = np.clip(img*expo - 1.0, 0, None)
    bloom = cv2.GaussianBlur(cv2.resize(br, (W//4, H//4), interpolation=cv2.INTER_AREA), (0, 0), 6)
    img = img*expo + cv2.resize(bloom, (W, H))*0.10
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = ((xx - W/2)/(W*0.62))**2 + ((yy - H/2)/(H*0.75))**2
    img *= (1 - 0.55*np.clip(v, 0, 1)**1.3)[..., None]
    out = aces(img)**(1/2.2)
    # subtle warm grade
    out = out*np.array([1.01, 1.0, 0.98], np.float32)
    rng = np.random.default_rng(int(t*FPS) + 11)
    out += rng.standard_normal((H, W, 1)).astype(np.float32)*0.006
    return (np.clip(out, 0, 1)*255 + 0.5).astype(np.uint8)

if __name__ == '__main__':
    import time
    for a in sys.argv[1:]:
        st = time.time(); fr = int(float(a)*FPS)
        im = render(fr)
        cv2.imwrite(f'{D}/test_{a}.png', im[..., ::-1]); print(a, round(time.time() - st, 1), 's', 'K', round(stitches(fr/FPS), 1))
