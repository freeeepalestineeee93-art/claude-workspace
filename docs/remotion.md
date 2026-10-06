# الأساس الجديد: Remotion + أدواتنا

فيديو جديد = `projects/<مشروع>/rvideos/<اسم>/index.jsx` (بيتسجّل تلقائياً كـ Composition باسم `<مشروع>-<اسم>`).

```jsx
export const meta = { duration: 8, fps: 30, width: 1080, height: 1920,
  audio: { music: { src: 'projects/x/assets/music.wav' }, sfx: [{ kind: 'whoosh', at: 2, gain_db: -24 }], master: { lufs: -16 } } };
export default function Video() { … }
```

## الأوامر
- `node studio.mjs rrender projects/x/rvideos/y` — رندر كامل: صوت (lib/audio/build.py) + فحص علو الصوت + `videoaudit` (ظهور جامد/كادر فاضي) + `camlang audit` (نتعات الكاميرا) + `sheet.png`.
- `--still 1.5,3,6` صور سريعة · `--draft` نص الدقة · `--from 2 --to 5` جزء بس.
- مثال كامل: `projects/lab/rvideos/demo`.

## الـ kit (`remotion/kit/`)
| الملف | شو بيعمل |
|---|---|
| `base.js` | `asset(path)` (من جذر الريبو عبر سيرفر الاستوديو)، `out/inOut/clamp/lerp/hash` |
| `camera.jsx` | `useCamera({ keys, handheld, track })` + `<World>` + `<Layer z>` + `<At x y>` — عمق حقيقي (parallax)، مسار متصل السرعة (Hermite)، `hold:true` للوقفة، `profile:'push-pan'` لمنحنى متعلّم من المراجع، `track` للحاق عنصر |
| `depth.jsx` | `<DepthImage dir … depth feather>` صورة مسطحة → طبقات عمق (من `tools/depth_layers.py`) |
| `arabic.jsx` | `<ArabicText>` حرف/كلمة/سطر عبر HarfBuzz تبعنا: reveal/exit/mask/draw/لون كلمة، `anchor: center/start/end/right/left` |
| Remotion نفسه | `@remotion/motion-blur` (CameraMotionBlur)، `transitions`، `lottie`، `three`، `noise`، `paths`، `shapes` |

## الكاميرا — قواعد
- `cam.z` سالب = الكاميرا أقرب (dolly in). `perspective` ≈ 1300–1600.
- المفاتيح الوسطانية بتمر بدون وقفة (السرعة متصلة)؛ الوقفة بس بـ `hold:true` أو أول/آخر مفتاح.
- مكتبة اللغة: `library/camera/library.json` (من `tools/camlang.py learn <ref>` ثم `build`). الجزيرة = دفع/سحب مع انزياح خفيف وسرعة شبه ثابتة، مش ease-in-out.
- **ممنوع blur على طبقة كاملة** (`Layer blur`/`dof`): بيبطّئ الرندر ×25. الـ blur على عناصر صغيرة قريبة بس.

## الصور بعمق
`python tools/depth_layers.py in.jpg projects/x/assets/<اسم>-depth --layers 4` ← `<DepthImage dir="projects/x/assets/<اسم>-depth" w={1180} depth={700} />`.

## مشاكل انحلّت (لا ترجعها)
- كاش webpack كبر لـ 9GB وعبّى القرص لأن `new URL(\`../${p}\`, import.meta.url)` بـ `lib/type.js` خلّى webpack يسحب كل الريبو → `webpackIgnore` + الكاش مطفي بـ `rrender`.
- `fetch` من صفحة Remotion بدّه CORS → السيرفر بيبعت `Access-Control-Allow-Origin: *`.
- الهوكس بـ React لازم قبل أي `return` مبكر.
