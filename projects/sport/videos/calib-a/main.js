// معايرة A: لقطة "أحمد شوبير" من r07 (20.08–23.85s).
// الاكتشاف: مش زووم كاميرا. الأشخاص (قصاصة) بيقفزوا ×1.96 والخلفية بالكاد بتتحرك (×1.12 ثم 0.93).
// كل طبقة متحركة لحالها بمنحنيات مقاسة (refmap.layer_keys)، والاسم والمثلث ملزوقين بطبقة الأشخاص.
export default async (S) => {
  const L = await (await fetch(S.asset('assets/calib/layersA.json'))).json();
  const T0 = 20.083, r = (abs) => abs - T0, D = 23.85 - T0;
  const HEAD = 'Al Jazeera', GREEN = '#2fe36f';
  // تحويل طبقة: screen = s·p + T  → group عند (T) بمقياس s، وأولاده بإحداثيات الصورة الأصلية
  const layer = (k, children) => S.group({ x: { kf: k.x }, y: { kf: k.y }, scale: { kf: k.scale } }, children);
  const PAD = 1.24; // الخلفية مكمّلة بانعكاس (حتى التصغير ما يكشف أطراف) بنفس مقياس المحتوى

  return {
    duration: D,
    background: '#000',
    post: { grain: { amount: 0.05, size: 1.4 } },
    overlay: [
      // الاسم طبقة لحالها شبه ثابتة بالشاشة (مش ملزوق بالحارس)، بانجراف بطيء
      S.text({ text: 'أحمد شوبير', family: HEAD, weight: 900, size: S.px(168), fill: '#fff', x: { kf: [[r(20.8), S.px(530)], [r(22.4), S.px(510), 'linear']] }, y: { kf: [[r(20.8), S.px(470)], [r(22.4), S.px(485), 'linear']] }, rotation: -8,
        shadow: { color: '#1a9a4c', blur: 0, x: -7, y: 10 },
        reveal: { by: 'char', at: r(20.82), from: { opacity: 0 }, dur: 0.001, ease: 'hold', stagger: { each: 0.028 } },
        exit: { by: 'char', at: r(22.16), to: { opacity: 0 }, dur: 0.001, ease: 'hold', stagger: { each: 0.028, from: 'end' } } }),
      ...[['الأكثر', 0.172], ['ظهورا', 0.268], ['في المباراة', 0.372]].map(([txt, yy], i) => S.text({
        text: txt, family: HEAD, weight: 900, size: S.px(155), fill: '#fff', x: S.px(980), y: S.H * yy, anchor: 'start',
        shadow: { color: 'rgba(0,0,0,.35)', blur: 12, y: 4 },
        ...(i === 1 ? { kashida: [{ word: 0, amount: S.px(95) }] } : {}),
        reveal: { by: 'word', at: r(22.45) + i * 0.125, from: { x: S.px(90), opacity: 0 }, dur: 0.28, ease: 'quadOut', stagger: { each: 0.12 } },
      })),
      S.tube({ inset: S.px(78), bulge: S.px(105), top: 0, vignette: 0.35 }),
    ],
    scenes: [{
      duration: D,
      layers: [
        layer(L.bg.keys, [S.image({ src: S.asset('assets/calib/plateA_bg_pad.png'), x: S.cx, y: S.cy, w: S.W * PAD, h: S.H * PAD, fit: 'cover' })]),
        layer(L.fg.keys, [
          S.image({ src: S.asset('assets/calib/plateA_fg.png'), x: S.cx, y: S.cy, w: S.W, h: S.H, fit: 'cover' }),
          S.polygon({ sides: 3, r: 28, rotation: 168, fill: GREEN, glow: { color: GREEN, blur: 32, strength: 1.6 }, x: 383.6, y: { base: 728, wiggle: { freq: 1.4, amp: 3, seed: 2 } },
            opacity: { kf: [[r(20.8), 0], [r(20.86), 1]] }, scale: { at: r(20.8), from: 0.4, to: 1, dur: 0.18, ease: 'quadOut' } }),
        ]),
      ],
    }],
  };
};
