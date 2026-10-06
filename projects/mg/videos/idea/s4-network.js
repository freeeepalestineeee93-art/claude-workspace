// مشهد ٤ — Isometric + شبكة (أسلوب m4): الشاشة بتصير موبايل واقف، بيميل وبيتمدد isometric،
// خطوط متقطعة بتطلع منه لدوائر ناس، كبسولات أرقام بتعد، وإشعارات. خلفية بخطوط دوائر خفيفة.
export function networkScene(S, P, D) {
  const { C } = P;
  const sfx = [];
  const px = S.px;
  const BG = '#E7ECFF', NAVY = '#26306B', PINK = '#F2558F', TEAL = '#1FB5A3';
  const cx = S.cx, cy = S.vh(55);
  const ISO = 0.5774;
  const T = { phone: 0.1, tilt: 0.85, lines: 1.7, text: 1.0, exit: D - 0.9 };

  // الموبايل: بيبلش واقف (نفس حجم الشاشة اللي غطسنا فيها تقريباً) وبيميل لـ isometric
  const pw = px(330), ph = px(620);
  const phoneFace = [
    S.rect({ w: pw, h: ph, radius: px(54), fill: NAVY }),
    S.rect({ w: pw - px(26), h: ph - px(26), radius: px(42), fill: '#FFFFFF' }),
    S.rect({ w: px(90), h: px(18), radius: px(9), y: -ph / 2 + px(32), fill: NAVY }),
    // واجهة التطبيق: أيقونة الصاروخ + عنوان + زر
    S.rect({ w: px(150), h: px(150), radius: px(38), y: -px(120), fill: C.blue }),
    S.polygon({ sides: 3, r: px(40), y: -px(160), fill: C.red, scale: [0.95, 0.75] }),
    S.rect({ w: px(54), h: px(90), radius: px(27), y: -px(108), fill: '#FFFFFF' }),
    S.circle({ r: px(14), y: -px(120), fill: C.blue }),
    S.rect({ w: px(200), h: px(20), radius: px(10), y: px(10), fill: '#D3DBFF' }),
    S.rect({ w: px(140), h: px(16), radius: px(8), y: px(46), fill: '#E6EAFB' }),
    S.rect({ w: px(220), h: px(64), radius: px(32), y: px(140), fill: C.red, scale: { kf: [[T.lines + 0.2, 1], [T.lines + 0.3, 0.9, 'quadOut'], [T.lines + 0.5, 1.04, 'quadOut'], [T.lines + 0.65, 1]] } }),
    S.rect({ w: px(110), h: px(16), radius: px(8), y: px(140), fill: '#FFFFFF' }),
  ];
  const tilt = { kf: [[T.tilt, 0, 'ae:75:33'], [T.tilt + 0.9, 1]] };
  const tv = (a, b) => ({ kf: tilt.kf.map(([t, k, e]) => { const v = typeof a === 'number' ? a + (b - a) * k : a.map((x, i) => x + (b[i] - x) * k); return e ? [t, v, e] : [t, v]; }) });
  // سماكة الموبايل: نسخ غامقة نازلة لتحت (بتظهر مع الميلان)
  const slab = Array.from({ length: 9 }, (_, i) => S.group({ y: tv(0, px(4) * (i + 1)) }, [S.group({ rotation: tv(0, -45), scale: tv([1, 1], [1, 1]) }, [S.rect({ w: pw, h: ph, radius: px(54), fill: i < 8 ? '#1B2152' : '#141838' })])]));
  const phone = S.group({ x: cx, y: { kf: [[T.phone, cy + px(40), 'ae:66:33'], [T.tilt + 0.9, cy + px(40)], [T.exit, cy + px(40), 'ae:85:33'], [D, cy + px(40) + S.H]] }, scale: { kf: [[0, 2.05, 'ae:33:85'], [T.tilt, 1.15, 'ae:75:33'], [T.tilt + 0.9, 1]] } }, [
    // ظل أرضي ناعم
    S.ellipse({ w: px(560), h: px(300), y: px(90), fill: 'rgba(38,48,107,0.10)', blur: px(30), opacity: tv(0, 1) }),
    S.group({ scale: tv([1, 1], [1, ISO]) }, [...slab.map((g) => g), S.group({ rotation: tv(0, -45) }, phoneFace)]),
  ]);
  sfx.push({ kind: 'whoosh', at: T.tilt + 0.3, align: 'peak', params: { dur: 0.7, brightness: 0.6 }, gain_db: -20 }, { kind: 'hit', at: T.tilt + 0.9, params: { pitch: 0.8 }, gain_db: -23 }, { kind: 'click', at: T.lines + 0.3, gain_db: -23 });

  // ناس حوالين (أفاتار: راس + كتاف بلون خلفية مختلف)
  const people = [
    { x: px(215), y: S.vh(38), c: C.yellow, skin: '#F2C29B', hair: NAVY, d: 0.0 },
    { x: px(865), y: S.vh(37), c: PINK, skin: '#C98B63', hair: '#3A2418', d: 0.15 },
    { x: px(140), y: S.vh(67), c: TEAL, skin: '#E8B48C', hair: '#1C1E2B', d: 0.3 },
    { x: px(930), y: S.vh(68), c: C.blue, skin: '#F1C7A5', hair: '#7A3E1D', d: 0.45 },
    { x: px(540), y: S.vh(83), c: C.red, skin: '#D69A70', hair: '#1C1E2B', d: 0.6 },
  ];
  const avatar = (p, at) => S.group({ x: p.x, y: { base: p.y, wiggle: { freq: 0.4, amp: px(6), seed: Math.round(p.x) } }, scale: { at, from: 0, to: 1, spring: 'playful' } }, [
    S.circle({ r: px(78), fill: '#FFFFFF', shadow: { color: 'rgba(38,48,107,0.16)', blur: 22, y: 8 } }),
    S.group({ isolate: true, mask: S.circle({ r: px(66) }) }, [
      S.circle({ r: px(66), fill: p.c }),
      S.ellipse({ w: px(110), h: px(80), y: px(62), fill: NAVY }),
      S.circle({ r: px(26), y: -px(4), fill: p.skin }),
      S.path({ d: `M${-px(27)},${-px(6)} Q${-px(26)},${-px(36)} 0,${-px(36)} Q${px(26)},${-px(36)} ${px(27)},${-px(6)} Q${px(16)},${-px(22)} 0,${-px(22)} Q${-px(16)},${-px(22)} ${-px(27)},${-px(6)} Z`, fill: p.hair }),
    ]),
  ]);
  const lineTo = (p, at) => {
    const mx = (cx + p.x) / 2 + (p.x < cx ? -px(60) : px(60)), my = (cy + p.y) / 2 - px(40);
    return S.path({ d: `M${cx},${cy} Q${mx},${my} ${p.x},${p.y}`, fill: null, stroke: NAVY, strokeWidth: px(5), dash: [px(12), px(12)], dashOffset: (t) => -t * px(40), opacity: 0.55,
      trim: { at, from: [0, 0], to: [0, 1], dur: 0.5, ease: 'ae:33:75' } });
  };
  const net = [];
  people.forEach((p, i) => {
    const at = T.lines + p.d;
    net.push(lineTo(p, at));
    sfx.push({ kind: 'pop', at: at + 0.45, params: { pitch: 0.9 + i * 0.08 }, gain_db: -24 });
  });
  const avatars = people.map((p, i) => avatar(p, T.lines + p.d + 0.42));
  // كبسولات أرقام + إشعارات (m4)
  const pill = (x, y, to, label, at, col) => S.group({ x, y, scale: { at, from: 0, to: 1, spring: 'snappy' } }, [
    S.text({ ...S.counter({ from: 0, to, at: at + 0.1, dur: 2.2, digits: 'en', group: true }), family: P.HEAD, weight: 800, size: px(38), fill: C.ink, x: px(20),
      box: { fill: '#FFFFFF', radius: px(36), pad: [px(26), px(12)], shadow: { color: 'rgba(38,48,107,0.14)', blur: 18, y: 6 } } }),
    S.circle({ r: px(24), x: -px(92), fill: col }),
    S.icon({ icon: label, size: px(28), color: '#FFFFFF', x: -px(92), strokeWidth: 2.4 }),
  ]);
  const pills = [
    pill(px(250), S.vh(46), 12480, 'lucide:heart', T.lines + 1.1, PINK),
    pill(px(850), S.vh(52.5), 3260, 'lucide:download', T.lines + 1.3, C.blue),
    pill(px(780), S.vh(77.5), 980, 'lucide:share-2', T.lines + 1.5, TEAL),
  ];
  sfx.push({ kind: 'count', at: T.lines + 1.2, gain_db: -26 }, { kind: 'chime', at: T.lines + 3.3, gain_db: -25 });

  // خلفية: دوائر وخطوط باهتة (متل m4)
  const bgLines = [
    ...[px(260), px(420), px(600)].map((r, i) => S.circle({ r, x: cx, y: cy, fill: null, stroke: '#D5DCF8', strokeWidth: px(3), scale: { at: 0.6 + i * 0.12, from: 0.6, to: 1, spring: 'gentle' }, opacity: { kf: [[0.6 + i * 0.12, 0], [1.0 + i * 0.12, 1]] } })),
    ...[[90, 300], [990, 260], [120, 1700], [960, 1660], [520, 330]].map(([x, y], i) => S.circle({ r: px(7), x: px(x), y: px(y), fill: [PINK, TEAL, C.yellow, C.blue, C.red][i], scale: { at: 1.2 + i * 0.1, from: 0, to: 1, spring: 'playful' } })),
  ];

  // خروج: الكل بيتجمع لعند الموبايل وبيصغر (والموبايل بينزل لتحت)
  const gather = (children) => S.group({ x: cx, y: cy, scale: { kf: [[T.exit, 1, 'ae:85:33'], [D, 0.0]] }, opacity: { kf: [[D - 0.3, 1], [D, 0]] } }, [S.group({ x: -cx, y: -cy }, children)]);
  sfx.push({ kind: 'whoosh', at: T.exit + 0.4, align: 'peak', params: { dur: 0.8, brightness: 0.9 }, gain_db: -19 });

  return {
    duration: D,
    background: BG,
    camera: { zoom: { kf: [[0, 1.0], [T.tilt + 0.9, 1.0], [T.exit, 1.05, 'sineInOut']] }, rotation: { kf: [[T.tilt + 0.9, 0], [T.exit, -1.2, 'sineInOut']] } },
    layers: [
      ...bgLines,
      gather([...net, ...avatars, ...pills]),
      phone,
      S.text({ text: 'وبتوصل للناس', family: P.HEAD, weight: 900, size: px(118), fill: C.ink, x: cx, y: S.vh(14),
        reveal: { by: 'word', at: T.text, mask: true, from: { y: px(140), opacity: 0 }, dur: 0.7, ease: 'ae:85:33', stagger: { each: 0.13 } },
        exit: { by: 'word', at: T.exit, to: { y: -px(60), opacity: 0 }, dur: 0.35, ease: 'quadIn', stagger: { each: 0.05 } } }),
      S.text({ text: 'من شاشة… لآلاف الشاشات', family: P.BODY, weight: 400, size: px(54), fill: '#6A7194', x: cx, y: S.vh(20),
        reveal: { by: 'word', at: T.text + 0.45, from: { y: px(20), opacity: 0 }, dur: 0.45, ease: 'ae:75:33', stagger: { each: 0.1 } },
        exit: { by: 'all', at: T.exit, to: { opacity: 0 }, dur: 0.3, ease: 'quadIn' } }),
    ],
    sfx,
  };
}
