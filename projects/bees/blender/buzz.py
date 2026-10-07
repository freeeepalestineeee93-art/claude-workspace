# طنين نحل stereo بيلحق حركة النحلات بالفيديو: pan حسب x على الشاشة، علو حسب القرب، وdoppler للمرقة جنب العدسة.
#   .venv/bin/python projects/bees/blender/buzz.py projects/bees/assets/gen/buzz.wav
import sys
import numpy as np
import soundfile as sf
sys.path.insert(0, '.')
from lib.audio.synth import SR

DUR = 17.5
n = int(DUR * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(4)

def smooth(x, k=0.02):
    w = max(1, int(k * SR)); return np.convolve(x, np.ones(w) / w, mode='same')

def bee(f0, pitch, gain):
    """صوت نحلة: هارمونيكس منشارية + vibrato + نفَس، pitch وgain منحنيات بطول الصوت."""
    vib = 1 + 0.018 * np.sin(2 * np.pi * 5.3 * t + rng.uniform(0, 6)) + 0.01 * smooth(rng.standard_normal(n), 0.05)
    ph = 2 * np.cumsum(np.pi * f0 * pitch * vib / SR)
    x = sum(np.sin(h * ph + rng.uniform(0, 6)) / h ** 1.15 for h in range(1, 14))
    x += 0.12 * smooth(rng.standard_normal(n), 0.0004)
    return x / 3 * gain

def env(points):  # [(t, v), …] → منحنى ناعم
    ts, vs = zip(*points); return smooth(np.interp(t, ts, vs), 0.03)

def pan_mix(x, pan):  # pan −1 يسار … +1 يمين (قدرة ثابتة)
    a = (pan + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)])

out = np.zeros((2, n))
# ١. hook: نحلة لاصقة بالعدسة يمين ← يسار (0.02–0.64)، doppler
k = np.clip((t - 0.02) / 0.62, 0, 1)
out += pan_mix(bee(240, 1.22 - 0.42 * k, env([(0, 0), (0.05, 0.6), (0.3, 1.0), (0.55, 0.7), (0.8, 0)])), 0.95 - 1.9 * k)
# ٢. نحلة البطل: بتدخل يمين، بتحوم يسار الحلقة، وبتطلع يسار-فوق
out += pan_mix(bee(232, 1.0, env([(0.8, 0), (1.1, 0.35), (2.2, 0.5), (3.3, 0.45), (4.0, 0)])), env([(0.8, 0.9), (2.2, -0.45), (3.3, -0.5), (4.0, -1)]))
# ٣. نحلات الحقل (بعيدة، خفيفة)
out += pan_mix(bee(250, 1.0, env([(3.8, 0), (4.4, 0.12), (7.2, 0.12), (7.8, 0)])), np.sin(t * 0.9) * 0.6)
# ٤. نحلة المدار: الصوت بيلف مع المدار (حوالي الكرة يسار الكادر)
laps = 3 * np.clip((t - 8.25) / 2.6, 0, 1) ** 2 * (3 - 2 * np.clip((t - 8.25) / 2.6, 0, 1))
out += pan_mix(bee(238, 1 + 0.04 * np.sin(2 * np.pi * laps), env([(8.2, 0), (8.5, 0.22), (10.9, 0.22), (11.2, 0)]) * (0.75 + 0.25 * np.sin(2 * np.pi * laps))), -0.35 + 0.5 * np.cos(2 * np.pi * laps))
# ٥. همهمة الخلية (كتير نحلات، جوقة خفيفة) بقسم القرص
hive = sum(bee(220 + d, 1.0, 1.0) for d in (-9, -3, 4, 11)) / 4
out += pan_mix(hive * env([(11.0, 0), (11.6, 0.18), (14.6, 0.18), (15.2, 0)]), 0.0)
# ٦. نحلة الهبوط: من يسار ← النص، بتعلى وهي بتقرب، وبتسكت لما تحط (16.7)
out += pan_mix(bee(236, env([(15.6, 1.04), (16.5, 0.98), (16.7, 0.9)]), env([(15.55, 0), (15.9, 0.35), (16.5, 0.55), (16.68, 0.4), (16.75, 0)])), env([(15.6, -0.9), (16.6, -0.05)]))

out /= np.abs(out).max() + 1e-9
out *= 0.7
sf.write(sys.argv[1], out.T.astype(np.float32), SR, subtype='PCM_24')
print('✓', sys.argv[1])
