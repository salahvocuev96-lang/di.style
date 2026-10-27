import render, numpy as np, sys
W, H = 1920, 1080
def scr(t):
    cam = render.camera(t, W, H); Hm = cam['H']
    c = np.linalg.inv(Hm)
    g = np.array([[x, y, 1] for x in np.linspace(0, W, 9) for y in np.linspace(0, H, 5)]).T
    P = c @ g; P = P/P[2]
    return P  # plane points under the screen grid at t
out = []
for i in range(0, 719):
    P = scr(i/60); cam2 = render.camera((i + 1)/60, W, H)
    q = cam2['H'] @ P; q = q[:2]/q[2]
    g = np.array([[x, y] for x in np.linspace(0, W, 9) for y in np.linspace(0, H, 5)]).T
    out.append(np.linalg.norm(q - g, axis=0).mean())
out = np.array(out)
a0, a1 = float(sys.argv[1]), float(sys.argv[2])
for i in range(int(a0*60), int(a1*60), 6): print(f'{i/60:5.2f} {out[i]:6.1f}')
