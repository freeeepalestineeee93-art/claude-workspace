// معايرة C: لقطة "ركلة ركنية" من r07 (95.85–98.6s): رسم ملعب بخط يد، كرة ليمونية بصدى بتوصل للركن،
// كاميرا مقاسة (دفعة سريعة ثم زحف بطيء)، "ركلة" خفيفة و"ركنية" ثقيلة بكشيدة بتطلع بشفافية.
export default async (S) => {
  const cam = await (await fetch(S.asset('assets/calib/camC.json'))).json();
  const T0 = 95.85, r = (abs) => abs - T0, D = 98.6 - T0;
  const HEAD = 'Al Jazeera', INK = '#141510', LIME = '#c8f02a';
  // خط يد: نقاط على الخط مع اهتزاز بسيط حتمي
  const hand = (pts, seed = 1) => {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 60));
      for (let k = 0; k < n; k++) {
        const u = k / n, j = Math.sin((i * 13 + k) * 12.9898 * seed) * 1.6;
        out.push([a[0] + (b[0] - a[0]) * u + j, a[1] + (b[1] - a[1]) * u - j]);
      }
    }
    out.push(pts.at(-1));
    return S.path({ d: S.shapes.smoothPath(out, false, 0.3), fill: null, stroke: INK, strokeWidth: 7, opacity: 0.92 });
  };
  const arc = (cx, cy, rr, a0, a1) => Array.from({ length: 14 }, (_, i) => { const a = a0 + (a1 - a0) * (i / 13); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });

  return {
    duration: D,
    background: '#000',
    post: { grain: { amount: 0.05, size: 1.3 } },
    overlay: [
      S.text({ text: 'ركلة', family: HEAD, weight: 300, size: S.px(150), fill: '#fff', x: S.px(870), y: S.px(560), anchor: 'start',
        opacity: { kf: [[r(96.72), 0], [r(96.98), 1, 'quadOut']] } }),
      S.text({ text: 'ركنية', family: HEAD, weight: 900, size: S.px(175), fill: '#fff', x: S.px(870), y: S.px(760), anchor: 'start',
        kashida: [{ word: 0, amount: S.px(150), at: 'last' }],
        opacity: { kf: [[r(96.85), 0], [r(97.0), 0.45, 'linear'], [r(97.15), 1, 'quadOut']] } }),
      S.tube({ inset: S.px(78), bulge: S.px(105), top: 0, vignette: 0.3 }),
    ],
    scenes: [{
      duration: D,
      camera: { zoom: { kf: cam.keys.zoom }, x: { kf: cam.keys.x }, y: { kf: cam.keys.y } },
      layers: [
        S.rect({ x: S.cx, y: S.cy, w: S.W * 1.5, h: S.H * 1.5, fill: { linear: [[0, -S.H * 0.75], [0, S.H * 0.75]], stops: [[0, '#3b3d30'], [0.7, '#34362a'], [1, '#1c1d16']] } }),
        // ورقة مطبوعة بتختفي مع بداية اللقطة
        S.text({ text: 'Sports law has long been shaped by the tension between the governing bodies and the clubs. The early rules on the conduct of goalkeepers were introduced to prevent time wasting and to keep the ball in play.', family: 'Courier Prime', size: 15, fill: '#cfcbb8', x: 300, y: 700, maxWidth: 560, lineHeight: 1.5, decor: true,
          opacity: { kf: [[0, 0.35], [0.4, 0, 'quadOut']] } }),
        // الملعب (إحداثيات مقاسة من فريم المرجع)
        hand([[-200, 560], [936, 560], [936, 1580], [-200, 1580]], 1),
        hand([[666, 752], [936, 752]], 2), hand([[666, 752], [666, 1394], [936, 1394]], 3),
        hand([[846, 926], [846, 1216], [936, 1216]], 4), hand([[846, 926], [936, 926]], 5),
        hand([[936, 1010], [980, 1010], [980, 1130], [936, 1130]], 6),
        S.path({ d: S.shapes.smoothPath(arc(760, 1070, 160, Math.PI * 0.62, Math.PI * 1.38), false, 0.5), fill: null, stroke: INK, strokeWidth: 7, opacity: 0.92 }),
        S.circle({ r: 9, x: 760, y: 1070, fill: INK }),
        // الكرة: بتطلع لفوق للركن مع صدى
        S.circle({ r: 19, fill: LIME, x: 892, y: { at: 0, from: 690, to: 572, dur: 0.32, ease: 'cubicOut' }, echo: { count: 6, step: 0.022, decay: 0.7, opacity: 0.85 }, glow: { color: LIME, blur: 10 } }),
      ],
    }],
  };
};
