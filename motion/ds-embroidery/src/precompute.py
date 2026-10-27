# Bakes static texture-space maps for the embroidery + knit fabric.
import numpy as np, cv2, geom, json
from scipy.spatial import cKDTree
W, H = 6000, 7000
K = 2.17                      # font-1000 units -> texels (cap height ~1500)
OX = W/2 - (99+1408)/2*K; OY = H/2 - (222+942)/2*K
PITCH = 6.5                   # satin stitch spacing along stroke, texels
rng = np.random.default_rng(7)

def hash2(i, j, seed=0):
    h = (i*374761393 + j*668265263 + seed*1442695041) & 0xffffffff
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return ((h ^ (h >> 16)) & 0xffff) / 65535.0

def resample(p):
    seg = np.linalg.norm(np.diff(p, axis=0), axis=1); s = np.r_[0, np.cumsum(seg)]
    ss = np.arange(0, s[-1], 1.0)
    q = np.column_stack([np.interp(ss, s, p[:, 0]), np.interp(ss, s, p[:, 1])])
    t = np.gradient(q, axis=0); t /= np.linalg.norm(t, axis=1, keepdims=True) + 1e-9
    t = cv2.GaussianBlur(t.reshape(-1, 1, 2).astype(np.float32), (1, 31), 0).reshape(-1, 2)
    t /= np.linalg.norm(t, axis=1, keepdims=True) + 1e-9
    return q, ss, t

def main():
    M = geom.mask(K, OX, OY, W, H)
    inside = (M > 0.5).astype(np.uint8)
    regs = geom.regions()
    samp, sarr, tan, rid = [], [], [], []
    for r, (name, p) in enumerate(regs):
        q, ss, t = resample(p*K + [OX, OY])
        samp.append(q); sarr.append(ss); tan.append(t); rid.append(np.full(len(q), r))
    samp = np.vstack(samp); sarr = np.concatenate(sarr); tan = np.vstack(tan); rid = np.concatenate(rid)
    tree = cKDTree(samp)
    act = cv2.dilate((M > 0.01).astype(np.uint8), np.ones((5, 5), np.uint8))
    ys, xs = np.nonzero(act); P = np.column_stack([xs, ys]).astype(np.float64)
    _, j = tree.query(P, workers=4)
    r = rid[j].copy()
    # explicit digitising objects: straight seams instead of Voronoi pockets
    fx = (P[:, 0] - OX)/K; fy = (P[:, 1] - OY)/K
    _, lab = cv2.connectedComponents(inside)
    dlab = lab[int(OY + 600*K), int(OX + 272*K)]
    dm = cv2.dilate((lab == dlab).astype(np.uint8), np.ones((9, 9), np.uint8))[ys, xs] > 0
    r[dm & (fx < 357)] = 0; r[dm & (fx >= 357)] = 1
    sm = ~dm
    r[sm] = 3
    r[sm & (fx > 1296) & (fy < 432)] = 2
    r[sm & (fx < 928) & (fy > 650)] = 4
    # nearest sample within the assigned region
    for k in range(len(regs)):
        sel = r == k
        if sel.any():
            sub = np.nonzero(rid == k)[0]
            _, jj = cKDTree(samp[sub]).query(P[sel], workers=4); j[sel] = sub[jj]
    s = sarr[j]; t = tan[j]; nrm = np.column_stack([-t[:, 1], t[:, 0]])
    o = np.einsum('ij,ij->i', P - samp[j], nrm)
    # global stitch index: regions in order, with travel gaps (D->S jump is longer)
    nloc = [int(sarr[rid == k].max()/PITCH) + 1 for k in range(len(regs))]
    gaps = [4, 4, 60, 4, 4]
    off = []; acc = 0
    for k in range(len(regs)):
        off.append(acc); acc += nloc[k] + gaps[k]
    off = np.array(off); total = acc
    kl = np.floor(s/PITCH).astype(np.int64); g = off[r] + kl
    u = s/PITCH - kl
    ins = inside[ys, xs] > 0
    omin = np.full(total, 1e9); omax = np.full(total, -1e9)
    np.minimum.at(omin, g[ins], o[ins]); np.maximum.at(omax, g[ins], o[ins])
    span = np.maximum(omax[g] - omin[g], 1.0); w = np.clip((o - omin[g])/span, 0, 1)
    wdir = np.where(g % 2 == 0, w, 1 - w)
    # per-stitch jitter
    gj = rng.random(total); gj2 = rng.random(total)
    # needle path: for every stitch, entry point on alternating side of the chord
    needle = np.zeros((total, 3))  # x, y, valid
    for k in range(len(regs)):
        sel = rid == k
        for i in range(nloc[k]):
            gi = off[k] + i
            if omin[gi] > 1e8: continue
            si = min(int((i + 0.5)*PITCH), sel.sum() - 1)
            c = samp[sel][si]; tt = tan[sel][si]; nn = np.array([-tt[1], tt[0]])
            side = omax[gi] if gi % 2 == 0 else omin[gi]  # stitch ends at w=1 for even
            needle[gi] = [*(c + nn*side), 1]
    # ---- height fields ----
    dist = cv2.distanceTransform(inside, cv2.DIST_L2, 5)
    He = np.zeros((H, W), np.float32)
    prof = np.sqrt(np.clip(1 - (2*u - 1)**2, 0, 1))**0.75
    along = o - omin[g]
    twist = 0.5 + 0.5*np.sin(2*np.pi*(along/5.0 + u*0.9))
    dome = 6.5*(1 - np.exp(-dist[ys, xs]/10.0))
    endsag = 1 - 0.35*np.exp(-np.minimum(w, 1 - w)*span/5.0)
    hh = (dome + (3.4*prof + 0.25*twist*prof)*(0.9 + 0.2*gj[g]))*endsag
    He[ys, xs] = hh
    He *= np.clip(M*1.15, 0, 1)
    # fabric knit (jersey, V columns)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    px, py = 16.0, 13.0
    i = np.floor(xx/px); jj = np.floor(yy/py)
    lx = xx - (i + 0.5)*px; ly = yy - (jj + 0.5)*py
    jit = hash2(i.astype(np.int64), jj.astype(np.int64)).astype(np.float32)
    Hf = np.zeros((H, W), np.float32)
    for sgn in (-1, 1):
        cx = sgn*(3.7 - ly*0.42) + (jit - 0.5)*0.8
        ac = (lx - cx)*0.92
        leg = np.exp(-(ac/2.3)**2)*(0.55 + 0.45*np.cos(np.pi*ly/py))
        ply = 0.18*np.sin(2*np.pi*(ac*0.55 + ly*0.35*sgn))
        Hf = np.maximum(Hf, leg*(1 + ply))
    Hf *= (0.85 + 0.3*jit)*2.4
    fuzz = cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 1.2)*0.9
    Hf += fuzz
    # drape folds (low frequency), shared by fabric and embroidery
    low = cv2.resize(rng.standard_normal((H//200 + 2, W//200 + 2)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    low = cv2.GaussianBlur(low, (0, 0), 260)
    low = low/np.abs(low).max()
    fold = 70*low + 22*np.sin((xx*0.6 + yy)/520.0 + 1.3)
    fold *= 1 - 0.75*np.exp(-(((xx - W/2)/1800)**2 + ((yy - H/2)/1100)**2))  # calmer under logo
    def normals(h):
        gx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3)/8; gy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3)/8
        n = np.dstack([-gx, -gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
        return n, gx, gy
    Nf, _, _ = normals(Hf + fold)
    Ne, gx, gy = normals(He + fold + Hf*0.15)
    # thread tangent: chord direction (across stroke) tilted by slope
    T = np.zeros((H, W, 3), np.float32)
    T[ys, xs, 0] = nrm[:, 0]; T[ys, xs, 1] = nrm[:, 1]
    T[..., 2] = T[..., 0]*gx + T[..., 1]*gy
    T /= np.linalg.norm(T, axis=2, keepdims=True) + 1e-9
    G = np.full((H, W), -1, np.int32); G[ys, xs] = g
    WD = np.zeros((H, W), np.float32); WD[ys, xs] = wdir
    AE = np.ones((H, W), np.float32); AE[ys, xs] = (0.93 + 0.12*gj2[g])*(0.88 + 0.12*prof)
    # cavity between threads darkens (thread valleys)
    AE[ys, xs] *= 0.30 + 0.70*np.clip(prof*1.5, 0, 1)
    AF = (0.75 + 0.5*jit*(0.6 + 0.4*np.clip(Hf/2.4, 0, 1))).astype(np.float32)
    i8 = lambda v: np.round(v*127).astype(np.int8)
    u8 = lambda v, sc=1.0: np.round(np.clip(v/sc, 0, 1)*255).astype(np.uint8)
    np.save('Nf8.npy', i8(Nf)); np.save('Ne8.npy', i8(Ne)); np.save('Te8.npy', i8(T))
    np.save('G.npy', G); np.save('WD8.npy', u8(WD)); np.save('AE8.npy', u8(AE, 1.2)); np.save('AF8.npy', u8(AF, 1.2))
    np.save('M8.npy', u8(M)); np.save('needle.npy', needle)
    json.dump(dict(W=W, H=H, K=K, OX=OX, OY=OY, total=int(total), off=off.tolist(), nloc=nloc), open('meta.json', 'w'))
    print('stitches', total, nloc)

if __name__ == '__main__':
    main()
