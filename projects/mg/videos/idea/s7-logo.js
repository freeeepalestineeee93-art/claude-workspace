// مشهد ٧ — الختام: iris من الأحمر للأبيض، وشعار بيتجمّع من نفس عناصر الفيديو (مربع أزرق + لمبة + شرارة حمرا + نقطة صفرا)،
// الاسم بيدخل من اليمين بقناع، والشعار بيتنفس بهدوء.
export function logoScene(S, P, D) {
  const { C } = P;
  const px = S.px;
  const mx = S.cx, my = S.vh(41);
  const T = { box: 0.35, bulb: 0.75, spark: 1.05, dot: 1.2, name: 1.35, tag: 1.85, line: 2.1 };
  const sfx = [
    { kind: 'whoosh', at: 0.05, align: 'peak', params: { dur: 0.6, brightness: 0.7 }, gain_db: -20 },
    { kind: 'pop', at: T.box + 0.1, params: { pitch: 0.65 }, gain_db: -20 },
    { kind: 'pop', at: T.bulb + 0.05, params: { pitch: 1.0 }, gain_db: -22 },
    { kind: 'swish', at: T.spark, gain_db: -22 },
    { kind: 'chime', at: T.name + 0.35, gain_db: -21 },
  ];
  const mark = S.group({ x: mx, y: my, scale: { base: 1, wiggle: { freq: 0.3, amp: 0.008, seed: 5 } } }, [
    // ظل ناعم
    S.rect({ w: px(260), h: px(260), radius: px(70), x: -px(14), y: px(24), fill: 'rgba(28,36,80,0.16)', blur: px(16), scale: { at: T.box, from: 0, to: 1, spring: 'heavy' }, rotation: { at: T.box, from: -90, to: 0, spring: 'heavy' } }),
    S.rect({ w: px(260), h: px(260), radius: px(70), fill: C.blue, spray: { angle: 40, start: 0.55, amount: 0.7 }, scale: { at: T.box, from: 0, to: 1, spring: 'heavy' }, rotation: { at: T.box, from: -90, to: 0, spring: 'heavy' } }),
    // اللمبة البيضا: دائرة + قاعدة بخطين
    S.circle({ r: px(70), y: -px(28), fill: '#FFFFFF', scale: { at: T.bulb, from: 0, to: 1, spring: 'playful' } }),
    S.rect({ w: px(64), h: px(52), radius: px(10), y: px(52), fill: '#FFFFFF', scale: { at: T.bulb + 0.12, from: [1, 0], to: [1, 1], spring: 'snappy' }, origin: [0, -px(26)] }),
    ...[0, 1].map((k) => S.rect({ w: px(64), h: px(8), y: px(46) + k * px(18), fill: C.blue, opacity: { kf: [[T.bulb + 0.2, 0], [T.bulb + 0.3, 1]] } })),
    // شرارة حمرا (مثلث) بتطير لزاوية الشعار
    S.polygon({ sides: 3, r: px(56), fill: C.red, x: { at: T.spark, from: px(500), to: px(118), spring: 'default' }, y: { at: T.spark, from: -px(500), to: -px(118), spring: 'default' }, rotation: { at: T.spark, from: 240, to: 20, spring: 'default' } }),
    S.circle({ r: px(22), fill: C.yellow, x: -px(124), y: px(122), scale: { at: T.dot, from: 0, to: 1, spring: 'playful' } }),
  ]);
  return {
    duration: D,
    background: '#F7F6F2',
    transition: { type: 'iris', dur: 0.75, ease: 'ae:85:33', at: [S.cx, S.cy] },
    camera: { zoom: { kf: [[0, 1.06, 'ae:33:66'], [D, 1.0]] } },
    layers: [
      // دوائر باهتة بالخلفية
      ...[px(380), px(560)].map((r, i) => S.circle({ r, x: mx, y: my, fill: null, stroke: '#E6E3DA', strokeWidth: px(3), scale: { at: 0.4 + i * 0.15, from: 0.7, to: 1, spring: 'gentle' }, opacity: { kf: [[0.4 + i * 0.15, 0], [0.8 + i * 0.15, 1]] } })),
      mark,
      S.text({ text: 'استوديو الموشن', family: P.HEAD, weight: 900, size: px(124), fill: C.ink, x: S.cx, y: S.vh(60),
        reveal: { by: 'word', at: T.name, mask: true, from: { x: px(120), opacity: 0 }, dur: 0.7, ease: 'ae:85:33', stagger: { each: 0.12 } } }),
      S.rect({ w: px(90), h: px(8), radius: px(4), x: S.cx, y: S.vh(65.8), fill: C.red, scale: { at: T.line, from: [0, 1], to: [1, 1], spring: 'snappy' } }),
      S.text({ text: 'من الفكرة… للحركة', family: P.BODY, weight: 400, size: px(60), fill: C.muted, x: S.cx, y: S.vh(70.5),
        reveal: { by: 'word', at: T.tag, from: { y: px(26), opacity: 0 }, dur: 0.5, ease: 'ae:75:33', stagger: { each: 0.12 } } }),
    ],
    sfx,
  };
}
