// اختبار المحرك: نص عربي بوصفات مختلفة، أشكال، أيقونات، علامات، انتقالات، post.
export default async (S) => {
  const C = S.colors;
  const bg = (seed) => [
    S.ellipse({ x: S.vw(80), y: S.vh(20), w: S.px(900), fill: { radial: { c: [0, 0], r: S.px(450) }, stops: [[0, C.primary + '55'], [1, C.primary + '00']] },
      x: { wiggle: { freq: 0.15, amp: S.px(60), seed }, base: S.vw(80) } }),
    S.ellipse({ x: S.vw(15), y: S.vh(85), w: S.px(1100), fill: { radial: { c: [0, 0], r: S.px(550) }, stops: [[0, C.cool + '33'], [1, C.cool + '00']] } }),
  ];
  const T = 140;
  return {
    background: C.bg,
    audio: { music: { style: 'tech', gain_db: -8 } },
    post: { bloom: { strength: 0.5, threshold: 0.7 }, grain: { amount: 0.045 }, vignette: { strength: 0.4 }, chromatic: 0.0012, grade: { contrast: 1.06 } },
    scenes: [
      {
        duration: 3.2,
        layers: [
          ...bg(1),
          S.text({ text: 'المحرك جاهز', size: T, x: S.cx, y: S.vh(42), ...S.fx.maskRise(0.3, { size: T }) }),
          S.text({ text: 'كل حرف وحدة حية', role: 'body', size: 64, fill: C.muted, x: S.cx, y: S.vh(52), ...S.fx.blurIn(0.9, { size: 64 }),
            marks: [{ word: 1, type: 'underline', color: C.primary, at: 1.6, dur: 0.6 }] }),
          S.rect({ x: S.cx, y: S.vh(62), w: { at: 1.2, from: 0, to: S.px(420), spring: 'snappy' }, h: S.px(6), radius: 3, fill: C.primary }),
        ],
      },
      {
        duration: 3.4,
        transition: { type: 'whip', dur: 0.5, dir: 'right' },
        layers: [
          ...bg(2),
          S.text({ text: 'بوب', size: 220, family: 'Lalezar', weight: 400, fill: C.accent, x: S.cx, y: S.vh(30), ...S.fx.pop(0.2, { size: 220 }) }),
          S.text({ text: 'رقعة مرسومة', role: 'accent', size: 150, x: S.cx, y: S.vh(48), stroke: C.text, ...S.fx.draw(0.4, { size: 150 }) }),
          S.text({ text: 'كشيدة', size: 150, x: S.cx, y: S.vh(66), fill: { angle: 0, stops: [[0, C.primary], [1, C.accent]] },
            kashida: [{ word: 0, amount: { kf: [[0.6, 0, 'glide'], [1.6, S.px(260), 'smooth'], [2.6, S.px(60)]] } }] }),
          S.icon({ icon: 'lucide:sparkles', size: S.px(140), color: C.cool, x: S.cx, y: S.vh(80), strokeWidth: 1.6, trim: { kf: [[0.8, [0, 0]], [1.8, [0, 1]]] },
            rotation: { at: 0.8, from: -30, to: 0, spring: 'playful' } }),
        ],
      },
      {
        duration: 3,
        transition: { type: 'iris', dur: 0.7, ring: C.accent },
        layers: [
          ...bg(3),
          S.text({ text: 'استوديو الموشن العربي', size: 120, x: S.cx, y: S.vh(45), maxWidth: S.px(820), lineHeight: 1.3,
            ...S.fx.combine(S.fx.cascade(0.2, { size: 120 }), S.fx.exitBlur(2.3, { size: 120 })),
            marks: [{ word: 2, type: 'highlight', color: C.primary + 'aa', at: 1.2, dur: 0.5 }] }),
        ],
      },
    ],
  };
};
