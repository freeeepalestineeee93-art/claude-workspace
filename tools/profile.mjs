#!/usr/bin/env node
// قياس أداء الرندر: كم بياخد كل جزء من الفريم (للتحسين)
// node tools/profile.mjs projects/x/videos/y/main.js [--quality final] [--t 1.5]
import { serve } from '../engine/server.js';
import { launch } from '../engine/browser.js';
import { openPlayer, parseArgs } from '../engine/render.js';

const a = parseArgs(process.argv.slice(2));
const comp = a._[0] ?? 'projects/demo/videos/engine-test/main.js';
const s = await serve(0);
const b = await launch();
try {
  const { page } = await openPlayer(b, `http://localhost:${s.address().port}`, comp, { aspect: a.aspect ?? '9:16', fps: 30, scale: +(a.scale ?? 1), quality: a.quality ?? 'final' });
  const r = await page.evaluate((t) => studio.profile(t), +(a.t ?? 1.5));
  console.table(r);
} finally {
  await b.close();
  s.close();
}
