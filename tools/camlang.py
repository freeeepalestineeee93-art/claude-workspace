"""لغة الكاميرا: الأداة بتتعلّم كيف بتتحرك الكاميرا بالمراجع (مش نسخ حرفي) وبتحوّلها لمعيار.

  learn <video> [--name r07] [--tags "aljazeera,sport"]   → library/camera/refs/<name>.json (كل حركة: نوعها، مدتها، منحنى سرعتها، نعومتها)
  build                                                   → library/camera/library.json (معيار مجمّع + منحنيات بأسماء للـ kit)
  audit <video> [--json out.json]                         → فحص انسيابية كاميرا فيديو عنا مقابل المعيار

الوحدات: الإزاحة بعرض الكادر (fw)، الزووم بـ log، الدوران بالدرجات. السرعة لكل ثانية.
"""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from refmap import read_frames, detect_cuts  # noqa: E402

LIB = Path(__file__).resolve().parent.parent / "library" / "camera"
NPROF = 25


def track(frames):
    """حركة الكاميرا بين كل فريمين (إزاحة/زووم/دوران) — بس إذا الحركة شاملة للكادر (مش عنصر لحاله عم يتحرك)."""
    import cv2
    H, W = frames.shape[1:]
    mask = np.zeros((H, W), np.uint8)
    mask[int(H * 0.06):int(H * 0.94), int(W * 0.06):int(W * 0.94)] = 255
    out = []
    for i in range(1, len(frames)):
        prev, cur = frames[i - 1], frames[i]
        rec = (0.0, 0.0, 1.0, 0.0, 0)
        p0 = cv2.goodFeaturesToTrack(prev, maxCorners=400, qualityLevel=0.01, minDistance=6, mask=mask)
        if p0 is not None and len(p0) >= 16:
            p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, p0, None, winSize=(21, 21), maxLevel=3)
            ok = st.reshape(-1) == 1
            if ok.sum() >= 12:
                m, inl = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=1.5)
                if m is not None and inl is not None and inl.sum() >= 10:
                    pts = p0[ok][inl.reshape(-1) == 1].reshape(-1, 2)
                    # شمولية: النقاط المتطابقة مع الحركة لازم تغطي جزء كبير من الكادر (وإلا هو عنصر مش كاميرا)
                    spread = (np.ptp(pts[:, 0]) / W) * (np.ptp(pts[:, 1]) / H)
                    share = inl.sum() / ok.sum()
                    if spread > 0.3 and share > 0.5:
                        s = float(np.hypot(m[0, 0], m[1, 0]))
                        rec = (float(m[0, 2]) / W, float(m[1, 2]) / W, s, float(np.degrees(np.arctan2(m[1, 0], m[0, 0]))), 1)
        out.append(rec)
    return np.array(out)


def moves_of(src):
    frames, info = read_frames(src, scale_w=360)
    fps = info["fps"]
    cuts, _ = detect_cuts(frames, fps)
    cam = track(frames)  # لكل فريم i (من i إلى i+1)
    dx, dy, sc, rot, ok = cam.T
    for c in cuts[1:]:  # القطع مش حركة كاميرا
        lo, hi = max(0, c - 2), min(len(dx), c + 1)
        dx[lo:hi] = dy[lo:hi] = rot[lo:hi] = 0
        sc[lo:hi] = 1
    lz = np.log(np.maximum(sc, 1e-3))
    vpan = np.hypot(dx, dy) * fps
    vz = np.abs(lz) * fps
    vr = np.abs(rot) * fps
    vr = np.where(np.abs(rot) < 0.04, 0, vr)  # دوران صغير جداً = ضجيج/عناصر بتلف، مش كاميرا
    e = vpan + vz + vr / 60
    e = np.convolve(e, np.hanning(7) / np.hanning(7).sum(), mode="same")  # تنعيم (التتبّع فيه ضجيج فريم بفريم)
    on, off = 0.06, 0.03
    moves, i, n = [], 0, len(e)
    cutset = set(cuts)
    while i < n:
        if e[i] > on:
            j = i
            quiet = 0
            while j < n and quiet < 3 and (j + 1) not in cutset:
                quiet = quiet + 1 if e[j] < off else 0
                j += 1
            s0, s1 = i, j - quiet
            if (s1 - s0) / fps >= 0.2:
                seg = slice(s0, s1)
                ve = e[seg]
                pk = float(np.percentile(ve, 90))  # ذروة متينة (مش فريم شاذ)
                tt = np.linspace(0, 1, len(ve))
                prof = np.clip(np.interp(np.linspace(0, 1, NPROF), tt, ve / pk), 0, 1.5)
                vx, vy = dx[seg] * fps, dy[seg] * fps
                acc = np.diff(np.stack([vx, vy, lz[seg] * fps, rot[seg] * fps / 60]), axis=1) * fps
                jerk = np.diff(acc, axis=1) * fps if acc.shape[1] > 1 else np.zeros((4, 1))
                dur = (s1 - s0) / fps
                tot = {"pan": float(np.hypot(dx[seg].sum(), dy[seg].sum())), "zoom": float(lz[seg].sum()), "roll": float(rot[seg].sum())}
                share = {"pan": float(vpan[seg].sum()), "zoom": float(vz[seg].sum()), "roll": float(vr[seg].sum() / 60)}
                tsh = sum(share.values()) or 1
                kind = max(share, key=share.get)
                if kind == "roll" and abs(tot["roll"]) < 2.5:
                    kind = "pan" if share["pan"] >= share["zoom"] else "zoom"
                if kind == "zoom":
                    kind = "push" if tot["zoom"] > 0 else "pull"
                    if share["pan"] / tsh > 0.35:
                        kind += "-pan"  # دفع/سحب مع انزياح (الأشيع بالجزيرة)
                elif kind == "pan":
                    if share["zoom"] / tsh > 0.35:
                        kind = ("push" if tot["zoom"] > 0 else "pull") + "-pan"
                    elif pk > 1.6:
                        kind = "whip" if dur < 0.7 else "travel"
                moves.append({
                    "t": round(s0 / fps, 3), "dur": round(dur, 3), "kind": kind, "peak": round(pk, 4),
                    "total": {k: round(v, 4) for k, v in tot.items()},
                    "dir": round(float(np.degrees(np.arctan2(dy[seg].sum(), dx[seg].sum()))), 1),
                    "t_peak": round(float(np.argmax(ve)) / max(1, len(ve) - 1), 3),
                    "start": round(float(ve[:3].mean() / pk), 3), "end": round(float(ve[-3:].mean() / pk), 3),
                    "jerk": round(float(np.sqrt((jerk ** 2).sum(axis=0).mean()) * dur ** 3 / max(pk, 1e-6) / 100), 4),
                    "profile": [round(float(x), 3) for x in prof],
                })
            i = max(j, i + 1)  # (لو بلّشت الحركة عند قطع مباشرة j = i وبتعلق)
        else:
            i += 1
    for a, b in zip(moves, moves[1:]):
        a["gap_after"] = round(b["t"] - (a["t"] + a["dur"]), 3)
    V = np.stack([dx * fps, dy * fps, lz * fps, np.where(np.abs(rot) < 0.04, 0, rot) * fps / 60])
    hw = np.hanning(5) / np.hanning(5).sum()
    V = np.stack([np.convolve(v, hw, mode="same") for v in V])
    dv = np.linalg.norm(np.diff(V, axis=1), axis=0)  # تغيّر السرعة بين فريمين (fw/s)
    near_cut = np.zeros(len(dv), bool)
    for c in cuts[1:]:
        near_cut[max(0, c - 4):c + 4] = True
    dv = np.where(near_cut, 0, dv)
    tracked = float(ok.mean()) if len(ok) else 0
    return {"dv": {"p50": round(float(np.percentile(dv, 50)), 4), "p95": round(float(np.percentile(dv, 95)), 4), "p99": round(float(np.percentile(dv, 99)), 4)}, "dv_series": [round(float(x), 4) for x in dv],"src": str(src), "fps": fps, "duration": info["duration"], "tracked": round(tracked, 3), "cuts": [round(c / fps, 3) for c in cuts], "moves": moves}


def build():
    refs = [json.loads(p.read_text()) for p in sorted((LIB / "refs").glob("*.json"))]
    allm = [dict(m, ref=r["name"]) for r in refs for m in r["moves"]]
    if not allm:
        raise SystemExit("ما في حركات متعلّمة بعد (camlang.py learn ...)")
    pct = lambda xs, q: round(float(np.percentile(xs, q)), 4) if len(xs) else None
    kinds = {}
    for k in sorted({m["kind"] for m in allm}):
        ms = [m for m in allm if m["kind"] == k]
        P = np.array([m["profile"] for m in ms])
        prof = np.median(P, axis=0)
        pos = np.concatenate([[0], np.cumsum((prof[1:] + prof[:-1]) / 2)])
        pos = pos / pos[-1] if pos[-1] > 0 else np.linspace(0, 1, NPROF)
        kinds[k] = {
            "count": len(ms), "refs": sorted({m["ref"] for m in ms}),
            "dur": {"p25": pct([m["dur"] for m in ms], 25), "median": pct([m["dur"] for m in ms], 50), "p75": pct([m["dur"] for m in ms], 75)},
            "peak": {"median": pct([m["peak"] for m in ms], 50), "p90": pct([m["peak"] for m in ms], 90)},
            "t_peak": pct([m["t_peak"] for m in ms], 50), "start": pct([m["start"] for m in ms], 50), "end": pct([m["end"] for m in ms], 50),
            "speed_profile": [round(float(x), 3) for x in prof],
            "position_curve": [round(float(x), 4) for x in pos],  # للـ kit: تقدّم الحركة 0→1 عبر الزمن الطبيعي
        }
    gaps = [m["gap_after"] for m in allm if "gap_after" in m]
    std = {
        "abrupt_start": pct([m["start"] for m in allm], 90), "abrupt_end": pct([m["end"] for m in allm], 90),
        "jerk_p95": pct([m["jerk"] for m in allm], 95), "peak_p95": pct([m["peak"] for m in allm], 95),
        "gap_median": pct(gaps, 50),
        # أقصى تغيّر سرعة بين فريمين بالمراجع اللي فيها كاميرا فعلية (تتبّع ≥ 75%)
        "dv_p99": round(float(np.median([r["dv"]["p99"] for r in refs if r.get("tracked", 0) >= 0.75 and "dv" in r])), 4), "chained_share": round(float(np.mean([g < 0.1 for g in gaps])), 3) if gaps else None,
    }
    lib = {"refs": [{"name": r["name"], "tags": r.get("tags", []), "moves": len(r["moves"]), "tracked": r["tracked"]} for r in refs], "moves": len(allm), "standard": std, "kinds": kinds}
    (LIB / "library.json").write_text(json.dumps(lib, ensure_ascii=False, indent=1))
    return lib


def audit(src):
    lib = json.loads((LIB / "library.json").read_text())
    std = lib["standard"]
    res = moves_of(src)
    out = []
    dv = np.array(res["dv_series"])
    thr = max(0.08, std["dv_p99"] * 1.8)
    i = 0
    while i < len(dv):
        if dv[i] > thr:
            j = i
            while j < len(dv) and dv[j] > thr * 0.6:
                j += 1
            pk = float(dv[i:j].max())
            out.append({"sev": 3 if pk > thr * 2 else 2, "t": round(i / res["fps"], 2), "msg": f"نتعة كاميرا: السرعة تغيّرت فجأة ({pk:.2f} عرض كادر/ث بفريم، المراجع ≤ {std['dv_p99']:.2f})"})
            i = j + 3
        else:
            i += 1
    for m in res["moves"]:
        tag = f"{m['kind']} {m['dur']:.2f}s"
        if False and m["start"] > max(0.35, std["abrupt_start"] * 1.3):
            out.append({"sev": 3, "t": m["t"], "msg": f"الكاميرا بتبلش فجأة ({tag}: سرعة البداية {m['start']:.0%} من الذروة، المرجع ≤ {std['abrupt_start']:.0%})"})
        if False and m["end"] > max(0.35, std["abrupt_end"] * 1.3) and m.get("gap_after", 1) > 0.1:
            out.append({"sev": 3, "t": round(m["t"] + m["dur"], 2), "msg": f"الكاميرا بتوقف فجأة ({tag}: سرعة النهاية {m['end']:.0%} من الذروة، المرجع ≤ {std['abrupt_end']:.0%})"})
        if False and std["jerk_p95"] and m["jerk"] > std["jerk_p95"] * 1.5:  # (مقياس مقطعي بيتضخّم بالحركات الطويلة؛ فحص النتعة الحقيقي = تغيّر السرعة بين فريمين فوق)
            out.append({"sev": 2, "t": m["t"], "msg": f"نتعة/تسارع غير ناعم ({tag}: jerk {m['jerk']:.3f} > معيار المراجع {std['jerk_p95']:.3f})"})
        k = lib["kinds"].get(m["kind"])
        if k:
            d = float(np.abs(np.array(m["profile"]) - np.array(k["speed_profile"])).mean())
            if d > 0.28:
                out.append({"sev": 1, "t": m["t"], "msg": f"منحنى السرعة بعيد عن أسلوب المراجع لنوع {m['kind']} (فرق {d:.2f})"})
    return {"moves": res["moves"], "issues": out, "tracked": res["tracked"]}


if __name__ == "__main__":
    a = sys.argv[1:]
    get = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    if not a:
        print(__doc__); raise SystemExit(0)
    if a[0] == "learn":
        src = a[1]
        name = get("--name", Path(src).stem)
        r = moves_of(src)
        r["name"], r["tags"] = name, [t for t in (get("--tags", "") or "").split(",") if t]
        (LIB / "refs").mkdir(parents=True, exist_ok=True)
        (LIB / "refs" / f"{name}.json").write_text(json.dumps(r, ensure_ascii=False, indent=1))
        kinds = {}
        for m in r["moves"]:
            kinds[m["kind"]] = kinds.get(m["kind"], 0) + 1
        print(f"✓ {name}: {len(r['moves'])} حركة كاميرا {kinds} · تتبّع {r['tracked']:.0%}")
    elif a[0] == "build":
        lib = build()
        kinds = ", ".join(f"{k}({v['count']})" for k, v in lib["kinds"].items())
        print(f"✓ library.json: {lib['moves']} حركة من {len(lib['refs'])} مرجع · أنواع: {kinds}")
        print("  المعيار:", json.dumps(lib["standard"], ensure_ascii=False))
    elif a[0] == "audit":
        r = audit(a[1])
        if "--json" in a:
            Path(get("--json")).write_text(json.dumps(r, ensure_ascii=False, indent=1))
        for x in r["issues"]:
            print(f"{'✗' if x['sev'] >= 3 else '⚠'} كاميرا @{x['t']}s: {x['msg']}")
        if not r["issues"]:
            print(f"✓ كاميرا: {len(r['moves'])} حركة، كلها ضمن معيار الانسيابية")
