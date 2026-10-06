# مرجع كتابة المشاهد (API)

كل فيديو ملف `projects/<مشروع>/videos/<اسم>/main.js`:

```js
export default async (S) => ({
  background: S.colors.bg,
  post: { grain: { amount: 0.045 }, vignette: { strength: 0.35 }, bloom: { strength: 0.4 } },
  audio: { music: { style: 'arabic', gain_db: -8 } },
  scenes: [
    { duration: 2.4, layers: [ S.text({ text: 'مرحبا', size: 160, x: S.cx, y: S.vh(45), ...S.fx.maskRise(0.2, { size: 160 }) }) ] },
    { duration: 3, transition: { type: 'whip', dur: 0.5 }, layers: [ /* ... */ ] },
  ],
});
```

## الكومب (comp)
| المفتاح | الوصف |
|---|---|
| `scenes[]` | `{ duration, layers[], transition?, camera?, background? }` |
| `layers[]` | طبقات فوق كل المشاهد (بزمن مطلق)؛ `underlay[]` تحت، `overlay[]` فوق |
| `background` | لون أو `{ layers: [...] }` |
| `camera` | `{ x, y, zoom, rotation, z, perspective }` (كلها قابلة للتحريك) |
| `post` | `bloom{strength,threshold,radius}` `halation{strength}` `chromatic` `vignette{strength,softness}` `grain{amount,size}` `grade{exposure,contrast,saturation,temperature,tint,lift,gamma,gain}` `lut{src,mix}` `dither` |
| `motionBlur` | `false` أو `{ samples: 8, shutter: 180, threshold: 6 }` |
| `audio` | `{ music, voice[], sfx[], auto, duck: {amount_db}, master: {lufs, ceiling_db} }` |
| `duration` | اختياري (بينحسب من المشاهد) |

## القيم المتحركة (أي خاصية)
```js
5                                            // ثابت
{ at: 0.4, from: 0, to: 100, spring: 'heavy' }   // حركة وحدة بـ spring
{ at: 0.4, from: 0, to: 100, dur: 0.6, ease: 'glide' }
{ kf: [[0, 0, 'smooth'], [1, 100, 'snap'], [2, 40]] }   // keyframes (الـ ease للمقطع اللي بعد المفتاح)
{ spring: 'default', from: 0, to: [[0, 100], [0.8, 40], [1.5, 70]] }   // track: هدف بيتغير
{ base: 100, wiggle: { freq: 0.5, amp: 20, seed: 3 } }   // اهتزاز عضوي
(t) => Math.sin(t) * 50                     // دالة (ما بتتصدّر للأفتر)
```
- **springs:** `snappy` `default` `heavy` `playful` `gentle` `rubber` `stiff` أو `{ stiffness, damping, mass, velocity }`
- **eases:** `linear` `hold` `quad/cubic/quart/quint/expo/circ/sine{In,Out,InOut}` `backIn` `backOut` `smooth` `snap` `glide` `anticipate` `whip` أو `[x1,y1,x2,y2]`
- الألوان بتتحرك بفضاء OKLab (تدرجات نضيفة بدون رمادي بالنص).

## خصائص مشتركة لكل طبقة
`x y` · `scale` (رقم أو `[sx,sy]`) · `rotation` (درجات) · `skewX skewY` · `opacity` · `origin [ox,oy]` (نقطة الارتكاز) ·
`z` (عمق 2.5D: موجب = أبعد) · `blur` · `glow { color, radius, strength }` · `shadow { color, blur, x, y }` ·
`blend` (`screen` `multiply` `overlay` `add` `soft-light`…) · `mask` (طبقة/طبقات شكل بتقص) · `maskInvert` ·
`matte { layer, invert }` · `in` `out` (ظهور/اختفاء) · `shift` (إزاحة زمن للمجموعة) · `sfx` (صوت يدوي/`false`) · `name`

## أنواع الطبقات
| النوع | الخصائص |
|---|---|
| `S.rect` | `w h radius fill stroke strokeWidth trim [s,e] trimOffset dash` |
| `S.ellipse` / `S.circle` | `w h` / `r` + نفس التعبئة |
| `S.polygon` | `sides r inner (نجمة) angle` |
| `S.line` | `points [[x,y]...] closed stroke strokeWidth trim` |
| `S.path` | `d` (مسار SVG، ممكن يتحرك) |
| `S.text` | انظر تحت |
| `S.image` | `src w h fit (cover/contain) focus [fx,fy] zoom radius` |
| `S.icon` | `icon: 'lucide:rocket'` (`tabler:` `phosphor:` `phosphor-fill:` `iconoir:` `remix:` `brand:`) `size color strokeWidth trim` |
| `S.svg` / `S.logo` | `src size recolor{} reveal { mode: draw/pop/rise/fade/assemble, at, each, dur, spring, order: area/x/doc/random }` |
| `S.particles` | `count rate start life[a,b] emitter{x,y,w,h | r} angle[a,b] speed[a,b] gravity[gx,gy] drag size[a,b] sizeEnd color[] shape(circle/square/confetti/spark/line) spin turbulence{amp,freq} particleBlend loop seed` |
| `S.three` | `w h build: (THREE, {W,H}) => ({ scene, camera, update(t) })` |
| `S.lottie` | `src w h at speed loop` |
| `S.video` | `src w h at rate trimIn loop fit radius` |
| `S.group` | `children[]` + `isolate` |
| `S.custom` | `draw(ctx, t, env)` |
| `fill` | لون، أو `{ linear: [[x0,y0],[x1,y1]], stops: [[0,c],[1,c]] }` أو `{ radial: { c:[x,y], r } , stops }` |

## النص `S.text({...})`
| الخاصية | الوصف |
|---|---|
| `text` | النص (أو `{expr: t => ...}`) — `\n` لسطر جديد |
| `role` | `display` / `body` / `accent` / `latin` (من الهوية) أو `family` + `weight` |
| `size lineHeight align maxWidth` | `align: center/start/end` (start = يمين بالعربي) لمحاذاة الأسطر |
| `anchor` `vAnchor` | وين `x/y` بالنسبة للنص: `anchor: 'start'` = حافة بداية القراءة (يمين بالعربي) على x · `vAnchor: top/bottom` |
| `weight` | قابل للتحريك مع الخطوط المتغيرة (Noto Kufi، Readex، Alexandria، Handjet، Rubik…) |
| `axes` | محاور متغيرة إضافية `{ wdth: ... }` |
| `fill` | لون أو تدرج `{ angle: 90, stops: [[0,c],[1,c]] }` |
| `stroke strokeWidth` | حدود |
| `kashida` | `[{ word: 0, amount: {at:..., from:0, to:200, spring:'heavy'} }]` تمدد كشيدة حقيقي |
| `reveal` | `{ by: char/word/line/glyph/all, at, from: {opacity,x,y,scale,scaleX,scaleY,rotation,blur,skewX,draw}, spring | dur+ease, stagger: {each, from: start/end/center/edges, ease, jitter}, mask: true, pivot: 'center', order: 'random', times: [] }` |
| `exit` | نفس الشي مع `to` |
| `loop` | `{ by, freq, phase, amp: { y: -8, scale: 0.02 } }` |
| `draw: true` | الحروف بتنرسم حدودها ثم تتعبى (مع `from: {draw: 0}`) |
| `words` | تنسيق كلمة: `{ 2: { color: '#ff0' } }` (اللون ممكن يتحرك) |
| `marks` | `[{ word: 1 أو [1,3], type: highlight/underline/circle/strike/box, color, at, dur, spring }]` |

**وصفات جاهزة `S.fx`:** `maskRise rise blurIn pop slam drop cascade type draw stretch flip assemble` · خروج: `exitUp exitBlur exitMask exitCollapse` · مستمر: `wave breathe` · دمج: `S.fx.combine(a, b)`.
كلها `(at, { size, by, each, spring, stagger })`.

## صندوق النص (كبسولة/عنوان)
`box: { fill, stroke, strokeWidth, radius, pad: [x, y], shadow, glow, reveal: { at, dur|spring, from: 'start'|'end'|'center' } }`
حجمه من النص تلقائياً، وبيختفي مع خروج النص. (أسلوب الجزيرة: كبسولة حمرا ونص أبيض.)

## خرائط
```js
const map = S.map({
  base: 'terrain' | 'satellite' | 'bluemarble' | 'vector' | 'none',
  style: { land, high, water, deep, exaggeration, shade, saturation, brightness, contrast, tint },   // terrain = تضاريس مرسومة
  camera: S.fly([{ t: 0, center: [lon, lat], zoom: 4 }, { t: 3, center: [...], zoom: 7, ease: 'smooth', mode?: 'linear' }]),
  borders: { color, opacity, width },
  countries: [{ id: 'YEM' | 'اليمن' | 'Yemen', fill, stroke, strokeWidth, glow: { blur }, hatch: { color, spacing }, wipe: anim, wipeFrom, opacity, trim }],
  regions: [{ country: 'EGY', id: 'القاهرة', ...نفس الخصائص }],
  routes: [{ points: [[lon, lat], ...] | from/to, smooth, curve, color, width, dash: [a, b], dashSpeed, glow, trim: anim }],
  markers: [{ at: [lon, lat], type: 'pulse'|'dot', color, size, appear }],
  clouds: { opacity: anim, scale, layers },
});
S.text({ text: 'قناة السويس', ...S.at(map, [32.5, 29.9], [0, -60]), box: {...} })   // نص لاصق على مكان
S.icon({ icon: 'lucide:ship', ...S.along(map, route, { kf: [[2, 0], [6, 1]] }) })    // عنصر ماشي على مسار
S.mapPhoto(map, [31.26, 30.05], { src: 'assets/x.jpg', number: 1, label: 'باب الفتوح', at: 2 })
const yem = await S.place('اليمن'); yem.center; yem.fit()   // مركز/زوم يغطي البلد
```
الطيران بين مكانين بيبعد لفوق وبيقرّب (متل Google Earth)، وكل حركة كاميرا إلها whoosh تلقائي.

## أدوات المراجع
- `S.sticker({ src: 'assets/player.png', w, outlineWidth, outlineColor })`: صورة مقصوصة بإطار أبيض وظل (اقصها بـ `node studio.mjs cutout in.jpg out.png`).
- `S.donut({ value: anim 0..1, r, width, color, track })` · `S.bars({ values: [...], h, barWidth, gap, color, at })`.
- `spray: { angle, start, amount, grain }` على أي شكل: ملمس رذاذ متل Bauhaus/riso.
- post: `lens` (عدسة منحنية 0.05–0.2) · `crt` (زوايا شاشة قديمة) · `scanlines` (0.03–0.08).

## الانتقالات `transition: { type, dur, ease, ... }`
`cut fade dip{color} flash{color} push{dir,blur} whip{dir} slide{dir} zoom{amount} wipe{dir,soft} iris{at,ring} shape{at,from,radius} blinds{count,dir} split{axis} glitch spin{angle}`
+ **125 انتقال GLSL:** `gl:crosswarp` `gl:cube` `gl:Dreamy` `gl:directionalwarp` `gl:ripple` `gl:swap` `gl:doorway` `gl:CrossZoom` `gl:GlitchMemories` `gl:InvertedPageCurl` … (`params: {...}`)
`dir`: `right` (الافتراضي: المشهد الجاي بيدخل من اليسار متل تقليب صفحات عربي) `left` `up` `down`.

## السياق `S`
- أبعاد: `S.W S.H S.cx S.cy S.vw(n) S.vh(n) S.vmin(n) S.px(n)` (قيمة مصممة على عرض 1080) · `S.safe {top,bottom,left,right,w,h,cx,cy}` · `S.pick({ '9:16': a, '16:9': b, default: c })` · `S.vertical`
- هوية: `S.colors.* S.color(k) S.font(role) S.weight(role) S.spring(role) S.asset(path) S.brand`
- إيقاع: `S.bpm S.beat(n) S.bar(n) S.snap(t)` · `await S.music('assets/song.beats.json')` (بعد `studio.mjs beats song.mp3`)
- `S.cursor(t0)` للتسلسل · `S.stagger(i, n, opts)` · `S.wiggle(t,…)` · `S.rng(seed)` · `S.ease.*` · `S.springPresets`
- `S.counter({ from, to, at, dur, digits: 'ar'|'en', decimals, prefix, suffix })` → `S.text({ ...S.counter({...}), size: 200 })`
- `await S.captions('assets/vo/x.words.json', { style: 'karaoke'|'pop'|'line', y, size, offset, active, box })`
- `S.shapes.*` (rectPath، smoothPath، handCirclePath…)

## الصوت `audio`
```js
audio: {
  music: { style: 'tech'|'cinematic'|'lofi'|'arabic'|'minimal'|'ambient', bpm, key: 'A', scale: 'hijaz', gain_db: -8, seed }
       | { src: 'assets/song.mp3', gain_db: -8, start: 12.5, fade_out: 1.5 },
  voice: [{ src: 'assets/vo/intro.wav', at: 0.4 }],
  sfx: [{ kind: 'impact', at: 3.2, gain_db: -4, params: { weight: 1.2 } }, { src: 'assets/sfx/x.wav', at: 5 }],
  auto: true,   // مؤثرات تلقائية من الحركة
}
```
المؤثرات: `whoosh swish riser impact hit pop click tick glitch sparkle swell marker scribble boom chime shutter drop count typing`
`align: 'peak'` = قمة الصوت بتقع على `at` بالضبط (للـ whoosh) · `'end'` = الصوت بيخلص عند `at` (للـ riser).
على طبقة: `sfx: false` (اسكتها) أو `sfx: { kind, at, ... }`.

## الأوامر
```bash
node studio.mjs render <main.js> [--aspect 9:16|1:1|4:5|16:9] [--quality draft|final] [--still 1.5] [--from 2 --to 5]
node studio.mjs preview <main.js>        # معاينة حية
node studio.mjs critique <main.js>       # نقد + contact sheet
node studio.mjs export-ae <main.js>      # After Effects
node studio.mjs new <اسم> [--logo logo.png]
node studio.mjs ref <video.mp4> projects/x/refs
node studio.mjs say "نص" out.wav --voice سوري-رجل
node studio.mjs align rec.wav "السكربت"
node studio.mjs beats song.mp3
```
