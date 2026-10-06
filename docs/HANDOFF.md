# وين وقفنا (للجلسة الجاية)

## الحالة
- **كيت "رياضة" (مرجع r07)**: أول فيديو جاهز `projects/sport/videos/offside/main.js` (قصة التسلّل، ~58 ثانية، 18 لقطة).
  - دليل الأسلوب: `projects/references/refs/r07/style_guide.md`
  - الهوية: `projects/sport/brand.json` (خط الجزيرة 900/300، أخضر عشب، ليموني، زيتي، كريمي)
  - الصور مولّدة بـ Higgsfield (`projects/sport/assets/offside/`)، وأرشيف Kling `archive.mp4`.
  - التعليق الحالي **مؤقت** (edge Hamed). كل توقيتات اللقطات مشتقة من كلمات التعليق، فتبديل الصوت بيظبط كل شي.
- فيديو القهوة (`projects/showcase/videos/coffee`) **مرفوض** من المستخدم: تجربة أنماط كتيرة بفيديو واحد = مستوى ضعيف. الدرس: كيت لكل مرجع، مطابق بالقياس.

## الخطوة الجاية: صوت Gemini
المفتاح `GEMINI_API_KEY` انضاف لمتغيرات البيئة (بيشتغل بجلسة جديدة).
```bash
.venv/bin/python -m lib.audio.tts script projects/sport/videos/offside/vo/script.json projects/sport/videos/offside/vo \
  --provider gemini --voice Charon --style "اقرأ بالعربية الفصحى بصوت راوٍ وثائقي رياضي واثق وحيوي، بإيقاع متوسط ووقفات قصيرة عند النقاط"
node studio.mjs critique projects/sport/videos/offside/main.js --frames 30   # تأكد إن ما في تراكب/خروج من المنطقة الآمنة
node studio.mjs render projects/sport/videos/offside/main.js --quality final  # ~35 دقيقة، شغّلها بالخلفية بـ timeout ساعتين
```
- جرّب كذا صوت قبل (Charon، Orus، Algenib، Fenrir) بمقطع v1 وخلّي المستخدم يختار.
- الموديل بينختار تلقائياً (أحدث TTS متاح، pro أول). للتثبيت: `GEMINI_TTS_MODEL=...`.

## بعدها
1. نقد المستخدم على فيديو التسلّل ← تعديل الكيت.
2. كيتات المراجع التانية، **كل نمط بفيديو لحاله** (r03 شارح الجزيرة، r15/r16 خرائط، r11 Bauhaus، r09/r10 flat...).
3. ذكّر المستخدم يختار طريقة الشغل (جوّا Claude ولا تطبيق على جهازه) قبل بناء واجهة الاستوديو (فيها رفع خطوط مع الهوية).
4. After Effects: الربط شغال (`ae_*`)؛ ae_batch و ae_reorder_layers فيهم أعطال، اشتغل خطوة خطوة.

## Higgsfield
الصرف لحد هلأ: قهوة 13.5 + تسلّل 10.5 (12 صورة = 3، Kling 5 ثواني = 7.5). Kling 3.0 pro 1080 بس، بدون Seedance، بدون موسيقى/صوت.
