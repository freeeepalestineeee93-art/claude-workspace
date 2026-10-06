"""يبني فهرس الخطوط: اسم العائلة ← الملفات والأوزان والمحاور المتغيرة ودعم العربي."""
import json, pathlib
from fontTools.ttLib import TTFont

root = pathlib.Path(__file__).resolve().parent.parent / "assets" / "fonts"
index = {}
for f in sorted(root.rglob("*.ttf")):
    tt = TTFont(f, lazy=True)
    name = tt["name"]
    fam = (name.getDebugName(16) or name.getDebugName(1)).strip()
    sub = (name.getDebugName(17) or name.getDebugName(2) or "Regular").strip()
    cmap = tt.getBestCmap() or {}
    arabic = any(0x0627 <= c <= 0x064A for c in cmap)
    axes = {a.axisTag: [a.minValue, a.defaultValue, a.maxValue] for a in tt["fvar"].axes} if "fvar" in tt else {}
    weight = tt["OS/2"].usWeightClass
    italic = bool(tt["OS/2"].fsSelection & 1)
    colr = "COLR" in tt
    e = index.setdefault(fam, {"arabic": arabic, "files": []})
    e["arabic"] = e["arabic"] or arabic
    e["files"].append({"path": str(f.relative_to(root.parent.parent)), "style": sub, "weight": weight,
                       "italic": italic, "axes": axes, "color": colr})
out = root / "index.json"
out.write_text(json.dumps(index, ensure_ascii=False, indent=1))
print(len(index), "families,", sum(1 for v in index.values() if v["arabic"]), "arabic →", out)
