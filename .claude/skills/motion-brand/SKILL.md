---
name: motion-brand
description: ينشئ مشروع موشن جديد بهوية خاصة (ألوان، خطوط، شخصية حركة، صوت) من لوغو أو من وصف. استعمله لما المستخدم بدو مشروع/براند جديد، أو يعطي لوغو، أو يقول "هوية"، "ألوان المشروع"، "خطوط المشروع". Create a new branded motion project.
---

# مشروع جديد بهوية

1. مع لوغو: `node studio.mjs new <اسم> --logo path/logo.png`
   - بيطلع `assets/logo.svg` (متجه نظيف، كل جزء مسار → `S.logo({ reveal: { mode: 'draw' } })`)، و`logo-clean.png`، و`brand.json` بألوان مستخرجة.
   - افتح `logo-clean.png` وراجع الألوان المقترحة بعينك: الـ primary لازم يكون لون الهوية الأقوى، والخلفية لازم تخدم التباين.
2. بدون لوغو: `node studio.mjs new <اسم>` وعدّل `brand.json`.
3. **اختار الخطوط** من `assets/fonts/index.json` (40 عائلة عربية) حسب شخصية البراند — شوف أزواج الخطوط بـ `docs/craft/principles.md` §٥.
4. **شخصية الحركة** `motion.springs`: براند رسمي/فاخر → `enter: 'heavy'`، تقني → `default`/`snappy`، مرح → `playful`.
5. **الصوت** `audio.music.style`: `tech` `minimal` `cinematic` `lofi` `arabic` `ambient`، ومع `bpm` إذا بدك إيقاع ثابت.
6. اعمل فيديو اختبار قصير (3 ثواني: لوغو + عنوان) وراجعه مع المستخدم قبل الشغل الكبير.

حقول `brand.json`: `colors{bg,surface,text,muted,primary,accent,...}` `fonts{display,body,accent,latin:{family,weight}}` `logo{svg,png}` `motion{energy,springs{enter,hero,ui,fun,bg}}` `audio{bpm,music{style,gain_db}}`.
