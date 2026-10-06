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

// بلاطات الخرائط: بتنزل مرة وحدة وبتنحفظ (كاش على القرص)
const TILE_SOURCES = {
  satellite: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  bluemarble: (z, x, y) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/${z}/${y}/${x}.jpeg`,
  terrain: (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
  osm: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
};
const tileJobs = new Map();
async function tile(src, z, x, y) {
  const dir = path.join(ROOT, '.cache', 'tiles', src, String(z), String(x));
  const file = path.join(dir, `${y}`);
  if (existsSync(file)) return file;
  const key = `${src}/${z}/${x}/${y}`;
  if (!tileJobs.has(key)) {
    tileJobs.set(key, (async () => {
      await mkdir(dir, { recursive: true });
      await run('curl', ['-sf', '-m', '60', '--retry', '3', '-A', 'MotionStudio/1.0 (map renderer)', '-o', file + '.part', TILE_SOURCES[src](z, x, y)]);
      await run('mv', [file + '.part', file]);
      return file;
    })().finally(() => tileJobs.delete(key)));
  }
  return tileJobs.get(key);
}

export function serve(port = 0, extra) {
  const app = express();
  app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('Access-Control-Allow-Origin', '*'); next(); }); // CORS: صفحة Remotion على origin تاني
  app.get('/__video/info', async (req, res) => {
    try { res.json(await videoInfo(req.query.src, req.query.fps || 30)); } catch (e) { res.status(500).send(String(e.message)); }
  });
  app.get('/__tile/:src/:z/:x/:y', async (req, res) => {
    const { src, z, x, y } = req.params;
    if (!TILE_SOURCES[src]) return res.status(404).send('unknown source');
    try { const f = await tile(src, +z, +x, +y); res.type(src === 'terrain' || src === 'osm' ? 'png' : 'jpg'); res.sendFile(f, { dotfiles: 'allow' }); } catch (e) { res.status(404).send(String(e.message)); }
  });
  if (extra) extra(app);
  app.use(express.static(ROOT, { fallthrough: true, dotfiles: 'allow' }));
  return new Promise((res) => { const s = app.listen(port, () => res(s)); });
}
