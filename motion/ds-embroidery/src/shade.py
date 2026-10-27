# Per-texel shading kernel (numba): knit fabric + anisotropic gold satin.
import numpy as np, math
from numba import njit, prange

@njit(parallel=True, fastmath=True, cache=True)
def shade(out, y0, x0, Nf, Ne, Te, G, WD, AE, AF, MK, shd, ao, C, L, inten, pcx, pcy, K):
    sh, sw = out.shape[0], out.shape[1]
    kf = math.floor(K); frac = K - kf
    for yy in prange(sh):
        y = y0 + yy
        for xx in range(sw):
            x = x0 + xx
            vx = C[0] - x; vy = C[1] - y; vz = C[2]
            vn = 1.0/math.sqrt(vx*vx + vy*vy + vz*vz); vx *= vn; vy *= vn; vz *= vn
            hx = vx + L[0]; hy = vy + L[1]; hz = vz + L[2]
            hn = 1.0/math.sqrt(hx*hx + hy*hy + hz*hz); hx *= hn; hy *= hn; hz *= hn
            dx = (x - pcx)/2600.0; dy = (y - pcy)/1900.0
            lit = inten*(0.30 + 0.70*math.exp(-(dx*dx + dy*dy)))
            s_ = shd[yy, xx]; a_ = ao[yy, xx]
            # fabric
            nx = Nf[y, x, 0]/127.0; ny = Nf[y, x, 1]/127.0; nz = Nf[y, x, 2]/127.0
            ndl = max(nx*L[0] + ny*L[1] + nz*L[2], 0.0)
            ndh = max(nx*hx + ny*hy + nz*hz, 0.0)
            af = AF[y, x]*(1.2/255.0)
            fd = (ndl*0.9 + 0.05)*af*lit*(1 - 0.75*s_)*(1 - 0.4*a_)
            fs = (ndh**24)*0.030*lit*(1 - 0.85*s_)
            fr = fd*0.0125 + fs*0.85; fg = fd*0.0120 + fs*0.85; fb = fd*0.0122 + fs*0.88
            g = G[y, x]
            R = 0.0
            if g >= 0:
                if g < kf or (g == kf and WD[y, x] <= frac*255.0):
                    R = min(MK[y, x]*(1.15/255.0), 1.0)
            if R <= 0.0:
                out[yy, xx, 0] = fr; out[yy, xx, 1] = fg; out[yy, xx, 2] = fb
                continue
            nx = Ne[y, x, 0]/127.0; ny = Ne[y, x, 1]/127.0; nz = Ne[y, x, 2]/127.0
            tx = Te[y, x, 0]/127.0; ty = Te[y, x, 1]/127.0; tz = Te[y, x, 2]/127.0
            ndl = max(nx*L[0] + ny*L[1] + nz*L[2], 0.0)
            vis = min(ndl*3.0, 1.0)
            ae = AE[y, x]*(1.2/255.0)
            fresh = max(0.0, 1.0 - (K - g)/30.0)
            # Kajiya-Kay, two shifted lobes
            ax = tx + 0.15*nx; ay = ty + 0.15*ny; az = tz + 0.15*nz
            th = (ax*hx + ay*hy + az*hz)/math.sqrt(ax*ax + ay*ay + az*az + 1e-8)
            s1 = max(1 - th*th, 0.0)**90.0
            ax = tx - 0.25*nx; ay = ty - 0.25*ny; az = tz - 0.25*nz
            th = (ax*hx + ay*hy + az*hz)/math.sqrt(ax*ax + ay*ay + az*az + 1e-8)
            s2 = max(1 - th*th, 0.0)**11.0
            d = (ndl*0.85 + 0.035)*ae*lit
            sp1 = s1*1.15*(1 + 0.3*fresh)*ae*ae*vis*lit
            sp2 = s2*0.20*ae*vis*lit
            er = d*0.42 + sp1*1.00 + sp2*0.80
            eg = d*0.25 + sp1*0.70 + sp2*0.48
            eb = d*0.08 + sp1*0.32 + sp2*0.16
            out[yy, xx, 0] = fr + (er - fr)*R
            out[yy, xx, 1] = fg + (eg - fg)*R
            out[yy, xx, 2] = fb + (eb - fb)*R
