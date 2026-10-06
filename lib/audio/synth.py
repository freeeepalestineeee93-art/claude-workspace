"""مولّد المؤثرات الصوتية: كل صوت بيتصنّع بالكود على مقاس الحركة (المدة، الاتجاه، القوة).

كل دالة بترجع مصفوفة stereo (2, N) بـ 48kHz وقيم بين -1 و 1.
العشوائية مضبوطة بـ seed: نفس المدخلات = نفس الصوت، ومع seed مختلف بيطلع تنويع طبيعي.
"""
from __future__ import annotations

import numpy as np
from scipy import signal

SR = 48000


# ───────────────────────── أدوات أساسية ─────────────────────────

def rng(seed):
    return np.random.default_rng(abs(int(seed)) % (2**32))


def t_axis(dur):
    return np.arange(int(max(dur, 1 / SR) * SR)) / SR


def noise(n, r, color="white"):
    w = r.standard_normal(n)
    if color == "white":
        return w
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1] if len(f) > 1 else 1
    spec = np.fft.rfft(w)
    spec /= {"pink": np.sqrt(f), "brown": f}[color]
    out = np.fft.irfft(spec, n)
    return out / (np.abs(out).max() + 1e-9)


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2, curve=2.0):
    """غلاف ADSR بأطوال بالثواني (مقصوص على طول الصوت)."""
    total = n / SR
    a, d, r = [max(x, 1 / SR) for x in (a, d, r)]
    sus = max(0.0, total - a - d - r)
    segs = [
        np.linspace(0, 1, int(a * SR)) ** (1 / curve),
        1 - (1 - s) * np.linspace(0, 1, int(d * SR)) ** (1 / curve),
        np.full(int(sus * SR), s),
        s * (1 - np.linspace(0, 1, int(r * SR))) ** curve,
    ]
    e = np.concatenate(segs)
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def env_peak(n, peak=0.6, attack_curve=2.2, release_curve=1.6):
    """غلاف بيطلع لقمة بنسبة peak من المدة وبينزل (شكل الـ whoosh)."""
    x = np.linspace(0, 1, n)
    up = (x / peak) ** attack_curve
    down = ((1 - x) / (1 - peak)) ** release_curve
    return np.where(x < peak, up, down)


def bandpass_sweep(x, f_start, f_peak, f_end, q=1.2, peak=0.6, blocks=64):
    """فلتر band-pass مركزه بيتحرك مع الزمن (القلب الحقيقي لصوت المرور)."""
    n = len(x)
    out = np.zeros(n)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    zi = None
    for i in range(blocks):
        a_, b_ = edges[i], edges[i + 1]
        p = (a_ + b_) / 2 / n
        if p < peak:
            fc = f_start * (f_peak / f_start) ** (p / peak)
        else:
            fc = f_peak * (f_end / f_peak) ** ((p - peak) / (1 - peak))
        fc = float(np.clip(fc, 40, SR / 2 - 2000))
        bw = fc / q
        lo, hi = max(20, fc - bw / 2), min(SR / 2 - 1000, fc + bw / 2)
        sos = signal.butter(2, [lo, hi], btype="band", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        seg, zi = signal.sosfilt(sos, x[a_:b_], zi=zi)
        out[a_:b_] = seg
    return out


def lowpass(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR / 2 - 100), btype="low", fs=SR, output="sos"), x)


def highpass(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, max(fc, 20), btype="high", fs=SR, output="sos"), x)


def pan_stereo(mono, pan_from=0.0, pan_to=None):
    """pan من -1 (يسار) لـ +1 (يمين)، بقانون القدرة الثابتة، وممكن يتحرك."""
    pan_to = pan_from if pan_to is None else pan_to
    p = np.linspace(pan_from, pan_to, len(mono))
    ang = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(ang), mono * np.sin(ang)])


def normalize(x, peak=0.89):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


def fade(x, fin=0.002, fout=0.01):
    n = x.shape[-1]
    a, b = min(n, int(fin * SR)), min(n, int(fout * SR))
    e = np.ones(n)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if b:
        e[n - b:] = np.minimum(e[n - b:], np.linspace(1, 0, b))
    return x * e


def sine_sweep(dur, f0, f1, curve="exp"):
    t = t_axis(dur)
    if curve == "exp":
        f = f0 * (f1 / f0) ** (t / max(dur, 1e-6))
    else:
        f = f0 + (f1 - f0) * t / max(dur, 1e-6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def reverb(stereo, room=0.4, wet=0.2, damp=0.5, tail=1.0):
    """reverb عبر pedalboard مع ذيل إضافي."""
    import pedalboard as pb
    pad = np.zeros((2, int(tail * SR)))
    x = np.concatenate([stereo, pad], axis=1).astype(np.float32)
    board = pb.Pedalboard([pb.Reverb(room_size=room, wet_level=wet, dry_level=1 - wet * 0.5, damping=damp, width=1.0)])
    y = board(x, SR)
    # قص الصمت بالآخر
    e = np.abs(y).max(axis=0)
    idx = np.where(e > 1e-4)[0]
    return y[:, : (idx[-1] + 1 if len(idx) else y.shape[1])]


# ───────────────────────── المؤثرات ─────────────────────────

def whoosh(dur=0.6, brightness=1.0, pan_from=-0.6, pan_to=0.6, peak=0.62, weight=1.0, seed=1, air=True, verb=0.18):
    """صوت مرور (عنصر بيعبر الشاشة). المدة = مدة الحركة."""
    r = rng(seed)
    n = int(dur * SR)
    src = noise(n, r, "pink")
    f0, fp, f1 = 300 * brightness, 2400 * brightness * (0.85 + 0.3 * r.random()), 700 * brightness
    body = bandpass_sweep(src, f0, fp, f1, q=1.0, peak=peak)
    e = env_peak(n, peak)
    mono = body * e
    if air:  # هوا عالي خفيف
        mono += highpass(noise(n, r, "white"), 6000) * env_peak(n, peak, 3, 2.4) * 0.12 * brightness
    if weight > 1.0:  # جسم منخفض للحركات الكبيرة فقط
        mono += lowpass(noise(n, r, "brown"), 220) * e * 0.2 * (weight - 1)
    st = pan_stereo(normalize(mono), pan_from, pan_to)
    return fade(reverb(st, 0.3, verb, tail=0.5) if verb else st)


def swish(dur=0.22, pitch=1.0, pan=0.0, seed=2):
    """مرور سريع وحاد (أيقونة، كرت صغير)."""
    r = rng(seed)
    n = int(dur * SR)
    mono = bandpass_sweep(noise(n, r), 1500 * pitch, 6500 * pitch, 3000 * pitch, q=1.6, peak=0.45) * env_peak(n, 0.45, 1.6, 2.2)
    return fade(pan_stereo(normalize(mono, 0.7), pan - 0.3, pan + 0.3))


def riser(dur=1.5, intensity=1.0, seed=3):
    """تصاعد قبل لحظة مهمة (بينتهي عند القمة بالضبط)."""
    r = rng(seed)
    n = int(dur * SR)
    t = t_axis(dur)
    p = t / dur
    nz = bandpass_sweep(noise(n, r, "pink"), 400, 9000, 9000, q=0.9, peak=0.999)
    tone = sum(sine_sweep(dur, 110 * k, 880 * k) / k for k in (1, 2, 3)) * 0.3
    shep = np.sin(2 * np.pi * np.cumsum(200 + 1800 * p ** 2) / SR) * 0.15
    mono = (nz * 0.8 + tone + shep) * p ** 2.4 * intensity
    st = pan_stereo(normalize(mono), -0.2, 0.2)
    st[1] = np.roll(st[1], int(0.006 * SR))  # عرض stereo
    return fade(st, 0.05, 0.004)


def impact(weight=1.0, bright=0.6, seed=4, verb=0.3):
    """ضربة (عنوان بينزل بقوة، شعار، قطع مهم)."""
    r = rng(seed)
    dur = 0.9 + 0.8 * weight
    n = int(dur * SR)
    sub = sine_sweep(dur, 90 * (0.9 + 0.2 * r.random()), 38, "exp") * env_adsr(n, 0.002, 0.25, 0.35, dur - 0.3, 3)
    knock = lowpass(noise(n, r, "brown"), 400) * env_adsr(n, 0.001, 0.08, 0.0, 0.05, 4)
    crack = highpass(noise(n, r), 2500) * env_adsr(n, 0.0005, 0.04 + 0.05 * bright, 0.0, 0.05, 4) * bright
    mono = sub * 1.0 * weight + knock * 0.8 + crack * 0.6
    st = pan_stereo(normalize(mono), 0)
    st = reverb(st, 0.6, verb * 0.8, damp=0.6, tail=1.2) if verb else st
    import pedalboard as pb
    st = pb.Pedalboard([pb.Compressor(threshold_db=-14, ratio=4, attack_ms=1, release_ms=120), pb.Gain(4)])(st.astype(np.float32), SR)
    return fade(normalize(st, 0.95), 0.0005, 0.2)


def hit_soft(seed=5):
    r = rng(seed)
    n = int(0.45 * SR)
    mono = sine_sweep(0.45, 140, 55) * env_adsr(n, 0.002, 0.12, 0.0, 0.2, 3) + lowpass(noise(n, r), 900) * env_adsr(n, 0.001, 0.05, 0, 0.05, 4) * 0.4
    return fade(pan_stereo(normalize(mono, 0.6)))


def pop(pitch=1.0, pan=0.0, seed=6):
    """فقعة (حرف/أيقونة بتنفقع)."""
    r = rng(seed)
    p = pitch * (0.9 + 0.22 * r.random())
    dur = 0.09
    n = int(dur * SR)
    tone = sine_sweep(dur, 1100 * p, 380 * p) * env_adsr(n, 0.0008, 0.04, 0.0, 0.04, 3)
    click = highpass(noise(n, r), 3000) * env_adsr(n, 0.0002, 0.004, 0, 0.004, 4) * 0.4
    return fade(pan_stereo(normalize(tone + click, 0.55), pan), 0.0003, 0.01)


def click(pitch=1.0, pan=0.0, seed=7, level=0.5):
    """كليك UI نضيف."""
    r = rng(seed)
    n = int(0.03 * SR)
    p = pitch * (0.95 + 0.1 * r.random())
    body = np.sin(2 * np.pi * 2200 * p * t_axis(0.03)) * env_adsr(n, 0.0002, 0.006, 0, 0.008, 5)
    tr = highpass(noise(n, r), 5000) * env_adsr(n, 0.0001, 0.002, 0, 0.002, 5)
    return fade(pan_stereo(normalize(body * 0.6 + tr, level), pan), 0.0001, 0.005)


def tick(pitch=1.0, pan=0.0, seed=8):
    """نقرة آلة كاتبة / عدّاد أرقام."""
    r = rng(seed)
    n = int(0.05 * SR)
    p = pitch * (0.85 + 0.3 * r.random())
    res = np.sin(2 * np.pi * 1700 * p * t_axis(0.05)) * env_adsr(n, 0.0002, 0.012, 0, 0.01, 6) * 0.5
    tr = bandpass_sweep(noise(n, r), 3000, 4000, 3500, q=2, blocks=4) * env_adsr(n, 0.0001, 0.006, 0, 0.004, 6)
    thock = lowpass(noise(n, r), 600) * env_adsr(n, 0.0005, 0.015, 0, 0.01, 4) * 0.5
    return fade(pan_stereo(normalize(res + tr + thock, 0.45), pan), 0.0001, 0.006)


def glitch(dur=0.4, seed=9):
    """تشويش رقمي متقطع."""
    r = rng(seed)
    n = int(dur * SR)
    out = np.zeros(n)
    pos = 0
    while pos < n:
        ln = int(r.uniform(0.008, 0.05) * SR)
        kind = r.integers(0, 3)
        seg = noise(ln, r) if kind == 0 else np.sign(np.sin(2 * np.pi * r.uniform(80, 2000) * np.arange(ln) / SR))
        if kind == 2:
            seg = np.round(noise(ln, r) * 4) / 4
        out[pos:pos + ln] = seg[: n - pos] * r.uniform(0.2, 1.0) * (r.random() > 0.25)
        pos += ln
    out = highpass(out, 150)
    return fade(pan_stereo(normalize(out, 0.5), r.uniform(-0.4, 0.4)), 0.001, 0.01)


def sparkle(dur=1.0, density=14, brightness=1.0, seed=10):
    """لمعة/بريق (جزيئات، نجوم، شي سحري)."""
    r = rng(seed)
    n = int(dur * SR)
    st = np.zeros((2, n))
    scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2]
    base = 1760 * brightness
    for _ in range(density):
        on = int(r.uniform(0, dur * 0.8) * SR)
        f = base * r.choice(scale) * r.choice([1, 2])
        ln = int(r.uniform(0.15, 0.5) * SR)
        ln = min(ln, n - on)
        if ln <= 0:
            continue
        tt = np.arange(ln) / SR
        tone = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt * r.uniform(8, 18))
        pp = pan_stereo(tone * r.uniform(0.2, 0.6), r.uniform(-0.8, 0.8))
        st[:, on:on + ln] += pp
    return fade(reverb(normalize(st, 0.5), 0.7, 0.35, tail=1.0), 0.001, 0.2)


def swell(dur=1.2, seed=11):
    """صنج معكوس: بيتصاعد وبينقطع فجأة (قبل كشف شي)."""
    r = rng(seed)
    n = int(dur * SR)
    x = highpass(noise(n, r, "white"), 3500) * 0.5 + bandpass_sweep(noise(n, r, "pink"), 2000, 8000, 8000, peak=0.999) * 0.5
    e = np.linspace(0, 1, n) ** 3.2
    st = pan_stereo(normalize(x * e, 0.7), -0.3, 0.3)
    return fade(st, 0.01, 0.003)


def marker(dur=0.5, seed=12):
    """قلم تظليل على ورق (highlight)."""
    r = rng(seed)
    n = int(dur * SR)
    fr = bandpass_sweep(noise(n, r, "pink"), 2200, 3200, 2600, q=1.4, peak=0.5, blocks=16)
    jitter = 0.7 + 0.3 * np.abs(signal.resample(r.standard_normal(max(4, int(dur * 40))), n))
    mono = fr * jitter * env_adsr(n, 0.02, 0.05, 0.85, 0.06)
    return fade(pan_stereo(normalize(mono, 0.4), -0.2, 0.2))


def scribble(dur=0.6, seed=13):
    """قلم رصاص بيرسم (رسم خط، دائرة، حرف بيتكتب)."""
    r = rng(seed)
    n = int(dur * SR)
    fr = highpass(noise(n, r), 1800)
    strokes = np.abs(np.sin(np.pi * np.cumsum(r.uniform(6, 12, n) / SR)))
    mono = lowpass(fr, 7000) * (0.4 + 0.6 * strokes) * env_adsr(n, 0.01, 0.05, 0.9, 0.05)
    return fade(pan_stereo(normalize(mono, 0.35), r.uniform(-0.3, 0.3)))


def boom(dur=2.0, seed=14):
    """بوم سينمائي طويل (بداية/نهاية قوية، كشف شعار)."""
    r = rng(seed)
    n = int(dur * SR)
    sub = sine_sweep(dur, 60, 28) * env_adsr(n, 0.003, 0.3, 0.6, dur - 0.4, 2.5)
    rumble = lowpass(noise(n, r, "brown"), 120) * env_adsr(n, 0.01, 0.4, 0.4, dur - 0.5, 2)
    hit = impact(1.2, 0.3, seed, verb=0)[0]
    mono = sub + rumble * 0.6
    mono[: len(hit)] += hit[: n] * 0.6
    return fade(reverb(pan_stereo(normalize(mono, 0.95)), 0.8, 0.25, tail=1.5), 0.0005, 0.5)


def chime(seed=15, notes=(0, 7), gap=0.09):
    """نغمة تأكيد (نجاح، رقم وصل لهدفه، ✓)."""
    r = rng(seed)
    dur = 0.9
    n = int(dur * SR)
    out = np.zeros(n)
    for i, semi in enumerate(notes):
        f = 1046.5 * 2 ** (semi / 12)
        on = int(i * gap * SR)
        tt = np.arange(n - on) / SR
        out[on:] += (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 3 * tt)) * np.exp(-tt * 6)
    return fade(reverb(pan_stereo(normalize(out, 0.45), r.uniform(-0.1, 0.1)), 0.5, 0.25, tail=0.8))


def shutter(seed=16):
    """غالق كاميرا (لقطة شاشة، صورة بتظهر)."""
    r = rng(seed)
    n = int(0.18 * SR)
    a = click(0.6, 0, seed, 0.7)[0][: n]
    b = highpass(noise(n, r), 1500) * env_adsr(n, 0.001, 0.05, 0, 0.04, 4) * 0.5
    mono = np.zeros(n)
    mono[: len(a)] += a
    mono += np.roll(b, int(0.06 * SR))
    return fade(pan_stereo(normalize(mono, 0.6)))


def bass_drop(dur=1.4, seed=17):
    n = int(dur * SR)
    mono = sine_sweep(dur, 120, 30) * env_adsr(n, 0.005, 0.2, 0.7, dur * 0.5, 2) + np.tanh(sine_sweep(dur, 120, 30) * 3) * 0.2 * env_adsr(n, 0.005, 0.3, 0.3, dur * 0.4)
    return fade(pan_stereo(normalize(mono, 0.9)), 0.002, 0.2)


def count_tick(seed=18, pitch=1.0):
    """تكة عدّاد (أرقام عم تعد)."""
    return tick(pitch * 1.4, 0, seed)


def typing(dur=1.0, rate=14, seed=19):
    """كتابة كيبورد متواصلة."""
    r = rng(seed)
    n = int(dur * SR)
    st = np.zeros((2, n))
    t = 0.0
    while t < dur - 0.05:
        k = tick(r.uniform(0.8, 1.2), r.uniform(-0.3, 0.3), int(r.integers(1, 1e6)))
        on = int(t * SR)
        ln = min(k.shape[1], n - on)
        st[:, on:on + ln] += k[:, :ln] * r.uniform(0.5, 1)
        t += r.exponential(1 / rate) + 0.02
    return normalize(st, 0.5)


SOUNDS = {
    "whoosh": whoosh, "swish": swish, "riser": riser, "impact": impact, "hit": hit_soft, "pop": pop, "click": click,
    "tick": tick, "glitch": glitch, "sparkle": sparkle, "swell": swell, "marker": marker, "scribble": scribble,
    "boom": boom, "chime": chime, "shutter": shutter, "drop": bass_drop, "count": count_tick, "typing": typing,
}


def make(kind, **params):
    if kind not in SOUNDS:
        raise ValueError(f"مؤثر غير معروف: {kind}. المتاح: {', '.join(SOUNDS)}")
    import inspect
    sig = inspect.signature(SOUNDS[kind]).parameters
    x = SOUNDS[kind](**{k: v for k, v in params.items() if k in sig}).astype(np.float32)
    m = np.abs(x).max()
    return x * (0.95 / m) if m > 0.95 else x
