# Glyph geometry: DS mask + satin centerlines (font-1000 coords, D at x=50, S shifted).
import numpy as np, os
from PIL import Image, ImageDraw, ImageFont
FONT = os.environ.get('DS_FONT', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gelasio-latin-700-normal.woff'))
SX = 804  # S origin x (kerned tighter than default 864)

def chaikin(pts, n=4):
    p = np.asarray(pts, float)
    for _ in range(n):
        q = 0.75*p[:-1] + 0.25*p[1:]; r = 0.25*p[:-1] + 0.75*p[1:]
        p = np.vstack([p[:1], np.column_stack([q, r]).reshape(-1, 2), p[-1:]])
    return p

def ell(cx, cy, a, b, t0, t1, n=24):
    t = np.radians(np.linspace(t0, t1, n))
    return np.column_stack([cx + a*np.cos(t), cy + b*np.sin(t)])

def regions():
    # (name, polyline) in stitch order; display coords*1.1 were measured from test render
    stem = [(275, 232), (275, 932)]
    bowl = np.vstack([[(335, 903), (450, 903)], ell(450, 581, 306, 322, 90, -90, 40)[1:-1], [(450, 259), (335, 259)]])
    s_top = [(1336, 440), (1333, 215)]
    s_spine = [(1350, 316), (1290, 288), (1235, 262), (1160, 244), (1085, 243), (1010, 262), (960, 300), (948, 350), (968, 412),
               (1030, 470), (1130, 530), (1240, 592), (1310, 650), (1334, 745), (1318, 830), (1268, 885), (1190, 915),
               (1110, 920), (1030, 903), (965, 868), (925, 820), (905, 770), (888, 700)]
    s_bot = [(898, 665), (899, 940)]
    out = [('D_stem', np.array(stem, float)), ('D_bowl', chaikin(bowl, 3)),
           ('S_top', np.array(s_top)), ('S_spine', chaikin(s_spine, 4)), ('S_bot', np.array(s_bot))]
    return out

def mask(scale, ox, oy, W, H):
    f = ImageFont.truetype(FONT, int(round(1000*scale)))
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    d.text((ox + 50*scale, oy), 'D', font=f, fill=255)
    d.text((ox + SX*scale, oy), 'S', font=f, fill=255)
    return np.asarray(im, np.float32)/255.0
