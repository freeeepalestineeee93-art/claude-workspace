"""هوية من لوغو: ألوان مستخرجة + لوغو متجه (SVG قابل للتحريك) + اقتراح brand.json.

python tools/brand-from-logo.py logo.png projects/<name>
- assets/logo.svg       (متجه، كل شكل مسار مستقل → بيترسم/بيتحرك)
- assets/logo-clean.png (بدون خلفية)
- brand.json            (إذا مش موجود) أو brand.suggested.json
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def hexc(rgb):
    return "#%02x%02x%02x" % tuple(int(x) for x in rgb[:3])


def lum(rgb):
    def f(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb[:3]
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def sat(rgb):
    mx, mn = max(rgb[:3]), min(rgb[:3])
    return 0 if mx == 0 else (mx - mn) / mx


def main(logo, proj):
    proj = Path(proj)
    (proj / "assets").mkdir(parents=True, exist_ok=True)
    img = Image.open(logo).convert("RGBA")
    a = np.array(img)
    # إزالة الخلفية إذا اللوغو مش شفاف
    if (a[..., 3] > 250).mean() > 0.97:
        from rembg import remove, new_session
        img = remove(img, session=new_session("isnet-general-use"))
        a = np.array(img)
    img.save(proj / "assets" / "logo-clean.png")
    px = a[a[..., 3] > 200][:, :3].astype(float)
    if len(px) == 0:
        raise SystemExit("ما لقيت بكسلات باللوغو")
    # ألوان أساسية بـ k-means بسيط
    rng = np.random.default_rng(0)
    sample = px[rng.choice(len(px), min(20000, len(px)), replace=False)]
    k = 6
    cent = sample[rng.choice(len(sample), k, replace=False)]
    for _ in range(20):
        d = ((sample[:, None] - cent[None]) ** 2).sum(-1)
        lab = d.argmin(1)
        cent = np.array([sample[lab == i].mean(0) if (lab == i).any() else cent[i] for i in range(k)])
    counts = np.bincount(lab, minlength=k)
    cols = [tuple(c) for c in cent[np.argsort(-counts)]]
    vivid = sorted(cols, key=lambda c: -sat(c) * (0.4 + counts[cols.index(c)] / counts.sum()))
    primary = vivid[0]
    accent = next((c for c in vivid[1:] if np.abs(np.array(c) - np.array(primary)).sum() > 120), vivid[min(1, len(vivid) - 1)])
    dark = min(cols, key=lum)
    light = max(cols, key=lum)
    bg = dark if lum(dark) < 0.08 else (12, 13, 16)
    text = light if lum(light) > 0.6 else (243, 239, 230)
    # SVG متجه: شفافية حادة (بدون حواف نص شفافة بتطلع بقع سودا)
    import vtracer
    b = np.array(img)
    b[..., 3] = np.where(b[..., 3] > 127, 255, 0)
    b[b[..., 3] == 0] = 0
    Image.fromarray(b).save(proj / "assets" / ".logo-vec.png")
    vtracer.convert_image_to_svg_py(str(proj / "assets" / ".logo-vec.png"), str(proj / "assets" / "logo.svg"), colormode="color", hierarchical="stacked", mode="spline", filter_speckle=6, color_precision=6, corner_threshold=60, path_precision=3)
    (proj / "assets" / ".logo-vec.png").unlink(missing_ok=True)
    brand = {
        "name": proj.name,
        "colors": {"bg": hexc(bg), "surface": hexc(np.clip(np.array(bg) + 14, 0, 255)), "text": hexc(text), "muted": "#8b8f98",
                   "primary": hexc(primary), "accent": hexc(accent)},
        "fonts": {"display": {"family": "Noto Kufi Arabic", "weight": 800}, "body": {"family": "IBM Plex Sans Arabic", "weight": 500},
                  "accent": {"family": "Aref Ruqaa", "weight": 700}, "latin": {"family": "Inter", "weight": 700}},
        "logo": {"svg": "assets/logo.svg", "png": "assets/logo-clean.png"},
        "motion": {"energy": "confident", "springs": {"enter": "default", "hero": "heavy", "ui": "snappy"}},
        "audio": {"music": {"style": "tech", "gain_db": -8}},
        "palette_extracted": [hexc(c) for c in cols],
    }
    out = proj / ("brand.json" if not (proj / "brand.json").exists() else "brand.suggested.json")
    out.write_text(json.dumps(brand, ensure_ascii=False, indent=2))
    print(f"✓ {out}\n  primary {brand['colors']['primary']} · accent {brand['colors']['accent']} · {len(cols)} لون\n✓ {proj / 'assets/logo.svg'}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
