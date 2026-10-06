# استوديو الموشن العربي

أداة لصناعة موشن غرافيك عربي بمستوى سينيور، مبنية على الكود بالكامل: كل فريم معادلة، وكل حرف عربي وحدة حية، والصوت بينصنع على مقاس الحركة.

```bash
bash scripts/setup.sh                                   # مرة وحدة (وبيشتغل تلقائياً بجلسات Claude السحابية)
node studio.mjs new my-brand --logo logo.png            # مشروع بهوية
node studio.mjs preview projects/showcase/videos/reel/main.js   # معاينة حية
node studio.mjs critique projects/showcase/videos/reel/main.js  # نقد
node studio.mjs render projects/showcase/videos/reel/main.js    # فيديو نهائي مع صوت
node studio.mjs export-ae projects/showcase/videos/reel/main.js # After Effects
```

## مع Claude
اطلب الفيديو بالكلام، وClaude بيستعمل الـ skills بـ `.claude/skills/`:
`motion` (صناعة فيديو) · `motion-brand` (هوية) · `motion-reference` (من مرجع لأسلوب) · `motion-critique` (حلقة النقد) · `motion-voiceover` (صوت + كابشن) · `motion-export-ae`.

## البنية
| المسار | شو فيه |
|---|---|
| `lib/anim.js` | springs بمعادلة مغلقة، keyframes، ease، ألوان OKLab، stagger عضوي، ضجيج |
| `lib/type.js` | محرك الخط: HarfBuzz + bidi، حروف مستقلة بمساراتها، كشيدة مستمرة، أوزان متغيرة |
| `lib/text-fx.js` | 17 وصفة تحريك نص |
| `lib/studio.js` | سياق التأليف `S` (مقاسات، هوية، إيقاع، عدّاد، كابشن) |
| `lib/captions.js` | كابشن متزامن karaoke/pop/line |
| `lib/audio/` | مولّد مؤثرات (19)، مولّد موسيقى (6 أساليب منها عربي)، ميكس وماستر، TTS عربي، تحليل موسيقى |
| `lib/export-ae.js` | تصدير لـ After Effects |
| `engine/runtime/` | المركّب، الانتقالات (13 + 125 GLSL)، المعالجة النهائية، جزيئات/3D/Lottie/فيديو، المؤثرات التلقائية، واجهة المعاينة |
| `engine/render.js` | رندر متوازي (بكسلات خام → ffmpeg) + بناء الصوت |
| `tools/` | النقد، تحليل المراجع، هوية من لوغو، تصدير AE + محاكي، قياس الأداء |
| `docs/` | `api.md` المرجع الكامل · `craft/principles.md` الذوق · `craft/ai-tells.md` قائمة الفحص |
| `projects/` | المشاريع (كل مشروع: `brand.json`، `assets/`، `refs/`، `videos/`) |
| `assets/` | 53 عائلة خط (40 عربية، OFL) · 473 مؤثر صوتي CC0 |

تفاصيل الأدوات المثبتة: `TOOLKIT.md` · ملخص الليلة الأولى: `SUMMARY.md`.
