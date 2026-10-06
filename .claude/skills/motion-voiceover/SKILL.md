---
name: motion-voiceover
description: تعليق صوتي عربي (32 صوت بلهجات مختلفة مجاناً، أو ElevenLabs/Gemini بمفتاح) أو تسجيل المستخدم، مع توقيت كل كلمة، وكابشن متزامن (karaoke/pop/line)، وتحريك النص على الكلام. استعمله لما الفيديو فيه كلام، تعليق صوتي، voiceover، كابشن، ترجمة على الشاشة. Arabic voiceover + synced captions.
---

# تعليق صوتي وكابشن

## صوت مولّد
```bash
node studio.mjs say "النص كامل" projects/<p>/assets/vo/intro.wav --voice سوري-رجل
```
أصوات: `سعودي/مصري/سوري/لبناني/أردني/إماراتي-رجل|امرأة`، `عراقي-رجل`، `مغربي-رجل`، أو أي `ar-XX-NameNeural`. `--rate +8%` للسرعة.
مزوّدين بمفتاح (`.env`): `--provider elevenlabs --voice <voice_id>` · `--provider gemini`.
الناتج: `intro.wav` + `intro.words.json` (توقيت كل كلمة).

## تسجيل المستخدم
```bash
node studio.mjs align projects/<p>/assets/vo/rec.wav "السكربت الصحيح كامل"
```
مع السكربت التوقيت بينطبق على كلماتك الصح (Whisper لحاله بيغلط باللهجات).

## بالمشهد
```js
const caps = await S.captions('assets/vo/intro.words.json', { style: 'karaoke', y: S.vh(74), size: S.px(78), offset: 0.4 });
return { audio: { voice: [{ src: 'assets/vo/intro.wav', at: 0.4 }], music: { style: 'lofi', gain_db: -8 } }, scenes: [{ duration: ..., layers: [..., ...caps] }] };
```
- `offset` = وقت بداية الصوت بالفيديو. الموسيقى بتوطى تحت الكلام تلقائياً.
- لتحريك عنوان على كلمة معينة: `const w = (await (await fetch(S.asset('assets/vo/intro.words.json'))).json())` واستعمل `w[i].start` كـ `at`.
- قاعدة: الكابشن بالمنطقة الآمنة السفلية (فوق 20% الأخيرة)، 4–6 كلمات بالسطر.
