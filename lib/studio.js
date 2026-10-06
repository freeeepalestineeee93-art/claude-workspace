// سياق التأليف (S): كل شي بيحتاجه كاتب المشهد بمكان واحد.
// المشهد بينكتب كـ: export default async (S) => ({ scenes: [...] })

import * as A from './anim.js';
import * as shapes from './shapes.js';
import { textFx } from './text-fx.js';
import { captionLayers, groupPhrases } from './captions.js';

export const ASPECTS = {
  '9:16': [1080, 1920], '4:5': [1080, 1350], '1:1': [1080, 1080], '16:9': [1920, 1080], '21:9': [2520, 1080], '2:3': [1080, 1620],
};

// مناطق آمنة لكل منصة (بالنسبة لـ 1080 عرض): الأماكن اللي بتغطيها واجهة التطبيق
const SAFE = {
  '9:16': { top: 0.11, bottom: 0.2, left: 0.06, right: 0.12 }, // ريلز/تيك توك: أزرار يمين، كابشن تحت
  '4:5': { top: 0.06, bottom: 0.08, left: 0.06, right: 0.06 },
  '1:1': { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 },
  '16:9': { top: 0.07, bottom: 0.1, left: 0.05, right: 0.05 },
};

export function createStudio({ aspect = '9:16', fps = 30, brand = {}, project = '', video = '', scale = 1 } = {}) {
  const [bw, bh] = ASPECTS[aspect] ?? aspect.split('x').map(Number);
  const W = Math.round(bw * scale), H = Math.round(bh * scale);
  const u = W / 1080; // وحدة مرجعية: كل القيم مكتوبة كأن العرض 1080
  const sf = SAFE[aspect] ?? SAFE['1:1'];
  const safe = { top: sf.top * H, bottom: H - sf.bottom * H, left: sf.left * W, right: W - sf.right * W };
  safe.w = safe.right - safe.left;
  safe.h = safe.bottom - safe.top;
  safe.cx = (safe.left + safe.right) / 2;
  safe.cy = (safe.top + safe.bottom) / 2;

  const colors = brand.colors ?? {};
  const fonts = brand.fonts ?? {};
  const motion = brand.motion ?? {};

  const S = {
    W, H, aspect, fps, scale, u,
    vertical: H > W, landscape: W > H, square: W === H,
    cx: W / 2, cy: H / 2,
    vw: (n) => (n / 100) * W, vh: (n) => (n / 100) * H, vmin: (n) => (n / 100) * Math.min(W, H), vmax: (n) => (n / 100) * Math.max(W, H),
    px: (n) => n * u, // قيمة مصممة على عرض 1080 → المقاس الحالي
    safe,
    // اختيار قيمة حسب المقاس: S.pick({ '9:16': 140, '16:9': 110, default: 120 })
    pick: (m) => m[aspect] ?? (H > W ? m.vertical : W > H ? m.landscape : m.square) ?? m.default,

    brand, colors, fonts, motion,
    color: (k, fallback = '#fff') => colors[k] ?? fallback,
    font: (role = 'display') => fonts[role]?.family ?? fonts.display?.family ?? 'IBM Plex Sans Arabic',
    weight: (role = 'display') => fonts[role]?.weight ?? 700,
    // شخصية الحركة من الهوية: S.spring('enter') → preset مناسب للبراند
    spring: (role = 'default') => motion.springs?.[role] ?? { enter: 'default', ui: 'snappy', hero: 'heavy', fun: 'playful', bg: 'gentle' }[role] ?? role,

    asset: (p) => (p.startsWith('/') || p.startsWith('http') ? p : `/${project}/${p}`),
    video, project,

    ...A,
    shapes,
    fx: textFx,

    // إيقاع: S.beat(n) = وقت الـ beat رقم n
    bpm: brand.audio?.bpm ?? 120,
    beatOffset: 0,
    beat(n) { return S.beatOffset + (n * 60) / S.bpm; },
    bar(n, beatsPerBar = 4) { return S.beat(n * beatsPerBar); },
    snap(t) { const b = 60 / S.bpm; return S.beatOffset + Math.round((t - S.beatOffset) / b) * b; },

    // موسيقى محللة: const m = await S.music('assets/song.beats.json') → S.beat/S.snap بيمشوا على الأغنية
    async music(p) {
      const m = await (await fetch(S.asset(p))).json();
      S.bpm = m.bpm; S.beatOffset = m.bars?.[0] ?? m.beats?.[0] ?? 0; S.beats = m.beats; S.bars = m.bars; S.drops = m.drops;
      S.beat = (n) => m.beats[n] ?? S.beatOffset + (n * 60) / S.bpm;
      S.snap = (t) => m.beats.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a), m.beats[0] ?? t);
      return m;
    },
    // كابشن متزامن مع تعليق صوتي
    async captions(p, o = {}) {
      const words = Array.isArray(p) ? p : await (await fetch(S.asset(p))).json();
      return captionLayers(S, words, o);
    },
    groupPhrases,

    // تسلسل زمني مريح: const c = S.cursor(0.3); c.at(); c.wait(0.4); c.at() ...
    cursor(start = 0) {
      let t = start;
      return { at: () => t, wait(d) { t += d; return t; }, set(x) { t = x; return t; }, mark() { return t; } };
    },

    // أنواع الطبقات (اختصارات)
    group: (o, children) => ({ type: 'group', ...o, children: children ?? o.children ?? [] }),
    rect: (o) => ({ type: 'rect', ...o }),
    ellipse: (o) => ({ type: 'ellipse', ...o }),
    circle: (o) => ({ type: 'ellipse', w: (o.r ?? 50) * 2, ...o }),
    polygon: (o) => ({ type: 'polygon', ...o }),
    line: (o) => ({ type: 'line', fill: null, ...o }),
    path: (o) => ({ type: 'path', ...o }),
    text: (o) => ({ type: 'text', family: o.family ?? S.font(o.role ?? 'display'), weight: o.weight ?? S.weight(o.role ?? 'display'), fill: o.fill ?? o.color ?? colors.text ?? '#fff', ...o }),
    image: (o) => ({ type: 'image', ...o, src: S.asset(o.src) }),
    icon: (o) => ({ type: 'icon', color: colors.text ?? '#fff', ...o }),
    custom: (o) => ({ type: 'custom', ...o }),
  };
  return S;
}
