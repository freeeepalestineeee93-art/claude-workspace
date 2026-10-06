#!/usr/bin/env node
// الرندر: node engine/render.js projects/x/videos/y/main.js [خيارات]
//   --aspect 9:16|1:1|4:5|16:9   --fps 30   --quality draft|final   --scale 0.5
//   --out file.mp4   --from 0 --to 3   --workers 4   --still 1.5 (صورة واحدة)
//   --format mp4|prores|webm|gif   --crf 16   --no-audio

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import express from 'express';
import { serve, ROOT } from './server.js';
import { launch } from './browser.js';

export function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) {
      const key = k.slice(2);
      const nxt = argv[i + 1];
      if (nxt == null || nxt.startsWith('--')) a[key] = true; else { a[key] = nxt; i++; }
    } else a._.push(k);
  }
  return a;
}

function ffmpeg(args, { input } = {}) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg فشل (${c}): ${args.join(' ')}`)))));
  return { p, done };
}

export async function openPlayer(browser, base, comp, opts) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); else if (opts.verbose) console.log('[page]', m.text()); });
  const q = new URLSearchParams({ comp, aspect: opts.aspect, fps: String(opts.fps), scale: String(opts.scale), quality: opts.quality });
  await page.goto(`${base}/engine/player.html?${q}`);
  await page.waitForFunction('window.ready || window.bootError', null, { timeout: 120000 });
  const bootError = await page.evaluate('window.bootError');
  if (bootError) throw new Error(`فشل تحميل المشهد:\n${bootError}\n${errors.join('\n')}`);
  const info = await page.evaluate(() => ({ W: studio.W, H: studio.H, fps: studio.fps, duration: studio.duration, audio: studio.audio }));
  return { page, info, errors };
}

// فريمات المشروع: من brand.json ("fps": 24 لمراجع سينمائية/أرشيف 24fps) وإلا 30
export function projectFps(compPath) {
  let dir = path.dirname(path.resolve(compPath));
  for (let i = 0; i < 6; i++) {
    const f = path.join(dir, 'brand.json');
    if (fs.existsSync(f)) { try { return JSON.parse(fs.readFileSync(f, 'utf8')).fps ?? 30; } catch { return 30; } }
    dir = path.dirname(dir);
  }
  return 30;
}

export async function render(compPath, o = {}) {
  const opts = {
    aspect: '9:16', fps: projectFps(compPath), quality: 'final', scale: 1, workers: Math.max(1, Math.min(4, os.cpus().length)),
    format: 'mp4', crf: 16, ...o,
  };
  opts.fps = +opts.fps; opts.scale = +opts.scale; opts.workers = +opts.workers;
  const t0 = Date.now();
  // الفريمات الخام بتوصل بـ POST من الصفحة (أسرع بكتير من ترميز PNG بالمتصفح)
  const waiting = new Map();
  const server = await serve(0, (app) => {
    app.post('/__frame/:key', express.raw({ type: () => true, limit: '200mb' }), (req, res) => {
      waiting.get(req.params.key)?.(req.body);
      waiting.delete(req.params.key);
      res.end('ok');
    });
  });
  const grab = async (page, t, key) => {
    const got = new Promise((r) => waiting.set(key, r));
    await page.evaluate(([tt, u]) => studio.push(tt, u), [t, `/__frame/${key}`]);
    return got;
  };
  const base = `http://localhost:${server.address().port}`;
  const browser = await launch();
  try {
    const first = await openPlayer(browser, base, compPath, opts);
    const { W, H, duration, fps } = first.info;

    if (opts.still != null) {
      const out = opts.out ?? compPath.replace(/main\.js$/, '') + `renders/still-${opts.still}.png`;
      await mkdir(path.dirname(out), { recursive: true });
      const buf = await grab(first.page, +opts.still, 'still');
      const enc = ffmpeg(['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', '-', '-vf', 'vflip', '-frames:v', '1', out], { input: true });
      enc.p.stdin.end(buf);
      await enc.done;
      console.log(`✓ ${out}`);
      return { out };
    }

    const from = Math.round((+(opts.from ?? 0)) * fps);
    const to = Math.round((+(opts.to ?? duration)) * fps);
    const total = to - from;
    const nW = Math.min(opts.workers, Math.max(1, Math.floor(total / 15)));
    const pages = [first, ...(await Promise.all(Array.from({ length: nW - 1 }, () => openPlayer(browser, base, compPath, opts))))];

    const outDir = path.dirname(opts.out ?? path.join(path.dirname(compPath), 'renders', 'x'));
    const tmp = path.join(outDir, `.tmp-${process.pid}`);
    await mkdir(tmp, { recursive: true });

    // الصوت بينبنى بالتوازي مع الفريمات
    let audioJob = null;
    if (!opts['no-audio'] && !opts.audio) {
      const plan = await first.page.evaluate(() => studio.audioPlan());
      if (opts.from || opts.to) plan.duration = total / fps;
      if (plan.music || plan.voice.length || plan.sfx.length) {
        const planFile = path.join(tmp, 'audio-plan.json');
        await writeFile(planFile, JSON.stringify(plan, null, 1));
        await writeFile(path.join(outDir, 'audio-plan.json'), JSON.stringify(plan, null, 1));
        const wav = path.join(tmp, 'audio.wav');
        audioJob = new Promise((res, rej) => {
          const py = spawn(path.join(ROOT, '.venv/bin/python'), ['-m', 'lib.audio.build', planFile, wav], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
          let outTxt = '';
          py.stdout.on('data', (d) => (outTxt += d));
          py.on('close', (c) => (c === 0 ? res({ wav, info: JSON.parse(outTxt.trim().split('\n').pop()) }) : rej(new Error('فشل بناء الصوت'))));
        });
        audioJob.catch(() => {});
      }
    }
    const chunk = Math.ceil(total / nW);
    let doneFrames = 0;
    const tick = setInterval(() => process.stdout.write(`\r  فريمات: ${doneFrames}/${total}  (${((Date.now() - t0) / 1000).toFixed(0)}s)   `), 1000);

    const parts = await Promise.all(pages.map(async (slot, w) => {
      let page = slot.page;
      const a = from + w * chunk, b = Math.min(to, a + chunk);
      if (a >= b) return null;
      const file = path.join(tmp, `part-${w}.mkv`);
      // وسيط بدون فقدان (RGB) لحتى الترميز النهائي يكون مرة وحدة بس
      const enc = ffmpeg(['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-framerate', String(fps), '-i', '-', '-vf', 'vflip', '-c:v', 'libx264rgb', '-crf', '0', '-preset', 'ultrafast', file], { input: true });
      for (let f = a; f < b; f++) {
        let buf;
        for (let attempt = 0; ; attempt++) {
          try { buf = await grab(page, f / fps, `${w}-${f}-${attempt}`); break; } catch (e) {
            // تاب انهار (ذاكرة مثلاً): منفتح تاب جديد ومنكمّل من نفس الفريم
            if (attempt >= 2) throw e;
            console.warn(`\n  ⚠ العامل ${w} انهار عند فريم ${f} (${e.message.split('\n')[0]}) — عم كمّل بتاب جديد`);
            await page.close().catch(() => {});
            page = (await openPlayer(browser, base, compPath, opts)).page;
          }
        }
        if (!enc.p.stdin.write(buf)) await new Promise((r) => enc.p.stdin.once('drain', r));
        doneFrames++;
      }
      enc.p.stdin.end();
      await enc.done;
      return file;
    }));
    clearInterval(tick);
    process.stdout.write('\n');
    for (const p of pages) if (p.errors.length) console.warn('تحذيرات الصفحة:', [...new Set(p.errors)].slice(0, 5).join('\n'));

    const list = path.join(tmp, 'list.txt');
    await writeFile(list, parts.filter(Boolean).map((p) => `file '${path.resolve(p)}'`).join('\n'));
    const ext = { mp4: 'mp4', prores: 'mov', webm: 'webm', gif: 'gif' }[opts.format];
    const out = opts.out ?? path.join(path.dirname(compPath), 'renders', `${path.basename(path.dirname(compPath))}-${opts.aspect.replace(':', 'x')}${opts.quality === 'draft' ? '-draft' : ''}.${ext}`);
    await mkdir(path.dirname(out), { recursive: true });

    let audio = opts.audio && !opts['no-audio'] ? opts.audio : null;
    if (audioJob) {
      try {
        const { wav, info } = await audioJob;
        audio = wav;
        console.log(`  🔊 صوت: ${info.sfx} مؤثر${info.music?.style ? ' + موسيقى ' + info.music.style : ''} · ${info.lufs} LUFS`);
        for (const x of info.audit ?? []) console.warn(`  ${x.sev >= 3 ? '✗' : '⚠'} صوت${x.t != null ? ` @${x.t}s` : ''}: ${x.msg}`);
        await writeFile(path.join(outDir, 'audio-audit.json'), JSON.stringify(info.audit ?? [], null, 1));
      } catch (e) { console.warn('  ⚠ الصوت فشل، الفيديو رح يطلع بدون صوت:', e.message); }
    }
    const vcodec = {
      mp4: ['-c:v', 'libx264', '-preset', opts.quality === 'draft' ? 'veryfast' : 'slow', '-crf', String(opts.crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-tune', 'animation', '-movflags', '+faststart'],
      prores: ['-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le'],
      webm: ['-c:v', 'libvpx-vp9', '-crf', '24', '-b:v', '0', '-pix_fmt', 'yuv420p'],
      gif: ['-vf', `fps=${Math.min(fps, 24)},scale=${Math.min(W, 720)}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a`],
    }[opts.format];
    const args = ['-f', 'concat', '-safe', '0', '-i', list];
    if (audio && opts.format !== 'gif') args.push('-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', opts.format === 'webm' ? 'libopus' : 'aac', '-b:a', '256k', '-shortest');
    args.push(...vcodec, out);
    await ffmpeg(args).done;
    await rm(tmp, { recursive: true, force: true });
    const s = await stat(out);
    const secs = (Date.now() - t0) / 1000;
    console.log(`✓ ${out}  ${W}x${H} ${fps}fps ${(total / fps).toFixed(1)}s  ${(s.size / 1e6).toFixed(1)}MB  بـ ${secs.toFixed(0)}s (${(total / secs).toFixed(1)} فريم/ث)`);
    return { out, W, H, fps, duration: total / fps };
  } finally {
    await browser.close();
    server.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = parseArgs(process.argv.slice(2));
  if (!a._[0]) { console.log('الاستعمال: node engine/render.js <path/main.js> [--aspect 9:16] [--quality draft] ...'); process.exit(1); }
  // أكتر من مقاس بأمر واحد: --aspect 9:16,1:1,16:9
  const aspects = String(a.aspect ?? '9:16').split(',');
  (async () => { for (const asp of aspects) await render(a._[0], { ...a, aspect: asp, out: aspects.length > 1 ? undefined : a.out }); })()
    .catch((e) => { console.error('✗', e.message); process.exit(1); });
}
