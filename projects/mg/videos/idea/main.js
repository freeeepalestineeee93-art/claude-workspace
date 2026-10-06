// "رحلة فكرة" — موشن غرافيك 60 ثانية بخلفية فاتحة، بيجمع أنماط المراجع الخمسة (m1–m5) بفيديو واحد متماسك:
// 3D طين (m1) ← أشكال Bauhaus برذاذ (m3) ← مكتب flat غني (m5) ← isometric وشبكة (m4) ← أرقام ← تحريري أبيض/أسود/أحمر (m2) ← لوغو.
// بدون تعليق صوتي ولا موسيقى؛ مؤثرات صوتية هادية بس. كل مشهد بيخلص بانتقال مصمم جوّاه (match/zoom-through)، فالقطع بين المشاهد ما بيبين.
import { bulbScene } from './s1-bulb.js';
import { bauhausScene } from './s2-bauhaus.js';
import { deskScene } from './s3-desk.js';
import { networkScene } from './s4-network.js';
import { growthScene } from './s5-growth.js';
import { editorialScene } from './s6-editorial.js';
import { logoScene } from './s7-logo.js';

export default async (S) => {
  const C = { bg: '#F3F2EE', ink: '#1C1E2B', muted: '#7B7F93', blue: '#2747F0', red: '#F0433A', yellow: '#FFC531', lav: '#E8E6F8', green: '#23B07D', white: '#FFFFFF' };
  const P = { C, HEAD: 'thmanyah sans', BODY: 'thmanyah sans' };
  const scenes = [bulbScene(S, P, 6.4), bauhausScene(S, P, 7.6), deskScene(S, P, 9.8), networkScene(S, P, 9.0), growthScene(S, P, 9.0), ...editorialScene(S, P, 9.6), logoScene(S, P, 8.4)];
  // مؤثرات كل مشهد (زمن محلي) → زمن مطلق
  const sfx = [];
  let t0 = 0;
  for (const sc of scenes) {
    for (const e of sc.sfx ?? []) sfx.push({ ...e, at: e.at + t0 });
    delete sc.sfx;
    t0 += sc.duration;
    const nx = scenes[scenes.indexOf(sc) + 1];
    if (nx?.transition && nx.transition.type !== 'cut') t0 -= nx.transition.dur ?? 0.6;
  }
  return {
    background: C.bg,
    audio: { auto: false, sfx, master: { lufs: -24 } },
    post: { grain: { amount: 0.025, size: 1.2 }, bloom: { strength: 0.25, threshold: 0.82 } },
    scenes,
  };
};
