# صندوق عدّة استوديو الموشن

كل شي متثبّت بالاستوديو، مقسّم حسب الاستعمال. التثبيت تلقائي عبر `scripts/setup.sh`، وبيشتغل لحاله ببداية كل جلسة.

> **✅ متثبّت وشغال** · **🔨 لازم نبنيه نحنا** (مكتباتنا الخاصة، هي اللي بتعطي الجودة)

---

## 1. المحرك والرندر ✅

| الأداة | الدور |
|---|---|
| Playwright + Chromium | تصوير الفريمات فريم فريم، WebGL 2 بدون GPU (SwiftShader) |
| ffmpeg 6.1 | ترميز MP4/ProRes/WebM، فلاتر، دمج الصوت |
| @napi-rs/canvas, skia-canvas | رسم Canvas بسرعة جوّا Node بدون متصفح |
| sharp, ImageMagick | معالجة صور سريعة |
| Remotion (+ transitions, shapes, paths, noise, motion-blur, three, lottie, captions, rive, gif, layout-utils) | المسار البديل بـ React، ومفيد للتايم لاين لاحقاً |
| HyperFrames | المسار البديل بـ HTML |
| express, vite, chokidar | سيرفر المعاينة الحية وإعادة التحميل |
| zod | التحقق من صيغة المشاهد (Scene Graph) |

## 2. التحريك ✅

| الأداة | الدور |
|---|---|
| **GSAP 3.15 مع كل الإضافات** (صارت مجانية) | SplitText، MorphSVG، DrawSVG، MotionPath، CustomEase/Wiggle/Bounce، ScrambleText، Physics2D، Flip، Inertia |
| Motion, Popmotion | springs فيزيائية |
| anime.js v4 | تحريك خفيف وstagger متقدم |
| Theatre.js (core + studio) | **محرر keyframes وتايم لاين بصري جاهز**، أساس للواجهة لاحقاً |
| lottie-web, dotLottie, lottie-api | تشغيل والتحكم بأنيميشن Lottie |
| Rive | أنيميشن تفاعلي وشخصيات مع state machines |
| flubber | morph بين أي شكلين |
| matter-js, cannon-es, Rapier | فيزياء 2D و3D (سقوط، تصادم، ارتداد) |

## 3. الرسم 2D والأشكال ✅

| الأداة | الدور |
|---|---|
| PixiJS 8 + pixi-filters | رسم WebGL سريع + فلاتر: bloom، glow، RGB split، shockwave، godray، CRT، motion blur، glitch |
| @pixi/particle-emitter | أنظمة جزيئات |
| Paper.js, Two.js, Konva, Fabric, SVG.js | رسم متجهات وتعديل مسارات |
| D3 | منحنيات، interpolation، رسوم بيانية متحركة |
| Rough.js | ستايل مرسوم باليد |
| perfect-freehand | خطوط فرشاة طبيعية |
| simplex-noise | حركة عضوية وعشوائية مضبوطة |
| bezier-js | حسابات المنحنيات |
| culori, chroma-js | تدرجات ألوان صحيحة إدراكياً (OKLCH) |

## 4. 3D والـ Shaders ✅

| الأداة | الدور |
|---|---|
| Three.js + three-stdlib | مشاهد 3D، كاميرات، مواد |
| postprocessing | bloom، depth of field، chromatic aberration، film grain، vignette، SSAO |
| troika-three-text | **نص عربي حقيقي داخل الـ 3D** مع وصل الحروف |
| three-nebula | جزيئات 3D |
| OGL, regl, twgl | WebGL خفيف لـ shaders مخصصة |
| **gl-transitions (125 انتقال)** | مكتبة انتقالات GLSL جاهزة |
| LYGIA | مكتبة shaders: noise، SDF، إضاءة، ألوان، blur |
| **Blender 5.0 (bpy)** بدون واجهة | رندر 3D ثقيل، مجسمات، فيزياء، إضاءة سينمائية |

## 5. العربي والخطوط ✅

| الأداة | الدور |
|---|---|
| **HarfBuzz** (harfbuzzjs + uharfbuzz) | تشكيل النص العربي ومعرفة مكان كل حرف بالضبط، **لتحريك الحرف العربي نفسه بدون ما ينكسر الوصل** |
| opentype.js, fontkit, fonttools | قراءة الخطوط وتحويل الحروف لمسارات (لرسم الحرف وmorph بين الحروف) |
| bidi-js, python-bidi, arabic-reshaper | اتجاه النص المختلط عربي/إنجليزي |
| **53 عائلة خط (95 ملف)، كلها OFL للاستخدام التجاري** | عربي: IBM Plex Arabic، Cairo، Tajawal، Almarai، Noto Kufi/Naskh/Sans Arabic، Amiri، Readex Pro، Rubik، Alexandria، Lalezar، Reem Kufi (+Fun +Ink الملوّن)، Aref Ruqaa (+Ink)، Marhey، Vibes، Blaka (+Hollow +Ink)، Kufam، Changa، El Messiri، Lemonada، Harmattan، Mada، Markazi، Zain، Handjet، Playpen Arabic، Katibeh، Mirza، Rakkas، Jomhuria، Baloo Bhaijaan، Gulzar، Qahiri… · لاتيني: Inter، Space Grotesk، Montserrat، Bebas Neue، Manrope، Sora، Unbounded، Syne، DM Sans، Playfair، Instrument Serif، Archivo، JetBrains Mono |

الخطوط المتغيرة (variable) متل Noto Kufi وReadex وAlexandria وHandjet بتسمح **بتحريك سماكة الخط نفسها**.

## 6. الصوت ✅

| الأداة | الدور |
|---|---|
| Tone.js | تصنيع موسيقى وأصوات بالكود (synths، drums، تأثيرات) |
| librosa, essentia.js, Meyda, web-audio-beat-detector | تحليل الموسيقى: BPM، الـ beats، الطاقة، الطبقات |
| **pedalboard** (Spotify) | تأثيرات استوديو: reverb، compressor، EQ، delay، distortion |
| pyloudnorm | ضبط الصوت على −14 LUFS (معيار إنستغرام ويوتيوب) |
| noisereduce, pydub, soundfile, wavefile, music-metadata | تنظيف وقص ومعالجة |
| **faster-whisper** | تفريغ الكلام العربي بتوقيت كل كلمة (للكابشن المتزامن) |
| edge-tts | تعليق صوتي عربي مجاني (أصوات عدة لهجات) |
| **473 مؤثر صوتي CC0** (Kenney) | واجهات، كليكات، impacts، digital، sci-fi |

## 7. الصورة ✅

| الأداة | الدور |
|---|---|
| **rembg** (u2net + isnet) | إزالة خلفية الصور محلياً |
| **vtracer, potrace, @neplex/vectorizer** | تحويل صورة لمتجهات SVG، **فتصير أي صورة أو لوغو قابلة للتحريك** |
| OpenCV, scikit-image, Pillow | تحليل ومعالجة متقدمة |
| colorthief | استخراج ألوان الهوية من صورة أو لوغو |
| cairosvg, svgo | تحويل وتنظيف SVG |

## 8. الفيديو ✅

| الأداة | الدور |
|---|---|
| PySceneDetect | تقطيع فيديو المرجع للقطات ومعرفة الإيقاع |
| moviepy, imageio | تركيب ومعالجة فيديو بـ Python |
| OpenCV | optical flow، تتبّع حركة، تحليل فريمات |

## 9. الأيقونات ✅

Lucide · Phosphor · Tabler · Iconoir · Remix Icon · Simple Icons (لوغوهات البراندات): **آلاف الأيقونات SVG** قابلة للرسم والتحريك بـ DrawSVG.

## 10. خدمات AI متصلة (MCP) ✅

| الخدمة | الدور |
|---|---|
| **Higgsfield** | توليد صور وفيديو وصوت وموسيقى وأصوات، upscale، إزالة خلفية، 3D، reframe |
| **After Effects / Premiere / Blender bridge** | بناء المشاهد كطبقات حقيقية جوّا البرامج (لما تكون مفتوحة على جهازك) |
| vidIQ | ترندات، عناوين، تحليل أداء |

---

## 🔨 المكتبات الخاصة (المرحلة الجاية)

هون الفرق الحقيقي. هاي الأشياء ما بتنباع جاهزة، ولازم نبنيها:

| المكتبة | شو بتعمل |
|---|---|
| `lib/scene` | صيغة Scene Graph موحّدة: نفس المشهد بيطلع MP4 أو معاينة أو After Effects |
| `lib/motion` | closed-form springs بـ 4 شخصيات + `track()` + overlap + secondary motion |
| `lib/arabic-type` | تحريك عربي على مستوى الحرف والكلمة والسطر: كشيدة متحركة، رسم الحرف، morph، تحريك سماكة الخط |
| `lib/transitions` | مكتبة انتقالات سينمائية (gl-transitions + انتقالاتنا) |
| `lib/camera` | كاميرا 2.5D: parallax، dolly، shake، focus |
| `lib/fx` | motion blur حقيقي (sub-frame)، grain، halation، light leaks، LUTs |
| `lib/layout` | تكوين نسبي، فنفس المشهد بيطلع 9:16 و1:1 و16:9 |
| `lib/audio` | beat grid، تصنيع whoosh/riser/impact، SFX تلقائي على الحركة، mastering |
| `lib/brand` | نظام الهويات: ألوان، خطوط، شخصية حركة، صوت |
| `lib/critique` | contact sheets + قائمة "علامات AI" + تقييم تلقائي |
| `lib/export-ae` | تصدير المشهد لـ After Effects كطبقات |
| `skills/` | `/براند-جديد` · `/موشن` · `/مرجع` · `/نقد` · `/صوت` · `/تصدير` |
