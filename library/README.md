# مكتبة Creative DNA

- `refs/<id>/global.json` — قراءة Gemini للفيديو كامل (فيديو+صوت+زمن). **ملاحظة:** توقيتاته أحياناً غلط (طلع 108s و131s بفيديو 101s) ووصفه للحركة ممكن يناقض القياس → كل ادعاء لازم يتحقق.
- `refs/<id>/measurements.json` — فحص فرضيات Gemini بالقياس (MEASURED / UNCERTAIN).
- `techniques/*.md` — بطاقات تقنيات: شو، كيف (أرقام)، ليش، إحساس، متى، دليل. **هي اللي بتنستعمل بالإنتاج** (مطبّقة بـ `projects/sport/kit.js`).
- مستوى الدليل: MEASURED (قياس) > OBSERVED (بيبيّن بالعين) > INFERRED (تفسير) > UNCERTAIN.
- تفضيلات المستخدم الصريحة وزنها أعلى من أي استنتاج.

أداة: `python tools/dna.py global <video>` ثم `python tools/dna.py measure <id>`.
