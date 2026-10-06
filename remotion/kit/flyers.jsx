// عناصر طايرة بعمق حقيقي (متل الأوراق النقدية بالجزيرة): قريبة = أكبر + مضبّبة + أسرع، بعيدة = أصغر وحادة.
//   <Flyers items={[{ src: 'projects/x/assets/petal.png', w: 120 }]} count={10} seed={3} t0={0} t1={17.5}
//     area={[x0, y0, x1, y1]} z={[-500, 300]} drift={[-1, 0.4]} speed={[260, 520]} spin={[-90, 90]} />
// بتنحط جوّا <World> (بتستعمل الكاميرا). blur بس على العناصر الصغيرة القريبة (مسموح، مش طبقة كاملة).
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Layer, At } from './camera.jsx';
import { asset, hash, clamp } from './base.js';

export function Flyers({ items, count = 8, seed = 1, t0 = 0, t1 = 10, area = [-600, -1000, 600, 1000], z = [-500, 400], drift = [-1, 0.3], speed = [220, 480], spin = [-120, 120], blurNear = 10, opacity = 1, life }) {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const out = [];
  const L = life ?? (area[3] - area[1]) / ((speed[0] + speed[1]) / 2) * 1.2;
  for (let i = 0; i < count; i++) {
    const r = (k) => hash(seed * 97 + i * 13 + k);
    const it = items[Math.floor(r(1) * items.length)];
    const zi = z[0] + (z[1] - z[0]) * r(2);
    const sp = speed[0] + (speed[1] - speed[0]) * r(3);
    // كل عنصر بيتكرر بدورة، بداية متفاوتة (مش stagger آلي)
    const born = t0 + r(4) * L;
    let age = t - born;
    if (age < 0) continue;
    age = age % L;
    if (t - age > t1) continue;
    const dx = drift[0], dy = drift[1];
    const n = Math.hypot(dx, dy) || 1;
    const x = area[0] + (area[2] - area[0]) * r(5) + (dx / n) * sp * age + Math.sin(age * (1 + r(6)) + i) * 40;
    const y = area[1] + (area[3] - area[1]) * r(7) * 0.3 + (dy / n) * sp * age + Math.cos(age * (0.8 + r(8)) + i) * 30;
    const rot = (spin[0] + (spin[1] - spin[0]) * r(9)) * age + r(10) * 360;
    const near = clamp(-zi / 500); // 0 بعيد → 1 قريب جداً
    const fade = Math.min(1, age / 0.4, (L - age) / 0.4, (t1 - t) / 0.4 + 1);
    out.push(<Layer key={i} z={zi}><At x={x} y={y} rotate={rot} opacity={opacity * clamp(fade)}>
      <img src={asset(it.src)} style={{ width: (it.w ?? 120) * (0.8 + r(11) * 0.5), filter: near > 0.3 ? `blur(${(near * blurNear).toFixed(1)}px)` : undefined, transform: `rotateX(${Math.sin(age * 3 + i) * 40}deg)` }} />
    </At></Layer>);
  }
  return <>{out}</>;
}
