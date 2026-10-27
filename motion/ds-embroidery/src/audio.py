# Synthesised score + foley locked to the stitch timeline of render.py
import numpy as np, render, wave
from scipy.signal import butter, sosfilt
SR = 48000; N = int(render.DUR*SR); t = np.arange(N)/SR
rng = np.random.default_rng(5)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def env(a, b, c, d):  # trapezoid fade a->b up, c->d down
    return np.clip((t - a)/(b - a + 1e-9), 0, 1)*np.clip((d - t)/(d - c + 1e-9), 0, 1)
L = np.zeros(N); R = np.zeros(N)
def add(sig, start, gain=1.0, pan=0.0):
    i = int(start*SR); n = min(len(sig), N - i)
    if n <= 0 or i < 0: return
    L[i:i+n] += sig[:n]*gain*np.sqrt(0.5*(1 - pan)); R[i:i+n] += sig[:n]*gain*np.sqrt(0.5*(1 + pan))

# 1) warm pad: A minor add9, slow swells, resolves to A major colour at the landing (10.0 s)
def pad_voice(f, a, b, c, d, det=0.0015):
    ph = rng.random()*6.28
    s = sum(np.sin(2*np.pi*f*(1 + k*det)*t + ph + k) for k in (-1, 0, 1))/3
    s += 0.3*np.sin(2*np.pi*2*f*t + ph)
    return s*env(a, b, c, d)
pad = (pad_voice(55.0, 0, 3.0, 9.6, 10.4)*0.9 + pad_voice(82.41, 0.5, 3.5, 9.6, 10.4)*0.6
       + pad_voice(110.0, 1.0, 4.0, 9.6, 10.4)*0.5 + pad_voice(130.81, 2.0, 5.0, 9.6, 10.4)*0.35
       + pad_voice(123.47, 4.0, 7.0, 9.6, 10.4)*0.25)
land = (pad_voice(55.0, 9.9, 10.3, 11.0, 12.0)*0.9 + pad_voice(110.0, 9.9, 10.3, 11.0, 12.0)*0.55
        + pad_voice(138.59, 9.9, 10.4, 11.0, 12.0)*0.35 + pad_voice(164.81, 9.9, 10.4, 11.0, 12.0)*0.3)
pads = lp(pad + land, 900)
add(pads, 0, 0.10, -0.1); add(np.roll(pads, 480), 0, 0.10, 0.1)

# 2) soft room / fabric air
air = lp(hp(rng.standard_normal(N), 300), 3000)*env(0, 1.5, 9.5, 11.5)
add(air, 0, 0.008)

# 3) stitches: needle penetration tick + low thump, thinning into a machine purr when fast
kc = render.KCUM; tg = render._tg
times = np.interp(np.arange(1, render.TOTAL), kc, tg)
times = times[(times > render.T0) & (times < render.T1 + 0.05)]
tick = hp(rng.standard_normal(int(0.012*SR)), 2500)*np.exp(-np.arange(int(0.012*SR))/(0.0025*SR))
tt = np.arange(int(0.06*SR))/SR
thump = np.sin(2*np.pi*(150*tt - 400*tt*tt))*np.exp(-tt/0.012)
swish_n = int(0.09*SR); swish = bp(rng.standard_normal(swish_n), 3000, 9000)*np.hanning(swish_n)
for k, ts in enumerate(times):
    r = render.rate(ts)
    g = 1/np.sqrt(max(1.0, r/8))
    pan = float(np.clip(np.sin(k*0.7)*0.25, -0.3, 0.3))
    add(tick, ts, 0.22*g, pan); add(thump, ts, 0.30*g, 0)
    if r < 14: add(swish, ts - 0.1, 0.05, -pan)  # thread drawn through before the pull
purr = lp(rng.standard_normal(N), 700)*np.array([min(1.0, max(0.0, (render.rate(x) - 20)/120)) for x in t[::480]]).repeat(480)[:N]
add(lp(purr, 500), 0, 0.05)

# 4) tie-off at end of stitching + gentle air swell into the glide
add(tick, render.T1 + 0.05, 0.25); add(thump, render.T1 + 0.05, 0.35)
sw = bp(rng.standard_normal(N), 400, 2500)*np.clip(np.sin(np.pi*np.clip((t - 8.0)/1.9, 0, 1)), 0, 1)**2
add(sw, 0, 0.018, 0.0)
rise = bp(rng.standard_normal(N), 800, 6000)*np.clip((t - 9.0)/1.0, 0, 1)**3*(t < 10.0)
add(rise, 0, 0.02)

# 5) landing accent at 10.0: soft low boom + bell-like chord (inharmonic partials, long decay)
tb = np.arange(int(2.0*SR))/SR
boom = np.sin(2*np.pi*(46*tb + 6*np.exp(-tb*6)))*np.exp(-tb/0.55)*(1 - np.exp(-tb*200))
add(lp(boom, 300), 10.0, 0.26)
def bell(f, dec):
    parts = [(1, 1), (2.0, 0.45), (3.01, 0.22), (4.2, 0.12), (5.43, 0.06)]
    return sum(a*np.sin(2*np.pi*f*m*tb)*np.exp(-tb/(dec/m**0.7)) for m, a in parts)*(1 - np.exp(-tb*300))
chord = bell(440.0, 1.3) + 0.8*bell(554.37, 1.2) + 0.7*bell(659.25, 1.1) + 0.4*bell(880, 0.9)
add(lp(chord, 5000), 10.0, 0.055, -0.15); add(lp(chord, 5000), 10.012, 0.05, 0.15)

mix = np.stack([L, R], 1)
# simple room: a few early reflections
for d, g in [(0.023, 0.25), (0.041, 0.18), (0.067, 0.12), (0.101, 0.08)]:
    s = int(d*SR); mix[s:] += np.stack([R, L], 1)[:-s]*g*lp(np.ones(1), 1)[0]
mix *= np.clip((render.DUR - t)/0.35, 0, 1)[:, None]  # end fade
mix *= np.clip(t/0.05, 0, 1)[:, None]
peak = np.abs(mix).max(); mix *= 10**(-1.5/20)/peak
print('peak scale', 1/peak)
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix*32767).astype(np.int16).tobytes())
