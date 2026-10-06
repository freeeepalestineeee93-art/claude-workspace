"""Creative DNA: فهم مرجع كفيديو (زمن + حركة + صوت) → أدلة مقاسة → تقنيات قابلة لإعادة الاستعمال.

المستويات:
  1. global   Gemini بيشوف الفيديو الأصلي كامل (فيديو + صوت + زمن، بدون تقطيع):
              الهدف، التسلسلات، اللقطات، الأحداث، و"فرضيات بدها قياس" (مثلاً: زووم كاميرا ولا طبقة منفصلة؟)
  2. measure  كل فرضية بتنفحص بأداة دقيقة على لحظتها بس (camera_keys / layer_keys / صوت مقابل صورة)
  3. (Claude) بيقرأ الأدلة وبيكتب بطاقات التقنيات بـ library/techniques/ (شو، كيف بالأرقام، ليش، إحساس، متى)

python tools/dna.py global projects/references/refs/r07.mp4 [--fps 2]
python tools/dna.py measure r07
الناتج: library/refs/<id>/{global.json, measurements.json}
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import refmap  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "library"

EVIDENCE = {"type": "STRING", "description": "MEASURED | OBSERVED | INFERRED | UNCERTAIN"}

GLOBAL_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "purpose": {"type": "STRING"},
        "genre": {"type": "STRING"},
        "storytelling": {"type": "STRING", "description": "How the narrative is structured and paced; emotional arc."},
        "visual_language": {"type": "STRING"},
        "motion_philosophy": {"type": "STRING", "description": "Where does perceived energy come from (camera? layers? typography? edit?). Be specific."},
        "editing_philosophy": {"type": "STRING"},
        "sound_philosophy": {"type": "STRING"},
        "sequences": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
            "name": {"type": "STRING", "description": "Hook / Setup / Explanation / Escalation / Reveal / Comparison / Climax / Resolution / Outro ..."},
            "start": {"type": "NUMBER"}, "end": {"type": "NUMBER"}, "role": {"type": "STRING"},
            "pacing": {"type": "STRING"}}, "required": ["name", "start", "end"]}},
        "shots": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
            "start": {"type": "NUMBER"}, "end": {"type": "NUMBER"},
            "purpose": {"type": "STRING", "description": "What this shot does for the story/attention."},
            "subject": {"type": "STRING"}, "composition": {"type": "STRING"},
            "what_moves": {"type": "STRING", "description": "Separate: camera vs subject layer vs background vs text vs graphics. Who moves independently?"},
            "typography": {"type": "STRING", "description": "Exact text, weight, entrance/exit, timing relative to speech/camera, screen-anchored or attached to subject."},
            "transition_in": {"type": "STRING"}, "transition_out": {"type": "STRING"},
            "sound": {"type": "STRING", "description": "Voice, music, SFX in this shot and what they sync to."},
            "attention_target": {"type": "STRING"},
            "events": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
                "t": {"type": "NUMBER"}, "kind": {"type": "STRING", "description": "punch_in | pull_back | rotation | freeze | speed_ramp | text_in | text_out | graphic_hit | mask_reveal | subject_isolation | foreground_wipe | impact | beat_sync | transition | reversal | focus_shift | marker_doodle | selective_color | other"},
                "description": {"type": "STRING"}, "evidence": EVIDENCE}}},
        }, "required": ["start", "end"]}},
        "hypotheses": {"type": "ARRAY", "description": "Moments where exact measurement would reveal HOW the motion is built (acceleration, layer separation, parallax, overshoot, sync).", "items": {"type": "OBJECT", "properties": {
            "start": {"type": "NUMBER"}, "end": {"type": "NUMBER"},
            "question": {"type": "STRING"},
            "test": {"type": "STRING", "description": "camera_curve | layer_separation | audio_sync | text_timing"},
            "subject": {"type": "STRING", "description": "Which element to isolate if layer_separation (e.g. 'goalkeeper', 'player cutout')."}}}},
        "signature_techniques": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {
            "name": {"type": "STRING"}, "what": {"type": "STRING"}, "why": {"type": "STRING"},
            "examples": {"type": "STRING", "description": "Timestamps."}, "evidence": EVIDENCE}}},
    },
    "required": ["purpose", "sequences", "shots", "hypotheses", "signature_techniques", "motion_philosophy"],
}

GLOBAL_PROMPT = """You are a senior motion designer and film editor studying this professional Arabic vertical video to learn its CRAFT (not to copy its content).
Watch the ENTIRE video with its audio as one continuous piece. Use exact timestamps (seconds, decimals).

Analyze hierarchically:
1) GLOBAL: purpose, genre, storytelling, visual language, motion philosophy (where does the perceived energy really come from?), editing philosophy, sound philosophy.
2) SEQUENCES: meaningful creative sections (Hook, Setup, Explanation, Escalation, Reveal, ... Outro) — not equal chunks.
3) SHOTS: every shot with purpose, subject, composition, WHAT MOVES (camera vs subject layer vs background vs text — who moves independently), typography timing (screen-anchored or attached to subject?), transitions in/out, sound and what it syncs to, attention target.
4) EVENTS inside shots with timestamps (punch-ins, pull-backs, text in/out, graphic hits, mask reveals, transitions, impacts, beat syncs, reversals, marker doodles, selective color...).
5) HYPOTHESES: the moments where precise measurement would reveal HOW the motion is built (e.g. "is this a camera zoom or an isolated subject layer scaling over a restrained background?", "does the SFX hit lead the cut?", "how fast does the punch accelerate?"). Give time ranges and the subject to isolate.
6) SIGNATURE TECHNIQUES: what makes it feel professional, why it works.

Label every claim's evidence: OBSERVED (you can see/hear it), INFERRED (interpretation), UNCERTAIN. Never claim exact numbers you cannot know; leave precise numbers to the measurement stage."""


def gemini_global(src, fps=2.0, model="gemini-3.8-flash"):
    key = os.environ["GEMINI_API_KEY"]
    f = refmap.gemini_upload(Path(src), key)
    body = {
        "contents": [{"parts": [{"fileData": {"mimeType": f["mimeType"], "fileUri": f["uri"]}, "videoMetadata": {"fps": fps}}, {"text": GLOBAL_PROMPT}]}],
        "generationConfig": {"responseMimeType": "application/json", "responseSchema": GLOBAL_SCHEMA, "temperature": 0.2, "mediaResolution": "MEDIA_RESOLUTION_MEDIUM", "maxOutputTokens": 65536},
    }
    for attempt in range(4):
        try:
            text, usage = refmap._gemini_stream(model, key, body)
            out = json.loads(text)
            out["_meta"] = {"model": model, "fps": fps, "native_video": True, "audio": True, "chunked": False, "usage": usage}
            return out
        except Exception as e:  # الاتصال الطويل ممكن ينقطع: منعيد
            print(f"  ↻ إعادة ({type(e).__name__}: {str(e)[:120]})", flush=True)
            time.sleep(10 * (attempt + 1))
    raise RuntimeError("Gemini global فشل")


def measure(ref_id, src):
    """بيفحص فرضيات Gemini بأدوات القياس، كل وحدة على لحظتها بس."""
    g = json.loads((LIB / "refs" / ref_id / "global.json").read_text())
    out = []
    for h in g.get("hypotheses", []):
        t0, t1 = float(h["start"]), float(h["end"])
        if t1 - t0 < 0.3:
            t1 = t0 + 0.6
        rec = {"hypothesis": h, "results": {}}
        try:
            cam = refmap.camera_keys(src, t0, t1)
            d = np.array(cam["dense"])
            rec["results"]["camera"] = {"zoom_start": 1.0, "zoom_peak": round(float(d[:, 1].max()), 3), "zoom_min": round(float(d[:, 1].min()), 3),
                                        "zoom_end": round(float(d[-1, 1]), 3), "keys": cam["keys"], "evidence": "MEASURED"}
            # تسارع: أسرع تغيّر بالزووم وزمن الوصول لـ 90% من الذروة
            z = d[:, 1]
            if z.max() - 1 > 0.05:
                i90 = int(np.argmax(z >= 1 + 0.9 * (z.max() - 1)))
                rec["results"]["camera"]["time_to_90pct_peak_s"] = round(float(d[i90, 0]), 3)
                rec["results"]["camera"]["peak_rate_per_s"] = round(float(np.max(np.diff(z)) * cam["fps"]), 3)
        except Exception as e:
            rec["results"]["camera_error"] = str(e)[:200]
        if h.get("test") == "layer_separation":
            try:
                mask = isolate_subject(src, t0, ref_id)
                if mask:
                    lk = refmap.layer_keys(src, t0, t1, mask)
                    fg, bg = np.array(lk["fg"]["dense"]), np.array(lk["bg"]["dense"])
                    rec["results"]["layers"] = {"fg_scale_peak": round(float(fg[:, 1].max()), 3), "bg_scale_peak": round(float(bg[:, 1].max()), 3),
                                                "fg_scale_end": round(float(fg[-1, 1]), 3), "bg_scale_end": round(float(bg[-1, 1]), 3),
                                                "differential": round(float(fg[:, 1].max() / max(bg[:, 1].max(), 1e-3)), 3),
                                                "fg_keys": lk["fg"]["keys"], "bg_keys": lk["bg"]["keys"], "evidence": "MEASURED"}
            except Exception as e:
                rec["results"]["layers_error"] = str(e)[:200]
        out.append(rec)
        print(f"  ✓ {t0:.2f}–{t1:.2f}s {h.get('test')}: {list(rec['results'])}", flush=True)
    (LIB / "refs" / ref_id / "measurements.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    return out


def isolate_subject(src, t, ref_id):
    """قناع العنصر الأمامي بأول فريم من اللحظة (rembg، وSAM 2 لاحقاً للتتبّع)."""
    import subprocess
    import cv2
    from rembg import remove, new_session
    d = LIB / "refs" / ref_id / "masks"
    d.mkdir(parents=True, exist_ok=True)
    png = d / f"mask_{t:.2f}.png"
    if not png.exists():
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t + 0.02:.3f}", "-i", str(src), "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        im = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
        rgba = np.array(remove(cv2.cvtColor(im, cv2.COLOR_BGR2RGB), session=new_session("isnet-general-use")))
        if (rgba[:, :, 3] > 128).mean() < 0.01:
            return None
        cv2.imwrite(str(png), rgba[:, :, 3])
    return png


def main():
    cmd, *args = sys.argv[1:] or ["help"]
    opt = {args[i][2:]: args[i + 1] for i in range(len(args) - 1) if args[i].startswith("--")}
    if cmd == "global":
        src = Path(args[0]); rid = src.stem
        (LIB / "refs" / rid).mkdir(parents=True, exist_ok=True)
        g = gemini_global(src, fps=float(opt.get("fps", 2)), model=opt.get("model", "gemini-3.8-flash"))
        g["_meta"]["src"] = str(src)
        (LIB / "refs" / rid / "global.json").write_text(json.dumps(g, ensure_ascii=False, indent=1))
        print(f"✓ library/refs/{rid}/global.json · {len(g['shots'])} لقطة · {len(g['hypotheses'])} فرضية")
    elif cmd == "measure":
        rid = args[0]
        src = json.loads((LIB / "refs" / rid / "global.json").read_text())["_meta"]["src"]
        measure(rid, src)
        print(f"✓ library/refs/{rid}/measurements.json")
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
