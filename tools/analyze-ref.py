"""تحليل فيديو مرجعي: "شو اللي بيخلّي هالفيديو حلو؟" بالأرقام.

python tools/analyze-ref.py ref.mp4 [projects/<name>/refs]
الناتج بمجلد refs/<اسم الفيديو>/:
  shots.png      فريم من كل لقطة (بالترتيب) مع مدتها
  strip.png      فريم كل 0.25 ثانية لأول 6 ثواني (الـ hook والإيقاع)
  analysis.json  القطعات، أطوال اللقطات، طاقة الحركة، الألوان، BPM ومواقع الـ beats
  analysis.md    ملخص بالعربي: الإيقاع، الألوان، هل القطعات على الإيقاع، توصيات
بعدها Claude بيفتح الصور وبيوصف الأسلوب (تايبوغرافي، انتقالات، تكوين) وبيكتب style_guide.md.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np


def run(*a):
    return subprocess.run(a, check=True, capture_output=True, text=True).stdout


def probe(path):
    out = json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)))
    v = next(s for s in out["streams"] if s["codec_type"] == "video")
    num, den = map(int, v["r_frame_rate"].split("/"))
    return {"w": int(v["width"]), "h": int(v["height"]), "fps": num / den, "duration": float(out["format"]["duration"]),
            "audio": any(s["codec_type"] == "audio" for s in out["streams"])}


def main(src, outroot=None):
    src = Path(src)
    out = Path(outroot or src.parent) / src.stem
    out.mkdir(parents=True, exist_ok=True)
    info = probe(src)

    # ── القطعات ──
    from scenedetect import detect, ContentDetector, AdaptiveDetector
    # كاشفين: قطع حاد (content) + تغيّر تدريجي (adaptive)، ومندمجهم
    found = set()
    for det in (ContentDetector(threshold=20, min_scene_len=5), AdaptiveDetector(adaptive_threshold=2.2, min_scene_len=5)):
        for sc in detect(str(src), det)[1:]:
            found.add(round(sc[0].get_seconds(), 2))
    cuts = []
    for c in sorted(found):
        if not cuts or c - cuts[-1] > 0.2:
            cuts.append(c)
    bounds = [0.0] + cuts + [info["duration"]]
    shots = [round(b - a, 3) for a, b in zip(bounds, bounds[1:])]

    # ── فريمات ──
    tmp = out / ".f"
    tmp.mkdir(exist_ok=True)
    mids = [(a + b) / 2 for a, b in zip(bounds, bounds[1:])][:40]
    for i, t in enumerate(mids):
        run("ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(src), "-frames:v", "1", "-vf", "scale=240:-2", str(tmp / f"s{i:03d}.png"))
        run("convert", str(tmp / f"s{i:03d}.png"), "-gravity", "south", "-background", "#111", "-fill", "#ddd", "-pointsize", "14", "-splice", "0x20", "-annotate", "+0+2", f"#{i + 1} {shots[i]:.2f}s", str(tmp / f"s{i:03d}.png"))
    if mids:
        run("montage", str(tmp / "s*.png"), "-tile", "8x", "-geometry", "+3+3", "-background", "#0a0a0a", str(out / "shots.png"))
    run("ffmpeg", "-v", "error", "-y", "-i", str(src), "-t", "6", "-vf", "fps=4,scale=180:-2,tile=8x3:padding=3:color=0x0a0a0a", "-frames:v", "1", str(out / "strip.png"))

    # ── طاقة الحركة + الألوان (من فريمات صغيرة) ──
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-vf", "fps=10,scale=64:64", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 64, 64, 3).astype(np.float32)
    motion = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2, 3)) if len(fr) > 1 else np.zeros(1)
    px = fr.reshape(-1, 3)[:: 7]
    rng = np.random.default_rng(0)
    cent = px[rng.choice(len(px), 8, replace=False)]
    for _ in range(15):
        lab = ((px[:, None] - cent[None]) ** 2).sum(-1).argmin(1)
        cent = np.array([px[lab == i].mean(0) if (lab == i).any() else cent[i] for i in range(8)])
    counts = np.bincount(lab, minlength=8) / len(lab)
    palette = [{"hex": "#%02x%02x%02x" % tuple(int(c) for c in cent[i]), "share": round(float(counts[i]), 3)} for i in np.argsort(-counts)]
    bright = fr.mean(axis=(1, 2, 3)) / 255

    # ── صوت: BPM وهل القطعات على الإيقاع ──
    audio = None
    if info["audio"]:
        try:
            sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
            from lib.audio.analyze import analyze
            wav = tmp / "a.wav"
            run("ffmpeg", "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "1", "-ar", "22050", str(wav))
            audio = analyze(wav)
            beats = np.array(audio["beats"])
            if len(beats) and cuts:
                d = np.array([np.abs(beats - c).min() for c in cuts])
                audio["cuts_on_beat"] = round(float((d < 0.07).mean()), 2)
            audio.pop("energy", None)
            audio.pop("onsets", None)
        except Exception as e:  # noqa
            audio = {"error": str(e)}
    for f in tmp.iterdir():
        f.unlink()
    tmp.rmdir()

    sh = np.array(shots)
    res = {
        "file": str(src), **info, "cuts": [round(c, 3) for c in cuts], "shots": shots,
        "pacing": {"count": len(shots), "mean": round(float(sh.mean()), 2), "median": round(float(np.median(sh)), 2), "min": round(float(sh.min()), 2), "max": round(float(sh.max()), 2),
                   "cuts_per_10s": round(len(cuts) / info["duration"] * 10, 1)},
        "hook": {"first_cut": round(cuts[0], 2) if cuts else None, "motion_first_2s": round(float(motion[:20].mean()), 2), "motion_avg": round(float(motion.mean()), 2)},
        "motion_per_sec": [round(float(motion[i:i + 10].mean()), 2) for i in range(0, len(motion), 10)],
        "palette": palette, "brightness_avg": round(float(bright.mean()), 2), "audio": audio,
    }
    (out / "analysis.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    p = res["pacing"]
    mx = max(res["motion_per_sec"] + [1e-6])
    bars = "".join("▁▂▃▄▅▆▇█"[min(7, int(m / mx * 7.99))] for m in res["motion_per_sec"])
    md = [
        f"# تحليل المرجع: {src.name}",
        f"{info['w']}×{info['h']} · {info['duration']:.1f}s · {info['fps']:.0f}fps",
        "",
        "## الإيقاع",
        f"- {p['count']} لقطة · متوسط {p['mean']}s · وسيط {p['median']}s · أقصر {p['min']}s · أطول {p['max']}s",
        f"- {p['cuts_per_10s']} قطع كل 10 ثواني · أول قطع عند " + (f"{res['hook']['first_cut']}s" if res['hook']['first_cut'] is not None else "— (لقطة وحدة)"),
        f"- طاقة الحركة بالثانية: `{bars}`",
        f"- حركة أول ثانيتين {res['hook']['motion_first_2s']} مقابل المتوسط {res['hook']['motion_avg']} " + ("(hook قوي ✓)" if res['hook']['motion_first_2s'] >= res['hook']['motion_avg'] else "(بداية أهدى من الباقي)"),
        "",
        "## الألوان",
        "- " + " · ".join(f"{c['hex']} ({c['share'] * 100:.0f}%)" for c in palette[:6]),
        f"- إضاءة عامة: {res['brightness_avg']} ({'غامق' if res['brightness_avg'] < 0.35 else 'فاتح' if res['brightness_avg'] > 0.6 else 'متوسط'})",
        "",
        "## الصوت",
        (f"- BPM {audio['bpm']} · القطعات على الـ beat: {audio.get('cuts_on_beat', '—')}" if audio and "bpm" in audio else "- ما في صوت أو ما انحلل"),
        "",
        "## للنسخ بمشروعنا",
        f"- طول المشهد المقترح: {p['median']}s (مع تنويع بين {p['min']} و{p['max']})",
        "- افتح shots.png وstrip.png ووصف: التايبوغرافي، نوع الانتقالات، التكوين، الملمس — واكتبهم بـ style_guide.md",
    ]
    (out / "analysis.md").write_text("\n".join(md))
    print("\n".join(md))
    print(f"\n✓ {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
