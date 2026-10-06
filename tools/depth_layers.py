"""صورة مسطحة → طبقات عمق (2.5D) للكاميرا: Depth Anything V2 ← تقسيم حسب العمق ← تعبئة الفراغات ورا القريب.

  python tools/depth_layers.py in.jpg out_dir [--layers 4] [--feather 6]

الناتج: out_dir/layer-0.png (الأبعد، كامل) … layer-N.png (الأقرب) + manifest.json
{w, h, layers: [{src, depth}]} — depth: 0 = أبعد شي، 1 = أقرب شي. المكوّن <DepthImage> بيحوّلهم لـ z.
"""
import json
import sys
from pathlib import Path

import numpy as np


def main(src, out, n=4, feather=6):
    import cv2
    from PIL import Image
    sys.path.insert(0, str(Path(__file__).parent))
    from vision_models import depth as load_depth

    img = Image.open(src).convert("RGB")
    W, H = img.size
    d = np.asarray(load_depth()(img)["predicted_depth"]).squeeze().astype(np.float32)
    d = cv2.resize(d, (W, H), interpolation=cv2.INTER_CUBIC)
    d = (d - d.min()) / (np.ptp(d) + 1e-6)  # 1 = قريب
    rgb = np.asarray(img)
    # تنعيم العمق مع الحفاظ على حواف الصورة (الطبقات بتلزق على حدود العناصر الحقيقية)
    d = cv2.ximgproc.guidedFilter(rgb, d, 8, 1e-3) if hasattr(cv2, "ximgproc") else cv2.bilateralFilter(d, 9, 0.1, 9)
    qs = np.quantile(d, np.linspace(0, 1, n + 1))
    qs[0], qs[-1] = -1, 2
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    layers = []
    for k in range(n):
        band = ((d >= qs[k]) & (d < qs[k + 1])).astype(np.uint8)
        nearer = (d >= qs[k + 1]).astype(np.uint8)
        if k == 0:
            alpha = np.ones((H, W), np.float32)  # الخلفية كاملة
        else:
            # الطبقة بتغطي حزامها + شوي من القريب (منطقة تعبئة) حتى ما يبين فراغ لما القريب يتزحزح
            grow = cv2.dilate(band, np.ones((feather * 4 + 1, feather * 4 + 1), np.uint8))
            alpha = np.clip(band + (grow & nearer) * 1.0, 0, 1).astype(np.float32)
            alpha = cv2.GaussianBlur(alpha, (0, 0), feather)
            if k == n - 1:
                alpha = cv2.GaussianBlur(band.astype(np.float32), (0, 0), feather * 0.6)
        # تعبئة اللي ورا العناصر الأقرب (inpaint) — على نسخة مصغّرة للسرعة
        fill = rgb.copy()
        if nearer.any() and k < n - 1:
            s = 0.5
            small = cv2.resize(rgb, None, fx=s, fy=s)
            m = cv2.resize(cv2.dilate(nearer, np.ones((9, 9), np.uint8)) * 255, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
            inp = cv2.inpaint(cv2.cvtColor(small, cv2.COLOR_RGB2BGR), m, 7, cv2.INPAINT_TELEA)
            inp = cv2.cvtColor(cv2.resize(inp, (W, H), interpolation=cv2.INTER_CUBIC), cv2.COLOR_BGR2RGB)
            nb = cv2.GaussianBlur(cv2.dilate(nearer, np.ones((5, 5), np.uint8)).astype(np.float32), (0, 0), 2)[..., None]
            fill = (rgb * (1 - nb) + inp * nb).astype(np.uint8)
        rgba = np.dstack([fill, (alpha * 255).clip(0, 255).astype(np.uint8)])
        name = f"layer-{k}.png"
        Image.fromarray(rgba, "RGBA").save(out / name)
        layers.append({"src": name, "depth": round(float(d[band > 0].mean()) if band.any() else k / max(1, n - 1), 3)})
    Image.fromarray((d * 255).astype(np.uint8)).save(out / "depth.png")
    man = {"w": W, "h": H, "layers": layers, "source": str(src)}
    (out / "manifest.json").write_text(json.dumps(man, ensure_ascii=False, indent=1))
    print(f"✓ {out}: {n} طبقات عمق ({W}×{H})")
    return man


if __name__ == "__main__":
    a = sys.argv[1:]
    get = lambda k, dflt: a[a.index(k) + 1] if k in a else dflt
    if len(a) < 2:
        print(__doc__); raise SystemExit(1)
    main(a[0], a[1], int(get("--layers", 4)), int(get("--feather", 6)))
