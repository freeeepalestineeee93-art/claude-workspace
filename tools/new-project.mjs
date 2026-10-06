#!/usr/bin/env node
// مشروع جديد بهوية: node tools/new-project.mjs <name> [--logo path/logo.png]
import { mkdir, writeFile, copyFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { parseArgs } from '../engine/render.js';

const a = parseArgs(process.argv.slice(2));
const name = a._[0];
if (!name) { console.log('node tools/new-project.mjs <name> [--logo logo.png]'); process.exit(1); }
const dir = path.join('projects', name);
for (const d of ['assets', 'refs', 'videos']) await mkdir(path.join(dir, d), { recursive: true });
const exists = await access(path.join(dir, 'brand.json')).then(() => true, () => false);
if (a.logo) {
  const r = spawnSync('.venv/bin/python', ['tools/brand-from-logo.py', a.logo, dir], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
} else if (!exists) {
  await writeFile(path.join(dir, 'brand.json'), JSON.stringify({
    name,
    colors: { bg: '#0c0d10', surface: '#16181d', text: '#f3efe6', muted: '#8b8f98', primary: '#ff6a3d', accent: '#ffd166' },
    fonts: { display: { family: 'Noto Kufi Arabic', weight: 800 }, body: { family: 'IBM Plex Sans Arabic', weight: 500 }, accent: { family: 'Aref Ruqaa', weight: 700 }, latin: { family: 'Inter', weight: 700 } },
    motion: { energy: 'confident', springs: { enter: 'default', hero: 'heavy', ui: 'snappy' } },
    audio: { music: { style: 'tech', gain_db: -8 } },
    post: { grain: { amount: 0.045 }, vignette: { strength: 0.35 }, bloom: { strength: 0.4 } },
  }, null, 2));
}
await writeFile(path.join(dir, 'README.md'), `# ${name}\n\n- \`brand.json\`: الهوية (ألوان، خطوط، شخصية الحركة، الصوت)\n- \`assets/\`: لوغو، صور، أصوات\n- \`refs/\`: مراجع بصرية (فريمات/فيديوهات) + تحليلاتها\n- \`videos/<اسم>/main.js\`: كل فيديو\n`);
console.log(`✓ ${dir}`);
