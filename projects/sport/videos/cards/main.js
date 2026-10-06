// "قصة البطاقة الصفراء والحمراء" — أول فيديو مبني على Creative DNA (كيت رياضة) مش على نسخ مرجع.
// المبادئ: الطاقة من الطبقات والكاميرا (subject punch، graphic punch)، النص بسيط (slide+fade)، لون انتقائي، قطع حاد،
// خربشات ماركر 12fps، أرشيف بإطار أنبوب. صوت Gemini (Charon). كل التوقيتات من كلمات التعليق.
import { kit, C, F } from '../../kit.js';

export default async (S) => {
  const K = kit(S);
  const A = (n) => `assets/cards/${n}`;

  // ── التعليق ──
  const ids = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'];
  const words = {}, start = {}, end = {};
  let tc = 0.35;
  for (const id of ids) {
    words[id] = await (await fetch(S.asset(`videos/cards/vo/${id}.words.json`))).json();
    start[id] = tc; end[id] = tc + words[id].at(-1).end;
    tc = end[id] + (id === 'v3' ? 0.25 : 0.45);
  }
  const W = (id, i) => start[id] + words[id][i].start;

  // ── القطعات ──
  const cut = [
    0,                       // ١ 1966 ملعب
    W('v1', 5) - 0.1,        // ٢ ربع نهائي كأس العالم (رسم)
    W('v1', 10) - 0.18,      // ٣ طُرد: hero punch على القائد
    start.v2 - 0.08,         // ٤ رفض الخروج: ماركر
    W('v2', 3) - 0.1,        // ٥ لم يفهم: الحكم الألماني
    W('v2', 9) - 0.1,        // ٦ دقائق طويلة: ساعة + صدى
    start.v3 - 0.05,         // ٧ لندن ليلاً
    W('v3', 3) - 0.1,        // ٨ كين أستون بالسيارة
    W('v3', 11) - 0.1,       // ٩ إشارة المرور
    start.v4 - 0.04,         // ١٠ أصفر
    W('v4', 2) - 0.06,       // ١١ أحمر
    start.v5 - 0.1,          // ١٢ المكسيك 1970
    W('v5', 7) - 0.12,       // ١٣ رُفعت البطاقات: الحكم
    start.v6 - 0.1,          // ١٤ أول بطاقة حمراء (رسم)
    W('v6', 9) - 0.1,        // ١٥ 1974 ورق
    W('v6', 14) - 0.15,      // ١٦ كاسيلي
    start.v7 - 0.1,          // ١٧ الختام
  ];
  const total = end.v7 + 2.4;
  const span = (i) => (cut[i + 1] ?? total) - cut[i];
  const TUBE = [0, 2, 6, 7, 8, 11, 12];
  const LIGHT = [14];
  const shot = (i, bg, layers, camera) => ({ duration: span(i), background: bg, ...(camera ? { camera } : {}), layers: layers((abs) => abs - cut[i], span(i)) });

  const overlay = [];
  for (let i = 0; i < cut.length; i++) {
    const win = { in: cut[i], out: cut[i + 1] ?? total };
    if (TUBE.includes(i)) overlay.push({ ...K.tube(), ...win });
    overlay.push({ ...K.mark(!LIGHT.includes(i)), ...win });
  }

  const LOREM = 'Law XII. A player shall be cautioned if he persistently infringes the Laws of the Game, shows by word or action dissent from any decision given by the Referee, or is guilty of ungentlemanly conduct. A player shall be sent off the field of play if, in the opinion of the Referee, he is guilty of violent conduct or serious foul play, or persists in misconduct after having received a caution.';

  return {
    duration: total,
    overlay,
    background: C.oliveD,
    audio: {
      music: { style: 'tech', bpm: 117, gain_db: -17 },
      voice: ids.map((id) => ({ src: `videos/cards/vo/${id}.wav`, at: start[id] })),
      duck: { amount_db: 9 },
    },
    post: { grain: { amount: 0.055, size: 1.4 }, chromatic: { amount: 0.5 }, grade: { contrast: 1.05 } },
    scenes: [
      // ١. HOOK: ملعب 1966 + دفعة كاميرا بأول 0.3s + "1966" خانات من الآخر
      shot(0, '#000', (l, d) => [
        K.photo(A('stadium1966.png'), { contrast: 1.25 }),
        K.light('عامَ', 0.25, { y: S.vh(55.5), x: S.px(860), size: 100 }),
        K.digits('1966', 0.45, { y: S.vh(67), size: 300, fill: '#3fd06a', shadow: { color: 'rgba(0,0,0,.75)', blur: 30, y: 6 } }),
      ], K.graphicPunch(span(0), 0.45)),

      // ٢. ربع نهائي كأس العالم: أخضر + كرة بصدى
      shot(1, C.green, (l, d) => [
        K.photo(A('stadium1966.png'), { contrast: 1.3, opacity: 0.18 }),
        K.light('ربعُ نهائي', l(W('v1', 6)), { y: S.vh(36), size: 105 }),
        K.heavy('كأس العالم', l(W('v1', 8)) - 0.05, { y: S.vh(47), size: 160, kash: { word: 1, amount: 50, at: 'last' } }),
        K.ball({ r: S.px(40), x: { at: 0.1, from: S.px(-120), to: S.px(820), dur: d - 0.2, ease: 'quadOut' }, y: { at: 0.1, from: S.vh(80), to: S.vh(66), dur: d - 0.2, ease: 'sineOut' }, extra: { echo: { count: 6, step: 0.03, decay: 0.65 }, sfx: { kind: 'whoosh', at: 0.15 } } }),
      ], K.creep(span(1), 0.06)),

      // ٣. HERO SUBJECT PUNCH: القائد بيقفز ×1.97 والملعب ورا ×1.12 بس + اسم ثابت بالشاشة + مؤشر بالرأس
      shot(2, '#000', (l, d) => {
        const t = 0.12, hx = S.px(520), hy = S.vh(40);
        return [
          K.around(S.cx, S.cy, K.punchBg(t, 1), [K.photo(A('stadium1966.png'), { contrast: 1.2, blur: S.px(2.5) })]),
          K.around(hx, hy, K.punchFg(t, 0.85), [
            K.cutout(A('captain-cut.png'), { x: S.px(520), y: S.vh(60), w: S.px(640), sfx: false }),
            K.pointer(S.px(545), S.vh(28.5), l(W('v1', 13)) - 0.1, 24),
          ], { sfx: { kind: 'whoosh', at: t, params: { dur: 0.6 } } }),
          K.heavy('طُرد', t + 0.15, { y: S.vh(78), size: 200, x: S.px(940) }),
          K.nameTag('أنطونيو راتين', l(W('v1', 13)), null, { y: S.vh(17), size: 130 }),
        ];
      }),

      // ٤. رفض الخروج: أخضر، القائد، دائرة ماركر 12fps
      shot(3, C.green, (l, d) => [
        K.photo(A('stadium1966.png'), { contrast: 1.4, opacity: 0.22 }),
        K.cutout(A('captain-cut.png'), { x: S.px(330), y: S.vh(62), w: S.px(560), green: C.greenD, extra: { scale: { kf: [[0, 1.08], [d, 1.0, 'sineOut']] } } }),
        K.markerCircle(S.px(330), S.vh(46), S.px(280), S.px(430), l(W('v2', 1)) + 0.1),
        K.light('لكنّه', l(W('v2', 0)), { y: S.vh(22), size: 100 }),
        K.heavy('رفضَ', l(W('v2', 1)), { y: S.vh(32), size: 210, kash: { amount: 90, at: 'first' } }),
        K.light('الخروج', l(W('v2', 2)), { y: S.vh(41), size: 110 }),
      ], K.creep(span(3), 0.05)),

      // ٥. لم يفهم: الحكم الألماني على زيتي + ورق قوانين
      shot(4, C.olive, (l, d) => [
        K.doc('FIFA — LAWS OF THE GAME — LAW XII', LOREM, { ink: '#141510', opacity: 0.25 }),
        K.cutout(A('referee1966-cut.png'), { x: S.px(560), y: S.vh(60), w: S.px(620), extra: { x: { at: 0, from: S.px(700), to: S.px(560), dur: 0.5, ease: 'cubicOut' } } }),
        K.heavy('لم يفهم', l(W('v2', 4)) - 0.1, { y: S.vh(20), size: 170 }),
        K.nameTag('الحكم الألماني', l(W('v2', 7)) - 0.05, null, { y: S.vh(33), size: 105, rot: -6, x: S.px(560) }),
      ], K.graphicPunch(span(4), 0.25)),

      // ٦. دقائق طويلة: ساعة + صدى + زووم لجوّا الساعة كانتقال
      shot(5, C.oliveD, (l, d) => [
        K.around(S.cx, S.vh(56), { kf: [[0, 0.9, 'quadOut'], [0.5, 1], [d - 0.4, 1.06, 'linear'], [d, 4.5, 'expoIn']] }, [
          S.image({ src: S.asset(A('stopwatch-cut.png')), fit: 'contain', x: S.cx, y: S.vh(56), w: S.px(700), tone: { contrast: 1.2, duotone: ['#0d0f0a', '#d9f0cf'] } }),
        ], { sfx: { kind: 'whoosh', at: d - 0.4, params: { dur: 0.4 } } }),
        ...K.echoLines('دقائق طويلة', l(W('v2', 12)) - 0.05, { y: S.vh(18), size: 120 }),
      ]),

      // ٧. لندن ليلاً (أرشيف)
      shot(6, '#000', (l, d) => [
        K.photo(A('london.png'), { contrast: 1.2 }),
        K.light('بعد المباراة…', 0.15, { y: S.vh(20), size: 100 }),
        K.heavy('لندن', 0.45, { y: S.vh(29), size: 190 }),
      ], { zoom: { kf: [[0, 1.12, 'expoOut'], [0.5, 1.03], [span(6), 1.0, 'linear']] } }),

      // ٨. كين أستون: دفعة على السائق + اسم
      shot(7, '#000', (l, d) => [
        K.around(S.px(560), S.vh(36), { kf: [[0, 1, 'ae:33:50'], [1.4, 1.3, 'sineOut'], [d, 1.36, 'linear']] }, [K.photo(A('driver.png'), { contrast: 1.2 })]),
        K.light('الحكم الإنجليزي', l(W('v3', 3)), { y: S.vh(66), size: 100 }),
        K.nameTag('كين أستون', l(W('v3', 5)), null, { y: S.vh(79), size: 170, rot: -6 }),
      ]),

      // ٩. إشارة المرور: الشارع ورا (متحفظ) + الإشارة قدام بتقفز، والضوء الأصفر بيولّع
      shot(8, '#000', (l, d) => {
        const tl = l(W('v3', 14));
        const lamp = (x, y, col, at) => S.circle({ r: S.px(62), x, y, fill: col, glow: { color: col, blur: 60, strength: 1.8 }, opacity: { kf: [[at, 0], [at + 0.05, 1]] }, sfx: { kind: 'click', at, gain_db: -12 } });
        return [
          K.around(S.cx, S.cy, K.punchBg(0.1, 0.8), [K.photo(A('london.png'), { contrast: 1.2, blur: S.px(3), bright: -0.12 })]),
          K.around(S.px(452), S.px(900), K.punchFg(0.1, 0.55), [
            S.image({ src: S.asset(A('trafficlight-cut.png')), fit: 'contain', x: S.px(560), y: S.vh(60), w: S.px(420), tone: { contrast: 1.3 }, shadow: { color: 'rgba(0,0,0,.6)', blur: 40, y: 20 } }),
            lamp(S.px(452), S.px(976), C.yellow, tl),
          ]),
          K.light('توقّف عند', l(W('v3', 12)), { y: S.vh(14), size: 100 }),
          K.heavy('إشارة مرور', tl - 0.05, { y: S.vh(84), size: 160, x: S.px(1000) }),
        ];
      }),

      // ١٠. أصفر… انتبه: match cut من الضوء للكرت الأصفر (لون انتقائي)
      shot(9, C.oliveD, (l, d) => [
        K.around(S.px(560), S.vh(36), K.punchFg(0, 0.4), [
          S.image({ src: S.asset(A('hand_yellow-cut.png')), fit: 'contain', x: S.px(560), y: S.vh(72), w: S.px(760), shadow: { color: 'rgba(0,0,0,.5)', blur: 40, y: 18 } }),
        ], { sfx: { kind: 'impact', at: 0.02, gain_db: -9 } }),
        K.heavy('أصفر', 0.04, { y: S.vh(16), size: 210, fill: C.yellow, kash: { amount: 70, at: 'first' } }),
        K.light('انتبه', l(W('v4', 1)), { y: S.vh(27), size: 130 }),
      ]),

      // ١١. أحمر… توقّف
      shot(10, '#15100f', (l, d) => [
        K.around(S.px(520), S.vh(36), K.punchFg(0, 0.45), [
          S.image({ src: S.asset(A('hand_red-cut.png')), fit: 'contain', x: S.px(520), y: S.vh(72), w: S.px(760), shadow: { color: 'rgba(0,0,0,.5)', blur: 40, y: 18 } }),
        ], { sfx: { kind: 'impact', at: 0.02, gain_db: -8 } }),
        K.heavy('أحمر', 0.04, { y: S.vh(16), size: 210, fill: C.red, kash: { amount: 70, at: 'first' } }),
        K.light('توقّف', l(W('v4', 3)), { y: S.vh(27), size: 130 }),
      ]),

      // ١٢. المكسيك 1970
      shot(11, '#000', (l, d) => [
        K.photo(A('azteca.png'), { contrast: 1.2 }),
        K.light('مونديال المكسيك', l(W('v5', 1)), { y: S.vh(58), size: 100 }),
        K.digits('1970', l(W('v5', 4)) - 0.1, { y: S.vh(68), size: 300, fill: '#3fd06a', shadow: { color: 'rgba(0,0,0,.75)', blur: 30, y: 6 } }),
      ], K.graphicPunch(span(11), 0.3)),

      // ١٣. رُفعت البطاقات: الحكم بيقفز (الكرت أصفر انتقائي) والملعب متحفظ
      shot(12, '#000', (l, d) => [
        K.around(S.cx, S.cy, K.punchBg(0.08, 1), [K.photo(A('azteca.png'), { contrast: 1.2, blur: S.px(3) })]),
        K.around(S.px(560), S.vh(34), K.punchFg(0.08, 0.7), [
          K.cutout(A('referee1970-cut.png'), { x: S.px(560), y: S.vh(60), w: S.px(560), keepColor: true }),
        ], { sfx: { kind: 'whoosh', at: 0.08, params: { dur: 0.6 } } }),
        K.heavy('لأوّل مرّة', l(W('v5', 9)) - 0.05, { y: S.vh(80), size: 170 }),
      ]),

      // ١٤. أول بطاقة حمراء: رسم + كلمة "حمراء" بالأحمر
      shot(13, C.olive, (l, d) => [
        K.doc('FIFA WORLD CUP — DISCIPLINARY RECORD', LOREM, { ink: '#141510', opacity: 0.22 }),
        S.rect({ w: S.px(300), h: S.px(420), radius: S.px(18), fill: C.red, x: S.px(560), y: S.vh(60), rotation: { at: 0.1, from: -40, to: -8, dur: 0.5, ease: 'cubicOut' }, scale: { at: 0.1, from: 0.4, to: 1, dur: 0.4, ease: 'cubicOut' },
          shadow: { color: 'rgba(0,0,0,.45)', blur: 40, y: 20 }, echo: { count: 4, step: 0.03, decay: 0.6 }, sfx: { kind: 'swish', at: 0.1 } }),
        K.light('أولُ بطاقةٍ', l(W('v6', 1)), { y: S.vh(18), size: 110 }),
        K.heavy('حمراء', l(W('v6', 3)) - 0.05, { y: S.vh(28), size: 220, fill: C.red, kash: { amount: 120, at: 'last' } }),
        K.light('في تاريخ كأس العالم', l(W('v6', 5)), { y: S.vh(84), size: 90 }),
      ], K.graphicPunch(span(13), 0.2)),

      // ١٥. 1974: ورقة بيضا وأرقام زيتية
      shot(14, C.paper, (l, d) => [
        K.doc('FIFA — 1974', LOREM, { ink: C.ink, opacity: 0.35 }),
        K.digits('1974', l(W('v6', 10)) - 0.1, { y: S.vh(44), size: 320, fill: '#867548', blend: 'multiply', shadow: false }),
      ], K.creep(span(14), 0.07)),

      // ١٦. كاسيلي: لاعب طالع + يد بالكرت الأحمر داخلة + سهم ماركر
      shot(15, C.green, (l, d) => [
        K.photo(A('azteca.png'), { contrast: 1.4, opacity: 0.2 }),
        K.cutout(A('player1974-cut.png'), { x: S.px(330), y: S.vh(60), w: S.px(560), green: C.greenD, extra: { x: { kf: [[0, S.px(360)], [d, S.px(300), 'linear']] } } }),
        S.image({ src: S.asset(A('hand_red-cut.png')), fit: 'contain', w: S.px(520), x: { at: 0.15, from: S.W + S.px(300), to: S.px(820), dur: 0.45, ease: 'cubicOut' }, y: S.vh(62), rotation: -8, shadow: { color: 'rgba(0,0,0,.45)', blur: 30, y: 14 }, sfx: { kind: 'whoosh', at: 0.15 } }),
        K.markerArrow(S.px(720), S.vh(50), S.px(470), S.vh(44), l(W('v6', 17)) + 0.2),
        K.nameTag('كارلوس كاسيلي', l(W('v6', 17)), null, { y: S.vh(14), size: 130 }),
        K.light('التشيلي', l(W('v6', 16)), { y: S.vh(84), size: 110 }),
      ], K.creep(span(15), 0.05)),

      // ١٧. الختام: الإشارة بالنص بتضوي أصفر ثم أحمر + "لغة يفهمها العالم"
      shot(16, C.green, (l, d) => {
        const lamp = (x, y, col, at) => S.circle({ r: S.px(56), x, y, fill: col, glow: { color: col, blur: 55, strength: 1.8 }, opacity: { kf: [[at, 0], [at + 0.05, 1]] }, sfx: { kind: 'click', at, gain_db: -12 } });
        return [
          K.around(S.px(442), S.px(960), { kf: [[0, 0.85, 'ae:33:50'], [0.9, 1.0, 'sineOut'], [d, 1.06, 'linear']] }, [
            S.image({ src: S.asset(A('trafficlight-cut.png')), fit: 'contain', x: S.cx, y: S.vh(62), w: S.px(380), tone: { contrast: 1.3 }, shadow: { color: 'rgba(0,0,0,.45)', blur: 30, y: 14 } }),
            lamp(S.px(442), S.px(1030), C.yellow, l(W('v7', 3))), lamp(S.px(442), S.px(896), C.red, l(W('v7', 4))),
          ]),
          K.light('فكرةٌ وُلدت عند إشارة', 0.1, { y: S.vh(14), size: 90, x: S.px(980) }),
          K.heavy('لغةٌ', l(W('v7', 6)) - 0.05, { y: S.vh(80), size: 210, kash: { amount: 100, at: 'first' } }),
          K.light('يفهمها العالم كلّه', l(W('v7', 7)), { y: S.vh(88), size: 100 }),
        ];
      }),
    ],
  };
};
