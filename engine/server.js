// سيرفر ملفات ثابت لجذر الاستوديو (للرندر والمعاينة)
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const run = promisify(execFile);
const extracting = new Map();

// استخراج فريمات فيديو مرة وحدة (كاش) لتشغيله كطبقة حتمية
async function videoInfo(src, fps) {
  const file = path.join(ROOT, src.replace(/^\//, ''));
  const id = createHash('md5').update(file + fps).digest('hex').slice(0, 12);
  const dir = path.join(ROOT, '.cache', 'video', id);
  if (!extracting.has(id)) {
    extracting.set(id, (async () => {
      if (!existsSync(path.join(dir, 'done'))) {
        await mkdir(dir, { recursive: true });
        await run('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `fps=${fps}`, '-q:v', '2', path.join(dir, '%06d.jpg')], { maxBuffer: 1e8 });
        await run('touch', [path.join(dir, 'done')]);
      }
      const frames = (await readdir(dir)).filter((f) => f.endsWith('.jpg')).length;
      return { dir: `/.cache/video/${id}`, fps: +fps, frames, duration: frames / fps };
    })());
  }
  return extracting.get(id);
}

export function serve(port = 0, extra) {
  const app = express();
  app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/__video/info', async (req, res) => {
    try { res.json(await videoInfo(req.query.src, req.query.fps || 30)); } catch (e) { res.status(500).send(String(e.message)); }
  });
  if (extra) extra(app);
  app.use(express.static(ROOT, { fallthrough: true, dotfiles: 'allow' }));
  return new Promise((res) => { const s = app.listen(port, () => res(s)); });
}
