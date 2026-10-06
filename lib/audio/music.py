"""مولّد موسيقى خلفية على مقاس الفيديو: بيعرف المدة والـ BPM ولحظات المشاهد، وبيخلص بضربة نهائية مع آخر فريم.

الأساليب: tech · cinematic · lofi · arabic · minimal · ambient
كل شي مصنّع بالكود (بدون عينات)، فالموسيقى ملكك 100% وما في مشاكل حقوق.
"""
from __future__ import annotations

import numpy as np
from .synth import SR, rng, noise, lowpass, highpass, env_adsr, sine_sweep, pan_stereo, normalize, bandpass_sweep, reverb

# ───────────────────────── نظريات ─────────────────────────

SCALES = {
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "major": [0, 2, 4, 5, 7, 9, 11],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "hijaz": [0, 1, 4, 5, 7, 8, 10],  # مقام حجاز (تقريب 12 نغمة)
    "nahawand": [0, 2, 3, 5, 7, 8, 11],
    "kurd": [0, 1, 3, 5, 7, 8, 10],
}
KEYS = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
PROGRESSIONS = {
    "minor": [[0, 2, 4], [5, 0, 2], [2, 4, 6], [6, 1, 3]],  # i VI III VII
    "major": [[0, 2, 4], [4, 6, 1], [5, 0, 2], [3, 5, 0]],  # I V vi IV
    "dorian": [[0, 2, 4], [3, 5, 0], [0, 2, 4], [6, 1, 3]],
    "hijaz": [[0, 2, 4], [6, 1, 3], [5, 0, 2], [0, 2, 4]],
    "nahawand": [[0, 2, 4], [3, 5, 0], [4, 6, 1], [0, 2, 4]],
    "kurd": [[0, 2, 4], [1, 3, 5], [6, 1, 3], [0, 2, 4]],
}


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def degree_midi(root, scale, deg, octave=4):
    sc = SCALES[scale]
    o, d = divmod(deg, len(sc))
    return 12 * (octave + 1 + o) + root + sc[d]


# ───────────────────────── آلات ─────────────────────────

def kick(r, punch=1.0):
    d = 0.45
    n = int(d * SR)
    body = sine_sweep(d, 160 * punch, 46) * env_adsr(n, 0.001, 0.18, 0.0, 0.25, 2.5)
    clk = highpass(noise(n, r), 3000) * env_adsr(n, 0.0002, 0.006, 0, 0.004, 5) * 0.3
    return np.tanh((body + clk) * 1.6) * 0.9


def clap(r):
    d = 0.35
    n = int(d * SR)
    x = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022, 0.034]):
        o = int(off * SR)
        seg = bandpass_sweep(noise(n - o, r), 1100, 1500, 1200, q=1.2, blocks=4) * env_adsr(n - o, 0.0005, 0.012 if k < 3 else 0.18, 0, 0.05, 4)
        x[o:] += seg
    return normalize(x, 0.6)


def hat(r, open_=False):
    d = 0.25 if open_ else 0.06
    n = int(d * SR)
    x = highpass(noise(n, r), 7500) * env_adsr(n, 0.0005, d * 0.6, 0, d * 0.3, 3)
    return normalize(x, 0.3 if open_ else 0.22)


def tom(r, f=110):
    d = 0.6
    n = int(d * SR)
    return normalize(sine_sweep(d, f * 1.6, f) * env_adsr(n, 0.001, 0.3, 0, 0.3, 2.5) + lowpass(noise(n, r), 500) * env_adsr(n, 0.001, 0.04, 0, 0.03, 4) * 0.3, 0.8)


def doum(r):
    """دُم الدربكة: رنين منخفض مع انحناء نغمة."""
    d = 0.5
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 95 + 40 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + lowpass(noise(n, r), 300) * np.exp(-t * 60) * 0.4
    return normalize(x, 0.85)


def tek(r, ka=False):
    """تِك/كا الدربكة: حاد وقصير برنين معدني."""
    d = 0.18
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 620 if ka else 850
    ring = sum(np.sin(2 * np.pi * f * m * t) / m for m in (1, 1.58, 2.31)) * np.exp(-t * (40 if ka else 30))
    x = ring * 0.5 + highpass(noise(n, r), 2000) * np.exp(-t * 120)
    return normalize(x, 0.45 if ka else 0.55)


def supersaw(freq, dur, r, voices=5, detune=0.012, cutoff=2500):
    t = np.arange(int(dur * SR)) / SR
    x = np.zeros_like(t)
    for v in range(voices):
        f = freq * (1 + detune * (v - voices // 2) / voices)
        ph = r.random()
        x += 2 * ((t * f + ph) % 1) - 1
    return lowpass(x / voices, cutoff, 2)


def pad_chord(midis, dur, r, cutoff=1800, attack=0.6, release=0.8):
    n = int(dur * SR)
    x = sum(supersaw(midi_hz(m), dur, r, cutoff=cutoff) for m in midis) / len(midis)
    return x * env_adsr(n, attack, 0.3, 0.8, release, 1.5)


def pluck(freq, dur, r, bright=0.5, decay=0.996):
    """Karplus-Strong: وتر مقطوف (قريب من العود مع فلتر). محسوب كفلتر IIR (سريع)."""
    from scipy.signal import lfilter
    n = int(dur * SR)
    period = max(2, int(round(SR / freq)))
    burst = r.uniform(-1, 1, period)
    if period > 30:
        burst = lowpass(burst, 2000 + 6000 * bright)
    x = np.zeros(n)
    x[: min(period, n)] = burst[: min(period, n)]
    a = np.zeros(period + 2)
    a[0] = 1
    a[period] -= decay * 0.5
    a[period + 1] -= decay * 0.5
    out = lfilter([1.0], a, x)
    return out * env_adsr(n, 0.001, 0.05, 1, 0.05)


def ep(freq, dur, r):
    """بيانو كهربائي ناعم (lofi)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t + 0.8 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 4)) * np.exp(-t * 1.8)
    return x * (1 + 0.15 * np.sin(2 * np.pi * 4.5 * t)) * env_adsr(n, 0.004, 0.2, 0.9, 0.2)


def sub_bass(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.25 * np.tanh(3 * np.sin(2 * np.pi * freq * t))
    return x * env_adsr(n, 0.005, 0.1, 0.85, 0.08)


# ───────────────────────── تركيب ─────────────────────────

class Track:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR * 4
        self.buses = {}

    def add(self, bus, x, at, pan=0.0, gain=1.0):
        b = self.buses.setdefault(bus, np.zeros((2, self.n)))
        st = pan_stereo(x, pan) if x.ndim == 1 else x
        i = int(at * SR)
        if i >= self.n or i + st.shape[1] <= 0:
            return
        ln = min(st.shape[1], self.n - i)
        b[:, i:i + ln] += st[:, :ln] * gain


def sidechain_env(n, kicks, depth=0.6, release=0.18):
    e = np.ones(n)
    rl = int(release * SR)
    curve = 1 - depth * (1 - np.linspace(0, 1, rl)) ** 2
    for k in kicks:
        i = int(k * SR)
        if i < n:
            ln = min(rl, n - i)
            e[i:i + ln] = np.minimum(e[i:i + ln], curve[:ln])
    return e


def compose(duration, style="tech", bpm=None, key="A", scale=None, sections=(), seed=7, ending=True, intensity=1.0):
    """يرجع (stereo, info). sections = أوقات بداية المشاهد (بيتحط عليها accent)."""
    r = rng(seed)
    defaults = {
        "tech": (118, "minor"), "cinematic": (90, "minor"), "lofi": (82, "dorian"), "arabic": (100, "hijaz"),
        "minimal": (108, "major"), "ambient": (70, "major"),
    }
    bpm = bpm or defaults[style][0]
    scale = scale or defaults[style][1]
    root = KEYS.get(key, 9)
    beat = 60 / bpm
    bar = beat * 4
    # الطول: لحتى تنتهي آخر ضربة مع نهاية الفيديو
    end_t = duration - (0.0 if not ending else 0.0)
    nbars = int(np.ceil(end_t / bar)) + 1
    T = Track(duration + 3)
    prog = PROGRESSIONS[scale]
    kicks = []
    sec = sorted(s for s in sections if 0.3 < s < duration - 0.5)

    def chord_at(b):
        return prog[b % len(prog)]

    for b in range(nbars):
        t0 = b * bar
        if t0 >= end_t:
            break
        intro = b == 0 and nbars > 3
        ch = chord_at(b)
        mids = [degree_midi(root, scale, d, 3) for d in ch]
        bl = min(bar, end_t - t0)

        if style in ("tech", "minimal", "cinematic", "ambient", "arabic"):
            cut = 900 if intro else (2600 if style == "tech" else 1500)
            T.add("pad", pad_chord(mids, bl + 0.6, r, cutoff=cut, attack=0.4 if style != "ambient" else 1.2), t0, gain=0.22, pan=0)
        if style == "lofi":
            for k, m in enumerate(mids):
                T.add("keys", ep(midi_hz(m + 12), bl, r), t0 + k * 0.012, pan=(k - 1) * 0.25, gain=0.25)

        # بيس
        if style in ("tech", "minimal", "lofi", "arabic") and not intro:
            rootm = degree_midi(root, scale, ch[0], 1)
            pattern = [0, 1.5, 2, 3.5] if style == "tech" else [0, 2] if style != "arabic" else [0, 1.5, 3]
            for p in pattern:
                if t0 + p * beat < end_t:
                    T.add("bass", sub_bass(midi_hz(rootm), beat * 0.9), t0 + p * beat, gain=0.5)

        # إيقاع
        for q in range(16):
            tt = t0 + q * beat / 4
            if tt >= end_t - 0.05:
                break
            swing = (beat / 4) * 0.18 if (style == "lofi" and q % 2) else 0
            if style == "tech" and not intro:
                if q % 4 == 0:
                    T.add("drums", kick(r), tt, gain=0.9); kicks.append(tt)
                if q % 8 == 4:
                    T.add("drums", clap(r), tt, gain=0.5, pan=0.05)
                if q % 4 == 2:
                    T.add("drums", hat(r, True), tt, gain=0.35, pan=0.25)
                elif q % 2 == 1:
                    T.add("drums", hat(r), tt, gain=0.25 * (0.7 + 0.3 * r.random()), pan=-0.2)
            elif style == "minimal" and not intro:
                if q % 8 == 0:
                    T.add("drums", kick(r, 0.8), tt, gain=0.7); kicks.append(tt)
                if q % 4 == 2:
                    T.add("drums", hat(r), tt, gain=0.18, pan=0.2)
            elif style == "lofi" and not intro:
                if q in (0, 7, 10):
                    T.add("drums", kick(r, 0.7), tt + swing, gain=0.7); kicks.append(tt)
                if q in (4, 12):
                    T.add("drums", clap(r), tt + swing, gain=0.35)
                if q % 2 == 0:
                    T.add("drums", hat(r), tt + swing, gain=0.16 * (0.6 + 0.4 * r.random()))
            elif style == "arabic" and not intro:
                # إيقاع مقسوم: دُم تك - تك دُم - تك -
                maqsum = {0: "D", 2: "T", 6: "T", 8: "D", 12: "T", 14: "k", 4: None, 10: "k"}
                hit = maqsum.get(q)
                if hit == "D":
                    T.add("drums", doum(r), tt, gain=0.8); kicks.append(tt)
                elif hit == "T":
                    T.add("drums", tek(r), tt, gain=0.5, pan=0.15)
                elif hit == "k":
                    T.add("drums", tek(r, True), tt, gain=0.35, pan=-0.15)
                elif q % 2 == 1 and r.random() < 0.35:
                    T.add("drums", tek(r, True), tt, gain=0.18, pan=-0.3)
            elif style == "cinematic":
                if q == 0 and b % 2 == 0:
                    T.add("drums", tom(r, 70), tt, gain=0.6); kicks.append(tt)
                if q in (10, 14) and b % 2 == 1:
                    T.add("drums", tom(r, 110), tt, gain=0.35, pan=0.2)

        # لحن
        if style in ("tech", "arabic", "minimal") and not intro:
            steps = 8
            motif = [int(x) for x in r.integers(0, 7, steps)] if b == 1 or not hasattr(compose, "_m") else None
            if motif:
                compose._m = motif
            mot = compose._m
            for k in range(steps):
                if r.random() < (0.35 if style != "arabic" else 0.5):
                    continue
                deg = ch[0] + mot[k] % 5 + (7 if style == "arabic" else 7)
                m = degree_midi(root, scale, deg, 3)
                tt = t0 + k * beat / 2
                if tt < end_t - 0.1:
                    voice = pluck(midi_hz(m), beat * (1.5 if style == "arabic" else 0.8), r, bright=0.35 if style == "arabic" else 0.6, decay=0.997 if style == "arabic" else 0.994)
                    T.add("lead", voice, tt, pan=(r.random() - 0.5) * 0.6, gain=0.28 if style == "arabic" else 0.2)

    # لحظات المشاهد: ضربة/صنج خفيف
    from .synth import impact, swell
    for s in sec:
        sb = round(s / beat) * beat
        T.add("fx", impact(0.6, 0.5, seed=int(s * 100), verb=0.2), sb, gain=0.35 * intensity)
    # نهاية: ضربة نهائية مع آخر لحظة + ذيل
    if ending:
        last = max(0.5, duration - 0.05)
        T.add("fx", impact(1.0, 0.6, seed=seed, verb=0.35), last - 0.02, gain=0.6 * intensity)
        T.add("pad", pad_chord([degree_midi(root, scale, d, 3) for d in prog[0]], 2.5, r, cutoff=1200, attack=0.02, release=2.0), last, gain=0.25)
    # ميكس
    n = T.n
    side = sidechain_env(n, kicks, 0.55 if style in ("tech", "minimal") else 0.3)
    mix = np.zeros((2, n))
    levels = {"pad": 1.0, "keys": 1.0, "bass": 0.9, "drums": 1.0, "lead": 1.0, "fx": 1.0}
    for name, buf in T.buses.items():
        if name in ("pad", "bass", "lead", "keys"):
            buf = buf * side
        if name in ("pad", "lead", "keys"):
            buf = reverb(buf, 0.65 if name == "pad" else 0.45, 0.28, tail=0.0)[:, :n] if buf.any() else buf
            buf = np.pad(buf, ((0, 0), (0, max(0, n - buf.shape[1]))))[:, :n]
        mix += buf * levels.get(name, 1.0)
    if style == "lofi":  # وبر الفينيل + فلتر دافئ
        crackle = (r.random(n) > 0.9993) * r.uniform(-0.4, 0.4, n)
        mix += np.stack([crackle, np.roll(crackle, 37)]) * 0.3
        mix = np.stack([lowpass(c, 5200) for c in mix])
    # fade in خفيف بالبداية، وقص بعد الذيل
    fi = int(0.05 * SR)
    mix[:, :fi] *= np.linspace(0, 1, fi)
    end = int((duration + 2.6) * SR)
    mix = mix[:, :end]
    fo = int(1.2 * SR)
    mix[:, -fo:] *= np.linspace(1, 0, fo) ** 2
    if hasattr(compose, "_m"):
        del compose._m
    info = {"bpm": bpm, "beat": beat, "key": key, "scale": scale, "style": style, "kicks": kicks[:2000]}
    return normalize(mix, 0.9).astype(np.float32), info
