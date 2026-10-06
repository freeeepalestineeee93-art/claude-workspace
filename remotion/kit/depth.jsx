// صورة مسطحة بعمق حقيقي جوّا عالم الكاميرا (طبقات من tools/depth_layers.py).
//   <DepthImage dir="projects/x/assets/street-depth" x={0} y={0} w={1080} z={0} depth={500} />
// كل طبقة بتنحط على z حسب عمقها (الأبعد z + depth، الأقرب z)، وحجمها بيتعوّض بالمنظور
// فلما الكاميرا بأول مكانها (cam.z = 0) الصورة بتطلع متطابقة تماماً، ولما تتحرك بيطلع parallax.
import React, { useEffect, useState } from 'react';
import { delayRender, continueRender } from 'remotion';
import { Layer, useWorld } from './camera.jsx';
import { asset } from './base.js';

const edgeMask = (f) => `linear-gradient(to right, transparent, #000 ${f * 100}%, #000 ${100 - f * 100}%, transparent), linear-gradient(to bottom, transparent, #000 ${f * 70}%, #000 ${100 - f * 70}%, transparent)`;

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
export function DepthImage({ dir, x = 0, y = 0, w, z = 0, depth = 400, focusAt, feather = 0.14, style }) {
  const m = useManifest(dir);
  const world = useWorld();
  if (!m) return null;
  const h = (w * m.h) / m.w;
  const f = world.f;
  // نقطة المحاذاة: وين الصورة لازم تتطابق تماماً (افتراضياً مركزها)
  const [ax, ay] = focusAt ?? [x, y];
  return <>{m.layers.map((L, i) => {
    const lz = z + (1 - L.depth) * depth;
    const k = (f + lz) / (f + z); // تعويض المنظور: الطبقة الأبعد أكبر بنفس النسبة
    const cx = ax + (x - ax) * k, cy = ay + (y - ay) * k;
    return <Layer key={i} z={lz}>
      <img src={asset(`${dir}/${L.src}`)} style={{ position: 'absolute', left: cx - (w * k) / 2, top: cy - (h * k) / 2, width: w * k, height: h * k,
        ...(feather > 0 && i < m.layers.length - 1 ? { WebkitMaskImage: edgeMask(feather), maskImage: edgeMask(feather), WebkitMaskComposite: 'source-in', maskComposite: 'intersect' } : {}), ...style }} />
    </Layer>;
  })}</>;
}
