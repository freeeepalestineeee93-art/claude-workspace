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

## ✅ المكتبات الخاصة (انبنت)

| المكتبة | شو بتعمل |
|---|---|
| `lib/anim.js` | 7 springs بمعادلة مغلقة + track بأهداف متعددة + 25 منحنى + ألوان OKLab + stagger عضوي + wiggle |
| `lib/type.js` | HarfBuzz + bidi: تحريك عربي بالحرف/الكلمة/السطر بدون كسر الوصل، كشيدة مستمرة، أوزان متغيرة متحركة، أرقام ولاتيني صحيحين جوّا العربي |
| `lib/text-fx.js` | maskRise · rise · blurIn · pop · slam · drop · cascade · type · draw · stretch · flip · assemble · خروج ×4 · wave · breathe |
| `engine/runtime` | طبقات: أشكال، نص، صور، أيقونات، SVG/لوغو، جزيئات، 3D، Lottie، فيديو · masks · mattes · glow · blur · عمق 2.5D · كاميرا · علامات المصمم (تظليل، خط يدوي، دائرة) |
| الانتقالات | 13 Canvas (whip، push، iris، zoom، glitch…) + 125 GLSL |
| `post.js` | motion blur حقيقي (adaptive) · bloom · halation · chromatic · grade · LUT · grain · dither |
| `lib/audio` | 19 مؤثر مصنّع · 6 أساليب موسيقى (عربي: حجاز + دربكة) · مؤثرات تلقائية من الحركة · ducking · −14 LUFS · 32 صوت عربي · Whisper + محاذاة للسكربت · تحليل BPM/beats/drops |
| `lib/captions.js` | كابشن karaoke/pop/line متزامن |
| `tools/critique.mjs` | contact sheet + منطقة آمنة + تباين + تراكب + جمود + hook + علامات AI |
| `lib/export-ae.js` | After Effects: precomps، shape/text layers، keyframes مضغوطة من الحركة الفعلية |
| `tools/analyze-ref.py` | تحليل مراجع: لقطات، إيقاع، ألوان، BPM، القطع على الإيقاع |
| `tools/brand-from-logo.py` | ألوان + SVG نظيف من اللوغو |
| `engine/preview.js` | معاينة حية بتايملاين وتحديث تلقائي |
| `.claude/skills/` | motion · motion-brand · motion-reference · motion-critique · motion-voiceover · motion-export-ae |
