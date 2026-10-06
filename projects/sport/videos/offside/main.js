// "قصة التسلّل" — أول فيديو بكيت "الجزيرة رياضة" (مرجع r07): صور أبيض وأسود بقصاصات كريمية،
// أرشيف VHS بإطار أنبوب، أخضر عشب + ليموني، نص ثقيل بالكشيدة وتباين أوزان، قطع حاد، كاميرا دايماً عم تدفع.
// كل التوقيتات مشتقة من كلمات التعليق، فتبديل الصوت (Gemini) بيظبط كل شي لحاله.
export default async (S) => {
  const C = { green: '#20813f', greenD: '#14592b', lime: '#c8e62a', olive: '#3a3d2e', oliveD: '#2a2c21', line: '#16180f', paper: '#f6f7f2', cream: '#f1e3bf', ink: '#14160f', white: '#ffffff' };
  const HEAD = 'Al Jazeera', BODY = 'thmanyah sans', MONO = 'Courier Prime';
  const A = (n) => `assets/offside/${n}`;

  // ── التعليق: كل مقطع ورا التاني بفاصل صغير ──
  const ids = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'];
  const words = {}, start = {}, end = {};
  let tcur = 0.3;
  for (const id of ids) {
    words[id] = await (await fetch(S.asset(`videos/offside/vo/${id}.words.json`))).json();
    start[id] = tcur;
    end[id] = tcur + words[id].at(-1).end;
    tcur = end[id] + 0.45;
  }
  const W = (id, i) => start[id] + words[id][i].start;

  // ── القطعات (مطلقة) ──
  const cut = [
    0,
    W('v1', 1) - 0.08, // ٢ جدلاً
    start.v2 - 0.12, // ٣ ١٨٦٣
    W('v2', 6) - 0.1, // ٤ صارماً: المهاجم والخط
    W('v2', 13) - 0.4, // ٥ متسلّل: حامل الراية
    start.v3 - 0.1, // ٦ أرشيف
    W('v3', 3) - 0.1, // ٧ ثلاثة مدافعين
    W('v3', 10) - 0.1, // ٨ ١٩٢٥: ٣ ← ٢
    start.v4 - 0.1, // ٩ ١٩٩٠ ورق
    W('v4', 5) - 0.1, // ١٠ المتساوي
    start.v5 - 0.1, // ١١ الفار
    W('v5', 3) - 0.1, // ١٢ شبه الآلية
    W('v5', 10) - 0.1, // ١٣ ١٢ كاميرا
    W('v5', 13) - 0.1, // ١٤ ٢٩ نقطة
    W('v5', 21) - 0.15, // ١٥ ٥٠ مرة
    start.v6 - 0.1, // ١٦ ورغم كل هذه الدقة
    W('v6', 4) - 0.1, // ١٧ ما زال الجدل
    end.v6 + 1.1, // ١٨ ختام
  ];
  const total = cut.at(-1) + 2.6;
  const span = (i) => (cut[i + 1] ?? total) - cut[i];
  // مشهد: الطبقات بتاخد دالة تحويل الزمن المطلق للمحلي
  const shot = (i, bg, layers, o = {}) => ({
    duration: span(i), background: bg,
    camera: o.camera ?? { zoom: { kf: [[0, o.z0 ?? 1], [span(i), o.z1 ?? 1.06, 'linear']] }, rotation: { kf: [[0, 0], [span(i), o.rot ?? 0, 'linear']] } },
    layers: layers((abs) => abs - cut[i], span(i)),
  });

  // ── عناصر الكيت ──
  const X = S.cx, R = S.W - S.px(90);
  // شعار صغير ثابت فوق يسار
  const mark = (dark = true) => S.group({ x: S.px(170), y: S.px(170), decor: true }, [
    S.circle({ r: S.px(9), fill: C.lime, x: S.px(-30), y: S.px(4) }),
    S.text({ text: 'رياضة', family: HEAD, weight: 900, size: S.px(30), fill: dark ? C.white : C.ink, anchor: 'start', x: S.px(30), decor: true }),
  ]);
  // كتابة حرف حرف بتوهج أخضر (أسماء ومصطلحات فوق الصور)
  const glowType = (at, size) => ({ glow: { color: '#3dff7a', blur: size * 0.22, strength: 0.7 }, reveal: { by: 'char', at, from: { opacity: 0, blur: size * 0.06, x: size * 0.12 }, dur: 0.12, ease: 'quadOut', stagger: { each: 0.035, jitter: 0.2 } } });
  // عنوان ثقيل: كلمة كلمة بتطلع من ورا خط قص
  const heavy = (text, at, o = {}) => S.text({ text, family: HEAD, weight: 900, size: S.px(o.size ?? 150), fill: o.fill ?? C.white, x: o.x ?? X, y: o.y, anchor: o.anchor, lineHeight: 1.05, maxWidth: o.maxWidth ?? S.W * 0.86,
    ...S.fx.maskRise(at, { size: o.size ?? 150, each: 0.08, spring: 'snappy' }), ...(o.kash ? { kashida: [{ word: o.kash.word ?? 0, amount: { at: o.kash.at, from: 0, to: S.px(o.kash.to), spring: 'heavy' } }] } : {}), ...(o.extra ?? {}) });
  // كلمة خفيفة صغيرة (تباين الأوزان)
  const light = (text, at, o = {}) => S.text({ text, family: HEAD, weight: 300, size: S.px(o.size ?? 84), fill: o.fill ?? C.white, x: o.x ?? X, y: o.y, anchor: o.anchor, opacity: o.opacity ?? 0.92,
    ...S.fx.rise(at, { size: o.size ?? 84, by: 'all', spring: 'snappy' }), ...(o.extra ?? {}) });
  // سطور صدى بشفافية متناقصة (التقاطها × ٣)
  const echoLines = (text, at, o = {}) => [0, 1, 2].map((k) => S.text({ text, family: HEAD, weight: 900, size: S.px(o.size ?? 120), fill: o.fill ?? C.white, x: o.x ?? X, y: o.y + k * S.px((o.size ?? 120) * 1.0), anchor: o.anchor,
    opacity: [1, 0.5, 0.22][k], ...S.fx.maskRise(at + k * 0.09, { size: o.size ?? 120, by: 'all', spring: 'snappy' }) }));
  // قصاصة أبيض وأسود بحافة كريمية خشنة (+ خضرا ورا اختياري)
  const cutout = (src, o) => S.image({ src: S.asset(A(src)), fit: 'contain', x: o.x, y: o.y, w: o.w, tone: { contrast: o.contrast ?? 1.35, grain: 0.1, dither: o.dither ?? 0, seed: 5 },
    outline: [{ width: o.ow ?? 16, color: C.cream, rough: 0.9, offset: o.off ?? [6, 4], seed: o.seed ?? 3 }, ...(o.green ? [{ width: o.ow2 ?? 22, color: o.green, rough: 0.6, seed: 9 }] : [])],
    shadow: o.shadow ?? { color: 'rgba(0,0,0,.35)', blur: 28, y: 12 }, ...(o.extra ?? {}) });
  // كرة ليمونية ناعمة (الموتيف)
  const ball = (o) => S.group({ x: o.x, y: o.y, ...(o.extra ?? {}) }, [
    ...(o.shadow === false ? [] : [S.ellipse({ w: o.r * 2.1, h: o.r * 0.45, y: o.r * 1.05, fill: { radial: { c: [0, 0], r: o.r * 1.1 }, stops: [[0, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']] } })]),
    S.circle({ r: o.r, fill: { radial: { c: [-o.r * 0.35, -o.r * 0.4], r: o.r * 1.5 }, stops: [[0, o.c0 ?? '#efff9a'], [0.5, o.c1 ?? '#c2e324'], [1, o.c2 ?? '#5c8a12']] } }),
  ]);
  // ورقة مطبوعة بالآلة الكاتبة (خلفية وثائق)
  const doc = (title, o = {}) => S.group({ x: o.x ?? X, y: o.y ?? S.vh(52), opacity: o.opacity ?? 1, decor: true }, [
    S.text({ text: title, family: MONO, weight: 700, size: S.px(30), fill: o.ink ?? C.ink, x: 0, y: -S.px(560), decor: true }),
    S.text({ text: LOREM, family: MONO, weight: 400, size: S.px(19), lineHeight: 1.45, fill: o.ink ?? C.ink, x: 0, y: S.px(40), maxWidth: S.px(820), align: 'left', decor: true, opacity: 0.8 }),
  ]);
  // رسم نص ملعب (خطوط رفيعة)
  const pitch = (o = {}) => {
    const w = o.w ?? S.px(860), h = o.h ?? S.px(1250), col = o.color ?? C.line, sw = o.sw ?? S.px(3);
    const ln = (pts) => S.line({ points: pts, stroke: col, strokeWidth: sw, decor: true });
    return S.group({ x: o.x ?? X, y: o.y ?? S.vh(54), decor: true, ...(o.extra ?? {}) }, [
      S.rect({ w, h, fill: null, stroke: col, strokeWidth: sw }),
      ln([[-w / 2, -h / 2 + h * 0.5], [w / 2, -h / 2 + h * 0.5]]),
      S.ellipse({ w: w * 0.36, h: w * 0.36, y: 0, fill: null, stroke: col, strokeWidth: sw }),
      S.rect({ w: w * 0.6, h: h * 0.16, y: -h / 2 + h * 0.08, fill: null, stroke: col, strokeWidth: sw }),
      S.rect({ w: w * 0.28, h: h * 0.06, y: -h / 2 + h * 0.03, fill: null, stroke: col, strokeWidth: sw }),
      S.circle({ r: S.px(6), y: -h / 2 + h * 0.11, fill: col }),
    ]);
  };
  // صورة مدرجات باهتة ورا الرسومات الغامقة (طبقة عمق متل r07)
  const bgPhoto = (o = {}) => S.image({ src: S.asset(A(o.src ?? 'stands.png')), x: X, y: S.cy, w: S.W * 1.15, h: S.H * 1.15, fit: 'cover', tone: { contrast: 1.4, grain: 0.15 }, opacity: o.opacity ?? 0.14, blur: S.px(o.blur ?? 2), decor: true });
  // نقطة لاعب على الرسم
  const dot = (x, y, at, col, r = S.px(20)) => S.circle({ r, x, y, fill: col, stroke: C.ink, strokeWidth: S.px(3), scale: { at, from: 0, to: 1, spring: 'playful' }, sfx: { kind: 'pop', at, gain_db: -16 } });
  // أرشيف VHS: نتيجة فوق + وقت الشريط تحت
  const archive = (at, trimIn, o = {}) => [
    S.video({ src: S.asset(A('archive.mp4')), x: S.cx, y: S.cy, w: S.W, h: S.H, at, trimIn, rate: o.rate ?? 1, fit: 'cover', vhs: { res: 0.32, chroma: 3, noise: 0.07, saturation: 0.8, scanlines: 0.1 }, scale: o.mirror ? [-1.08, 1.08] : 1.08 }),
    S.group({ x: S.px(330), y: S.px(118), decor: true }, [
      S.rect({ w: S.px(330), h: S.px(46), fill: 'rgba(10,20,40,.75)' }),
      S.text({ text: 'ENG  1 - 0  SCO', family: 'Archivo', weight: 700, size: S.px(26), fill: '#e8eef8', decor: true }),
    ]),
    S.text({ text: { expr: (t) => tc(t + (o.tc0 ?? 12321)) }, family: 'JetBrains Mono', weight: 700, size: S.px(40), fill: '#eef2e8', x: S.W - S.px(220), y: S.H - S.px(150), decor: true, opacity: 0.85 }),
  ];
  const tc = (sec) => { const s = Math.floor(sec); const f = Math.floor((sec - s) * 25); return `${String(Math.floor(s / 3600) % 24).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(f).padStart(2, '0')}`; };
  // كابشن صغير فوق الأرشيف
  const cap = (text, at, dur) => S.text({ text, family: BODY, weight: 700, size: S.px(44), fill: C.white, x: X, y: S.vh(73.5), opacity: { kf: [[at, 0], [at + 0.08, 1], [at + dur, 1], [at + dur + 0.08, 0]] }, shadow: { color: 'rgba(0,0,0,.6)', blur: 10, y: 3 } });
  const tube = () => S.tube({ inset: S.px(92), bulge: S.px(118), top: 0, vignette: 0.5 });

  // طبقات ثابتة فوق الكاميرا: إطار الأنبوب + الشعار، حسب نوع كل لقطة
  const TUBE = [0, 2, 5, 6, 7, 10, 11, 12, 13, 14, 16], LIGHT = [3, 8];
  const overlay = [];
  for (let i = 0; i < cut.length; i++) {
    const win = { in: cut[i], out: cut[i + 1] ?? total };
    if (TUBE.includes(i)) overlay.push({ ...tube(), ...win });
    overlay.push({ ...mark(!LIGHT.includes(i)), ...win });
  }

  return {
    duration: total,
    overlay,
    background: C.oliveD,
    audio: {
      music: { style: 'tech', bpm: 117, gain_db: -16 },
      voice: ids.map((id) => ({ src: `videos/offside/vo/${id}.wav`, at: start[id] })),
      duck: { amount_db: 9 },
    },
    post: { grain: { amount: 0.06, size: 1.5 }, chromatic: { amount: 0.6 }, grade: { contrast: 1.06 } },
    scenes: [
      // ١. hook: أرشيف + "التسلّل" بتنكتب بتوهج + مثلث فوق المهاجم
      shot(0, '#000', (l) => [
        ...archive(0, 0.4),
        S.polygon({ sides: 3, r: S.px(26), rotation: 180, fill: '#3dff7a', x: S.px(560), glow: { color: '#3dff7a', blur: 20 }, opacity: { kf: [[0.25, 0], [0.32, 1]] }, y: { base: S.vh(44), wiggle: { freq: 1.6, amp: S.px(6) } } }),
        S.text({ text: 'التسلّل', family: HEAD, weight: 900, size: S.px(170), fill: C.white, x: X, y: S.vh(34), ...glowType(0.2, 170) }),
      ], { z1: 1.1 }),

      // ٢. أخضر + أرجل halftone + "القانون الأكثر / جدلاً" + كرة
      shot(1, C.green, (l, d) => [
        S.image({ src: S.asset(A('legs.png')), x: X, y: S.vh(20), w: S.W * 1.1, h: S.vh(46), fit: 'cover', focus: [0.5, 0.2], tone: { contrast: 1.6, halftone: { cell: 7, mix: 0.55 }, grain: 0.12 }, mask: S.path({ x: X, y: S.vh(20), d: S.shapes.smoothPath([[-S.W * 0.6, -S.vh(30)], [S.W * 0.6, -S.vh(30)], [S.W * 0.6, S.vh(4)], [S.px(230), S.vh(23)], [-S.px(230), S.vh(23)], [-S.W * 0.6, S.vh(4)]], true) }) }),
        light('القانونُ الأكثرُ', l(W('v1', 1)), { y: S.vh(45.5), size: 86 }),
        heavy('جدلاً', l(W('v1', 3)) - 0.05, { y: S.vh(57.5), size: 230, kash: { at: l(W('v1', 3)) + 0.25, to: 170 } }),
        ball({ x: X, y: { at: l(W('v1', 4)), from: S.H + 200, to: S.vh(78), spring: 'heavy' }, r: S.px(150), extra: { sfx: { kind: 'whoosh', at: l(W('v1', 4)) } } }),
      ], { z1: 1.05 }),

      // ٣. ١٨٦٣: ورقة قوانين + صورة الفريق + الرقم بالأخضر
      shot(2, C.oliveD, (l, d) => [
        doc('THE LAWS OF THE GAME  —  LONDON, 1863', { ink: '#d9d6c6', opacity: 0.35 }),
        S.image({ src: S.asset(A('team1863.png')), x: X, y: S.vh(40), w: S.px(900), h: S.px(600), fit: 'cover', tone: { contrast: 1.25, grain: 0.14, duotone: ['#151510', '#efe8d2'] }, outline: { width: 14, color: C.cream, rough: 0.5, seed: 4 },
          rotation: { at: 0.05, from: -6, to: -2.5, spring: 'default' }, scale: { at: 0.05, from: 0.8, to: 1, spring: 'heavy' }, shadow: { color: 'rgba(0,0,0,.5)', blur: 40, y: 18 }, sfx: { kind: 'shutter', at: 0.05 } }),
        light('وُلد عام', l(W('v2', 0)), { y: S.vh(60), size: 70, fill: C.cream }),
        S.text({ text: '1863', family: HEAD, weight: 900, size: S.px(330), fill: '#2fae55', x: X, y: S.vh(70.5),
          reveal: { by: 'char', at: l(W('v2', 2)), from: { opacity: 0, y: S.px(80), rotation: 12 }, spring: 'snappy', stagger: { each: 0.11, from: 'end' } }, sfx: { kind: 'impact', at: l(W('v2', 2)), gain_db: -10 } }),
      ], { z1: 1.08 }),

      // ٤. أبيض: المهاجم + خط الكرة: "أي لاعب يتقدّم على الكرة"
      shot(3, C.paper, (l, d) => {
        const tb = l(W('v2', 10)), lx = S.px(470);
        return [
          S.image({ src: S.asset(A('stands.png')), x: X, y: S.vh(58), w: S.W, h: S.vh(30), fit: 'cover', tone: { contrast: 1.1, brightness: 0.18, grain: 0.08 }, opacity: 0.4, decor: true,
            mask: S.rect({ x: X, y: S.vh(58), w: S.W, h: S.vh(30), fill: { linear: [[0, -S.vh(15)], [0, S.vh(15)]], stops: [[0, 'rgba(255,255,255,0)'], [0.3, '#fff'], [0.7, '#fff'], [1, 'rgba(255,255,255,0)']] } }) }),
          light('وكان صارماً', l(W('v2', 6)), { y: S.vh(20), size: 76, fill: C.ink }),
          // خط الكرة المتقطع
          S.line({ points: [[lx, S.vh(30)], [lx, S.vh(86)]], stroke: C.green, strokeWidth: S.px(5), dash: [S.px(18), S.px(14)], trim: { at: tb - 0.3, from: [0, 0], to: [0, 1], dur: 0.5, ease: 'quartOut' } }),
          ball({ x: lx, y: S.vh(83), r: S.px(42), shadow: false, extra: { scale: { at: tb - 0.4, from: 0, to: 1, spring: 'playful' } } }),
          cutout('striker1920-cut.png', { x: { kf: [[0.1, S.px(-400), { spring: 'heavy' }], [0.9, S.px(240)], [tb, S.px(330), 'sineInOut'], [tb + 0.6, S.px(330)], [d, S.px(300), 'linear']] }, y: { base: S.vh(60), wiggle: { freq: 2.2, amp: S.px(5), seed: 2 } }, w: S.px(470), green: C.green, extra: { rotation: { base: -2, wiggle: { freq: 1.1, amp: 1.5 } }, sfx: { kind: 'whoosh', at: 0.1 } } }),
          heavy('يتقدّم', tb, { y: S.vh(29), size: 150, fill: C.ink, x: S.px(700) }),
          light('على الكرة', tb + 0.35, { y: S.vh(37), size: 80, fill: C.green, x: S.px(700) }),
          ];
      }, { z1: 1.07 }),

      // ٥. أخضر: حامل الراية + "متسلّل" بصدى
      shot(4, C.green, (l) => [
        cutout('linesman-cut.png', { x: S.px(760), y: { at: 0, from: S.vh(74), to: S.vh(66), spring: 'default' }, w: S.px(600), off: [-8, 6], extra: { rotation: { at: 0, from: 6, to: 0, spring: 'default' } } }),
        ...echoLines('متسلّل', l(W('v2', 13)) - 0.05, { y: S.vh(30), size: 160, x: S.px(400) }),
      ], { z1: 1.06 }),

      // ٦. أرشيف: "بعد ثلاث سنوات"
      shot(5, '#000', (l, d) => [
        ...archive(0, 2.6, { mirror: true, tc0: 12360 }),
        cap('بعدَ ثلاثِ سنوات…', 0.15, d - 0.4),
      ], { z1: 1.12 }),

      // ٧. رسم الملعب: ثلاثة مدافعين أمام المهاجم
      shot(6, C.olive, (l, d) => {
        const t3 = l(W('v3', 6)), y0 = S.vh(36);
        return [
          bgPhoto(),
          doc('FA MINUTES  —  1866', { ink: '#141510', opacity: 0.22 }),
          pitch(),
          light('صار الشرطُ', l(W('v3', 3)), { y: S.vh(20), size: 84 }),
          dot(S.px(330), y0, t3, C.cream), dot(S.px(560), y0 + S.px(40), t3 + 0.12, C.cream), dot(S.px(760), y0 - S.px(20), t3 + 0.22, C.cream),
          S.line({ points: [[S.px(150), y0 + S.px(150)], [S.W - S.px(150), y0 + S.px(150)]], stroke: C.cream, strokeWidth: S.px(3), dash: [S.px(10), S.px(10)], trim: { at: t3 + 0.4, from: [0, 0], to: [0, 1], dur: 0.6, ease: 'quartOut' }, opacity: 0.8 }),
          ball({ x: S.px(500), y: y0 + S.px(330), r: S.px(26), shadow: false, extra: { scale: { at: l(W('v3', 9)), from: 0, to: 1, spring: 'playful' }, echo: { count: 5, step: 0.03 } } }),
          S.text({ text: '3', family: HEAD, weight: 900, size: S.px(420), fill: C.white, x: S.px(780), y: S.vh(70), ...S.fx.slam(t3 - 0.05, { size: 420, by: 'all', from: 1.8 }) }),
          light('مدافعين', t3 + 0.3, { y: S.vh(75.5), x: S.px(330), size: 90 }),
          ];
      }, { z1: 1.06, rot: -0.6 }),

      // ٨. ١٩٢٥: ٣ ← ٢ بسهم بينرسم
      shot(7, C.olive, (l, d) => {
        const tY = l(W('v3', 13)), t2 = l(W('v3', 18));
        return [
          bgPhoto(),
          pitch({ extra: { scale: 1.12 } }),
          S.text({ text: '1925', family: HEAD, weight: 900, size: S.px(190), fill: C.lime, x: X, y: S.vh(25),
            reveal: { by: 'char', at: tY, from: { opacity: 0, y: S.px(60) }, spring: 'snappy', stagger: { each: 0.09, from: 'end' } } }),
          S.text({ text: '3', family: HEAD, weight: 900, size: S.px(360), fill: C.white, x: S.px(330), y: S.vh(56), opacity: { kf: [[t2 - 0.1, 1], [t2 + 0.4, 0.35]] }, scale: { kf: [[t2 - 0.1, 1], [t2 + 0.4, 0.8, 'quartOut']] } }),
          S.path({ d: `M${S.px(420)},${S.vh(50)} C${S.px(560)},${S.vh(40)} ${S.px(700)},${S.vh(44)} ${S.px(760)},${S.vh(53)}`, fill: null, stroke: C.white, strokeWidth: S.px(8), lineCap: 'round', trim: { at: t2 - 0.45, from: [0, 0], to: [0, 1], dur: 0.45, ease: 'quartOut' }, sfx: { kind: 'swish', at: t2 - 0.45 } }),
          S.polygon({ sides: 3, r: S.px(22), fill: C.white, x: S.px(765), y: S.vh(54), rotation: 200, scale: { at: t2 - 0.02, from: 0, to: 1, spring: 'snappy' } }),
          S.text({ text: '2', family: HEAD, weight: 900, size: S.px(440), fill: C.white, x: S.px(790), y: S.vh(62), ...S.fx.slam(t2, { size: 460, by: 'all', from: 2 }), sfx: { kind: 'impact', at: t2, gain_db: -8 } }),
          heavy('اثنين فقط', t2 + 0.3, { y: S.vh(74), x: S.px(380), size: 100 }),
          ];
      }, { z0: 1.04, z1: 1.12 }),

      // ٩. ١٩٩٠: ورقة بيضا + أرقام ضخمة
      shot(8, C.paper, (l, d) => [
        doc('IFAB  —  LAW 11  —  AMENDMENT 1990', { ink: C.ink, opacity: 0.32 }),
        S.text({ text: '1990', family: HEAD, weight: 900, size: S.px(300), fill: '#867548', x: X, y: S.vh(42), blend: 'multiply',
          reveal: { by: 'char', at: l(W('v4', 2)) - 0.05, from: { opacity: 0, x: S.px(40) }, dur: 0.18, ease: 'quadOut', stagger: { each: 0.08, from: 'end' } }, y: { kf: [[l(W('v4', 2)), S.vh(44)], [d, S.vh(40), 'linear']] } }),
        light('القانون الحادي عشر', l(W('v4', 0)) + 0.1, { y: S.vh(58), size: 80, fill: C.ink, extra: { weight: 700, box: { fill: C.paper, pad: [S.px(20), S.px(6)] } } }),
      ], { z1: 1.05 }),

      // ١٠. المتساوي = سليم: مهاجم ومدافع على نفس الخط الليموني
      shot(9, C.green, (l, d) => {
        const te = l(W('v4', 7)), ts = l(W('v4', 13));
        return [
          S.image({ src: S.asset(A('stands.png')), x: X, y: S.vh(30), w: S.W, h: S.vh(40), fit: 'cover', tone: { duotone: [C.greenD, '#5fb27a'], contrast: 1.2 }, opacity: 0.45, decor: true }),
          cutout('defender-cut.png', { x: S.px(770), y: S.vh(60), w: S.px(540), extra: { x: { kf: [[0.05, S.px(1100), { spring: 'heavy' }], [0.8, S.px(770)], [d, S.px(745), 'linear']] } } }),
          cutout('striker-cut.png', { x: S.px(300), y: S.vh(61), w: S.px(560), off: [-6, 4], extra: { x: { kf: [[0.2, S.px(-300), { spring: 'heavy' }], [1.0, S.px(300)], [d, S.px(325), 'linear']] } } }),
          S.rect({ x: X, y: S.vh(78), w: { at: te, from: 0, to: S.W * 0.9, dur: 0.5, ease: 'quartOut' }, h: S.px(8), fill: C.lime, glow: { color: C.lime, blur: 18 }, sfx: { kind: 'swish', at: te } }),
          light('المتساوي مع آخر مدافع', te, { y: S.vh(17), size: 70 }),
          light('في وضعٍ', ts - 0.35, { y: S.vh(25), size: 80, x: S.px(700) }),
          heavy('سليم', ts, { y: S.vh(33), size: 200, x: S.px(430), kash: { at: ts + 0.3, to: 70 } }),
          ];
      }, { z1: 1.06 }),

      // ١١. الفار: حكم + مدرجات + كتابة متوهجة
      shot(10, '#000', (l, d) => [
        S.image({ src: S.asset(A('stands.png')), x: X, y: S.cy, w: S.W, h: S.H, fit: 'cover', tone: { contrast: 1.3, grain: 0.12 }, zoom: { kf: [[0, 1], [d, 1.1, 'linear']] }, blur: S.px(3) }),
        cutout('referee-cut.png', { x: S.px(600), y: S.vh(64), w: S.px(700), extra: { scale: { at: 0, from: 1.15, to: 1, spring: 'heavy' } } }),
        S.text({ text: 'الفار', family: HEAD, weight: 900, size: S.px(190), fill: C.white, x: S.px(600), y: S.vh(19), ...glowType(l(W('v5', 2)) - 0.1, 190) }),
      ], { z1: 1.08 }),

      // ١٢. التقنية شبه الآلية — قطر
      shot(11, C.oliveD, (l, d) => [
        bgPhoto(),
        pitch({ color: '#20231a', extra: { scale: 1.2, rotation: -8 } }),
        light('التقنيةُ', l(W('v5', 4)), { y: S.vh(32), size: 90 }),
        heavy('شبه الآلية', l(W('v5', 5)), { y: S.vh(42), size: 145, kash: { word: 1, at: l(W('v5', 6)) + 0.3, to: 70 } }),
        S.text({ text: 'QATAR 2022', family: 'Archivo', weight: 800, size: S.px(64), fill: C.lime, x: X, y: S.vh(55), tracking: 0.25,
          reveal: { by: 'char', at: l(W('v5', 9)) - 0.05, from: { opacity: 0 }, dur: 0.05, ease: 'linear', stagger: { each: 0.03 } } }),
      ], { z1: 1.07 }),

      // ١٣. ١٢ كاميرا: الكاميرا الضخمة + رقم
      shot(12, C.olive, (l, d) => [
        bgPhoto(),
        doc('SAOT  —  TECHNICAL BRIEF', { ink: '#141510', opacity: 0.22 }),
        S.image({ src: S.asset(A('camera-cut.png')), fit: 'contain', x: S.px(470), y: S.vh(46), w: S.px(900), tone: { contrast: 1.3, duotone: ['#0d0f0a', '#cfe8c4'] }, scale: { kf: [[0, 0.9, { spring: 'heavy' }], [0.6, 1], [d, 1.12, 'linear']] }, shadow: { color: 'rgba(0,0,0,.45)', blur: 40, y: 20 } }),
        S.text({ text: '12', family: HEAD, weight: 900, size: S.px(430), fill: C.white, x: S.px(680), y: S.vh(62), ...S.fx.slam(l(W('v5', 10)) + 0.05, { size: 460, by: 'all', from: 1.9 }), sfx: { kind: 'impact', at: l(W('v5', 10)) + 0.05, gain_db: -8 } }),
        light('كاميرا', l(W('v5', 12)), { y: S.vh(75), x: S.px(680), size: 90 }),
      ], { z1: 1.1 }),

      // ١٤. ٢٩ نقطة على جسد المهاجم
      shot(13, C.oliveD, (l, d) => {
        const tp = l(W('v5', 14));
        // نقاط التتبع على مفاصل الجسم الحقيقية (إحداثيات نسبية من صورة القصاصة)
        const J = { head: [0.52, 0.06], neck: [0.52, 0.15], sL: [0.34, 0.2], sR: [0.69, 0.2], eL: [0.2, 0.26], eR: [0.82, 0.24], wL: [0.09, 0.29], wR: [0.93, 0.26], hL: [0.04, 0.3], hR: [0.97, 0.27],
          chest: [0.52, 0.26], belly: [0.5, 0.35], hipL: [0.41, 0.43], hipR: [0.59, 0.43], pelvis: [0.5, 0.46], thL: [0.41, 0.53], thR: [0.56, 0.52], kL: [0.39, 0.61], kR: [0.53, 0.61],
          shL: [0.38, 0.67], shR: [0.53, 0.7], aL: [0.37, 0.72], aR: [0.52, 0.8], fL: [0.38, 0.75], fR: [0.5, 0.86], eyeL: [0.47, 0.06], eyeR: [0.56, 0.06], chin: [0.53, 0.1], back: [0.5, 0.2] };
        const bones = [['head', 'neck'], ['neck', 'sL'], ['neck', 'sR'], ['sL', 'eL'], ['eL', 'wL'], ['wL', 'hL'], ['sR', 'eR'], ['eR', 'wR'], ['wR', 'hR'], ['neck', 'chest'], ['chest', 'belly'], ['belly', 'pelvis'], ['pelvis', 'hipL'], ['pelvis', 'hipR'], ['hipL', 'thL'], ['thL', 'kL'], ['kL', 'shL'], ['shL', 'aL'], ['aL', 'fL'], ['hipR', 'thR'], ['thR', 'kR'], ['kR', 'shR'], ['shR', 'aR'], ['aR', 'fR']];
        const cx0 = S.px(380), cy0 = S.vh(56), w0 = S.px(720), h0 = w0 * 940 / 688;
        const P = (k) => [cx0 + (J[k][0] - 0.5) * w0, cy0 + (J[k][1] - 0.5) * h0];
        const keys = Object.keys(J);
        return [
          cutout('striker-cut.png', { x: cx0, y: cy0, w: w0, extra: { opacity: 0.95 } }),
          ...bones.map(([a, b], k) => S.line({ points: [P(a), P(b)], stroke: C.lime, strokeWidth: S.px(3), opacity: 0.7, trim: { at: tp + 0.5 + k * 0.025, from: [0, 0], to: [0, 1], dur: 0.25, ease: 'quadOut' }, decor: true })),
          ...keys.map((k, n) => S.circle({ r: S.px(10), x: P(k)[0], y: P(k)[1], fill: C.lime, stroke: C.ink, strokeWidth: S.px(2), glow: { color: C.lime, blur: 12 }, scale: { at: tp + n * 0.03 + (n % 3) * 0.012, from: 0, to: 1, spring: 'snappy' }, sfx: n % 6 === 0 ? { kind: 'tick', at: tp + n * 0.03 } : false })),
          S.text({ text: '29', family: HEAD, weight: 900, size: S.px(340), fill: C.white, x: S.px(740), y: S.vh(26), ...S.fx.slam(tp + 0.05, { size: 420, by: 'all', from: 1.8 }) }),
          light('نقطة', l(W('v5', 16)), { y: S.vh(35), x: S.px(780), size: 90 }),
          light('في جسد كل لاعب', l(W('v5', 18)), { y: S.vh(15), x: S.px(720), size: 62 }),
          ];
      }, { z1: 1.06 }),

      // ١٥. ٥٠ مرة بالثانية: كرة بصدى بتطير
      shot(14, C.olive, (l, d) => [
        bgPhoto(),
        pitch({ extra: { scale: 1.3 } }),
        S.text({ text: '50', family: HEAD, weight: 900, size: S.px(560), fill: C.white, x: X, y: S.vh(46), ...S.fx.slam(0.05, { size: 560, by: 'all', from: 1.8 }) }),
        light('مرةً في الثانية', l(W('v5', 22)), { y: S.vh(60), size: 90 }),
        ball({ r: S.px(70), shadow: false, x: { at: 0.2, from: S.px(-150), to: S.W + S.px(200), dur: d - 0.2, ease: 'quadIn' }, y: { at: 0.2, from: S.vh(80), to: S.vh(18), dur: d - 0.2, ease: 'sineOut' }, extra: { echo: { count: 6, step: 0.04, decay: 0.6 }, sfx: { kind: 'whoosh', at: d * 0.5 } } }),
      ], { z1: 1.12 }),

      // ١٦. ورغم كل هذه الدقة: حامل الراية بالأخضر
      shot(15, C.green, (l, d) => [
        S.image({ src: S.asset(A('legs.png')), x: X, y: S.vh(84), w: S.W, h: S.vh(32), fit: 'cover', focus: [0.5, 0.9], tone: { contrast: 1.6, halftone: { cell: 7, mix: 0.5 } }, opacity: 0.5, decor: true }),
        cutout('linesman-cut.png', { x: S.px(320), y: S.vh(58), w: S.px(520), green: C.greenD, extra: { scale: [-1, 1], x: { at: 0, from: S.px(250), to: S.px(320), dur: d, ease: 'linear' } } }),
        light('ورغمَ كلِّ', l(W('v6', 0)), { y: S.vh(24), x: S.px(700), size: 86 }),
        heavy('هذه الدقّة', l(W('v6', 2)), { y: S.vh(33), x: S.px(630), size: 128 }),
      ], { z1: 1.05 }),

      // ١٧. أرشيف: ما زال الجدل قائماً
      shot(16, '#000', (l, d) => [
        ...archive(0, 0.1, { rate: 0.8, tc0: 12399 }),
        light('ما زال الجدلُ', l(W('v6', 4)), { y: S.vh(34.5), size: 92 }),
        heavy('قائماً', l(W('v6', 7)) - 0.05, { y: S.vh(46), size: 220, kash: { at: l(W('v6', 7)) + 0.35, to: 150 } }),
      ], { z1: 1.1 }),

      // ١٨. ختام: الكرة بتتدحرج لركن الملعب
      shot(17, C.oliveD, (l, d) => [
        bgPhoto(),
        pitch({ color: '#15170f' }),
        ball({ r: S.px(30), shadow: false, x: { at: 0.1, from: X, to: S.px(160) + S.px(40), dur: 1.1, ease: 'quartOut' }, y: { at: 0.1, from: S.vh(54), to: S.vh(54) - S.px(625) + S.px(30), dur: 1.1, ease: 'quartOut' }, extra: { echo: { count: 5, step: 0.035 } } }),
        light('قصة', 0.5, { y: S.vh(44.5), size: 80 }),
        heavy('التسلّل', 0.7, { y: S.vh(54), size: 190, kash: { at: 1.1, to: 120 } }),
      ], { z1: 1.04 }),
    ],
  };
};

const LOREM = `In the event of the ball being kicked by a player, any one of the same side who is nearer to the opponents' goal line is out of play, and may not touch the ball himself, nor in any way whatever prevent any other player from doing so, until the ball has been played. A player is not out of play when the ball is kicked from behind the goal line. The committee have considered the question raised by member associations regarding the interpretation of this law, and have resolved that the following shall apply from the beginning of the coming season. When a player plays the ball, an opponent who is level with the second-last defender is to be considered onside. Referees are instructed to apply the benefit of the doubt in favour of the attacking side.`;
