// مشهد ٣ — Flat explainer غني (أسلوب m5/m4): مكتب بيتبنى قطعة قطعة بجاذبية وارتداد وsquash،
// تروس بتلف، ساعة بتركض (الوقت)، نبتة بتطلع، بخار، ستارة بتتمايل. بالآخر الكاميرا بتغطس جوّا الشاشة (zoom-through).
export function deskScene(S, P, D) {
  const { C } = P;
  const sfx = [];
  const px = S.px;
  const WOOD = '#D9945A', WOOD_D = '#B8743F', NAVY = '#26306B', SCREEN = '#E7ECFF', PINK = '#F2558F', TEAL = '#1FB5A3';
  const SH = 'rgba(38,48,107,0.13)';

  // سقوط بجاذبية + ارتداد + squash عند الأرض (أسلوب m5)
  const land = (at, y, o = {}) => {
    const h = o.h ?? px(700), b = o.bounce ?? px(46);
    sfx.push({ kind: o.sound ?? 'hit', at: at + 0.32, gain_db: o.gain ?? -22, params: { pitch: o.pitch ?? 1 } });
    return {
      y: { kf: [[at, y - h, 'quadIn'], [at + 0.32, y, 'quadOut'], [at + 0.47, y - b, 'quadIn'], [at + 0.62, y, 'quadOut'], [at + 0.7, y - b * 0.2, 'quadIn'], [at + 0.78, y]] },
      scale: { kf: [[at, [0.92, 1.1]], [at + 0.32, [1.12, 0.86], 'quadOut'], [at + 0.44, [0.97, 1.04], 'quadOut'], [at + 0.62, [1.04, 0.96], 'quadOut'], [at + 0.8, [1, 1]]] },
      opacity: { kf: [[at, 0], [at + 0.05, 1]] },
    };
  };
  const pop = (at, spring = 'playful') => ({ scale: { at, from: 0, to: 1, spring } });
  const shadowEl = (x, y, w, at) => S.ellipse({ x, y, w, h: w * 0.12, fill: SH, blur: px(6), scale: { kf: [[at, 0.3], [at + 0.32, 1, 'quadOut']] }, opacity: { kf: [[at, 0], [at + 0.3, 1]] } });

  // ── ترس ──
  const gearPath = (r, teeth = 10) => {
    const pts = [];
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2, rr = i % 4 < 2 ? r : r * 0.8;
      pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
    }
    return 'M' + pts.join('L') + 'Z';
  };
  const gear = (x, y, r, col, at, dir) => S.group({ x, y: { base: y, wiggle: { freq: 0.5, amp: px(8), seed: Math.round(x) } }, ...pop(at) }, [
    S.path({ d: gearPath(r), fill: col, rotation: (t) => dir * t * 70 }),
    S.circle({ r: r * 0.36, fill: '#FBFAFD' }),
  ]);
  const star = (x, y, s, at) => S.polygon({ sides: 4, r: px(s), inner: px(s * 0.35), x, y, fill: C.yellow, rotation: (t) => t * 30, scale: { kf: [[at, 0], [at + 0.25, 1.2, 'quadOut'], [at + 0.45, 1]] } });

  // ── عناصر ──
  const T = { blob: 0.05, desk: 0.35, legs: 0.3, mon: 0.75, kb: 1.15, mug: 1.3, lamp: 1.5, plant: 1.7, win: 0.6, clock: 1.0, gears: 2.0, text: 2.3 };
  const deskY = px(1180);
  const monX = px(600), monY = px(950), mw = px(430), mh = px(280);

  // لوحة الشاشة: الصاروخ المصغّر من المشهد السابق (تصميم صار على الشاشة) + شريط أدوات
  const screenContent = S.group({ x: monX, y: monY, opacity: { kf: [[T.mon + 0.5, 0], [T.mon + 0.7, 1], [D - 1.1, 1], [D - 0.75, 0]] } }, [
    S.rect({ w: mw - px(28), h: px(26), y: -mh / 2 + px(27), fill: '#D3DBFF' }),
    ...[0, 1, 2].map((k) => S.circle({ r: px(5), x: mw / 2 - px(40) - k * px(16), y: -mh / 2 + px(27), fill: [C.red, C.yellow, TEAL][k] })),
    S.group({ x: -px(80), y: px(20), scale: 0.36 }, [
      S.path({ d: `M0,0 L${-px(150)},0 A${px(150)},${px(150)} 0 0 0 0,${px(150)} Z`, fill: C.red, x: -px(115), y: px(130) }),
      S.path({ d: `M0,0 L${px(150)},0 A${px(150)},${px(150)} 0 0 1 0,${px(150)} Z`, fill: C.red, x: px(115), y: px(130) }),
      S.rect({ w: px(250), h: px(470), radius: px(125), fill: C.blue, y: px(30) }),
      S.polygon({ sides: 3, r: px(150), fill: C.red, y: -px(250), scale: [0.95, 0.72] }),
      S.circle({ r: px(70), y: -px(60), fill: '#FFF', stroke: C.ink, strokeWidth: px(18) }),
    ]),
    // لوحة خصائص يمين
    ...[0, 1, 2, 3].map((k) => S.rect({ w: px(130), h: px(16), radius: px(8), x: px(110), y: -px(60) + k * px(34), fill: k === 0 ? C.blue : '#C9D2F5', scale: { at: T.mon + 0.9 + k * 0.08, from: [0, 1], to: [1, 1], spring: 'snappy' }, origin: [px(65), 0] })),
    // مؤشر ماوس بيتحرك
    S.path({ d: `M0,0 L0,${px(34)} L${px(9)},${px(26)} L${px(16)},${px(40)} L${px(22)},${px(37)} L${px(15)},${px(23)} L${px(27)},${px(23)} Z`, fill: C.ink, stroke: '#fff', strokeWidth: px(3),
      x: { kf: [[T.mon + 1.2, px(160)], [T.mon + 2.0, -px(40), 'ae:66:33'], [T.mon + 3.2, -px(60), 'sineInOut'], [T.mon + 4.2, px(95), 'ae:66:33']] },
      y: { kf: [[T.mon + 1.2, px(110)], [T.mon + 2.0, px(10), 'ae:66:33'], [T.mon + 3.2, px(40), 'sineInOut'], [T.mon + 4.2, -px(60), 'ae:66:33']] } }),
  ]);
  sfx.push({ kind: 'click', at: T.mon + 2.05, gain_db: -24 }, { kind: 'click', at: T.mon + 4.25, gain_db: -24 });

  const layers = [
    // بقعة لافندر عضوية
    S.path({ d: S.shapes.smoothPath([[-px(430), -px(120)], [-px(260), -px(400)], [px(60), -px(450)], [px(380), -px(330)], [px(470), px(30)], [px(330), px(330)], [-px(20), px(380)], [-px(380), px(260)]], true), fill: '#ECEAF9', x: px(540), y: px(980),
      scale: { kf: [[T.blob, 0, 'ae:33:66'], [T.blob + 0.7, 1]] }, rotation: (t) => Math.sin(t * 0.5) * 3 }),
    // نقاط ونجوم زينة بالخلفية
    ...[[150, 560], [960, 520], [120, 1320], [990, 1300], [700, 560]].map(([x, y], i) => S.circle({ r: px(7), x: px(x), y: px(y), fill: [C.blue, PINK, TEAL, C.yellow, C.red][i], ...pop(0.6 + i * 0.13) })),
    // الشباك + ستارة صفرا بتتمايل
    S.group({ x: px(230), y: px(720), ...pop(T.win, 'default') }, [
      S.rect({ w: px(230), h: px(290), radius: px(10), fill: '#DCE8FF', stroke: '#B9B3DD', strokeWidth: px(10) }),
      S.line({ points: [[0, -px(145)], [0, px(145)]], stroke: '#B9B3DD', strokeWidth: px(6) }),
      S.line({ points: [[-px(115), 0], [px(115), 0]], stroke: '#B9B3DD', strokeWidth: px(6) }),
      S.rect({ w: px(270), h: px(14), radius: px(7), y: -px(158), fill: WOOD_D }),
      S.path({ d: (t) => { const s = Math.sin(t * 1.6) * px(14); return `M${-px(130)},${-px(150)} L${-px(40)},${-px(150)} Q${-px(30) + s},${px(20)} ${-px(70) + s * 1.6},${px(150)} L${-px(130)},${px(150)} Z`; }, fill: C.yellow }),
    ]),
    // ساعة الحيط: العقارب بتركض (الوقت عم يمرق)
    S.group({ x: px(905), y: px(615), scale: 0.86, ...pop(T.clock, 'playful') }, [
      S.circle({ r: px(84), fill: '#FFFFFF', stroke: NAVY, strokeWidth: px(10) }),
      ...Array.from({ length: 12 }, (_, i) => S.rect({ w: px(4), h: px(i % 3 === 0 ? 16 : 8), fill: NAVY, x: Math.sin((i / 12) * Math.PI * 2) * px(62), y: -Math.cos((i / 12) * Math.PI * 2) * px(62), rotation: i * 30 })),
      S.rect({ w: px(7), h: px(52), radius: px(4), fill: NAVY, origin: [0, px(22)], rotation: (t) => (t - T.clock) * 220 }),
      S.rect({ w: px(5), h: px(66), radius: px(3), fill: C.red, origin: [0, px(29)], rotation: (t) => (t - T.clock) * 1600 }),
      S.circle({ r: px(9), fill: NAVY }),
    ]),
    // كبسولة أرقام (m4): ساعات الشغل بتعد
    S.text({ ...S.counter({ from: 0, to: 1240, at: T.clock + 0.4, dur: 3.2, digits: 'en' }), family: P.HEAD, weight: 800, size: px(40), fill: C.ink, x: px(905), y: px(770), opacity: { kf: [[T.clock + 0.3, 0], [T.clock + 0.4, 1]] },
      box: { fill: '#FFFFFF', radius: px(40), pad: [px(26), px(12)], shadow: { color: 'rgba(38,48,107,0.15)', blur: 18, y: 6 }, reveal: { at: T.clock + 0.3, spring: 'snappy', from: 'center' } } }),
    S.text({ text: 'ساعة شغل', family: P.BODY, weight: 500, size: px(34), fill: C.muted, x: px(905), y: px(828), reveal: { by: 'all', at: T.clock + 0.55, from: { y: px(14), opacity: 0 }, dur: 0.4, ease: 'quadOut' } }),

    // ظلال الأرض
    shadowEl(px(540), px(1462), px(760), T.legs),
    // أرجل الطاولة (A-frame متل m5)
    S.group({ ...land(T.legs, 0, { h: px(900), sound: 'hit', pitch: 0.7, gain: -21 }) }, [
      ...[px(250), px(830)].flatMap((x) => [
        S.line({ points: [[x - px(70), px(1460)], [x + px(10), deskY]], stroke: NAVY, strokeWidth: px(14), lineCap: 'round' }),
        S.line({ points: [[x + px(70), px(1460)], [x - px(10), deskY]], stroke: NAVY, strokeWidth: px(14), lineCap: 'round' }),
      ]),
    ]),
    // سطح الطاولة
    S.group({ x: px(540), ...land(T.desk, deskY, { sound: 'hit', pitch: 0.6, gain: -20 }) }, [
      S.rect({ w: px(800), h: px(30), radius: px(15), fill: WOOD }),
      S.rect({ w: px(800), h: px(10), radius: px(5), y: px(12), fill: WOOD_D }),
    ]),
    // الشاشة (إطار + ستاند)
    S.group({ x: monX, ...land(T.mon, monY, { h: px(1000), sound: 'hit', pitch: 0.8, gain: -21 }) }, [
      S.rect({ w: px(26), h: px(120), y: px(190), fill: '#3A438A' }),
      S.rect({ w: px(150), h: px(16), radius: px(8), y: px(222), fill: NAVY }),
      S.rect({ w: mw + px(20), h: mh + px(20), radius: px(22), fill: NAVY }),
      S.rect({ w: mw - px(10), h: mh - px(10), radius: px(12), fill: SCREEN }),
    ]),
    screenContent,
    // كيبورد
    S.group({ x: px(560), ...land(T.kb, deskY - px(22), { h: px(600), sound: 'click', gain: -23 }) }, [
      S.rect({ w: px(250), h: px(18), radius: px(9), fill: '#C7CDEB' }),
      ...Array.from({ length: 8 }, (_, i) => S.rect({ w: px(22), h: px(6), radius: px(3), x: -px(98) + i * px(28), y: -px(2), fill: '#9EA8DA' })),
    ]),
    // كاسة + بخار
    S.group({ x: px(345), ...land(T.mug, deskY - px(48), { h: px(650), sound: 'pop', pitch: 0.8, gain: -22 }) }, [
      S.rect({ w: px(64), h: px(74), radius: px(14), fill: C.red }),
      S.ellipse({ w: px(36), h: px(40), x: px(38), fill: null, stroke: C.red, strokeWidth: px(10) }),
      ...[0, 1].map((k) => S.path({ d: S.shapes.smoothPath([[0, 0], [px(12), -px(24)], [-px(8), -px(48)], [px(6), -px(70)]]), fill: null, stroke: '#C9C3E6', strokeWidth: px(7), lineCap: 'round', x: -px(14) + k * px(26), y: -px(50),
        trim: { at: T.mug + 0.9 + k * 0.2, from: [0, 0], to: [0, 1], dur: 0.6, ease: 'quadOut' }, opacity: { base: 0.9, wiggle: { freq: 0.8, amp: 0.25, seed: k } }, y: { base: -px(50), wiggle: { freq: 0.6, amp: px(5), seed: k + 3 } } })),
    ]),
    // لمبة مكتب: ذراع + راس أصفر + مخروط ضو
    S.group({ x: px(200), y: deskY - px(16), ...pop(T.lamp, 'default') }, [
      S.path({ d: `M${-px(120)},${-px(10)} L${px(10)},${-px(170)} L${px(150)},${-px(150)} L${px(220)},${px(60)} Z`, fill: 'rgba(255,197,49,0.18)', opacity: { kf: [[T.lamp + 0.6, 0], [T.lamp + 0.75, 1]] }, x: px(40), y: -px(110) }),
      S.ellipse({ w: px(110), h: px(18), fill: NAVY }),
      S.line({ points: [[0, 0], [-px(40), -px(150)], [px(40), -px(250)]], stroke: NAVY, strokeWidth: px(12), lineCap: 'round', lineJoin: 'round', trim: { at: T.lamp + 0.1, from: [0, 0], to: [0, 1], dur: 0.35, ease: 'quadOut' } }),
      S.path({ d: `M0,0 L${px(70)},${-px(30)} L${px(110)},${px(50)} Z`, fill: C.yellow, x: px(30), y: -px(255), rotation: { at: T.lamp + 0.4, from: -50, to: 0, spring: 'playful' }, scale: { at: T.lamp + 0.35, from: 0, to: 1, spring: 'playful' } }),
    ]),
    // نبتة: أصيص + ورق بيطلع
    S.group({ x: px(890), ...land(T.plant, deskY - px(56), { h: px(700), sound: 'pop', pitch: 0.7, gain: -22 }) }, [
      ...[[-35, 0.0], [20, 0.08], [-8, 0.16], [40, 0.22], [-55, 0.28]].map(([rot, d], i) => S.path({ d: `M0,0 C${-px(40)},${-px(60)} ${-px(10)},${-px(140)} 0,${-px(170) + i * px(10)} C${px(14)},${-px(120)} ${px(30)},${-px(60)} 0,0 Z`, fill: i % 2 ? TEAL : C.green, y: -px(40), rotation: rot,
        scale: { at: T.plant + 0.55 + d, from: 0, to: 1, spring: 'playful' }, origin: [0, 0] })),
      S.path({ d: `M${-px(52)},${-px(46)} L${px(52)},${-px(46)} L${px(40)},${px(56)} L${-px(40)},${px(56)} Z`, fill: '#F2994A' }),
      S.rect({ w: px(116), h: px(18), radius: px(6), y: -px(46), fill: '#E07D2B' }),
    ]),
    // تروس فوق الشاشة (أفكار شغالة)
    gear(px(420), px(745), px(46), C.green, T.gears, 1),
    gear(px(488), px(700), px(30), PINK, T.gears + 0.12, -1.5),
    gear(px(745), px(760), px(38), TEAL, T.gears + 0.24, 1.2),
    star(px(330), px(690), 18, T.gears + 0.35), star(px(790), px(690), 13, T.gears + 0.5), star(px(650), px(640), 10, T.gears + 0.62),
    // النص فوق
    S.text({ text: 'بالشغل… والتفاصيل', family: P.HEAD, weight: 900, size: px(104), fill: C.ink, x: S.cx, y: S.vh(14),
      reveal: { by: 'word', at: T.text, mask: true, from: { y: px(130), opacity: 0 }, dur: 0.7, ease: 'ae:85:33', stagger: { each: 0.14 } } }),
    S.text({ text: 'كل تفصيلة إلها وقتها', family: P.BODY, weight: 400, size: px(54), fill: C.muted, x: S.cx, y: S.vh(19.5),
      reveal: { by: 'word', at: T.text + 0.45, from: { y: px(20), opacity: 0 }, dur: 0.45, ease: 'ae:75:33', stagger: { each: 0.1 } } }),
  ];
  sfx.push({ kind: 'pop', at: T.win, gain_db: -24 }, { kind: 'pop', at: T.clock, params: { pitch: 1.2 }, gain_db: -23 }, { kind: 'sparkle', at: T.gears + 0.3, params: { dur: 0.7 }, gain_db: -26 }, { kind: 'pop', at: T.lamp, gain_db: -24 });

  // الغطسة بالشاشة: الكاميرا بتقرّب عمركز الشاشة لحد ما لونها يملى الكادر
  const ZIN = D - 1.25;
  sfx.push({ kind: 'whoosh', at: ZIN + 0.5, align: 'peak', params: { dur: 0.9, brightness: 0.7 }, gain_db: -18 });
  return {
    duration: D,
    background: '#F7F6FB',
    camera: {
      zoom: { kf: [[0, 1.16, 'ae:33:66'], [1.4, 1.1, 'sineInOut'], [ZIN, 1.13, 'ae:85:33'], [D - 0.12, 10.5, 'linear'], [D, 11]] },
      x: { kf: [[ZIN, 0, 'ae:85:33'], [D - 0.12, monX - S.cx]] },
      y: { kf: [[0, -px(70)], [ZIN, -px(70), 'ae:85:33'], [D - 0.12, monY - S.cy]] },
    },
    layers,
    sfx,
  };
}
