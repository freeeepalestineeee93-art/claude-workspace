# فصل جوانح النحلة عن جسمها (لرفرفة حقيقية بـ Remotion) — .venv/bin/python projects/bees/blender/split_wings.py
import numpy as np, sys
from PIL import Image, ImageFilter
from scipy import ndimage
def split(name, region):
    im = Image.open(f'projects/bees/assets/{name}.png').convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1); sat = (mx - mn) / (mx + 1e-6)
    H, W = al.shape; yy, xx = np.mgrid[0:H, 0:W]
    m = (al > 0.05) & (sat < 0.34) & (mx > 0.5) & region(xx / W, yy / H)
    m = ndimage.binary_opening(m, iterations=2); m = ndimage.binary_closing(m, iterations=4)
    lab, n = ndimage.label(m); sizes = ndimage.sum(m, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 4000])
    core = ndimage.binary_dilation((sat > 0.42) & (al > 0.6) & ~ndimage.binary_dilation(keep, iterations=3), iterations=3)
    core = ndimage.binary_opening(core, iterations=3)
    keep = ndimage.binary_dilation(keep, iterations=14) & ~core & (al > 0.02) & region(xx / W, yy / H + 0.0)
    soft = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
    wings = a.copy(); wings[..., 3] = al * soft
    body = a.copy(); body[..., 3] = al * (1 - soft)
    thick = ndimage.binary_opening(body[..., 3] > 0.05, iterations=5)
    zone = region(xx / W, yy / H) & ~((xx / W > 0.62) & (yy / H > 0.15))
    body[..., 3] = np.where(zone & ~thick, 0, body[..., 3])
    if name == 'bee-side':  # فصل جوانح النحلة عن جسمها (لرفرفة حقيقية بـ Remotion): .venv/bin/python projects/bees/blender/split_wings.py
# عرق الجنح الذهبي (خط رفيع فوق الجسم)
        thick2 = ndimage.binary_opening(body[..., 3] > 0.05, iterations=10)
        body[..., 3] = np.where((xx / W < 0.47) & (yy / H < 0.3) & ~thick2, 0, body[..., 3])
    Image.fromarray((wings * 255).astype(np.uint8)).save(f'projects/bees/assets/{name}-wings.png')
    Image.fromarray((body * 255).astype(np.uint8)).save(f'projects/bees/assets/{name}-body.png')
    ys, xs = np.nonzero(keep); print(name, 'wing bbox', xs.min(), ys.min(), xs.max(), ys.max())
split('bee-side', lambda x, y: (y < 0.42))
split('bee-front', lambda x, y: (y < 0.5) & ((x < 0.43) | (x > 0.6)))
