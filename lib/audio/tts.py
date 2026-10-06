"""تعليق صوتي عربي + توقيت كل كلمة (للكابشن المتزامن وتحريك النص على الكلام).

المزوّدين:
  edge        مجاني، 32 صوت عربي بلهجات مختلفة (ar-SA-HamedNeural، ar-EG-SalmaNeural، ar-SY-LaithNeural، ...)
  elevenlabs  الأقوى بالإحساس (بدو ELEVENLABS_API_KEY بملف .env)
  gemini      بدو GEMINI_API_KEY
  file        تسجيلك الصوتي: منطلّع توقيت الكلمات بـ Whisper

الاستعمال:
  python -m lib.audio.tts say "النص" out.wav --voice ar-SY-LaithNeural [--rate +5%]
  python -m lib.audio.tts align recording.wav ["السكربت"]  ← توقيت كلمات تسجيل موجود (مع السكربت أدق)
الناتج: out.wav + out.words.json  [{ "word": "...", "start": 0.12, "end": 0.48 }, ...]
"""
from __future__ import annotations

import asyncio
import json
import os
import ssl
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

VOICES = {
    "سعودي-رجل": "ar-SA-HamedNeural", "سعودي-امرأة": "ar-SA-ZariyahNeural",
    "مصري-رجل": "ar-EG-ShakirNeural", "مصري-امرأة": "ar-EG-SalmaNeural",
    "سوري-رجل": "ar-SY-LaithNeural", "سوري-امرأة": "ar-SY-AmanyNeural",
    "لبناني-رجل": "ar-LB-RamiNeural", "لبناني-امرأة": "ar-LB-LaylaNeural",
    "أردني-رجل": "ar-JO-TaimNeural", "أردني-امرأة": "ar-JO-SanaNeural",
    "إماراتي-رجل": "ar-AE-HamdanNeural", "إماراتي-امرأة": "ar-AE-FatimaNeural",
    "عراقي-رجل": "ar-IQ-BasselNeural", "مغربي-رجل": "ar-MA-JamalNeural",
}


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def _ssl_ctx():
    """certifi + أي CA إضافية بالبيئة (بروكسي الشركة/السحابة)."""
    import certifi
    ctx = ssl.create_default_context(cafile=certifi.where())
    extra = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt" if Path("/root/.ccr/ca-bundle.crt").exists() else None)
    if extra:
        ctx.load_verify_locations(cafile=extra)
    return ctx


def to_wav(src, dst):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ar", "48000", "-ac", "2", str(dst)], check=True)


async def _edge(text, out_mp3, voice, rate, pitch):
    import edge_tts
    import edge_tts.communicate as ec
    ec._SSL_CTX = _ssl_ctx()
    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words = []
    with open(out_mp3, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                st = chunk["offset"] / 1e7
                words.append({"word": chunk["text"], "start": round(st, 3), "end": round(st + chunk["duration"] / 1e7, 3)})
    return words


def say(text, out_wav, voice="ar-SA-HamedNeural", provider="edge", rate="+0%", pitch="+0Hz", style=None):
    load_env()
    out_wav = Path(out_wav)
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    voice = VOICES.get(voice, voice)
    tmp = out_wav.with_suffix(".src.mp3")
    words = None
    if provider == "edge":
        words = asyncio.run(_edge(text, tmp, voice, rate, pitch))
    elif provider == "elevenlabs":
        import urllib.request
        key = os.environ["ELEVENLABS_API_KEY"]
        body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2"}).encode()
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}", body, {"xi-api-key": key, "Content-Type": "application/json"})
        tmp.write_bytes(urllib.request.urlopen(req, context=_ssl_ctx()).read())
    elif provider == "gemini":
        import base64
        import urllib.request
        key = os.environ["GEMINI_API_KEY"]
        model = os.environ.get("GEMINI_TTS_MODEL") or gemini_tts_model(key)
        vname = voice if not voice.startswith("ar-") else "Charon"
        # الأسلوب (بالإنجليزي) بيتحط قبل النص. أحياناً الموديل بيقرا التعليمات نفسها (خصوصاً مع نص قصير):
        # منتحقق بالتفريغ وبنعيد التوليد، وآخر محاولة بدون أسلوب.
        for attempt in range(4):
            st = style if (style and attempt < 3) else None
            prompt = f"{st}:\n{text}" if st else text
            body = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": vname}}}}}).encode()
            req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}", body, {"Content-Type": "application/json"})
            data = json.loads(urllib.request.urlopen(req, context=_ssl_ctx()).read())
            pcm = base64.b64decode(data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            raw = out_wav.with_suffix(".pcm")
            raw.write_bytes(pcm)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", str(raw), str(tmp)], check=True)
            raw.unlink()
            if not st or _clean_read(tmp, text):
                break
            print(f"  ↻ {out_wav.name}: الموديل قرا التعليمات، عم عيد ({attempt + 1})", file=sys.stderr)
    else:
        raise ValueError(f"مزوّد غير معروف: {provider}")
    to_wav(tmp, out_wav)
    tmp.unlink(missing_ok=True)
    if not words:
        words = align(out_wav, script=text)
    Path(str(out_wav).replace(".wav", ".words.json")).write_text(json.dumps(words, ensure_ascii=False, indent=1))
    return {"wav": str(out_wav), "words": words, "duration": words[-1]["end"] if words else 0}


def _clean_read(audio, script):
    """القراءة نظيفة؟ ما في حروف لاتينية بالتفريغ، وطول الكلام مش أكبر بكتير من النص."""
    import re
    from faster_whisper import WhisperModel
    global _WM
    try:
        _WM
    except NameError:
        _WM = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = _WM.transcribe(str(audio), language="ar")
    heard = " ".join(s.text for s in segs)
    if re.search(r"[A-Za-z]{3,}", heard):
        return False
    words_heard = len(heard.split()); words_script = len(script.split())
    return words_heard <= words_script * 1.6 + 3


_GEM_MODEL = None


def gemini_tts_model(key):
    """أحدث موديل TTS متاح على المفتاح (pro قبل flash)."""
    global _GEM_MODEL
    if _GEM_MODEL:
        return _GEM_MODEL
    import urllib.request
    try:
        data = json.loads(urllib.request.urlopen(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}&pageSize=1000", context=_ssl_ctx()).read())
        names = [m["name"].split("/")[-1] for m in data.get("models", []) if "tts" in m["name"]]
        import re
        ver = lambda n: tuple(int(x) for x in re.findall(r"\d+", n.split("-tts")[0])[:2] or [0])
        # الأحدث أولاً، والـ lite آخر شي
        names = [n for n in names if "live" not in n]
        names.sort(key=lambda n: (ver(n), "lite" not in n, "preview" not in n), reverse=True)
        _GEM_MODEL = names[0] if names else "gemini-2.5-flash-preview-tts"
    except Exception:
        _GEM_MODEL = "gemini-2.5-flash-preview-tts"
    return _GEM_MODEL


def say_script(script_json, out_dir, **opts):
    """سكربت كامل [{id, text}] → id.wav + id.words.json لكل مقطع."""
    out = []
    for item in json.loads(Path(script_json).read_text()):
        r = say(item["text"], Path(out_dir) / f"{item['id']}.wav", **opts)
        out.append({"id": item["id"], "duration": round(r["duration"], 2)})
        print(item["id"], out[-1]["duration"], flush=True)
    return out


def _norm(w):
    import re
    w = re.sub(r"[\u064B-\u0652\u0640،,.!?؟:؛\"']", "", w)
    return w.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")


def snap_to_script(heard, script):
    """forced alignment تقريبي: توقيتات Whisper بتنطبق على كلمات السكربت الحقيقية."""
    import difflib
    target = script.split()
    a = [_norm(w["word"]) for w in heard]
    b = [_norm(w) for w in target]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    out = [None] * len(target)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                out[j1 + k] = {"word": target[j1 + k], "start": heard[i1 + k]["start"], "end": heard[i1 + k]["end"]}
        elif op == "replace":
            # توزيع المدة المسموعة على كلمات السكربت حسب طول كل كلمة
            span_s, span_e = heard[i1]["start"], heard[i2 - 1]["end"]
            lens = [max(1, len(b[j])) for j in range(j1, j2)]
            tot, acc = sum(lens), 0
            for k, ln in enumerate(lens):
                st = span_s + (span_e - span_s) * acc / tot
                acc += ln
                out[j1 + k] = {"word": target[j1 + k], "start": round(st, 3), "end": round(span_s + (span_e - span_s) * acc / tot, 3)}
    # تعبئة الفراغات بالاستيفاء
    for i, w in enumerate(out):
        if w is None:
            prev = next((out[j]["end"] for j in range(i - 1, -1, -1) if out[j]), 0.0)
            nxt = next((out[j]["start"] for j in range(i + 1, len(out)) if out[j]), prev + 0.3)
            out[i] = {"word": target[i], "start": round(prev, 3), "end": round(max(prev + 0.05, nxt), 3)}
    return out


def align(audio, model="small", language="ar", script=None):
    """توقيت كل كلمة بتسجيل موجود (Whisper محلي). مع script: التوقيت بينطبق على كلماتك الصحيحة."""
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(str(audio), language=language, word_timestamps=True, vad_filter=True)
    words = []
    for s in segs:
        for w in s.words or []:
            words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3), "p": round(w.probability, 2)})
    return snap_to_script(words, script) if script else words


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "say":
        args = sys.argv[2:]
        opts = {}
        while len(args) > 2 and args[-2].startswith("--"):
            opts[args[-2][2:]] = args[-1]
            args = args[:-2]
        res = say(args[0], args[1], **opts)
        print(json.dumps({k: res[k] for k in ("wav", "duration")} | {"words": len(res["words"])}, ensure_ascii=False))
    elif cmd == "script":
        # python -m lib.audio.tts script vo/script.json vo/ --provider gemini --voice Charon --style "..."
        args = sys.argv[2:]
        opts = {}
        while len(args) > 2 and args[-2].startswith("--"):
            opts[args[-2][2:]] = args[-1]
            args = args[:-2]
        say_script(args[0], args[1], **opts)
    elif cmd == "align":
        words = align(sys.argv[2], script=sys.argv[3] if len(sys.argv) > 3 else None)
        out = Path(sys.argv[2]).with_suffix(".words.json")
        out.write_text(json.dumps(words, ensure_ascii=False, indent=1))
        print(out, len(words), "كلمة")
