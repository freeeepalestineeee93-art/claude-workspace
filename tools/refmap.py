"""خريطة المرجع: "شو صاير ووين" (Gemini) + "كيف بالظبط" (قياس بصري وصوتي) → refs/<اسم>/map.json + map.md

python tools/refmap.py projects/references/refs/r07.mp4 [--only gemini|cv|audio] [--fps 5] [--model gemini-3.8-flash]

1. gemini  فهم الفيديو: لقطات، عناصر، نصوص، دخول/خروج، حركة كاميرا، انتقالات، مؤثرات بصرية، صوت ومؤثرات، بالتوقيت.
           بيحتاج GEMINI_API_KEY (من البيئة، لا تكتبه بكود).
2. cv      قياس: حركة الكاميرا لكل لقطة (optical flow → إزاحة/زووم/دوران فريم بفريم) + مطابقة منحنى (ease) لكل حركة،
           وأحداث الدخول (مناطق بتتغير فجأة) مع زمن صعودها.
3. audio   أحداث الصوت: ضربات/swooshes (onsets بطاقة وطيف)، وكم بعيدة عن القطعات وأحداث الحركة.
"""
from __future__ import annotations

import json
import os
import ssl
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("NUMBA_CACHE_DIR", f"/tmp/numba-cache-{os.getpid()}")


def ssl_ctx():
    ca = "/root/.ccr/ca-bundle.crt"
    return ssl.create_default_context(cafile=ca) if os.path.exists(ca) else ssl.create_default_context()


def probe(path):
    out = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], check=True, capture_output=True, text=True).stdout)
    v = next(s for s in out["streams"] if s["codec_type"] == "video")
    n, d = map(int, v["r_frame_rate"].split("/"))
    return {"w": int(v["width"]), "h": int(v["height"]), "fps": n / d, "duration": float(out["format"]["duration"])}


# ───────────────────────── ١. Gemini ─────────────────────────

SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "summary": {"type": "STRING", "description": "Art direction in 3-5 sentences: visual style, palette, typography, motion character, pacing."},
        "shots": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
            "start": {"type": "NUMBER"}, "end": {"type": "NUMBER"},
            "background": {"type": "STRING"},
            "composition": {"type": "STRING", "description": "Where things sit in the 9:16 frame and why (focal point, negative space, layering depth)."},
            "elements": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
                "kind": {"type": "STRING", "description": "photo_cutout | photo_full | archive_footage | text | number | logo | shape | diagram | document | particle | 3d_object | other"},
                "description": {"type": "STRING"},
                "region": {"type": "STRING", "description": "e.g. top-right, center, bottom third, full frame"},
                "enter_time": {"type": "NUMBER"}, "enter_style": {"type": "STRING", "description": "Exactly how it appears: slide from X, scale-up with overshoot, mask wipe direction, letter-by-letter typing, fade, cut-in, etc."},
                "enter_duration": {"type": "NUMBER"},
                "motion_while_on": {"type": "STRING", "description": "Drift, parallax, rotation, float, none..."},
                "exit_time": {"type": "NUMBER"}, "exit_style": {"type": "STRING"},
                "treatment": {"type": "STRING", "description": "Visual treatment: B&W, halftone, outline/stroke color & thickness, glow, shadow, blur, chromatic aberration, echo/trails, texture."},
            }}},
            "on_screen_text": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
                "text": {"type": "STRING"}, "time": {"type": "NUMBER"}, "weight": {"type": "STRING"}, "size": {"type": "STRING"},
                "color": {"type": "STRING"}, "animation": {"type": "STRING"}, "kashida": {"type": "BOOLEAN"}}}},
            "camera": {"type": "OBJECT", "properties": {
                "move": {"type": "STRING", "description": "static | push_in | pull_out | pan | tilt | rotate | zoom_punch | whip | shake | parallax | combination"},
                "speed": {"type": "STRING"}, "easing": {"type": "STRING", "description": "How it accelerates/decelerates (linear, ease-in-out, fast-then-settle, overshoot...)."},
                "start": {"type": "NUMBER"}, "end": {"type": "NUMBER"}, "depth_layers": {"type": "STRING", "description": "Do foreground/background move at different speeds?"}}},
            "transition_out": {"type": "OBJECT", "properties": {
                "type": {"type": "STRING", "description": "hard cut | match cut | zoom-through | whip | wipe | shape mask | flash | glitch | dissolve | other"},
                "duration": {"type": "NUMBER"}, "description": {"type": "STRING"}}},
            "effects": {"type": "ARRAY", "items": {"type": "STRING"}},
            "sfx": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {"time": {"type": "NUMBER"}, "sound": {"type": "STRING"}, "synced_to": {"type": "STRING"}}}},
        }, "required": ["start", "end"]}},
        "audio": {"type": "OBJECT", "properties": {
            "music": {"type": "STRING", "description": "Genre, instruments, tempo, energy arc, where it hits/drops."},
            "voice": {"type": "STRING", "description": "Narrator style, pace, tone."},
            "mix": {"type": "STRING", "description": "How music ducks under voice, SFX loudness, silences."}}},
        "signature_moves": {"type": "ARRAY", "items": {"type": "STRING"}, "description": "The 5-10 recurring techniques that define this style and how exactly to reproduce each."},
    },
    "required": ["summary", "shots", "signature_moves"],
}

PROMPT = """You are a senior motion designer reverse-engineering a professional Arabic sports explainer (vertical 9:16) so another designer can recreate its STYLE exactly in After Effects.
Watch the whole video carefully, including audio. Use exact timestamps in seconds (decimals). Segment into shots at every cut.
For every shot describe precisely: background, composition, every element and HOW it enters/moves/exits (direction, timing, overshoot, easing), the visual treatment (B&W, halftone, outline thickness and color, glow, chromatic aberration, echo trails, CRT/VHS frame), on-screen Arabic text (exact text, weight light/heavy, kashida stretching, animation), the camera move with its easing, the transition to the next shot, visual effects, and sound effects with their exact times and what visual they are synced to.
Be concrete and measurable (e.g. "slides in from right over ~0.3s, overshoots ~5% then settles", "push-in ~8% over the whole shot, ease-in-out"). Do not invent things you cannot see or hear."""


def gemini_upload(path, key):
    size = path.stat().st_size
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/upload/v1beta/files?key={key}", data=json.dumps({"file": {"display_name": path.name}}).encode(),
                                 headers={"X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start", "X-Goog-Upload-Header-Content-Length": str(size),
                                          "X-Goog-Upload-Header-Content-Type": "video/mp4", "Content-Type": "application/json"})
    url = urllib.request.urlopen(req, context=ssl_ctx()).headers["X-Goog-Upload-URL"]
    req = urllib.request.Request(url, data=path.read_bytes(), headers={"X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize", "Content-Length": str(size)})
    f = json.loads(urllib.request.urlopen(req, context=ssl_ctx()).read())["file"]
    for _ in range(120):
        st = json.loads(urllib.request.urlopen(f"https://generativelanguage.googleapis.com/v1beta/{f['name']}?key={key}", context=ssl_ctx()).read())
        if st["state"] == "ACTIVE":
            return st
        if st["state"] == "FAILED":
            raise RuntimeError("Gemini رفض الفيديو")
        time.sleep(3)
    raise TimeoutError("تجهيز الفيديو طوّل")


def _gemini_stream(model, key, body):
    """streamGenerateContent (SSE): الاتصال بيضل حي مع التوليد الطويل."""
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={key}", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    text, usage = [], {}
    with urllib.request.urlopen(req, context=ssl_ctx(), timeout=1200) as r:
        for line in r:
            line = line.decode().strip()
            if not line.startswith("data:"):
                continue
            ev = json.loads(line[5:])
            for c in ev.get("candidates", []):
                text += [p.get("text", "") for p in c.get("content", {}).get("parts", []) if not p.get("thought")]
            usage = ev.get("usageMetadata", usage)
    return "".join(text), usage


def gemini_pass(src, fps=5, model="gemini-3.8-flash", prompt=PROMPT, chunk=25.0):
    """الفيديو بيتقسم لمقاطع (كل واحد بطلب) وبتندمج اللقطات بتوقيت مطلق."""
    key = os.environ["GEMINI_API_KEY"]
    f = gemini_upload(Path(src), key)
    dur = probe(src)["duration"]
    merged = {"summary": "", "shots": [], "signature_moves": [], "audio": {}}
    usage = []
    t = 0.0
    while t < dur - 0.5:
        a, b = t, min(dur, t + chunk)
        body = {
            "contents": [{"parts": [{"fileData": {"mimeType": f["mimeType"], "fileUri": f["uri"]}, "videoMetadata": {"fps": fps, "startOffset": f"{a:.2f}s", "endOffset": f"{b:.2f}s"}},
                                    {"text": prompt + f"\n\nThis request covers ONLY {a:.2f}s to {b:.2f}s of the full video. Report ABSOLUTE timestamps (seconds from the start of the full video), all between {a:.2f} and {b:.2f}."}]}],
            "generationConfig": {"responseMimeType": "application/json", "responseSchema": SCHEMA, "temperature": 0.2, "mediaResolution": "MEDIA_RESOLUTION_MEDIUM"},
        }
        for attempt in range(3):
            try:
                text, u = _gemini_stream(model, key, body)
                part = json.loads(text)
                break
            except Exception as e:  # شبكة/429/JSON ناقص
                if attempt == 2:
                    raise
                print(f"  ↻ إعادة {a:.0f}-{b:.0f}s ({type(e).__name__})", flush=True)
                time.sleep(8 * (attempt + 1))
        # لو رجع توقيت نسبي للمقطع، منصلّحه لمطلق
        sh = part.get("shots", [])
        if sh and a > 1 and max(x.get("end", 0) for x in sh) <= (b - a) + 0.5 and min(x.get("start", 0) for x in sh) < a - 0.5:
            def shift(o):
                for k2, v2 in list(o.items()):
                    if k2 in ("start", "end", "time", "enter_time", "exit_time") and isinstance(v2, (int, float)):
                        o[k2] = round(v2 + a, 3)
                    elif isinstance(v2, dict):
                        shift(v2)
                    elif isinstance(v2, list):
                        for it in v2:
                            if isinstance(it, dict):
                                shift(it)
            for x in sh:
                shift(x)
        merged["shots"] += sh
        merged["summary"] += (" " if merged["summary"] else "") + part.get("summary", "")
        merged["signature_moves"] += part.get("signature_moves", [])
        for k2, v2 in (part.get("audio") or {}).items():
            merged["audio"][k2] = (merged["audio"].get(k2, "") + " | " + v2).strip(" |")
        usage.append(u)
        print(f"  ✓ {a:.0f}–{b:.0f}s: {len(sh)} لقطة", flush=True)
        t = b
    merged["_model"] = model
    merged["_usage"] = usage
    return merged


# ───────────────────────── ٢. قياس بصري ─────────────────────────

def read_frames(src, scale_w=360):
    info = probe(src)
    h = int(round(info["h"] * scale_w / info["w"] / 2) * 2)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-vf", f"scale={scale_w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], check=True, capture_output=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, h, scale_w)
    return frames, info


def detect_cuts(frames, fps, thresh=28.0):
    d = np.array([0] + [np.mean(np.abs(frames[i].astype(np.int16) - frames[i - 1])) for i in range(1, len(frames))])
    cuts = [0]
    for i in range(1, len(d)):
        if d[i] > thresh and d[i] > 2.5 * np.median(d[max(1, i - 8):i + 8]) and i - cuts[-1] > fps * 0.15:
            cuts.append(i)
    return cuts, d


def camera_track(frames):
    """حركة الكاميرا بين كل فريمين (similarity: إزاحة، زووم، دوران) من optical flow على نقاط مميزة."""
    import cv2
    out = []
    prev = frames[0]
    # منستثني الأطراف (إطار الأنبوب واللوغو الثابتين بيخربوا قياس الكاميرا)
    H, W = frames.shape[1:]
    mask = np.zeros((H, W), np.uint8)
    mask[int(H * 0.08):int(H * 0.92), int(W * 0.14):int(W * 0.86)] = 255
    for i in range(1, len(frames)):
        cur = frames[i]
        p0 = cv2.goodFeaturesToTrack(prev, maxCorners=300, qualityLevel=0.01, minDistance=7, mask=mask)
        m = None
        if p0 is not None and len(p0) >= 12:
            p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, p0, None, winSize=(21, 21), maxLevel=3)
            ok = st.reshape(-1) == 1
            # نصوص/لوغو ثابتة بالشاشة بتشد القياس للصفر: إذا في مجموعة نقاط عم تتحرك فعلاً، منعتمد عليها
            mv = np.linalg.norm((p1 - p0).reshape(-1, 2), axis=1) > 0.35
            if (ok & mv).sum() >= 10 and (ok & mv).sum() >= 0.15 * ok.sum():
                ok = ok & mv
            if ok.sum() >= 10:
                m, inl = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=2.0)
                if m is not None and inl is not None and inl.sum() < 8:
                    m = None
        if m is None:
            out.append((0.0, 0.0, 1.0, 0.0, 0))
        else:
            s = float(np.hypot(m[0, 0], m[1, 0]))
            out.append((float(m[0, 2]), float(m[1, 2]), s, float(np.degrees(np.arctan2(m[1, 0], m[0, 0]))), 1))
        prev = cur
    return out


EASES = {
    "linear": lambda x: x,
    "sine_inout": lambda x: 0.5 - 0.5 * np.cos(np.pi * x),
    "quad_out": lambda x: 1 - (1 - x) ** 2,
    "cubic_out": lambda x: 1 - (1 - x) ** 3,
    "expo_out": lambda x: np.where(x >= 1, 1, 1 - 2 ** (-10 * x)),
    "quad_in": lambda x: x * x,
    "cubic_inout": lambda x: np.where(x < 0.5, 4 * x ** 3, 1 - (-2 * x + 2) ** 3 / 2),
}


def ae_ease(influence_in, influence_out):
    """منحنى AE: easy ease بنسب تأثير (bezier زمني). ‎33/33 = Easy Ease الافتراضي."""
    x1, x2 = influence_out / 100, 1 - influence_in / 100
    ts = np.linspace(0, 1, 400)
    bx = 3 * (1 - ts) ** 2 * ts * x1 + 3 * (1 - ts) * ts ** 2 * x2 + ts ** 3
    by = 3 * (1 - ts) * ts ** 2 + ts ** 3  # y1=0، y2=1 (سرعة صفر بالطرفين)
    return lambda x: np.interp(x, bx, by)


for a in (33, 50, 66, 75, 85, 95):
    for b in (33, 50, 66, 75, 85, 95):
        EASES[f"ae_{a}_{b}"] = ae_ease(a, b)


def fit_curve(y):
    """منطابق منحنى تراكمي (مطبّع 0..1) مع عائلة eases ومنرجع الأقرب."""
    y = np.asarray(y, float)
    if len(y) < 4 or abs(y[-1] - y[0]) < 1e-6:
        return None
    yn = (y - y[0]) / (y[-1] - y[0])
    x = np.linspace(0, 1, len(y))
    best = min(((float(np.mean((f(x) - yn) ** 2)), n) for n, f in EASES.items()))
    return {"ease": best[1], "rmse": round(best[0] ** 0.5, 4)}


def segments(series, fps, min_len=4, still=0.02):
    """بيقسم سلسلة سرعة لمقاطع حركة متصلة: بين لحظات السكون، وعند انعكاس الاتجاه (زووم لجوّا ← لبرّا)."""
    sm = np.convolve(series, np.ones(3) / 3, mode="same") if len(series) >= 3 else np.asarray(series)
    moving = np.abs(sm) > still
    segs, i = [], 0
    while i < len(sm):
        if moving[i]:
            j, sign = i, np.sign(sm[i])
            while j < len(sm) and moving[j] and np.sign(sm[j]) == sign:
                j += 1
            if j - i >= min_len:
                segs.append((i, j))
            i = j
        else:
            i += 1
    return segs


def entrance_events(frames, a, b, fps, grid=6):
    """مناطق بالفريم بتتغير فجأة وبعدين بتستقر = دخول عنصر. منرجع وقت البداية ومدة الصعود (10%→90%)."""
    H, W = frames.shape[1:]
    gh, gw = H // grid * 2, W // grid
    ev = []
    for gy in range(0, H - gh + 1, gh):
        for gx in range(0, W - gw + 1, gw):
            cell = frames[a:b, gy:gy + gh, gx:gx + gw].astype(np.float32)
            if len(cell) < 6:
                continue
            ref = cell[0]
            dist = np.array([np.mean(np.abs(c - ref)) for c in cell])
            final = np.mean(dist[-3:])
            if final < 12:
                continue
            t10 = np.argmax(dist >= final * 0.1)
            t90 = np.argmax(dist >= final * 0.9)
            if t90 > t10:
                ev.append({"t": round((a + t10) / fps, 3), "rise": round((t90 - t10) / fps, 3), "region": [round(gx / W, 2), round(gy / H, 2)], "amount": round(float(final), 1)})
    return sorted(ev, key=lambda e: e["t"])


def cv_pass(src):
    frames, info = read_frames(src)
    fps = info["fps"]
    cuts, diff = detect_cuts(frames, fps)
    known = Path(src).parent / Path(src).stem / "analysis.json"
    if known.exists():  # قطعات PySceneDetect (أدق) من analyze-ref
        an = json.loads(known.read_text())
        cuts = sorted({0, *[int(round(c * fps)) for c in an.get("cuts", [])]})
    cam = camera_track(frames)
    shots = []
    bounds = cuts + [len(frames)]
    for k in range(len(cuts)):
        a, b = bounds[k], bounds[k + 1]
        c = cam[a:b - 1] if b - 1 > a else []
        dx = np.array([m[0] for m in c]); dy = np.array([m[1] for m in c]); sc = np.array([m[2] for m in c]); rot = np.array([m[3] for m in c])
        valid = np.array([m[4] for m in c]) if c else np.array([])
        zoom = np.cumprod(sc) if len(sc) else np.array([1.0])
        px, py, pr = np.cumsum(dx), np.cumsum(dy), np.cumsum(rot)
        W = frames.shape[2]
        moves = []
        for name, series, cum, unit in (("zoom", sc - 1, zoom, "x"), ("pan_x", dx / W, px / W, "frame"), ("pan_y", dy / W, py / W, "frame"), ("rotate", rot, pr, "deg")):
            for s0, s1 in segments(series, fps, still={"zoom": 0.0015, "pan_x": 0.002, "pan_y": 0.002, "rotate": 0.05}[name]):
                total = float(cum[min(s1, len(cum) - 1)] - (cum[s0 - 1] if s0 else (1.0 if name == "zoom" else 0.0)))
                if (name == "zoom" and abs(total) < 0.01) or (name != "zoom" and abs(total) < (0.02 if unit == "frame" else 0.5)):
                    continue
                f = fit_curve(cum[s0:s1])
                peak = float(np.max(np.abs(series[s0:s1])))
                moves.append({"what": name, "start": round((a + s0) / fps, 3), "dur": round((s1 - s0) / fps, 3), "total": round(total, 4), "unit": unit,
                              "peak_per_frame": round(peak, 4), "fit": f})
        shots.append({"start": round(a / fps, 3), "end": round(b / fps, 3), "dur": round((b - a) / fps, 3),
                      "tracking": round(float(valid.mean()), 2) if len(valid) else 0, "camera": moves,
                      "zoom_total": round(float(zoom[-1]), 4), "entrances": entrance_events(frames, a, b, fps)[:12]})
    return {"fps": fps, "w": info["w"], "h": info["h"], "duration": info["duration"], "cuts": [round(c / fps, 3) for c in cuts], "shots": shots}


ENGINE_EASE = {"linear": "linear", "sine_inout": "sineInOut", "quad_out": "quadOut", "cubic_out": "cubicOut", "expo_out": "expoOut", "quad_in": "quadIn", "cubic_inout": "cubicInOut"}


def camera_keys(src, t0, t1, out_w=1080, out_h=1920):
    """حركة الكاميرا للقطة وحدة → keyframes للمحرك (zoom/x/y/rotation) مع منحنى مطابق لكل مقطع.
    التحويل التراكمي: screen = z·R·p + T  ⇒  كاميرا المحرك: cam = (C(1−z) − T)/z  (C = نص الشاشة)."""
    import cv2
    frames, info = read_frames(src)
    fps = info["fps"]
    a, b = int(round(t0 * fps)), int(round(t1 * fps))
    k = out_w / frames.shape[2]
    A = np.eye(3)
    dense = [(0.0, 1.0, 0.0, 0.0, 0.0)]
    for (dx, dy, sc, rot, ok) in camera_track(frames[a:b]):
        r = np.radians(rot)
        M = np.array([[sc * np.cos(r), -sc * np.sin(r), dx * k], [sc * np.sin(r), sc * np.cos(r), dy * k], [0, 0, 1]])
        # التحويل حوالين نص الإطار الأصلي → حوالين نص الشاشة
        A = M @ A
        z = float(np.hypot(A[0, 0], A[1, 0]))
        T = A[:2, 2]
        C = np.array([out_w / 2, out_h / 2])
        cam = (C * (1 - z) - T) / z
        dense.append((len(dense) / fps, z, float(cam[0]), float(cam[1]), float(np.degrees(np.arctan2(A[1, 0], A[0, 0])))))
    d = np.array(dense)
    keys = {}
    for col, name, still in ((1, "zoom", 0.0012), (2, "x", 0.6), (3, "y", 0.6), (4, "rotation", 0.04)):
        vel = np.diff(d[:, col])
        segs = segments(vel, fps, min_len=3, still=still)
        kf = [[0.0, round(float(d[0, col]), 4)]]
        # تقسيم تكراري: مقطع ما بيطابقه منحنى واحد (خطأ > 3%) بينقسم عند أكبر انحراف
        def split(s0, s1, depth=0):
            f = fit_curve(d[s0:s1 + 1, col])
            if f and f["rmse"] > 0.03 and s1 - s0 >= 8 and depth < 3:
                y = d[s0:s1 + 1, col]
                lin = np.linspace(y[0], y[-1], len(y))
                m = s0 + int(np.argmax(np.abs(y - lin)[2:-2])) + 2
                return split(s0, m, depth + 1) + split(m, s1, depth + 1)
            return [(s0, s1)]
        segs = [p for s0, s1 in segs for p in split(s0, s1)]
        for s0, s1 in segs:
            f = fit_curve(d[s0:s1 + 1, col])
            ease = ENGINE_EASE.get(f["ease"], f["ease"].replace("ae_", "ae:").replace("_", ":")) if f else "linear"
            if d[s0, 0] > kf[-1][0] + 1e-3:
                kf.append([round(float(d[s0, 0]), 3), round(float(d[s0, col]), 4)])
            kf[-1].append(ease)
            kf.append([round(float(d[min(s1, len(d) - 1), 0]), 3), round(float(d[min(s1, len(d) - 1), col]), 4)])
        if len(kf) > 1:
            keys[name] = kf
    return {"fps": fps, "dense": d.round(4).tolist(), "keys": keys}


def fit_keys(times, values, still=None, tol=0.03):
    """سلسلة قيم كثيفة → keyframes قليلة بمنحنيات مسماة (نفس منطق camera_keys)."""
    t = np.asarray(times, float); y = np.asarray(values, float)
    fps = 1 / np.median(np.diff(t)) if len(t) > 1 else 24
    rng = float(np.ptp(y)) or 1.0
    vel = np.diff(y)
    segs = segments(vel, fps, min_len=3, still=still if still is not None else rng * 0.004)

    def split(s0, s1, depth=0):
        f = fit_curve(y[s0:s1 + 1])
        if f and f["rmse"] > tol and s1 - s0 >= 8 and depth < 4:
            lin = np.linspace(y[s0], y[s1], s1 - s0 + 1)
            m = s0 + int(np.argmax(np.abs(y[s0:s1 + 1] - lin)[2:-2])) + 2
            return split(s0, m, depth + 1) + split(m, s1, depth + 1)
        return [(s0, s1)]
    kf = [[0.0, round(float(y[0]), 4)]]
    for s0, s1 in [p for a_, b_ in segs for p in split(a_, min(b_, len(y) - 1))]:
        f = fit_curve(y[s0:s1 + 1])
        ease = ENGINE_EASE.get(f["ease"], f["ease"].replace("ae_", "ae:").replace("_", ":")) if f else "linear"
        if t[s0] > kf[-1][0] + 1e-3:
            kf.append([round(float(t[s0]), 3), round(float(y[s0]), 4)])
        kf[-1] = kf[-1][:2] + [ease]
        kf.append([round(float(t[s1]), 3), round(float(y[s1]), 4)])
    return kf


def layer_keys(src, t0, t1, fg_mask_png, out_w=1080, out_h=1920):
    """تتبّع طبقتين منفصلتين (قدام: أشخاص/قصاصة حسب القناع، ورا: الخلفية) → تحويل تراكمي لكل طبقة
    (scale, x, y) بإحداثيات الشاشة: screen = s·p + T. بيكشف الـ parallax الحقيقي بدل تخمين عمق الكاميرا."""
    import cv2
    frames, info = read_frames(src)
    fps = info["fps"]
    a, b = int(round(t0 * fps)), int(round(t1 * fps))
    fr = frames[a:b]
    H, W = fr.shape[1:]
    k = out_w / W
    m0 = cv2.imread(str(fg_mask_png), cv2.IMREAD_UNCHANGED)
    m0 = (cv2.resize(m0[:, :, 3] if m0.ndim == 3 else m0, (W, H)) > 128).astype(np.uint8) * 255
    edge = np.zeros((H, W), np.uint8); edge[int(H * 0.06):int(H * 0.94), int(W * 0.12):int(W * 0.88)] = 255
    A = {"fg": np.eye(3), "bg": np.eye(3)}
    out = {"fg": [(0.0, 1.0, 0.0, 0.0)], "bg": [(0.0, 1.0, 0.0, 0.0)]}
    for i in range(1, len(fr)):
        prev, cur = fr[i - 1], fr[i]
        mfg = cv2.warpAffine(m0, A["fg"][:2], (W, H), flags=cv2.INTER_NEAREST)
        masks = {"fg": cv2.erode(mfg, np.ones((5, 5), np.uint8)) & edge,
                 "bg": cv2.bitwise_not(cv2.dilate(mfg, np.ones((21, 21), np.uint8))) & edge}
        for L in ("fg", "bg"):
            p0 = cv2.goodFeaturesToTrack(prev, maxCorners=250, qualityLevel=0.005, minDistance=5, mask=masks[L])
            M = None
            if p0 is not None and len(p0) >= 8:
                p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, p0, None, winSize=(21, 21), maxLevel=3)
                ok = st.reshape(-1) == 1
                if ok.sum() >= 6:
                    M, inl = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=1.5)
            if M is None:
                M = np.array([[1, 0, 0], [0, 1, 0]], float)
            A[L] = np.vstack([M, [0, 0, 1]]) @ A[L]
            sc = float(np.hypot(A[L][0, 0], A[L][1, 0]))
            out[L].append((i / fps, sc, float(A[L][0, 2] * k), float(A[L][1, 2] * k)))
    res = {"fps": fps}
    for L in ("fg", "bg"):
        d = np.array(out[L])
        res[L] = {"dense": np.round(d, 4).tolist(), "keys": {n: fit_keys(d[:, 0], d[:, c]) for n, c in (("scale", 1), ("x", 2), ("y", 3))}}
    return res


# ───────────────────────── ٣. صوت ─────────────────────────

def audio_pass(src, cuts):
    import librosa
    wav = Path("/tmp") / f"refmap-{os.getpid()}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "1", "-ar", "22050", str(wav)], check=True)
    y, sr = librosa.load(wav, sr=22050)
    wav.unlink(missing_ok=True)
    hop = 256
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    on = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=hop, units="frames", backtrack=False, delta=0.25)
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    flat = librosa.feature.spectral_flatness(y=y, hop_length=hop)[0]
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
    ev = []
    strong = np.percentile(env[on], 75) if len(on) else 0
    for f in on:
        t = f * hop / sr
        if env[f] < strong:
            continue
        # تصنيف بسيط: ضجيج عريض طويل = whoosh، قصير حاد منخفض = hit، عالي ونقي = ding/pop
        w = slice(f, min(len(rms), f + int(0.25 * sr / hop)))
        kind = "whoosh" if flat[w].mean() > 0.15 else ("hit" if cent[f] < 1800 else "click/pop")
        near = min(cuts, key=lambda c: abs(c - t)) if cuts else None
        ev.append({"t": round(float(t), 3), "kind": kind, "strength": round(float(env[f]), 2), "to_cut": round(float(t - near), 3) if near is not None else None})
    on_cut = sum(1 for e in ev if e["to_cut"] is not None and abs(e["to_cut"]) < 0.08)
    return {"bpm": round(float(np.atleast_1d(tempo)[0]), 1), "events": ev, "events_on_cuts": f"{on_cut}/{len(ev)}"}


# ───────────────────────── دمج + تقرير ─────────────────────────

def report(m):
    L = [f"# خريطة المرجع: {m['src']}", ""]
    cv = m.get("cv")
    if cv:
        L += [f"{cv['w']}×{cv['h']} · {cv['fps']:.0f}fps · {cv['duration']:.1f}s · {len(cv['cuts'])} لقطة", "", "## حركة الكاميرا المقاسة (كل لقطة)", ""]
        eases = {}
        for s in cv["shots"]:
            mv = ", ".join(f"{c['what']} {c['total']:+.3f}{'' if c['unit'] == 'x' else ' ' + c['unit']} بـ {c['dur']}s ({c['fit']['ease'] if c['fit'] else '?'})" for c in s["camera"]) or "ثابتة"
            L.append(f"- {s['start']:.2f}–{s['end']:.2f}s ({s['dur']:.2f}s): {mv}")
            for c in s["camera"]:
                if c["fit"]:
                    eases[c["fit"]["ease"]] = eases.get(c["fit"]["ease"], 0) + 1
        L += ["", "**أكثر منحنيات مستعملة:** " + ", ".join(f"{k} ×{v}" for k, v in sorted(eases.items(), key=lambda x: -x[1])[:6]), ""]
        rises = [e["rise"] for s in cv["shots"] for e in s["entrances"] if e["rise"] > 0]
        if rises:
            L.append(f"**زمن دخول العناصر (10%→90%):** وسيط {np.median(rises):.2f}s · أسرع {min(rises):.2f}s · أبطأ {max(rises):.2f}s")
            L.append("")
    au = m.get("audio")
    if au:
        kinds = {}
        for e in au["events"]:
            kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
        L += ["## الصوت المقاس", f"BPM ≈ {au['bpm']} · {len(au['events'])} حدث قوي ({', '.join(f'{k} {v}' for k, v in kinds.items())}) · على القطعات (±80ms): {au['events_on_cuts']}", ""]
    g = m.get("gemini")
    if g:
        L += ["## قراءة Gemini", "", g.get("summary", ""), "", "### الحركات المميِّزة", ""] + [f"- {x}" for x in g.get("signature_moves", [])] + [""]
        a = g.get("audio") or {}
        if a:
            L += ["### الصوت", f"- الموسيقى: {a.get('music', '')}", f"- التعليق: {a.get('voice', '')}", f"- المكساج: {a.get('mix', '')}", ""]
        L += ["### اللقطات", ""]
        for s in g.get("shots", []):
            cam = s.get("camera") or {}
            tr = s.get("transition_out") or {}
            L.append(f"**{s.get('start', 0):.2f}–{s.get('end', 0):.2f}s** · {s.get('background', '')} · كاميرا: {cam.get('move', '')} ({cam.get('easing', '')}) · انتقال: {tr.get('type', '')}")
            for e in s.get("elements", []):
                L.append(f"  - {e.get('kind')}: {e.get('description', '')} — دخول: {e.get('enter_style', '')} ({e.get('enter_duration', '')}s) · معالجة: {e.get('treatment', '')}")
            for t in s.get("on_screen_text", []):
                L.append(f"  - نص «{t.get('text', '')}» {t.get('weight', '')} {'كشيدة ' if t.get('kashida') else ''}— {t.get('animation', '')}")
            for x in s.get("sfx", []):
                L.append(f"  - 🔊 {x.get('time')}s {x.get('sound', '')} ← {x.get('synced_to', '')}")
            L.append("")
    return "\n".join(L)


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    src = Path(args[0])
    opt = {args[i][2:]: args[i + 1] for i in range(1, len(args) - 1, 2) if args[i].startswith("--")}
    out = src.parent / src.stem
    out.mkdir(parents=True, exist_ok=True)
    mpath = out / "map.json"
    m = json.loads(mpath.read_text()) if mpath.exists() else {}
    m["src"] = str(src)
    only = opt.get("only")
    if only in (None, "cv"):
        print("▸ قياس الكاميرا والدخول…", flush=True)
        m["cv"] = cv_pass(src)
    if only in (None, "audio"):
        print("▸ أحداث الصوت…", flush=True)
        m["audio"] = audio_pass(src, (m.get("cv") or {}).get("cuts", []))
    if only in (None, "gemini"):
        if os.environ.get("GEMINI_API_KEY"):
            print(f"▸ Gemini ({opt.get('model', 'gemini-3.8-flash')})…", flush=True)
            m["gemini"] = gemini_pass(src, fps=float(opt.get("fps", 5)), model=opt.get("model", "gemini-3.8-flash"))
        else:
            print("  (ما في GEMINI_API_KEY، تخطّيت الفهم)")
    mpath.write_text(json.dumps(m, ensure_ascii=False, indent=1))
    (out / "map.md").write_text(report(m))
    print(f"✓ {mpath}\n✓ {out / 'map.md'}")


if __name__ == "__main__":
    main()
