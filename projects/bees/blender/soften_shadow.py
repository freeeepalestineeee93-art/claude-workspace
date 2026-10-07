# ظل الـ shadow catcher بـ Cycles بيطلع عريض وغامق (بيبين لطخة رمادية فوق الحقل): منخففه ومنقصّره.
#   .venv/bin/python projects/bees/blender/soften_shadow.py <dir> [strength=0.45]
import sys, glob
import numpy as np
from PIL import Image
k = float(sys.argv[2]) if len(sys.argv) > 2 else 0.45
for p in sorted(glob.glob(sys.argv[1] + '/*.png')):
    a = np.asarray(Image.open(p).convert('RGBA')).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    sh = (rgb.max(-1) < 30) & (al < 250)          # بكسلات الظل: سودا ونص شفافة
    a[..., 3] = np.where(sh, al * k, al)
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(p)
print('✓', sys.argv[1])
