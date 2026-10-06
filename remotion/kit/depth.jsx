// صورة مسطحة بعمق حقيقي جوّا عالم الكاميرا (طبقات من tools/depth_layers.py).
//   <DepthImage dir="projects/x/assets/street-depth" x={0} y={0} w={1080} z={0} depth={500} />
// كل طبقة بتنحط على z حسب عمقها (الأبعد z + depth، الأقرب z)، وحجمها بيتعوّض بالمنظور
// فلما الكاميرا بأول مكانها (cam.z = 0) الصورة بتطلع متطابقة تماماً، ولما تتحرك بيطلع parallax.
import React, { useEffect, useState } from 'react';
import { delayRender, continueRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { Layer, useWorld } from './camera.jsx';
import { asset } from './base.js';

const edgeMask = (f) => `linear-gradient(to right, transparent, #000 ${f * 100}%, #000 ${100 - f * 100}%, transparent), linear-gradient(to bottom, transparent, #000 ${f * 70}%, #000 ${100 - f * 70}%, transparent)`;

// فحص: حافة الصورة ممنوع تبين بالكادر (VISION.md). الطبقة الأبعد لازم تغطي الكادر كامل بكل فريم.
const reported = new Set();
const inside = (q, [px, py]) => { let s = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; const c = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } } return true; };

const cache = new Map();
function useManifest(dir) {
  const [m, setM] = useState(cache.get(dir) ?? null);
  const [handle] = useState(() => (cache.has(dir) ? null : delayRender(`depth ${dir}`)));
  useEffect(() => {
    if (cache.has(dir)) return;
    fetch(asset(`${dir}/manifest.json`)).then((r) => r.json()).then((j) => { cache.set(dir, j); setM(j); continueRender(handle); });
  }, [dir]);
  return m;
}

// feather: أطراف الصورة بتذوب بالعالم (0 = حواف حادة). ما بينطبق على الطبقة الأقرب حتى ما ينقص العنصر القريب.
// cover (افتراضي true): الصورة خلفية لازم تغطي الكادر؛ أي حافة ظاهرة = "✗ حافة صورة ظاهرة" بالرندر.
export function DepthImage({ dir, x = 0, y = 0, w, z = 0, depth = 400, focusAt, feather = 0, cover = true, opacity = 1, style }) {
  const m = useManifest(dir);
  const world = useWorld();
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  if (!m) return null;
  const h = (w * m.h) / m.w;
  const f = world.f;
  // نقطة المحاذاة: وين الصورة لازم تتطابق تماماً (افتراضياً مركزها)
  const [ax, ay] = focusAt ?? [x, y];
  return <>{m.layers.map((L, i) => {
    const lz = z + (1 - L.depth) * depth;
    const k = (f + lz) / (f + z); // تعويض المنظور: الطبقة الأبعد أكبر بنفس النسبة
    const cx = ax + (x - ax) * k, cy = ay + (y - ay) * k;
    const s = world.scaleAt(lz);
    // الطبقة اللي صارت قريبة كتير من الكاميرا (غطسة) بتذوب قبل ما تتبكسل
    // (بلّش الذوبان بكير: بعد ×2.2 التكبير بيصير أُسّي والعين بتشوفه نتعة — مقاس بـ camlang)
    const near = s > 2.2 ? Math.max(0, Math.min(1, (3.6 - s) / 1.4)) : 1;
    if (s <= 0 || near <= 0) return null;
    if (cover && i === 0 && opacity * near > 0.05) {
      const W2 = w * k / 2, H2 = h * k / 2;
      const q = [[cx - W2, cy - H2], [cx + W2, cy - H2], [cx + W2, cy + H2], [cx - W2, cy + H2]].map(([qx, qy]) => world.project(qx, qy, lz));
      const ok = [[0, 0], [world.W, 0], [world.W, world.H], [0, world.H]].every((p) => inside(q, p));
      const key = `${dir}@${Math.floor(frame / fps * 2) / 2}`;
      if (!ok && !reported.has(key)) { reported.add(key); console.error(`✗ حافة صورة ظاهرة: ${dir} @${(frame / fps).toFixed(2)}s — كبّر w أو خفّف حركة الكاميرا أو غيّر الانتقال (ممنوع إطلاقاً، VISION.md)`); }
    }
    return <Layer key={i} z={lz} style={{ opacity: opacity * near }}>
      <img src={asset(`${dir}/${L.src}`)} style={{ position: 'absolute', left: cx - (w * k) / 2, top: cy - (h * k) / 2, width: w * k, height: h * k,
        ...(feather > 0 && i < m.layers.length - 1 ? { WebkitMaskImage: edgeMask(feather), maskImage: edgeMask(feather), WebkitMaskComposite: 'source-in', maskComposite: 'intersect' } : {}), ...style }} />
    </Layer>;
  })}</>;
}
