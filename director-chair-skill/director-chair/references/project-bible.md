# Project bible (هوية المشروع)

The bible is one file the user adds to the Claude Project's knowledge, next to the permanent reference images (character sheets, locations). Every conversation in the project reads it, so nothing is explained twice.

## Creating it
Ask these in ONE message, as a short numbered list the user can answer in one line each (offer the default in brackets):
1. اسم المشروع ونوعه: سينمائي واقعي / كرتون 2D / 3D بيكسار / أنمي / وثائقي / إعلان / فيديو كليب / ريلز
2. الستايل: وصفك (ولو طويل)، أو «اقترح» (وقتها أعطِ ٣ اتجاهات وخلّيه يختار)
3. الأبعاد [16:9]
4. الحوار: فويس أوفر خارجي / ليب سينك عربي / ليب سينك إنجليزي / بدون كلام [فويس أوفر]
5. الموسيقى: ممنوعة / مسموحة [ممنوعة] · المؤثرات الصوتية: نعم / لا [نعم]
6. المخرج: مبدع يقترح / ملتزم بالسكربت [مبدع]
7. الجمهور وأي قواعد دائمة (اختياري)

If a script was analysed in the conversation, pre-fill characters and style options from it.

Then output the file below inside ONE code block (markdown), and tell the user:
«انسخه واحفظه كملف `هوية المشروع.md` بمعرفة المشروع (Project knowledge)، وارفع جنبه صور الكاركتر شيت والأماكن، وسمّي كل صورة باسم واضح (مثلاً: سليم - كاركتر شيت).»
(If a file-creation tool is available, create the file for download instead.)

## Template

```markdown
# هوية المشروع: [الاسم]

- النوع: [..]
- الأبعاد: [..]
- الحوار: [فويس أوفر خارجي | ليب سينك عربي | ليب سينك إنجليزي | بدون كلام]
- الموسيقى: [ممنوعة | مسموحة]
- المؤثرات الصوتية: [نعم | لا]
- المخرج: [مبدع يقترح | ملتزم بالسكربت]
- الجمهور: [..]

## STYLE (locked)
[Full English style paragraph]

## الشخصيات
- [Name] ([phonetic]): [English visual identity: age, face, hair, build, costume, colors] | Voice: [signature, lip-sync only] | Reference image: [file name]

## الأماكن
- [Place]: [English visual description] | Reference image: [file name]

## قواعد دائمة
- [..]

## أفكار معتمدة للفيلم
- [..]
```
