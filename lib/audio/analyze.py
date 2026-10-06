"""تحليل موسيقى: BPM، مواقع الـ beats، بدايات الـ bars، لحظات الذروة، ومنحنى الطاقة.

python -m lib.audio.analyze song.mp3   →  song.beats.json
بالمشهد: const m = await S.music('assets/song.beats.json'); m.beats[8] · m.drops[0] · S.snap(t)
"""
import json
import os
import sys

# كاش numba منفصل لكل عملية (التشغيل المتوازي كان بيخرّب الكاش وبيعمل segfault)
os.environ.setdefault('NUMBA_CACHE_DIR', f'/tmp/numba-cache-{os.getpid()}')
from pathlib import Path

import numpy as np


def analyze(path):
    import librosa
    y, sr = librosa.load(str(path), sr=22050, mono=True)
    dur = len(y) / sr
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="time", trim=False)
    bpm = float(np.atleast_1d(tempo)[0])
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units="time")
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
    # منحنى طاقة مبسّط كل 0.1 ثانية
    grid = np.arange(0, dur, 0.1)
    energy = np.interp(grid, times, rms)
    energy = (energy / (energy.max() + 1e-9)).round(3)
    # الـ downbeat: نختار الإزاحة (0..3) اللي beats تبعها أقوى
    bstr = np.interp(beats, librosa.frames_to_time(np.arange(len(onset_env)), sr=sr), onset_env) if len(beats) else np.array([])
    off = int(np.argmax([bstr[k::4].mean() if len(bstr[k::4]) else 0 for k in range(4)])) if len(bstr) >= 4 else 0
    bars = beats[off::4]
    # لحظات "drop": قفزات طاقة كبيرة على بداية bar
    drops = []
    sm = np.convolve(energy, np.ones(10) / 10, mode="same")
    for b in bars:
        i = int(b * 10)
        if 20 <= i < len(sm) - 10 and sm[i + 5] - sm[i - 10] > 0.25:
            drops.append(round(float(b), 3))
    return {
        "file": str(path), "duration": round(dur, 3), "bpm": round(bpm, 2),
        "beats": [round(float(b), 3) for b in beats], "bars": [round(float(b), 3) for b in bars],
        "onsets": [round(float(o), 3) for o in onsets], "drops": drops, "energy": energy.tolist(), "energy_step": 0.1,
    }


if __name__ == "__main__":
    p = Path(sys.argv[1])
    res = analyze(p)
    out = p.with_suffix(".beats.json")
    out.write_text(json.dumps(res, ensure_ascii=False))
    print(f"{out}  BPM {res['bpm']} · {len(res['beats'])} beat · {len(res['bars'])} bar · drops {res['drops'][:5]}")
