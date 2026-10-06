#!/usr/bin/env node
// تصدير مشهد لـ After Effects:
//   node tools/export-ae.mjs projects/x/videos/y/main.js [--aspect 9:16] [--guide renders/y.mp4] [--audio renders/.../audio.wav]
// الناتج: <video>/export-ae/ فيه build.jsx + الصور + الخطوط + الرندر كمرجع + README
// بالأفتر: File › Scripts › Run Script File › build.jsx

import { mkdir, writeFile, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { serve, ROOT } from '../engine/server.js';
import { launch } from '../engine/browser.js';
import { openPlayer, parseArgs } from '../engine/render.js';
import { buildJSX, fontFiles } from '../lib/export-ae.js';

const a = parseArgs(process.argv.slice(2));
const comp = a._[0];
if (!comp) { console.log('node tools/export-ae.mjs <main.js> [--aspect 9:16] [--guide video.mp4] [--audio audio.wav]'); process.exit(1); }
const vdir = path.dirname(comp);
const out = a.out ?? path.join(vdir, 'export-ae');
await mkdir(path.join(out, 'assets'), { recursive: true });

const server = await serve(0);
const browser = await launch();
let bake;
try {
  const { page } = await openPlayer(browser, `http://localhost:${server.address().port}`, comp, { aspect: a.aspect ?? '9:16', fps: +(a.fps ?? 30), scale: 1, quality: 'draft' });
  const t0 = Date.now();
  bake = await page.evaluate(() => studio.bake());
  console.log(`  تسجيل ${bake.elements.length} عنصر × ${Math.round(bake.duration * bake.fps)} فريم بـ ${((Date.now() - t0) / 1000).toFixed(0)}s`);
} finally {
  await browser.close();
  server.close();
}

// الصور
const images = {};
for (const el of bake.elements) {
  if (el.type !== 'image') continue;
  const g = Object.values(el.frames).find((f) => f.geo)?.geo;
  if (!g?.src || images[g.src]) continue;
  const srcFile = path.join(ROOT, g.src.replace(/^\//, ''));
  const name = `assets/${path.basename(srcFile)}`;
  await copyFile(srcFile, path.join(out, name));
  images[g.src] = name;
}
// المرجع والصوت
let guide = null, audio = null;
const renders = path.join(vdir, 'renders');
const guideSrc = a.guide ?? (existsSync(renders) ? (await readdir(renders)).filter((f) => f.endsWith('.mp4') && !f.includes('draft')).map((f) => path.join(renders, f))[0] : null);
if (guideSrc && existsSync(guideSrc)) { guide = 'assets/guide.mp4'; await copyFile(guideSrc, path.join(out, guide)); }
if (a.audio && existsSync(a.audio)) { audio = 'assets/audio.wav'; await copyFile(a.audio, path.join(out, audio)); }

const name = path.basename(vdir);
const { jsx, fonts } = buildJSX(bake, { name, guide, audio, images });
await writeFile(path.join(out, 'build.jsx'), jsx);
// الخطوط (لازم تتثبت عالجهاز قبل تشغيل السكربت)
await mkdir(path.join(out, 'fonts'), { recursive: true });
for (const f of fontFiles(fonts)) await copyFile(path.join(ROOT, f), path.join(out, 'fonts', path.basename(f)));

const kinds = bake.elements.reduce((m, e) => ((m[e.kind === 'layer' ? e.type : e.kind] = (m[e.kind === 'layer' ? e.type : e.kind] ?? 0) + 1), m), {});
const readme = `# تصدير After Effects — ${name}

## الخطوات
1. ثبّت الخطوط من مجلد \`fonts/\` (دبل كليك ← Install).
2. بالأفتر: **Preferences › Type › Text Engine Options › Middle Eastern and South Asian** وأعد تشغيل البرنامج (ضروري للعربي).
3. **File › Scripts › Run Script File…** واختار \`build.jsx\`.

## شو بيطلع
- كومب رئيسي "${name}" + precomp لكل مشهد (${bake.scenes.length}) بمجلد لحالهم.
- العناصر: ${Object.entries(kinds).map(([k, n]) => `${k}: ${n}`).join(' · ')}
- النص اللي بيتحرك بالكلمة/السطر = طبقات نص قابلة للتعديل. النص اللي بيتحرك حرف حرف = أشكال (shape) للحروف، لأن تقطيع العربي لطبقات حروف بيكسر الوصل.
- الحركة = keyframes خطية مضغوطة من الحركة الحقيقية (springs والكاميرا والعمق محسوبين).
- طبقة "Guide" = الرندر الأصلي كمرجع (مطفية) لتقارن.

## تقريبات
- الانتقالات بين المشاهد بتتحول لأقرب مكافئ بالأفتر (opacity/position/scale/mask).
- المعالجة النهائية (grain/glow/vignette) طبقة adjustment تقريبية.
${bake.unsupported.length ? `- طبقات ما بتتصدّر كطبقات أفتر: ${bake.unsupported.join('، ')} — موجودة بالـ Guide، أو رندرها لحالها كـ plate.` : ''}
`;
await writeFile(path.join(out, 'README.md'), readme);
console.log(`✓ ${out}/build.jsx (${(jsx.length / 1024).toFixed(0)}KB) · ${bake.elements.length} طبقة · خطوط: ${fonts.join('، ')}`);
