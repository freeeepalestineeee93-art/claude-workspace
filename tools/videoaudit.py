"""فحص بصري للفيديو النهائي (بالبكسل، بيشتغل على أي فيديو):
- pop-park: عنصر بيظهر فجأة بفريم واحد، بيضل جامد، وبعدين بيبلش يتحرك
  (ملاحظة المستخدم: "بالثانية 6 بتطلع شغلات على أطراف الشاشة فجأة وما بتكون متحركة بعدين بتتحرك").
- blank: لحظات فاضية (الكادر لون واحد تقريباً) بين المشاهد.

python tools/videoaudit.py video.mp4 [--json out.json]
"""
import json
import subprocess
import sys

import numpy as np

W, H = 120, 214  # تصغير ثابت للسرعة (9:16)


def frames(path):
    info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate,width,height", "-of", "json", path], capture_output=True, text=True)
    st = json.loads(info.stdout)["streams"][0]
    n, d = map(int, st["r_frame_rate"].split("/"))
    fps = n / d
    w, h = (W, H) if st["height"] >= st["width"] else (H, W)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    raw = p.stdout.read()
    a = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)
    return a, fps


def audit(path):
    v, fps = frames(path)
    n, h, w, _ = v.shape
    B = 10  # بلوك 10×10 بكسل من الصورة المصغّرة
    gh, gw = h // B, w // B
    blk = v[:, : gh * B, : gw * B].reshape(n, gh, B, gw, B, 3).mean(axis=(2, 4))  # n,gh,gw,3
    d = np.abs(np.diff(blk, axis=0)).mean(axis=3)  # تغيّر كل بلوك بين فريمين
    glob = d.mean(axis=(1, 2))
    cut = glob > 18  # قطع/انتقال كامل: كل الكادر بيتغير
    out = []

    # ── pop-park ──
    MOVE, STILL = 6.0, 1.2
    park_min, park_max = int(0.2 * fps), int(2.0 * fps)
    hits = []
    for y in range(gh):
        for x in range(gw):
            s = d[:, y, x]
            i = 3
            while i < len(s) - park_min - 1:
                # ظهور مفاجئ: قبله سكون، بفريم واحد تغيّر كبير، وبعده سكون
                if s[i] > MOVE and s[i - 3:i].max() < STILL and not cut[max(0, i - 2):i + 3].any():
                    k = i  # الظهور ممكن ياخد لحد 3 فريمات (motion blur)
                    while k + 1 < len(s) and s[k + 1] >= STILL and k - i < 3:
                        k += 1
                    if k + 1 >= len(s) or s[k + 1] >= STILL:
                        i += 1
                        continue
                    j = k + 1
                    while j < len(s) and s[j] < STILL:
                        j += 1
                    still_len = j - k - 1
                    if park_min <= still_len <= park_max and j < len(s) and s[j:j + 4].max() > MOVE:
                        hits.append((i, y, x, still_len))
                        i = j
                        continue
                i += 1
    # جمّع البلوكات اللي بنفس اللحظة تقريباً (عنصر واحد)
    hits.sort()
    groups = []
    for h_ in hits:
        if groups and h_[0] - groups[-1][-1][0] <= 2:
            groups[-1].append(h_)
        else:
            groups.append([h_])
    for g in groups:
        if len(g) < 2:
            continue  # بلوك واحد = ضجيج غالباً
        t = (g[0][0] + 1) / fps
        park = np.median([x[3] for x in g]) / fps
        ys = [x[1] for x in g]
        xs = [x[2] for x in g]
        edge = min(ys) == 0 or min(xs) == 0 or max(ys) == gh - 1 or max(xs) == gw - 1
        box = [min(xs) * B * 1080 // w, min(ys) * B * 1920 // h, (max(xs) + 1) * B * 1080 // w, (max(ys) + 1) * B * 1920 // h]
        out.append({"sev": 3 if edge else 2, "t": round(t, 2), "kind": "pop-park", "box": box,
                    "msg": f"عنصر ظهر فجأة{' على طرف الكادر' if edge else ''} وضل جامد {park:.2f}s قبل ما يتحرك — لازم يكون برا الكادر كلياً أو يدخل وهو متحرك"})

    # ── blank ──
    spread = blk.reshape(n, -1, 3).std(axis=1).mean(axis=1)
    empty = spread < 2.5
    i = 0
    while i < n:
        if empty[i]:
            j = i
            while j < n and empty[j]:
                j += 1
            L = (j - i) / fps
            if L >= 0.3 and i > 0 and j < n:
                out.append({"sev": 3 if L >= 0.6 else 2, "t": round(i / fps, 2), "kind": "blank", "msg": f"كادر فاضي {L:.2f}s — لازم يضل في عنصر شغّال (الانتقال يكون حركة مستمرة مش فراغ)"})
            i = j
        else:
            i += 1
    return sorted(out, key=lambda x: x["t"])


if __name__ == "__main__":
    res = audit(sys.argv[1])
    if "--json" in sys.argv:
        open(sys.argv[sys.argv.index("--json") + 1], "w").write(json.dumps(res, ensure_ascii=False, indent=1))
    for x in res:
        print(f"{'✗' if x['sev'] >= 3 else '⚠'} @{x['t']}s [{x['kind']}]{' ' + str(x['box']) if x.get('box') else ''} {x['msg']}")
    if not res:
        print("✓ ما في ظهور مفاجئ جامد ولا كوادر فاضية")
