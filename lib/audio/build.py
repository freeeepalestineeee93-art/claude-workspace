"""بناء صوت الفيديو: موسيقى + تعليق صوتي + مؤثرات → ميكس → ماستر (−14 LUFS).

الاستعمال: python -m lib.audio.build plan.json out.wav

plan = {
  "duration": 15.0,
  "music": { "style": "tech", "bpm": 118, "key": "A", "sections": [4, 8], "gain_db": -6, "seed": 3 }
         | { "src": "path/song.mp3", "gain_db": -8, "start": 0, "fade_out": 1.5 },
  "voice": [ { "src": "vo.wav", "at": 0.5, "gain_db": 0 } ],
  "sfx": [ { "kind": "whoosh", "at": 2.0, "align": "peak", "gain_db": -6, "params": { "dur": 0.6 } },
           { "src": "assets/sfx/kenney/ui-audio/click1.ogg", "at": 3.1 } ],
  "duck": { "amount_db": 9 },          # الموسيقى بتوطى تحت الصوت
  "master": { "lufs": -14, "ceiling_db": -1 }
}
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

from . import synth
from .synth import SR

ROOT = Path(__file__).resolve().parents[2]


def db(x):
    return 10 ** (x / 20)


def load(path):
    p = Path(path)
    if not p.exists():  # مسارات الويب (/projects/...) نسبية لجذر الاستوديو
        p = ROOT / str(path).lstrip("/")
    x, sr = sf.read(str(p), always_2d=True)
    x = x.T.astype(np.float32)
    if sr != SR:
        from math import gcd
        g = gcd(SR, sr)
        x = resample_poly(x, SR // g, sr // g, axis=1).astype(np.float32)
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    return x[:2]


def place(bus, x, at, align="start", gain=1.0):
    """وضع صوت على الخط الزمني. align=peak: أعلى نقطة بالصوت بتقع على at بالضبط."""
    if align == "peak":
        env = np.abs(x).max(axis=0)
        k = max(1, int(0.01 * SR))
        sm = np.convolve(env, np.ones(k) / k, mode="same")
        at -= int(np.argmax(sm)) / SR
    elif align == "end":
        at -= x.shape[1] / SR
    i = int(round(at * SR))
    if i < 0:
        x = x[:, -i:]
        i = 0
    ln = min(x.shape[1], bus.shape[1] - i)
    if ln > 0:
        bus[:, i:i + ln] += x[:, :ln] * gain


def envelope_follow(x, attack=0.01, release=0.25):
    mono = np.abs(x).max(axis=0)
    hop = 240
    frames = mono[: len(mono) // hop * hop].reshape(-1, hop).max(axis=1)
    out = np.zeros_like(frames)
    a, r = np.exp(-hop / (attack * SR)), np.exp(-hop / (release * SR))
    v = 0.0
    for i, f in enumerate(frames):
        v = a * v + (1 - a) * f if f > v else r * v + (1 - r) * f
        out[i] = v
    e = np.repeat(out, hop)
    return np.pad(e, (0, len(mono) - len(e)), mode="edge")


def limit(x, ceiling, lookahead=0.005, release=0.08):
    """limiter بنظرة مسبقة: ما في قمة بتعدّي السقف، والتنزيل ناعم."""
    from scipy.ndimage import minimum_filter1d
    from scipy.signal import lfilter
    peak = np.abs(x).max(axis=0) + 1e-9
    g = np.minimum(1.0, ceiling / peak)
    la = max(1, int(lookahead * SR))
    g = minimum_filter1d(g, size=2 * la + 1, mode="nearest")
    a = np.exp(-1 / (release * SR))
    sm = lfilter([1 - a], [1, -a], g - 1) + 1  # تنعيم الرجوع
    g = np.minimum(g, sm)
    return np.clip(x * g, -ceiling, ceiling).astype(np.float32)


def _loud(x, win=0.4, hop=0.1):
    """loudness لحظي تقريبي (RMS بنافذة 400ms ≈ momentary) بالـ dB، نقطة كل 100ms."""
    m = x.mean(axis=0) if x.ndim == 2 else x
    w, h = int(win * SR), int(hop * SR)
    if len(m) < w:
        return np.full(1, -120.0)
    k = (len(m) - w) // h + 1
    idx = np.arange(w)[None, :] + h * np.arange(k)[:, None]
    return 10 * np.log10((m[idx] ** 2).mean(axis=1) + 1e-12) - 0.691


def audit_levels(plan, fx, voice, music, master_gain_db):
    """فحص تلقائي لقاعدة: المؤثرات صوتها عادي، وأبداً ما بتطغى على التعليق (VISION.md).
    بيرجع قائمة {sev, t, msg} — sev 3 = مرفوض قبل التسليم."""
    out = []
    lf = _loud(fx)
    has_voice = bool(np.abs(voice).max() > 1e-4)
    hot = [e for e in plan.get("sfx", []) if e.get("gain_db", -6) > (-16 if has_voice else -14)]
    if hot:
        top = max(hot, key=lambda e: e.get("gain_db", -6))
        out.append({"sev": 2, "t": round(float(top.get("at", 0)), 2), "msg": f"{len(hot)} مؤثر فوق الحد (أعلاها {top.get('kind', '?')} على {top.get('gain_db', -6)}dB) — القاعدة: −18 لـ −26 لكل مؤثر"})
    if has_voice:
        lv = _loud(voice)
        n = min(len(lf), len(lv))
        # مستوى الكلام المرجعي = متوسط الأجزاء اللي فيها كلام فعلاً
        speech = lv[:n][lv[:n] > lv[:n].max() - 20]
        ref = float(np.median(speech)) if len(speech) else -20.0
        bad = np.where((lf[:n] > ref - 6) & (lf[:n] > -45))[0]
        worst = {}
        for i in bad:
            sec = int(i * 0.1)
            worst[sec] = max(worst.get(sec, -99), float(lf[i] - ref))
        for sec, d in sorted(worst.items(), key=lambda kv: -kv[1])[:6]:
            out.append({"sev": 3 if d > -2 else 2, "t": float(sec), "msg": f"المؤثرات {d:+.1f}dB نسبةً للتعليق (لازم ≤ −6) — بتطغى على الصوت"})
    else:
        if master_gain_db > 9:
            out.append({"sev": 2, "t": None, "msg": f"الماستر رفع المؤثرات +{master_gain_db:.1f}dB ليوصل للـ LUFS — بدون تعليق خلّي master.lufs ≈ −24"})
        tgt = plan.get("master", {}).get("lufs", -14)
        if tgt > -20 and not np.abs(music).max() > 1e-4:
            out.append({"sev": 3, "t": None, "msg": f"مؤثرات بس بدون موسيقى/تعليق والماستر على {tgt} LUFS — رح تطلع عالية. خليه ≈ −24"})
        pk = float(lf.max())
        if pk > -12:
            t = float(np.argmax(lf) * 0.1)
            out.append({"sev": 3, "t": round(t, 1), "msg": f"أعلى مؤثر لحظي {pk:.1f} LUFS — عالي (حد المؤثرات بدون تعليق ≈ −14)"})
    return out


def build(plan, out_path):
    dur = float(plan["duration"])
    tail = 2.5
    n = int((dur + tail) * SR)
    music = np.zeros((2, n), np.float32)
    voice = np.zeros((2, n), np.float32)
    fx = np.zeros((2, n), np.float32)
    info = {}

    m = plan.get("music")
    if m:
        if m.get("src"):
            x = load(m["src"])
            st = int(m.get("start", 0) * SR)
            x = x[:, st:st + int((dur + m.get("tail", 0.8)) * SR)]
            fo = int(m.get("fade_out", 1.5) * SR)
            if x.shape[1] > fo:
                x[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
        else:
            from .music import compose
            x, info = compose(dur, m.get("style", "tech"), m.get("bpm"), m.get("key", "A"), m.get("scale"), m.get("sections", []), m.get("seed", 7), m.get("ending", True), m.get("intensity", 1.0))
        place(music, x, m.get("at", 0), gain=db(m.get("gain_db", -6)))

    for v in plan.get("voice", []):
        place(voice, load(v["src"]), v.get("at", 0), gain=db(v.get("gain_db", 0)))

    count = 0
    for e in plan.get("sfx", []):
        try:
            x = load(e["src"]) if e.get("src") else synth.make(e["kind"], seed=e.get("seed", count + 1), **e.get("params", {}))
        except Exception as err:  # مؤثر واحد ما بيوقّف الكل
            print(f"تحذير: {e}: {err}", file=sys.stderr)
            continue
        place(fx, x, e["at"], e.get("align", "start"), db(e.get("gain_db", -6)))
        count += 1

    # ducking: الموسيقى بتنزل تحت الكلام
    if voice.any() and music.any():
        amt = plan.get("duck", {}).get("amount_db", 9)
        ev = envelope_follow(voice)
        k = np.clip(ev / (ev.max() + 1e-9) * 3, 0, 1)
        music *= 1 - (1 - db(-amt)) * k

    import pedalboard as pb
    fx = pb.Pedalboard([pb.HighpassFilter(40), pb.Reverb(room_size=0.25, wet_level=0.08, dry_level=1.0)])(fx, SR)[:, :n]
    if voice.any():
        voice = pb.Pedalboard([pb.HighpassFilter(80), pb.Compressor(threshold_db=-18, ratio=3, attack_ms=5, release_ms=80)])(voice, SR)
    mix = music + voice + fx

    # ماستر: تنعيم ← ضبط loudness ← limiter
    ms = plan.get("master", {})
    mix = pb.Pedalboard([pb.HighpassFilter(25), pb.Compressor(threshold_db=-10, ratio=2, attack_ms=10, release_ms=150)])(mix.astype(np.float32), SR)
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    target = ms.get("lufs", -14)
    ceiling = db(ms.get("ceiling_db", -1))
    # تكرار: تطبيع ← limiter، لأن الـ limiter بينزّل الـ loudness شوي
    gain_db = 0.0
    base = mix.copy()
    for _ in range(3):
        cur = meter.integrated_loudness(limit(base * db(gain_db), ceiling).T)
        if not np.isfinite(cur):
            break
        if abs(cur - target) < 0.3:
            break
        gain_db += target - cur
    mix = limit(base * db(gain_db), ceiling)
    audit = audit_levels(plan, fx * db(gain_db), voice * db(gain_db), music * db(gain_db), gain_db)
    # قص الصمت بالذيل
    env = np.abs(mix).max(axis=0)
    last = np.where(env > 1e-4)[0]
    end = min(n, (last[-1] + 1) if len(last) else int(dur * SR))
    end = max(end, int(dur * SR))
    mix = mix[:, :end]
    sf.write(out_path, mix.T, SR, subtype="PCM_24")
    final = meter.integrated_loudness(mix.T)
    return {"out": str(out_path), "lufs": round(float(final), 1), "sfx": count, "duration": end / SR, "music": info, "audit": audit}


if __name__ == "__main__":
    plan = json.loads(Path(sys.argv[1]).read_text())
    res = build(plan, sys.argv[2])
    print(json.dumps(res, ensure_ascii=False, default=str))
