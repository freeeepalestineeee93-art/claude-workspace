---
name: motion-export-ae
description: يصدّر فيديو من استوديو الموشن لمشروع After Effects بطبقات حقيقية قابلة للتعديل (نصوص، أشكال، keyframes، precomp لكل مشهد). استعمله لما المستخدم يقول "أفتر إفكت"، "AE"، "بدي عدّل يدوي"، "طبقات". Export to After Effects.
---

# تصدير لـ After Effects

```bash
node studio.mjs render projects/<p>/videos/<v>/main.js        # (اختياري) ليصير في Guide
node studio.mjs export-ae projects/<p>/videos/<v>/main.js
node tools/ae-mock.mjs projects/<p>/videos/<v>/export-ae/build.jsx   # فحص السكربت بمحاكي قبل التسليم
```
الناتج `export-ae/`: `build.jsx` + `fonts/` + `assets/` + `README.md` (تعليمات للمستخدم بالعربي).

## شو بيطلع وشو لأ
- ✅ كل مشهد precomp، أشكال = shape layers بمسارات حقيقية، نص بالكلمة/السطر = text layers قابلة للتعديل (RTL)، نص بالحرف = أشكال حروف (للحفاظ على الوصل)، كل الحركة keyframes (springs والكاميرا محسوبين)، blur، trim paths، صور، صوت، Guide.
- ≈ الانتقالات (تقريب)، المعالجة النهائية (adjustment layer تقريبي).
- ❌ جزيئات، 3D، Lottie، فيديو، custom: موجودين بالـ Guide فقط.

## إذا Higgsfield bridge متصل (AE مفتوح على جهاز المستخدم)
`get_host_status` → إذا `aeft: true` منقدر نبني مباشرة بأدوات `ae_*` بدل السكربت (حمّل `ae_get_skill('ae-clean-rig')` أولاً)، ومنفحص بـ `ae_export_frame`.
