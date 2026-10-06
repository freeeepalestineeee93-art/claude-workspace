#!/usr/bin/env node
// أمر واحد لكل الاستوديو: node studio.mjs <أمر> ...
import { spawnSync } from 'node:child_process';

const PY = '.venv/bin/python';
const cmds = {
  render: ['node', 'engine/render.js'], // <main.js> [--aspect 9:16] [--quality draft|final] [--still t]
  preview: ['node', 'engine/preview.js'], // <main.js> [--port 5173]
  critique: ['node', 'tools/critique.mjs'], // <main.js>
  'export-ae': ['node', 'tools/export-ae.mjs'], // <main.js>
  new: ['node', 'tools/new-project.mjs'], // <name> [--logo logo.png]
  ref: [PY, 'tools/analyze-ref.py'], // <video> [projects/x/refs]
  say: [PY, '-m', 'lib.audio.tts', 'say'], // "النص" out.wav [--voice سوري-رجل]
  align: [PY, '-m', 'lib.audio.tts', 'align'], // recording.wav ["السكربت"]
  beats: [PY, '-m', 'lib.audio.analyze'], // song.mp3
  profile: ['node', 'tools/profile.mjs'], // <main.js>
  fonts: [PY, 'tools/font-index.py'],
  setup: ['bash', 'scripts/setup.sh'],
};
const [cmd, ...rest] = process.argv.slice(2);
if (!cmds[cmd]) {
  console.log(`استوديو الموشن — الأوامر:
  render <main.js> [--aspect 9:16|1:1|4:5|16:9] [--quality draft|final] [--still 1.5]   رندر فيديو/صورة
  preview <main.js>          معاينة حية بالمتصفح مع تحديث تلقائي
  critique <main.js>         نقد: contact sheet + فحوصات + علامات AI
  export-ae <main.js>        تصدير لـ After Effects كطبقات
  new <اسم> [--logo logo.png]  مشروع جديد بهوية
  ref <video.mp4> [مجلد]      تحليل فيديو مرجعي
  say "نص" out.wav [--voice سوري-رجل]   تعليق صوتي + توقيت الكلمات
  align rec.wav ["السكربت"]   توقيت كلمات تسجيلك
  beats song.mp3             BPM والـ beats والـ drops
  profile <main.js>          قياس أداء الرندر
  fonts | setup`);
  process.exit(cmd ? 1 : 0);
}
const [bin, ...args] = cmds[cmd];
process.exit(spawnSync(bin, [...args, ...rest], { stdio: 'inherit' }).status ?? 1);
