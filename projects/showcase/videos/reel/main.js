// ريل استوديو الموشن — "كل حرف إله روح"
// 100 BPM: beat = 0.6s، القطعات على بدايات الـ bars (انظر brief.md)

export default async (S) => {
  const C = S.colors;
  const beat = 60 / 100;
  const cuts = [0, 2.4, 4.8, 8.4, 10.8, 13.2, 16.8]; // بداية كل مشهد (على الإيقاع)
  const trs = [null, { type: 'whip', dur: 0.42, dir: 'right' }, { type: 'dip', dur: 0.5, color: C.primary }, { type: 'zoom', dur: 0.5 }, { type: 'cut' }, { type: 'iris', dur: 0.62, ring: C.accent }];
  // مدة كل مشهد بحيث نص الانتقال يقع على القطع بالضبط
  const half = (i) => (trs[i] && trs[i].type !== 'cut' ? trs[i].dur / 2 : 0);
  const scene = (i, layers) => ({
    duration: cuts[i + 1] + half(i + 1) - (cuts[i] - half(i)),
    transition: trs[i] ?? undefined,
    layers: layers(half(i)),
  });
  const X = S.safe.cx; // مركز المنطقة الآمنة (بعيد عن أزرار التطبيق يمين)
  const R = S.safe.right - S.px(20);

  // ── خلفية عامة بعمق: بقع ضوء بطيئة + حرف ضخم مفرّغ بعيد ──
  const background = [
    S.ellipse({ w: S.px(1100), x: { base: S.vw(78), wiggle: { freq: 0.12, amp: S.px(90), seed: 2 } }, y: { base: S.vh(22), wiggle: { freq: 0.1, amp: S.px(70), seed: 5 } },
      fill: { radial: { c: [0, 0], r: S.px(550) }, stops: [[0, C.primary + '40'], [1, C.primary + '00']] } }),
    S.ellipse({ w: S.px(1300), x: { base: S.vw(12), wiggle: { freq: 0.09, amp: S.px(80), seed: 9 } }, y: S.vh(84),
      fill: { radial: { c: [0, 0], r: S.px(650) }, stops: [[0, C.cool + '26'], [1, C.cool + '00']] } }),
    S.text({ text: 'ع', size: S.px(1500), weight: 900, x: S.vw(62), y: S.vh(58), z: 900, fill: 'transparent', stroke: C.text, strokeWidth: 2.5, opacity: 0.07,
      rotation: { base: -6, wiggle: { freq: 0.07, amp: 3, seed: 4 } }, sfx: false }),
  ];

  return {
    background: C.bg,
    camera: { zoom: { kf: [[0, 1.0], [16.8, 1.06, 'linear']] }, x: { base: 0, wiggle: { freq: 0.15, amp: S.px(10), seed: 1 } } },
    layers: background,
    post: {
      grain: { amount: 0.05, size: 1.6 }, vignette: { strength: 0.42, softness: 0.55 }, bloom: { strength: 0.35, threshold: 0.74, radius: 1.1 },
      chromatic: 0.0008, grade: { contrast: 1.06, temperature: 0.12, saturation: 1.04 },
    },
    scenes: [
      // ١ — Hook: "حرف" بيتجمّع، بعدين الكشيدة بتنفجر
      scene(0, (c) => [
        S.text({ text: 'كل', role: 'body', size: S.px(84), weight: 600, fill: C.muted, x: R, y: S.vh(35), anchor: 'start', ...S.fx.rise(c + 0.55, { size: 84 }) }),
        S.text({ text: 'حرف', size: S.px(330), weight: 900, x: X, y: S.vh(47),
          ...S.fx.assemble(c + 0.05, { size: 330, each: 0.07, spring: 'heavy' }),
          kashida: [{ word: 0, amount: { kf: [[c + 1.2, 0, 'snap'], [c + 1.55, S.px(135), 'smooth'], [c + 2.4, S.px(95)]] } }],
          sfx: [{ kind: 'whoosh', at: c + 0.35, align: 'peak', params: { dur: 0.7, weight: 1.3 } }, { kind: 'impact', at: c + 1.25, params: { weight: 1.1 }, gain_db: -3 }] }),
        S.rect({ x: X, y: S.vh(57), h: S.px(7), radius: 4, fill: C.primary, w: { kf: [[c + 1.25, 0, { spring: 'snappy' }], [c + 1.6, S.px(560)]] }, sfx: false }),
      ]),

      // ٢ — "إله روح" بالرقعة بتنرسم، ودائرة يدوية حول "روح"
      scene(1, (c) => [
        S.text({ text: 'إله روح', role: 'accent', size: S.px(220), fill: C.accent, stroke: C.accent, x: X, y: S.vh(46), lineHeight: 1.4,
          ...S.fx.draw(c + 0.05, { size: 220, each: 0.11, dur: 0.85, strokeWidth: 3 }),
          marks: [{ word: 1, type: 'circle', color: C.primary, at: c + 1.15, dur: 0.55, width: S.px(9) }] }),
        S.text({ text: 'خط يد حقيقي، حرف حرف', role: 'body', size: S.px(58), fill: C.muted, x: X, y: S.vh(60), ...S.fx.blurIn(c + 0.9, { size: 58 }) }),
      ]),

      // ٣ — أرقام: عدّاد + ٣ كروت بتدخل من اليمين
      scene(2, (c) => {
        const cards = [
          { icon: 'lucide:type', t: '٤٠ خط عربي' },
          { icon: 'lucide:audio-waveform', t: '١٩ مؤثر صوتي من الكود' },
          { icon: 'lucide:layers', t: 'تصدير لـ After Effects' },
        ];
        return [
          S.text({ ...S.counter({ from: 0, to: 125, at: c + 0.15, dur: 1.3, digits: 'ar' }), size: S.px(300), weight: 900, fill: C.primary, x: X, y: S.vh(25),
            scale: { at: c + 0.1, from: 0.7, to: 1, spring: 'heavy' }, opacity: { at: c + 0.1, from: 0, to: 1, dur: 0.25 } }),
          S.text({ text: 'انتقال سينمائي', role: 'body', size: S.px(64), x: X, y: S.vh(35.5), ...S.fx.maskRise(c + 0.5, { size: 64 }) }),
          S.particles({ count: 70, rate: 400, start: c + 1.45, life: [0.6, 1.3], emitter: { x: X, y: S.vh(25), r: S.px(60) }, angle: [0, 360], speed: [250, 900], drag: 2.2,
            gravity: [0, 260], size: [3, 9], color: [C.primary, C.accent, C.text], shape: 'spark', particleBlend: 'add', seed: 7 }),
          ...cards.map((cd, i) => {
            const at = c + 0.9 + i * 0.6; // كرت على كل beat
            return S.group({ x: { at, from: S.W + S.px(500), to: X, spring: 'default' }, y: S.vh(50 + i * 10.5), rotation: { at, from: -4, to: 0, spring: 'default' },
              sfx: { kind: 'whoosh', at: at + 0.12, align: 'peak', params: { dur: 0.45, brightness: 1.2 }, gain_db: -10 } }, [
              S.rect({ w: S.px(840), h: S.px(150), radius: S.px(34), fill: C.surface, stroke: C.text + '18', strokeWidth: 2 }),
              S.icon({ icon: cd.icon, size: S.px(72), color: C.accent, x: S.px(345), strokeWidth: 1.8, trim: { kf: [[at + 0.2, [0, 0]], [at + 0.75, [0, 1], 'smooth']] } }),
              S.text({ text: cd.t, role: 'body', size: S.px(56), weight: 600, x: S.px(275), y: S.px(4), anchor: 'start', ...S.fx.rise(at + 0.15, { size: 56, each: 0.04 }), sfx: false }),
            ]);
          }),
        ];
      }),

      // ٤ — "نَفَس": سماكة الخط بتتنفس (لحظة أهدى قبل الذروة)
      scene(3, (c) => [
        S.ellipse({ x: X, y: S.vh(45), w: S.px(640), fill: null, stroke: C.cool + '55', strokeWidth: 3,
          scale: { kf: [[c, 0.6, 'smooth'], [c + 0.9, 1.05, 'smooth'], [c + 1.6, 0.92, 'smooth'], [c + 2.4, 1.08]] }, opacity: { at: c, from: 0, to: 1, dur: 0.5 } }),
        S.text({ text: 'نَفَس', size: S.px(330), x: X, y: S.vh(45), fill: C.text,
          weight: { kf: [[c, 150, 'smooth'], [c + 0.9, 900, 'smooth'], [c + 1.6, 300, 'smooth'], [c + 2.4, 800]] },
          ...S.fx.blurIn(c, { size: 330, by: 'all', dur: 0.7 }), sfx: { kind: 'swell', at: c + 0.9, align: 'end', params: { dur: 0.8 }, gain_db: -14 } }),
        S.text({ text: 'خطوط متغيرة بتتنفس', role: 'body', size: S.px(58), fill: C.muted, x: X, y: S.vh(60), ...S.fx.rise(c + 0.6, { size: 54 }) }),
      ]),

      // ٥ — الذروة: ٣ كلمات على ٣ beats
      scene(4, (c) => {
        const words = [['صوت', C.text], ['صورة', C.accent], ['حركة', C.primary]];
        return words.map(([w, col], i) => S.text({ text: w, size: S.px(250), weight: 900, fill: col, x: i === 1 ? X + S.px(60) : X - S.px(50) * (i === 0 ? -1 : 1), y: S.vh(30 + i * 15),
          ...S.fx.slam(c + i * beat, { size: 250, from: 2.6 }),
          ...(i < 2 ? { opacity: { kf: [[c + (i + 1) * beat + 0.05, 1], [c + (i + 1) * beat + 0.3, 0.35]] } } : {}),
        }));
      }),

      // ٦ — الختام: علامة بتنرسم + الاسم
      scene(5, (c) => [
        S.ellipse({ x: X, y: S.vh(38), w: S.px(250), fill: null, stroke: C.primary, strokeWidth: S.px(9), trim: { kf: [[c + 0.2, [0, 0]], [c + 0.95, [0, 1], 'smooth']] }, rotation: -90 }),
        S.text({ text: 'م', size: S.px(150), weight: 900, x: X, y: S.vh(37.6), fill: C.text, ...S.fx.pop(c + 0.75, { size: 150 }) }),
        S.text({ text: 'استوديو الموشن', size: S.px(96), x: X, y: S.vh(51.5), ...S.fx.maskRise(c + 1.0, { size: 96, each: 0.1 }) }),
        S.text({ text: 'كل شي هون مصنوع بالكود', role: 'body', size: S.px(56), fill: C.muted, x: X, y: S.vh(59.5), ...S.fx.blurIn(c + 1.55, { size: 56 }) }),
      ]),
    ],
  };
};
