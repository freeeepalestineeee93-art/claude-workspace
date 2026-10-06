#!/usr/bin/env node
// الناقد: contact sheet + فحوصات تلقائية + قائمة "علامات AI" → تقرير بالعربي.
// node tools/critique.mjs projects/x/videos/y/main.js [--aspect 9:16] [--frames 12]
// الناتج: <video>/renders/critique/{sheet.png, report.md, report.json}
// بعدها Claude بيفتح sheet.png وبيقيّم بعينه، وبيصلّح أسوأ 3 مشاكل، وبيعيد.

import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { serve } from '../engine/server.js';
import { launch } from '../engine/browser.js';
import { openPlayer, parseArgs, projectFps } from '../engine/render.js';

const a = parseArgs(process.argv.slice(2));
const comp = a._[0];
if (!comp) { console.log('node tools/critique.mjs <main.js> [--aspect 9:16] [--frames 12]'); process.exit(1); }
const aspect = a.aspect ?? '9:16';
const outDir = path.join(path.dirname(comp), 'renders', 'critique');
await mkdir(outDir, { recursive: true });

const run = (cmd, args) => new Promise((res, rej) => { const p = spawn(cmd, args, { stdio: 'inherit' }); p.on('close', (c) => (c ? rej(new Error(`${cmd} ${c}`)) : res())); });

const waiting = new Map();
const server = await serve(0, (app) => app.post('/__frame/:key', express.raw({ type: () => true, limit: '200mb' }), (req, res) => { waiting.get(req.params.key)?.(req.body); res.end('ok'); }));
const base = `http://localhost:${server.address().port}`;
const browser = await launch();
const issues = [];
const warn = (sev, area, msg, t, detail) => issues.push({ sev, area, msg, t: t != null ? +t.toFixed(2) : null, detail });

try {
  const { page, info } = await openPlayer(browser, base, comp, { aspect, fps: projectFps(comp), scale: 1, quality: 'final' });
  const { W, H, duration } = info;
  const style = await page.evaluate(() => studio.styleReport());

  // ── 1. contact sheet: لقطات موزّعة + لحظة بعد كل بداية مشهد ──
  const N = +(a.frames ?? 12);
  const times = new Set();
  for (let i = 0; i < N; i++) times.add(+((duration * (i + 0.5)) / N).toFixed(2));
  style.scenes.forEach((s) => times.add(+Math.min(duration - 0.05, s.start + Math.min(0.9, s.duration * 0.4)).toFixed(2)));
  times.add(0.25);
  const ts = [...times].sort((x, y) => x - y);
  const tmp = path.join(outDir, '.frames');
  await mkdir(tmp, { recursive: true });
  for (const [i, t] of ts.entries()) {
    const got = new Promise((r) => waiting.set(`c${i}`, r));
    await page.evaluate(([tt, u]) => studio.push(tt, u), [t, `/__frame/c${i}`]);
    const buf = await got;
    const f = path.join(tmp, `${String(i).padStart(2, '0')}.png`);
    const p = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', '-', '-vf', `vflip,scale=${W > H ? 480 : 270}:-1`, '-frames:v', '1', f]);
    p.stdin.end(buf);
    await new Promise((r) => p.on('close', r));
    await run('convert', [f, '-gravity', 'south', '-background', '#111', '-fill', '#ddd', '-pointsize', '16', '-splice', '0x24', '-annotate', '+0+3', `${t.toFixed(2)}s`, f]);
  }
  const cols = W > H ? 4 : 6;
  // 24 لقطة بكل صفحة: sheet.png، sheet-2.png، …
  const pages = Math.ceil(ts.length / 24);
  for (let pg = 0; pg < pages; pg++) {
    const files = ts.slice(pg * 24, pg * 24 + 24).map((_, j) => path.join(tmp, `${String(pg * 24 + j).padStart(2, '0')}.png`));
    await run('montage', [...files, '-tile', `${cols}x`, '-geometry', '+4+4', '-background', '#0a0a0a', path.join(outDir, pg ? `sheet-${pg + 1}.png` : 'sheet.png')]);
  }
  await rm(tmp, { recursive: true, force: true });

  // ── 2. فحص النصوص كل نص ثانية ──
  const textStats = { minSize: Infinity, minContrast: Infinity };
  for (let t = 0.1; t < duration; t += 0.5) {
    const texts = await page.evaluate((tt) => studio.audit(tt), t);
    // أثناء الانتقال الخلفية خليط من مشهدين، فالتباين المقاس مضلّل
    const inTransition = style.scenes.some((s) => s.overlap && t >= s.start && t < s.start + s.overlap);
    const onScreen = texts.filter((x) => x.box.x + x.box.w > 4 && x.box.x < W - 4 && x.box.y + x.box.h > 4 && x.box.y < H - 4);
    texts.length = 0; texts.push(...onScreen);
    for (const x of texts) {
      const b = x.box, s = style.safe;
      if (b.x < s.left - 2 || b.x + b.w > s.right + 2 || b.y < s.top - 2 || b.y + b.h > s.bottom + 2)
        warn(2, 'المنطقة الآمنة', `"${x.text.slice(0, 30)}" طالع برا المنطقة الآمنة (رح تغطيه واجهة التطبيق)`, t, `x ${Math.round(b.x)}→${Math.round(b.x + b.w)} · y ${Math.round(b.y)}→${Math.round(b.y + b.h)}`);
      if (x.size < W * 0.035) warn(1, 'الحجم', `"${x.text.slice(0, 30)}" صغير (${x.size.toFixed(0)}px) — صعب ينقرا على الموبايل`, t);
      if (inTransition) { /* skip contrast */ } else if (x.contrast < 3) warn(3, 'التباين', `"${x.text.slice(0, 30)}" تباينه ${x.contrast} (أقل من 3 = صعب القراءة)`, t);
      else if (x.contrast < 4.5 && x.size < W * 0.06) warn(1, 'التباين', `"${x.text.slice(0, 30)}" تباينه ${x.contrast} لنص صغير`, t);
      textStats.minSize = Math.min(textStats.minSize, x.size);
      textStats.minContrast = Math.min(textStats.minContrast, x.contrast);
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      if (texts[i].scene !== texts[j].scene) continue; // مشهدين بانتقال: طبيعي يتراكبوا
      const A = texts[i].box, B = texts[j].box;
      const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x)), iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
      if (ix * iy > 0.08 * Math.min(A.w * A.h, B.w * B.h)) warn(3, 'تراكب', `"${texts[i].text.slice(0, 20)}" فوق "${texts[j].text.slice(0, 20)}"`, t);
    }
  }

  // ── 3. الحركة: جمود، زحمة، hook ──
  const motion = await page.evaluate(() => studio.motion(0.1));
  let still = 0;
  motion.forEach((m, i) => {
    if (m < 0.15) still++; else { if (still >= 14) warn(2, 'إيقاع', `جمود ${(still / 10).toFixed(1)} ثانية بدون حركة ملحوظة`, (i - still) / 10); still = 0; }
  });
  if (still >= 14 && (motion.length - still) / 10 < duration - 0.6) warn(2, 'إيقاع', `جمود ${(still / 10).toFixed(1)} ثانية بالآخر`, (motion.length - still) / 10);
  const first = motion.slice(0, 5).reduce((x, y) => x + y, 0);
  if (first < 1) warn(3, 'Hook', 'أول نص ثانية شبه ساكن — المشاهد بيقلب قبل ما يصير شي');
  const perSec = [];
  for (let s = 0; s < Math.ceil(duration); s++) perSec.push(+(motion.slice(s * 10, s * 10 + 10).reduce((x, y) => x + y, 0) / 10).toFixed(2));

  // ── 4. علامات AI (أسلوبية) ──
  const T = style.texts;
  const centered = T.filter((x) => x.x != null && Math.abs(x.x - W / 2) < W * 0.02).length;
  if (T.length >= 3 && centered / T.length > 0.85) warn(2, 'علامة AI', `كل النصوص تقريباً بالنص (${centered}/${T.length}) — جرّب تكوين غير متماثل: محاذاة يمين، أحجام متباينة، نص على حافة`);
  const fadeOnly = T.filter((x) => x.reveal && x.reveal.from.length === 1 && x.reveal.from[0] === 'opacity' && !x.reveal.times);
  if (fadeOnly.length >= 2) warn(2, 'علامة AI', `${fadeOnly.length} نصوص دخولها fade بس — أضف حركة (mask rise، scale، blur)`);
  const sigs = T.filter((x) => x.reveal).map((x) => `${x.reveal.by}|${x.reveal.from.sort().join(',')}|${x.reveal.spring ?? x.reveal.ease}`);
  const uniq = new Set(sigs);
  if (sigs.length >= 4 && uniq.size <= 1) warn(2, 'علامة AI', 'كل النصوص بنفس وصفة الدخول بالضبط — نوّع حسب أهمية كل نص');
  if (T.filter((x) => x.reveal && x.reveal.jitter === 0).length >= 2) warn(1, 'علامة AI', 'stagger منتظم 100% (jitter: 0) — الحركة بتبين آلية');
  if (T.length && !T.some((x) => x.exit) && style.scenes.length > 1 && style.scenes.slice(1).every((s) => !s.transition || s.transition === 'cut'))
    warn(1, 'انتقالات', 'ما في خروج للنصوص ولا انتقالات بين المشاهد — القطع بيبين مفاجئ');
  const trs = style.scenes.slice(1).map((s) => s.transition).filter(Boolean);
  if (trs.length >= 3 && new Set(trs).size === 1) warn(1, 'انتقالات', `نفس الانتقال (${trs[0]}) بين كل المشاهد`);
  const durs = style.scenes.map((s) => s.duration);
  if (durs.length >= 3 && Math.max(...durs) - Math.min(...durs) < 0.3) warn(1, 'إيقاع', 'كل المشاهد بنفس الطول — نوّع الإيقاع (قصير-قصير-طويل)');
  if (!style.post.includes('grain')) warn(1, 'ملمس', 'ما في grain — الصورة رقمية ونظيفة زيادة (علامة AI)');
  if (!style.motionBlur) warn(1, 'حركة', 'motion blur مطفي');
  if (!style.audio) warn(1, 'صوت', 'ما في موسيقى (المؤثرات التلقائية لحالها ممكن ما تكفي)');

  // ── تقييم ──
  const sevName = ['', 'ملاحظة', 'متوسط', 'مهم'];
  const dedup = [];
  const seen = new Set();
  // نفس المشكلة بأكتر من لحظة = مشكلة وحدة (مع أول وقت وعدد المرات)
  for (const x of issues.sort((p, q) => q.sev - p.sev || (p.t ?? 0) - (q.t ?? 0))) {
    const k = x.area + (x.msg.match(/"[^"]*"/)?.[0] ?? x.msg); // نفس النص = نفس المشكلة حتى لو اختلف الرقم
    if (!seen.has(k)) { seen.add(k); dedup.push({ ...x, count: 1 }); } else dedup.find((d) => d.area + (d.msg.match(/"[^"]*"/)?.[0] ?? d.msg) === k).count++;
  }
  const pen = dedup.reduce((s, x) => s + [0, 0.25, 0.6, 1.2][x.sev], 0);
  const score = Math.max(0, Math.min(10, 10 - pen)).toFixed(1);
  const md = [
    `# تقرير النقد — ${path.dirname(comp)}`,
    '',
    `**التقييم التلقائي: ${score}/10** · ${duration.toFixed(1)}s · ${W}×${H} · ${style.scenes.length} مشاهد`,
    '',
    `> التقييم التلقائي بيلقط المشاكل التقنية والأسلوبية بس. الحكم الفني الكامل لازم يصير بالعين على sheet.png.`,
    '',
    '## المشاكل (الأهم أولاً)',
    ...(dedup.length ? dedup.slice(0, 30).map((x) => `- **[${sevName[x.sev]}] ${x.area}**${x.t != null ? ` @${x.t}s` : ''}${x.count > 1 ? ` (×${x.count})` : ''}: ${x.msg}${x.detail ? ` — ${x.detail}` : ''}`) : ['- ما في مشاكل تلقائية 👌']),
    '',
    '## الإيقاع (طاقة الحركة بكل ثانية)',
    '`' + perSec.map((e) => '▁▂▃▄▅▆▇█'[Math.min(7, Math.floor(e / 1.2))]).join('') + '`',
    '',
    `أصغر نص: ${isFinite(textStats.minSize) ? textStats.minSize.toFixed(0) + 'px' : '—'} · أقل تباين: ${isFinite(textStats.minContrast) ? textStats.minContrast : '—'}`,
    '',
    '## قائمة النقد بالعين (Claude بيعبّيها بعد ما يشوف sheet.png)',
    '- التكوين: هل في نقطة تركيز واضحة بكل فريم؟',
    '- التايبوغرافي: أحجام متباينة؟ وزن مناسب؟ تشكيل عربي سليم؟',
    '- الإيقاع: في لحظات هدوء قبل الذروات؟',
    '- الهوية: الألوان والخطوط ملتزمة بالبراند؟',
    '- أول ثانيتين: في سبب يخلّي المشاهد يكمل؟',
    '- النهاية: في لحظة ختام واضحة (لوغو/دعوة)؟',
  ].join('\n');
  await writeFile(path.join(outDir, 'report.md'), md);
  await writeFile(path.join(outDir, 'report.json'), JSON.stringify({ score: +score, issues: dedup, perSecond: perSec, style }, null, 1));
  console.log(md.split('\n').slice(0, 14).join('\n'));
  console.log(`\n✓ ${path.join(outDir, 'sheet.png')}\n✓ ${path.join(outDir, 'report.md')}`);
} finally {
  await browser.close();
  server.close();
}
