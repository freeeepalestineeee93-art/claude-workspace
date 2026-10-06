// مشهد ٥ — أرقام ونمو: أعمدة isometric حقيقية (3 وجوه بإضاءة) بتطلع بـ spring، سهم بينرسم والصاروخ ماشي عليه،
import { value as V } from '../../../../lib/anim.js';
// عدّاد ضخم، عملات بتتراكم (m5). اللون بيتحول بهدوء من لون المشهد السابق.
export function growthScene(S, P, D) {
  const { C } = P;
  const sfx = [];
  const px = S.px;
  const NAVY = '#26306B', TEAL = '#1FB5A3';
  const A = 0.866;
  const ox = px(330), oy = S.vh(70);
  const P3 = (X, Y, Z) => [ox + (X - Y) * A, oy + (X + Y) * 0.5 - Z];
  const poly = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (c) => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

  const w = px(92), gap = px(46);
  const bars = [
    { h: px(150), c: '#8FA3FF' }, { h: px(250), c: TEAL }, { h: px(360), c: C.yellow }, { h: px(500), c: C.red }, { h: px(690), c: C.blue },
  ];
  const T0 = 0.9;
  // ارتفاع العمود بـ spring (بيتجاوز شوي وبيرجع)
  const hAnim = (i, h) => ({ at: T0 + i * 0.16 + (i % 2) * 0.03, from: 0.0001, to: h, spring: { stiffness: 150, damping: 13, mass: 1 } });
  const barLayers = bars.flatMap((b, i) => {
    const x0 = i * (w + gap), x1 = x0 + w, y0 = 0, y1 = w;
    const H = hAnim(i, b.h);
    const face = (fn, col) => S.path({ d: (t) => { const h = Math.max(0.0001, V(H, t)); return poly(fn(h)); }, fill: col, opacity: { kf: [[H.at - 0.01, 0], [H.at + 0.02, 1]] } });
    sfx.push({ kind: 'pop', at: H.at + 0.05, params: { pitch: 0.7 + i * 0.1 }, gain_db: -24 });
    return [
      face((h) => [P3(x0, y1, 0), P3(x1, y1, 0), P3(x1, y1, h), P3(x0, y1, h)], b.c),
      face((h) => [P3(x1, y0, 0), P3(x1, y1, 0), P3(x1, y1, h), P3(x1, y0, h)], shade(b.c, 0.78)),
      face((h) => [P3(x0, y0, h), P3(x1, y0, h), P3(x1, y1, h), P3(x0, y1, h)], shade(b.c, 1.18)),
    ];
  });
  // أرضية isometric بشبكة
  const fl = [P3(-px(70), -px(80), 0), P3(px(700), -px(80), 0), P3(px(700), px(190), 0), P3(-px(70), px(190), 0)];
  const floor = S.group({ scale: { at: 0.35, from: 0, to: 1, spring: 'default' }, origin: [0, 0] }, [
    S.path({ d: poly(fl.map(([x, y]) => [x, y + px(16)])), fill: '#C3CBEF' }),
    S.path({ d: poly(fl), fill: '#EEF1FC' }),
    ...Array.from({ length: 7 }, (_, k) => S.line({ points: [P3(-px(70) + k * px(128), -px(80), 0), P3(-px(70) + k * px(128), px(190), 0)], stroke: '#E3E7FA', strokeWidth: px(3) })),
  ]);

  // السهم الصاعد + الصاروخ عليه
  const arrowPts = [[px(150), S.vh(60)], [px(360), S.vh(53)], [px(500), S.vh(55)], [px(700), S.vh(42)], [px(900), S.vh(33)]];
  const TA = T0 + 1.0;
  const arrowD = S.shapes.smoothPath(arrowPts, false, 0.5);
  const along = (k) => { // نقطة واتجاه تقريبي على المسار (خطي بين النقاط)
    const segs = arrowPts.slice(1).map((p, i) => [arrowPts[i], p]);
    const L = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1])), tot = L.reduce((x, y) => x + y);
    let d = k * tot, i = 0;
    while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; }
    const [a, b] = segs[i], u = Math.min(1, d / L[i]);
    return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI };
  };
  const prog = { at: TA, from: 0, to: 1, dur: 1.5, ease: 'ae:50:85' };
  const arrow = [
    S.path({ d: arrowD, fill: null, stroke: C.red, strokeWidth: px(12), lineCap: 'round', lineJoin: 'round', trim: { at: TA, from: [0, 0], to: [0, 1], dur: 1.5, ease: 'ae:50:85' } }),
    // الصاروخ الصغير (نفس تصميم المشهد ٢) راكب على راس السهم
    S.group({ x: (t) => along(V(prog, t)).x, y: (t) => along(V(prog, t)).y, rotation: (t) => along(V(prog, t)).ang + 90, scale: { kf: [[TA, 0], [TA + 0.2, 0.3, 'quadOut']] } }, [
      S.path({ d: `M${-px(40)},${px(250)} Q0,${px(420)} ${px(40)},${px(250)} Z`, fill: C.yellow }),
      S.path({ d: `M0,0 L${-px(150)},0 A${px(150)},${px(150)} 0 0 0 0,${px(150)} Z`, fill: C.red, x: -px(115), y: px(130) }),
      S.path({ d: `M0,0 L${px(150)},0 A${px(150)},${px(150)} 0 0 1 0,${px(150)} Z`, fill: C.red, x: px(115), y: px(130) }),
      S.rect({ w: px(250), h: px(470), radius: px(125), fill: C.blue, y: px(30) }),
      S.polygon({ sides: 3, r: px(150), fill: C.red, y: -px(250), scale: [0.95, 0.72] }),
      S.circle({ r: px(70), y: -px(60), fill: '#FFF', stroke: C.ink, strokeWidth: px(18) }),
    ]),
  ];
  sfx.push({ kind: 'riser', at: TA, params: { dur: 1.4, intensity: 0.5 }, gain_db: -24 }, { kind: 'chime', at: TA + 1.5, gain_db: -22 });

  // عملات بتتراكم (يسار تحت)
  const coins = Array.from({ length: 6 }, (_, i) => S.group({ x: px(150), y: S.vh(76) - i * px(22), scale: { at: T0 + 0.5 + i * 0.12, from: 0, to: 1, spring: 'playful' } }, [
    S.ellipse({ w: px(120), h: px(48), y: px(10), fill: '#E0A21A' }),
    S.ellipse({ w: px(120), h: px(48), fill: C.yellow }),
    S.ellipse({ w: px(70), h: px(26), fill: null, stroke: '#E8B22A', strokeWidth: px(5) }),
  ]));
  coins.forEach((_, i) => i % 2 === 0 && sfx.push({ kind: 'tick', at: T0 + 0.5 + i * 0.12, gain_db: -25 }));

  const EXIT = D - 0.55;
  return {
    duration: D,
    background: '#E7ECFF',
    camera: { zoom: { kf: [[0, 1.12, 'ae:33:75'], [1.4, 1.0], [EXIT, 1.04, 'sineInOut'], [D, 1.35, 'quadIn']] }, rotation: { kf: [[EXIT, 0], [D, -6, 'quadIn']] }, x: { kf: [[EXIT, 0], [D, px(160), 'quadIn']] } },
    layers: [
      S.rect({ x: S.cx, y: S.cy, w: S.W * 1.6, h: S.H * 1.6, fill: { kf: [[0, '#E7ECFF', 'sineInOut'], [1.2, '#F8F8FB']] } }),
      floor,
      ...barLayers,
      ...coins,
      ...arrow,
      S.text({ text: 'وبتكبر…', family: P.HEAD, weight: 900, size: px(112), fill: C.ink, x: S.cx, y: S.vh(13),
        reveal: { by: 'word', at: 0.5, mask: true, from: { y: px(130), opacity: 0 }, dur: 0.7, ease: 'ae:85:33' } }),
      S.text({ ...S.counter({ from: 0, to: 2.4, decimals: 1, prefix: '+', suffix: 'M', at: T0 + 0.2, dur: 2.4, digits: 'en' }), family: P.HEAD, weight: 900, size: px(230), fill: C.blue, x: S.cx, y: S.vh(24),
        opacity: { kf: [[T0, 0], [T0 + 0.25, 1]] }, scale: { at: T0, from: 0.85, to: 1, spring: 'default' } }),
      S.text({ text: 'مستخدم حول العالم', family: P.BODY, weight: 500, size: px(54), fill: C.muted, x: S.cx, y: S.vh(32.6),
        reveal: { by: 'word', at: T0 + 0.5, from: { y: px(20), opacity: 0 }, dur: 0.45, ease: 'ae:75:33', stagger: { each: 0.1 } } }),
    ],
    sfx: [...sfx, { kind: 'whoosh', at: EXIT + 0.3, align: 'peak', params: { dur: 0.6, brightness: 1.1 }, gain_db: -18 }],
  };
}
