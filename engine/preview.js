#!/usr/bin/env node
// معاينة حية: node engine/preview.js projects/x/videos/y/main.js [--port 5173] [--aspect 9:16]
// بيفتح سيرفر، وأي حفظ لملف المشهد/الهوية/المكتبات بيحدّث الصفحة تلقائياً.
import chokidar from 'chokidar';
import path from 'node:path';
import { serve, ROOT } from './server.js';
import { parseArgs } from './render.js';

const a = parseArgs(process.argv.slice(2));
const comp = a._[0];
if (!comp) { console.log('node engine/preview.js <main.js> [--port 5173]'); process.exit(1); }
const clients = new Set();
const server = await serve(+(a.port ?? 5173), (app) => {
  app.get('/__live', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    clients.add(res);
    req.on('close', () => clients.delete(res));
  });
});
const project = comp.split('/').slice(0, 2).join('/');
chokidar.watch([path.join(ROOT, project), path.join(ROOT, 'lib'), path.join(ROOT, 'engine/runtime')], { ignored: /renders|\.cache|node_modules/, ignoreInitial: true })
  .on('all', (ev, f) => { console.log(`↻ ${path.relative(ROOT, f)}`); for (const c of clients) c.write('data: reload\n\n'); });
const q = new URLSearchParams({ comp, aspect: a.aspect ?? '9:16', quality: a.quality ?? 'draft', ui: '1' });
console.log(`▶ المعاينة: http://localhost:${server.address().port}/engine/player.html?${q}`);
