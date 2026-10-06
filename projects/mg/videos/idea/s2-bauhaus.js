// مشهد ٢ — Bauhaus (أسلوب m3): أشكال هندسية برذاذ وظلال ناعمة بتطير من برا الكادر وبتتجمع لصاروخ.
// بداية: بياض الضو بيصغر لدائرة = شباك الصاروخ (match cut). نهاية: الصاروخ بينطلق والدخان بيغطي الكادر.
export function bauhausScene(S, P, D) {
  const { C } = P;
  const sfx = [];
  const SH = { color: 'rgba(28,36,80,0.16)', blur: 26, x: -14, y: 22 };
  const cx = S.cx, cy = S.vh(46);
  // طيران لمكان: من إزاحة + دوران، هبوط بـ spring بوزن مناسب
  const fly = (x, y, at, o = {}) => ({
    x: { at, from: x + (o.dx ?? 0), to: x, spring: o.spring ?? 'default' },
    y: { at, from: y + (o.dy ?? 0), to: y, spring: o.spring ?? 'default' },
    rotation: { at, from: (o.r0 ?? 0) + (o.rot ?? 0), to: o.r0 ?? 0, spring: o.spring ?? 'default' },
  });
  const LAUNCH = D - 2.1;
  // الصاروخ كله مجموعة وحدة: طفو خفيف، تحضير (squash) ثم انطلاق
  const rocketY = { kf: [[0, 0], [1.8, 0, 'sineInOut'], [LAUNCH - 0.2, -S.px(14), 'quadOut'], [LAUNCH, S.px(26), 'ae:33:95'], [LAUNCH + 1.3, -S.H * 1.05]] };
  const rocketScale = { kf: [[LAUNCH - 0.2, [1, 1], 'quadOut'], [LAUNCH, [1.06, 0.9], 'quadOut'], [LAUNCH + 0.18, [0.92, 1.12], 'quadOut'], [LAUNCH + 0.6, [1, 1.04]]] };
  sfx.push({ kind: 'swell', at: LAUNCH - 0.3, params: { dur: 0.5 }, gain_db: -16 }, { kind: 'whoosh', at: LAUNCH + 0.25, params: { dur: 1.0, brightness: 0.8 }, gain_db: -14 });

  // ظل ناعم مزاح (متل m3): نسخة من الشكل بلون الظل ومغبشة، بتتبع نفس الحركة
  const shadowed = (mk, props) => {
    const { spray, fill, stroke, shadow, sfx: _s, ...rest } = props;
    const sc = 'rgba(28,36,80,0.17)';
    return [mk({ ...rest, ...(fill == null ? { fill: null, stroke: sc } : { fill: sc, stroke: null }), blur: S.px(14), x: offs(rest.x, -S.px(16)), y: offs(rest.y, S.px(24)) }), mk(props)];
  };
  const offs = (v, d) => (v == null ? d : typeof v === 'number' ? v + d : v.kf ? { ...v, kf: v.kf.map(([t, x, e]) => (e ? [t, x + d, e] : [t, x + d])) } : { ...v, from: v.from + d, to: v.to + d });
  const quarter = (r, dir) => `M0,0 L${dir * r},0 A${r},${r} 0 0 ${dir > 0 ? 1 : 0} 0,${r} Z`;
  const rocket = S.group({ x: cx, y: { kf: rocketY.kf.map(([t, v, e]) => (e ? [t, cy + v, e] : [t, cy + v])) }, scale: rocketScale, origin: [0, S.px(260)] }, [
    // لهب (بيبين مع الانطلاق)
    S.group({ y: S.px(300), scale: { kf: [[LAUNCH - 0.1, [0.2, 0]], [LAUNCH + 0.1, [1, 1.3], 'quadOut'], [LAUNCH + 1.3, [1, 1.6]]] }, opacity: { kf: [[LAUNCH - 0.1, 0], [LAUNCH, 1]] } }, [
      S.path({ d: `M${-S.px(70)},0 Q0,${S.px(330)} ${S.px(70)},0 Z`, fill: C.yellow, scale: { base: 1, wiggle: { freq: 9, amp: 0.12, seed: 4 } } }),
      S.path({ d: `M${-S.px(38)},0 Q0,${S.px(190)} ${S.px(38)},0 Z`, fill: C.red, scale: { base: 1, wiggle: { freq: 11, amp: 0.15, seed: 7 } } }),
    ]),
    // الزعانف: ربعي دائرة حمر
    ...shadowed(S.path, { d: quarter(S.px(150), -1), fill: C.red, spray: { angle: 200, start: 0.5, amount: 0.8 }, ...fly(-S.px(115), S.px(130), 0.95, { dx: -S.px(500), dy: S.px(200), rot: -70 }) }),
    ...shadowed(S.path, { d: quarter(S.px(150), 1), fill: C.red, ...fly(S.px(115), S.px(130), 1.05, { dx: S.px(500), dy: S.px(240), rot: 80 }) }),
    // الجسم
    ...shadowed(S.rect, { w: S.px(250), h: S.px(470), radius: S.px(125), fill: C.blue, spray: { angle: 35, start: 0.42, amount: 0.95 }, ...fly(0, S.px(30), 0.4, { dy: S.px(1300), rot: -28, spring: 'heavy' }) }),
    // خطوط على الجسم
    ...[0, 1].map((k) => S.rect({ w: S.px(250), h: S.px(16), y: S.px(150) + k * S.px(34), fill: '#F4F2EE', scale: { at: 1.35 + k * 0.08, from: [0, 1], to: [1, 1], spring: 'snappy' } })),
    // الأنف
    ...shadowed(S.polygon, { sides: 3, r: S.px(150), fill: C.red, spray: { angle: 120, start: 0.55, amount: 0.9 }, ...fly(0, -S.px(250), 0.72, { dy: -S.px(1200), rot: 200, spring: 'default' }), scale: [0.95, 0.72] }),
    // الشباك: الدائرة البيضا (هي نفسها بياض المشهد السابق) + حلقة سودا بتنرسم
    S.circle({ r: { kf: [[0, S.px(1300), 'ae:85:33'], [0.75, S.px(70)]] }, y: { kf: [[0, S.vh(53) - cy, 'ae:85:33'], [0.75, -S.px(60)]] }, fill: '#FFFDF6' }),
    S.circle({ r: S.px(84), y: -S.px(60), fill: null, stroke: C.ink, strokeWidth: S.px(18), rotation: -90, trim: { at: 0.62, from: [0, 0], to: [0, 1], dur: 0.45, ease: 'ae:33:85' } }),
  ]);
  sfx.push({ kind: 'swish', at: 0.4, gain_db: -18 }, { kind: 'pop', at: 0.85, params: { pitch: 0.7 }, gain_db: -19 }, { kind: 'swish', at: 0.95, gain_db: -20 }, { kind: 'swish', at: 1.05, gain_db: -21 });

  // زينة حوالين (كل وحدة بتطير من جهة مختلفة، بأزمنة عضوية)
  const deco = [
    S.circle({ r: S.px(330), x: cx, y: cy + S.px(20), fill: '#F6F6F9', scale: { at: 0.55, from: 0, to: 1, spring: 'gentle' } }),
    // شبكة نقاط ٣×٣ أحمر/أزرق
    S.group({ x: S.px(230), y: S.vh(25) }, Array.from({ length: 9 }, (_, i) => S.circle({ r: S.px(15), x: (i % 3) * S.px(42), y: Math.floor(i / 3) * S.px(42), fill: i % 4 === 0 ? C.blue : C.red,
      scale: { at: 1.25 + ((i * 7) % 9) * 0.035, from: 0, to: 1, spring: 'playful' } }))),
    // مربع إطار أسود مايل
    ...shadowed(S.rect, { w: S.px(150), h: S.px(150), fill: null, stroke: C.ink, strokeWidth: S.px(14), ...fly(S.px(840), S.vh(28), 1.15, { dx: S.px(500), dy: -S.px(300), rot: 120, r0: 18 }) }),
    S.circle({ r: S.px(14), x: S.px(915), y: S.vh(24.5), fill: C.red, scale: { at: 1.55, from: 0, to: 1, spring: 'playful' } }),
    // ثلاث شرطات سود
    ...[0, 1, 2].map((k) => S.rect({ w: S.px(110), h: S.px(16), x: S.px(190), y: S.vh(59) + k * S.px(34), fill: C.ink, scale: { at: 1.4 + k * 0.06, from: [0, 1], to: [1, 1], spring: 'snappy' }, origin: [S.px(55), 0] })),
    // قوس أحمر متقطع
    S.path({ d: `M${S.px(740)},${S.vh(64)} A${S.px(170)},${S.px(170)} 0 0 0 ${S.px(915)},${S.vh(55)}`, fill: null, stroke: C.red, strokeWidth: S.px(10), dash: [S.px(16), S.px(14)], trim: { at: 1.5, from: [0, 0], to: [0, 1], dur: 0.6, ease: 'ae:33:75' } }),
    // دائرة بيضا كبيرة بظل (متل m3) ورا يسار
    ...shadowed(S.circle, { r: S.px(105), fill: '#FAFAF8', ...fly(S.px(230), S.vh(47), 1.0, { dx: -S.px(600), dy: S.px(100), rot: 0, spring: 'default' }) }),
    // خط أزرق مايل
    S.line({ points: [[S.px(660), S.vh(68)], [S.px(900), S.vh(65.5)]], stroke: C.blue, strokeWidth: S.px(7), trim: { at: 1.7, from: [0, 0], to: [0, 1], dur: 0.4, ease: 'quadOut' } }),
    // نص الأحمر/الأزرق نص دائرة صغير
    ...shadowed(S.path, { d: `M${-S.px(60)},0 A${S.px(60)},${S.px(60)} 0 0 1 ${S.px(60)},0 Z`, fill: C.blue, ...fly(S.px(840), S.vh(47), 1.3, { dx: S.px(400), dy: S.px(300), rot: -160, r0: -35 }) }),
  ];
  sfx.push({ kind: 'tick', at: 1.25, gain_db: -22 }, { kind: 'pop', at: 1.15, params: { pitch: 1.1 }, gain_db: -21 }, { kind: 'click', at: 1.4, gain_db: -22 }, { kind: 'scribble', at: 1.5, params: { dur: 0.5 }, gain_db: -24 });

  // الزينة بتنزاح لبرا شوي مع الانطلاق (رد فعل)
  const decoGroup = S.group({ x: cx, y: cy, scale: { kf: [[LAUNCH, 1], [LAUNCH + 0.6, 1.06, 'quadOut']] }, opacity: { kf: [[LAUNCH + 0.9, 1], [D, 0.2]] } }, [S.group({ x: -cx, y: -cy }, deco)]);

  // دخان الانطلاق: كرات بيضا بتكبر وبتغطي الكادر (انتقال للمشهد الجاي)
  const puffs = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + i * 0.37, d0 = S.px(60 + (i % 4) * 40);
    const t0 = LAUNCH + 0.15 + (i % 7) * 0.07;
    return S.circle({ r: S.px(70 + (i % 5) * 26), x: cx + Math.cos(a) * d0 * 0.6, y: S.vh(70) + Math.sin(a) * d0 * 0.3, fill: '#F7F6FB', shadow: { color: 'rgba(28,36,80,0.08)', blur: 30, y: 10 },
      scale: { kf: [[t0, 0], [t0 + 0.5, 1.6, 'quadOut'], [D, 7.5 + (i % 3), 'ae:33:66']] }, x: { kf: [[t0, cx], [D, cx + Math.cos(a) * S.px(520), 'quadOut']] }, y: { kf: [[t0, S.vh(72)], [D, S.vh(72) + Math.sin(a) * S.px(460) - S.px(200), 'quadOut']] } });
  });
  sfx.push({ kind: 'swell', at: LAUNCH + 0.3, params: { dur: 1.4 }, gain_db: -20 });

  return {
    duration: D,
    background: '#E9EBF0',
    camera: { y: { kf: [[LAUNCH, 0], [D, -S.px(120), 'ae:66:33']] }, zoom: { kf: [[0, 1.0], [LAUNCH, 1.04, 'sineInOut'], [D, 1.12, 'quadIn']] } },
    layers: [
      decoGroup,
      rocket,
      S.text({ text: 'وبتاخد شكلها', family: P.HEAD, weight: 900, size: S.px(128), fill: C.ink, x: cx, y: S.vh(78),
        reveal: { by: 'word', at: 2.1, mask: true, from: { y: S.px(150), opacity: 0 }, dur: 0.75, ease: 'ae:85:33', stagger: { each: 0.12 } },
        exit: { by: 'word', at: LAUNCH + 0.05, to: { y: S.px(40), opacity: 0 }, dur: 0.3, ease: 'quadIn', stagger: { each: 0.05 } } }),
      S.text({ text: 'شكل… ولون… وتفصيلة', family: P.BODY, weight: 400, size: S.px(58), fill: C.muted, x: cx, y: S.vh(84),
        reveal: { by: 'word', at: 2.55, from: { y: S.px(24), opacity: 0 }, dur: 0.5, ease: 'ae:75:33', stagger: { each: 0.14 } },
        exit: { by: 'all', at: LAUNCH, to: { opacity: 0 }, dur: 0.25, ease: 'quadIn' } }),
      ...puffs,
    ],
    sfx,
  };
}
