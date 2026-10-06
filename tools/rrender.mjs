#!/usr/bin/env node
// رندر فيديو Remotion عبر خط إنتاجنا الكامل:
//   bundle → رندر (المتصفح المحلي) → بناء الصوت (lib/audio/build.py) → دمج → فحص علو الصوت → فحص بصري (videoaudit) → contact sheet.
// node tools/rrender.mjs projects/<مشروع>/rvideos/<اسم> [--still 3.5] [--from 2 --to 6] [--draft] [--concurrency 4]
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { serve, ROOT } from '../engine/server.js';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const dir = argv.find((a) => !a.startsWith('--') && !/^\d/.test(a));
if (!dir) { console.log('node tools/rrender.mjs projects/<مشروع>/rvideos/<اسم> [--still t] [--from a --to b] [--draft]'); process.exit(1); }
const abs = path.resolve(dir);
const m = abs.match(/projects\/([^/]+)\/rvideos\/([^/]+)/);
if (!m) throw new Error('المسار لازم يكون projects/<مشروع>/rvideos/<اسم>');
const id = `${m[1]}-${m[2]}`.replace(/[^a-zA-Z0-9-]/g, '-');
const outDir = path.join(abs, 'renders');
await mkdir(outDir, { recursive: true });

// المتصفح: headless shell المحلي (ممنوع تنزيل متصفحات)
const SHELL = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', process.env.CHROME_PATH].find((p) => p && existsSync(p));
const chromiumOptions = { gl: 'swangle', ignoreCertificateErrors: true };
const run = (cmd, args, o = {}) => new Promise((res, rej) => { const p = spawn(cmd, args, { cwd: ROOT, ...o }); let out = ''; p.stdout?.on('data', (d) => (out += d)); p.stderr?.on('data', (d) => (o.quiet ? null : process.stderr.write(d))); p.on('close', (c) => (c ? rej(new Error(`${cmd} ${c}`)) : res(out))); });

const t0 = Date.now();
const server = await serve(0);
const base = `http://localhost:${server.address().port}`;
try {
  process.stdout.write('  📦 bundle… ');
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'remotion/src/index.js'), onProgress: () => {} });
  console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s`);
  const inputProps = { base };
  const composition = await selectComposition({ serveUrl, id, inputProps, browserExecutable: SHELL, chromiumOptions, logLevel: 'error' });
  const { fps, durationInFrames: N, width: W, height: H } = composition;

  if (opt('still')) {
    const ts = String(opt('still')).split(',').map(Number);
    for (const t of ts) {
      const output = path.join(outDir, `still-${t}.png`);
      await renderStill({ composition, serveUrl, output, frame: Math.min(N - 1, Math.round(t * fps)), inputProps, browserExecutable: SHELL, chromiumOptions, logLevel: 'error' });
      console.log(`✓ ${path.relative(ROOT, output)}`);
    }
    process.exit(0);
  }

  const from = Math.round(+(opt('from', 0)) * fps), to = Math.min(N - 1, Math.round(+(opt('to', N / fps)) * fps) - 1);
  const draft = !!opt('draft');
  const silent = path.join(outDir, '.video.mp4');
  let last = 0;
  await renderMedia({
    composition, serveUrl, codec: 'h264', outputLocation: silent, inputProps, browserExecutable: SHELL, chromiumOptions, logLevel: 'error',
    frameRange: [from, to], concurrency: +opt('concurrency', 4), crf: draft ? 26 : 16, imageFormat: 'jpeg', jpegQuality: draft ? 80 : 95, muted: true,
    scale: draft ? 0.5 : 1,
    onProgress: ({ renderedFrames }) => { if (renderedFrames !== last && (renderedFrames - last >= 15 || renderedFrames === to - from + 1)) { last = renderedFrames; process.stdout.write(`\r  🎞️  ${renderedFrames}/${to - from + 1} (${((Date.now() - t0) / 1000).toFixed(0)}s)   `); } },
  });
  process.stdout.write('\n');

  // ── الصوت: نفس خطة محركنا (موسيقى + مؤثرات + تعليق) وبنفس الماستر والفحص ──
  const out = path.join(outDir, `${m[2]}${draft ? '-draft' : ''}.mp4`);
  const plan = composition.props.audio;
  let audio = null;
  if (plan && (plan.music || plan.sfx?.length || plan.voice?.length)) {
    const full = { duration: (to - from + 1) / fps, voice: [], sfx: [], ...plan };
    if (from) { // رندر جزئي: نزيح كل الأحداث
      const s = from / fps;
      full.sfx = (full.sfx || []).map((e) => ({ ...e, at: e.at - s })).filter((e) => e.at > -2);
      full.voice = (full.voice || []).map((e) => ({ ...e, at: (e.at ?? 0) - s }));
      if (full.music) full.music = { ...full.music, start: (full.music.start ?? 0) + s };
    }
    const pf = path.join(outDir, 'audio-plan.json');
    await writeFile(pf, JSON.stringify(full, null, 1));
    const wav = path.join(outDir, '.audio.wav');
    const res = JSON.parse((await run(path.join(ROOT, '.venv/bin/python'), ['-m', 'lib.audio.build', pf, wav], { quiet: true })).trim().split('\n').pop());
    console.log(`  🔊 صوت: ${res.sfx} مؤثر · ${res.lufs} LUFS`);
    for (const x of res.audit ?? []) console.warn(`  ${x.sev >= 3 ? '✗' : '⚠'} صوت${x.t != null ? ` @${x.t}s` : ''}: ${x.msg}`);
    audio = wav;
  }
  await run('ffmpeg', ['-v', 'error', '-y', '-i', silent, ...(audio ? ['-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-shortest'] : []), '-c:v', 'copy', '-movflags', '+faststart', out]);
  await rm(silent, { force: true }); if (audio) await rm(audio, { force: true });
  const s = await stat(out);
  console.log(`✓ ${path.relative(ROOT, out)}  ${W * (draft ? 0.5 : 1)}x${H * (draft ? 0.5 : 1)} ${fps}fps ${((to - from + 1) / fps).toFixed(1)}s  ${(s.size / 1e6).toFixed(1)}MB  بـ ${((Date.now() - t0) / 1000).toFixed(0)}s`);

  // ── الفحوصات (نفس قواعد VISION.md) ──
  const sheet = path.join(outDir, 'sheet.png');
  await run('ffmpeg', ['-v', 'error', '-y', '-i', out, '-vf', `fps=${Math.max(1, Math.round(10 / Math.max(1, (to - from + 1) / fps / 4)) / 10)},scale=180:-1,tile=8x5`, '-frames:v', '1', sheet]).catch(() => {});
  const audit = await run(path.join(ROOT, '.venv/bin/python'), ['tools/videoaudit.py', out, '--json', path.join(outDir, 'video-audit.json')], { quiet: true }).catch((e) => `⚠ videoaudit: ${e.message}`);
  console.log(audit.trim().split('\n').map((l) => '  ' + l).join('\n'));
  if (existsSync(path.join(ROOT, 'library/camera/library.json'))) {
    const cam = await run(path.join(ROOT, '.venv/bin/python'), ['tools/camlang.py', 'audit', out, '--json', path.join(outDir, 'camera-audit.json')], { quiet: true }).catch((e) => `⚠ camlang: ${e.message}`);
    console.log(cam.trim().split('\n').map((l) => '  ' + l).join('\n'));
  }
  console.log(`  🖼️  ${path.relative(ROOT, sheet)}`);
} finally {
  server.close();
}
process.exit(0);
