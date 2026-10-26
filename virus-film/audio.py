"""Музыка и звуковой дизайн ролика: синтез на numpy, без внешних сэмплов.
Запуск: python3 audio.py  -> audio.wav (48 кГц, стерео, 50 с)
Таймкоды берутся из той же раскадровки, что и анимация (+ events.json из dump_events.js)."""
import json, os, wave
import numpy as np

SR = 48000
DUR = 50.0
N = int(SR * DUR)
BEAT = 0.5  # 120 BPM
rng = np.random.default_rng(3)
L = np.zeros(N); R = np.zeros(N)
here = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(here, 'events.json')))


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0:
        return
    s = sig[: max(0, N - i)]
    if i < 0:
        s = s[-i:]; i = 0
    lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(s)] += s * gain * lg * 1.414
    R[i:i + len(s)] += s * gain * rg * 1.414


def env(n, a, r, sustain=True):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    rel = np.clip((n / SR - t) / max(r, 1e-4), 0, 1)
    return e * rel


def spec_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X * m, len(x))


def additive(freq, dur, harm=8, roll=3.0, det=0.0):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for k in range(1, harm + 1):
        s += np.sin(2 * np.pi * freq * k * (1 + det) * t + k) / k * np.exp(-k / roll)
    return s


# ---------------- музыка ----------------
CH = {  # аккорды (MIDI), такт = 2 с
    'Dm': [50, 57, 62, 65, 69], 'Bb': [46, 53, 58, 62, 65], 'F': [41, 53, 57, 60, 65], 'C': [48, 55, 60, 64, 67],
    'Gm': [43, 55, 58, 62, 67], 'A': [45, 57, 61, 64, 69], 'Eb': [51, 58, 63, 67, 70], 'Fadd9': [41, 53, 57, 60, 67, 72],
}
prog = ['Dm', 'Dm', 'Bb', 'Dm', 'Bb', 'F', 'C', 'Dm',  # 0-16
        'Gm', 'Dm', 'Eb', 'A',  # 16-24
        'Dm', 'Bb', 'Gm', 'A', 'Dm',  # 24-34 (с 22 — фабрика)
        'Bb', 'Gm', 'Eb', 'A',  # 34-42
        'Bb', 'Gm', 'Fadd9', 'Fadd9']  # 42-50
bars = []
t = 0.0
for c in prog:
    bars.append((t, c)); t += 2.0

# пэд — весь ролик, громкость по драматургии
def pad_level(t):
    return np.interp(t, [0, 6, 9, 14, 22, 32, 36, 41.5, 42, 46, 50], [.55, .6, .45, .6, .45, .5, .6, .75, .4, .8, .8])

for (t0, c) in bars:
    for m in CH[c]:
        for det, pan in ((-.003, -.6), (.003, .6)):
            s = additive(hz(m), 2.25, harm=7, roll=2.2, det=det) * env(int(2.25 * SR), .5, .7)
            place(s, t0, .035 * pad_level(t0), pan)

# суб-бас дрон в начале
s = np.sin(2 * np.pi * hz(38) * np.arange(int(6.2 * SR)) / SR) * env(int(6.2 * SR), 2.5, 1.0)
place(s, 0, .12)

# бас восьмыми (с 6.0), в 3-й сцене — половинные, в 4-й — шестнадцатые
for (t0, c) in bars:
    root = CH[c][0] - 12 if CH[c][0] > 45 else CH[c][0]
    if t0 < 6 or t0 >= 42:
        continue
    if 14 <= t0 < 22:
        steps = [(0, 1.0), (1.0, 1.0)]
    elif 22 <= t0 < 32:
        steps = [(k * .25, .22) for k in range(8)]
    else:
        steps = [(k * .5, .45) for k in range(4)]
    for i, (o, d) in enumerate(steps):
        n = int(d * SR); tt = np.arange(n) / SR
        f = hz(root + (12 if (22 <= t0 < 32 and i % 4 == 2) else 0))
        x = np.sin(2 * np.pi * f * tt) + .45 * np.sin(4 * np.pi * f * tt) + .2 * np.sin(6 * np.pi * f * tt)
        place(x * np.exp(-tt * 5) * env(n, .005, .03), t0 + o, .16)

# арпеджио-«блёстки» с эхом (сцены 1, 4, 5)
def arp(t0, t1, notes_fn, step=.25, gain=.05):
    t = t0; i = 0
    while t < t1:
        c = notes_fn(t)
        m = c[1:][i % (len(c) - 1)] + 12
        n = int(.35 * SR); tt = np.arange(n) / SR
        x = (np.sin(2 * np.pi * hz(m) * tt) + .3 * np.sin(2 * np.pi * hz(m) * 3 * tt)) * np.exp(-tt * 9)
        pan = .5 * np.sin(i * 1.3)
        for k, g in enumerate((1, .45, .2)):
            place(x, t + k * .375, gain * g, pan * (-1) ** k)
        t += step; i += 1

chord_at = lambda t: CH[prog[min(len(prog) - 1, int(t // 2))]]
arp(1.0, 6.0, chord_at, .25, .035)
arp(22.0, 32.0, chord_at, .125, .028)
arp(32.0, 42.0, chord_at, .25, .04)

# ударные
def kick(t, g=.5):
    n = int(.35 * SR); tt = np.arange(n) / SR
    f = 45 + 90 * np.exp(-tt * 30); ph = 2 * np.pi * np.cumsum(f) / SR
    place(np.sin(ph) * np.exp(-tt * 9), t, g)

def snare(t, g=.18):
    n = int(.25 * SR); tt = np.arange(n) / SR
    x = spec_filter(rng.standard_normal(n), 900, 7000) * np.exp(-tt * 18) + .4 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 25)
    place(x, t, g)

def hat(t, g=.05, pan=.3):
    n = int(.06 * SR); tt = np.arange(n) / SR
    place(spec_filter(rng.standard_normal(n), 7000) * np.exp(-tt * 70), t, g, pan)

def tick(t, g=.08, f=2600, pan=0):
    n = int(.05 * SR); tt = np.arange(n) / SR
    place(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 120), t, g, pan)

b = 0.0
while b < 42.0 - 1e-6:
    k = int(round(b / BEAT))
    if 6.0 <= b < 14.0:
        kick(b, .45); hat(b + .25, .05)
        if k % 2 == 1: snare(b, .1)
    elif 14.0 <= b < 22.0:
        if k % 4 == 0: kick(b, .5)
        tick(b, .05, 3200, .6 if k % 2 else -.6)  # «часы» напряжения
    elif 22.0 <= b < 32.0:
        kick(b, .5)
        if k % 2 == 1: snare(b, .16)
        for s in range(4):  # механика «фабрики»
            hat(b + s * .125, .035 if s else .05, -.4 + .27 * s)
        tick(b + .375, .05, 1800, .5)
    elif 32.0 <= b < 42.0:
        kick(b, .55)
        if k % 2 == 1: snare(b, .2)
        hat(b + .25, .06); hat(b + .375, .03, -.3)
    b += BEAT

# стабы (кульминация) и подъём к 42
for t0 in np.arange(32.0, 36.0, 2.0):
    for m in CH[prog[int(t0 // 2)]][1:]:
        n = int(.4 * SR); tt = np.arange(n) / SR
        place(additive(hz(m), .4, 10, 4) * np.exp(-tt * 6), t0, .03)
n = int(5.6 * SR); tt = np.arange(n) / SR
riser = spec_filter(rng.standard_normal(n), 300, 9000) * (tt / tt[-1]) ** 3
place(riser, 36.4, .12)

# ---------------- звуковой дизайн ----------------
def whoosh(t, dur=.6, g=.25, f0=400, f1=4000, pan0=-.5, pan1=.5):
    n = int(dur * SR); x = rng.standard_normal(n); y = np.zeros(n); a = 0.0
    fc = np.geomspace(f0, f1, n // 2).tolist() + np.geomspace(f1, f0, n - n // 2).tolist()
    for i in range(n):
        k = 1 - np.exp(-2 * np.pi * fc[i] / SR); a += k * (x[i] - a); y[i] = a
    e = np.sin(np.pi * np.arange(n) / n) ** 2
    half = n // 2
    place(y[:half] * e[:half], t - dur / 2, g, pan0)
    place(y[half:] * e[half:], t, g, pan1)

def bell(t, m, g=.12, dec=3.0, pan=0):
    n = int(2.5 * SR); tt = np.arange(n) / SR; f = hz(m)
    x = np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 3) + .25 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 6)
    place(x * np.exp(-tt * dec) * env(n, .002, .2), t, g, pan)

def pop(t, f=600, g=.2, pan=0):
    n = int(.12 * SR); tt = np.arange(n) / SR
    fr = f * (1 + 2 * np.exp(-tt * 60)); ph = 2 * np.pi * np.cumsum(fr) / SR
    place(np.sin(ph) * np.exp(-tt * 35), t, g, pan)

def snip(t, g=.22, pan=0):
    for o, f in ((0, 5200), (.045, 4300)):
        n = int(.04 * SR); tt = np.arange(n) / SR
        place(spec_filter(rng.standard_normal(n), f * .7, f * 1.4) * np.exp(-tt * 140), t + o, g, pan)
    n = int(.4 * SR); tt = np.arange(n) / SR
    place(np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt * 14) * .3, t + .045, g, pan)

def thump(t, f0=90, f1=35, dur=.6, g=.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 8); ph = 2 * np.pi * np.cumsum(f) / SR
    place(np.sin(ph) * np.exp(-tt * 4), t, g)

# сцена 1
whoosh(.4, 1.6, .12, 200, 1500)
bell(4.0, 81, .1, 2.5, .3); bell(4.06, 86, .07, 2.5, .3)  # глаза открываются
for i, ch in enumerate('ВИРУС'):
    tick(4.15 + i * .05, .05, 1500 + i * 120, -.6)
whoosh(5.95, .9, .3, 300, 6000, -.3, .6)  # переход в каплю
# капля
n = int(.5 * SR); tt = np.arange(n) / SR
place(np.sin(2 * np.pi * (300 + 900 * tt) * tt) * np.exp(-tt * 6) * .5, 6.0, .12)  # «оболочка» капли
whoosh(7.4, 1.2, .14, 600, 2500, .5, -.5)
# удар о слизь
thump(9.0, 110, 40, .8, .7)
place(spec_filter(rng.standard_normal(int(.7 * SR)), 300, 5000) * np.exp(-np.arange(int(.7 * SR)) / SR * 7), 9.0, .35)
for i in range(10):
    pop(9.15 + i * .07 + rng.random() * .05, 500 + rng.random() * 900, .07, rng.random() * 1.4 - .7)
whoosh(9.25, .7, .2, 2000, 300)
# застревание и разрез
place(np.sin(2 * np.pi * 220 * np.arange(int(.6 * SR)) / SR * (1 + .02 * np.sin(np.arange(int(.6 * SR)) / SR * 70))) * np.exp(-np.arange(int(.6 * SR)) / SR * 4), 10.4, .08)
snip(11.5, .3)
whoosh(13.9, .8, .18, 500, 3000)
# связывание, эндоцитоз, закисление, слияние
for i, k in enumerate((-1, 0, 1)):
    tick(15.98 + i * .03, .2, 2200 + i * 300, k * .5)
bell(16.0, 79, .1, 2.5); bell(16.03, 83, .07, 2.5)
n = int(.7 * SR); tt = np.arange(n) / SR  # «глоток» — отшнуровка
place(np.sin(2 * np.pi * np.cumsum(260 * np.exp(-tt * 4) + 60) / SR) * np.exp(-tt * 5) * env(n, .02, .1), 17.95, .35)
for i in range(60):  # шипение кислоты
    tt0 = 18.6 + rng.random() * 1.8
    tick(tt0, .02 + .03 * rng.random(), 3000 + rng.random() * 4000, rng.random() * 1.6 - .8)
n = int(1.8 * SR); tt = np.arange(n) / SR
place(spec_filter(rng.standard_normal(n), 2500, 9000) * env(n, .6, .4) * .5, 18.6, .08)
n = int(.5 * SR); tt = np.arange(n) / SR  # пружина гемагглютинина
place(np.sin(2 * np.pi * np.cumsum(200 + 1600 * tt) / SR) * np.exp(-tt * 6), 20.15, .1)
pop(21.0, 300, .4); thump(21.0, 140, 60, .4, .4)
for i in range(8):
    bell(21.02 + i * .04, 74 + [0, 3, 7, 10, 12, 15, 19, 22][i], .03, 4, -.6 + i * .17)
whoosh(22.1, .8, .16, 400, 2000)
# ядро, фабрика
thump(24.6, 70, 40, .7, .35); bell(24.6, 62, .06, 1.5)
whoosh(27.0, .7, .2, 300, 7000, -.2, .2)  # наезд на рибосому
n = int(.6 * SR); tt = np.arange(n) / SR
place(np.sin(2 * np.pi * np.cumsum(500 + 1800 * tt ** 2) / SR) * np.exp(-tt * 3) * env(n, .05, .1), 27.75, .07)  # сворачивание
whoosh(28.5, .9, .18, 2500, 500)
# почкование и выход: таймкоды из анимации
for b_ in EV['buds']:
    pan = float(np.clip(rng.normal(0, .4), -.8, .8))
    pop(b_['pinch'], 380 if b_['lead'] else 500 + rng.random() * 400, .3 if b_['lead'] else .12, pan)
    snip(b_['snip'], .2 if b_['lead'] else .07, pan)
thump(32.0, 120, 45, .7, .55)
# интерферон — мерцающая волна
n = int(2.4 * SR); tt = np.arange(n) / SR
x = sum(np.sin(2 * np.pi * hz(m) * tt + m) for m in (86, 90, 93, 98)) * env(n, .1, 1.5) * (0.6 + .4 * np.sin(2 * np.pi * 9 * tt))
place(x, 36.4, .04)
for tb in sorted(EV['abs']):
    tick(tb, .035, 1700 + rng.random() * 600, rng.random() * 1.2 - .6)
# макрофаг: вязкое поглощение
n = int(1.2 * SR); tt = np.arange(n) / SR
place(np.sin(2 * np.pi * np.cumsum(110 - 50 * tt) / SR) * (1 + .5 * np.sin(2 * np.pi * 7 * tt)) * env(n, .3, .4), 40.8, .22)
pop(41.75, 180, .4)
# отъезд «степени десяти»
n = int(1.0 * SR); tt = np.arange(n) / SR
place((spec_filter(rng.standard_normal(n), 200, 6000) * (tt / tt[-1]) ** 2)[::-1][::-1], 41.0, .18)  # обратный подсос
thump(42.0, 160, 30, 2.2, .9)
whoosh(42.4, 1.6, .3, 6000, 150, .3, -.3)
# финал
for m, p_ in ((65, -.4), (69, 0), (72, .4), (77, .1)):
    bell(46.0, m, .05, 1.2, p_)
bell(47.2, 84, .1, 1.6, .2)  # точка «приземляется»

# ---------------- реверберация и мастер ----------------
ir_n = int(2.4 * SR); tt = np.arange(ir_n) / SR
def rev(x, seed):
    r_ = np.random.default_rng(seed).standard_normal(ir_n) * np.exp(-tt * 2.6)
    r_ = spec_filter(r_, 200, 7000); r_ /= np.sqrt((r_ ** 2).sum())
    m = 1 << int(np.ceil(np.log2(len(x) + ir_n)))
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(r_, m), m)[:len(x)]
L2 = L + .22 * rev(L, 1); R2 = R + .22 * rev(R, 2)
fade = np.clip((DUR - np.arange(N) / SR) / 1.2, 0, 1) ** 1.5
L2 *= fade; R2 *= fade
g = .85 / np.percentile(np.abs(np.concatenate([L2, R2])), 99.9)
L2 = np.tanh(L2 * g) * .95; R2 = np.tanh(R2 * g) * .95
out = (np.stack([L2, R2], 1) * 32767).astype(np.int16)
with wave.open(os.path.join(here, 'audio.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', out.shape, 'peak', np.abs(out).max())
