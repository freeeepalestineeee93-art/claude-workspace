// كيت "رياضة" (مبني على Creative DNA مستخرج ومقاس من r07). كل تقنية فيها: شو، كيف (أرقام مقاسة)، ليش.
// الاستعمال: import { kit } from '../../kit.js'; const K = kit(S);
export const C = { green: '#20813f', greenD: '#14592b', lime: '#c8e62a', olive: '#3a3d2e', oliveD: '#2a2c21', line: '#16180f', paper: '#f6f7f2', cream: '#f1e3bf', ink: '#14160f', white: '#ffffff', glow: '#2fe36f', yellow: '#f5d31b', red: '#ff3b2f' };
export const F = { head: 'Al Jazeera', body: 'thmanyah sans', mono: 'Courier Prime' };

export function kit(S) {
  const X = S.cx;

  // ── Hero Subject Punch ──
  // شو: الموضوع (قصاصة) بيقفز لقدام والخلفية متحفظة.  كيف (r07 مقاس): قدام 1→1.71 بـ 0.875s (ae:33:50) ثم 1.97 بـ 1.7s، ورا 1→1.12.
  // ليش: تركيز انتباه فوري + عمق بدون إحساس زووم رقمي. متى: كشف، جملة مهمة، اسم.
  const punchFg = (t, k = 1, hold = 99) => ({ kf: [[t, 1, 'ae:33:50'], [t + 0.875, 1 + 0.71 * k, 'linear'], [t + 1.125, 1 + 0.83 * k, 'sineOut'], [t + 1.7, 1 + 0.97 * k], [t + hold, 1 + 0.97 * k]] });
  const punchBg = (t, k = 1) => ({ kf: [[t, 1, 'sineInOut'], [t + 1.7, 1 + 0.12 * k, 'linear'], [t + 6, 1 + 0.16 * k]] });
  // تكبير حوالين نقطة (مركز الموضوع): group عند النقطة، والأولاد معكوسين
  const around = (px, py, scale, children, extra = {}) => S.group({ x: px, y: py, scale, ...extra }, [S.group({ x: -px, y: -py }, children)]);

  // ── Graphic Punch (لقطات الرسوم) ── r07 مقاس: ×1.40 بـ 0.17s (quadIn) ثم ×1.55 بـ 0.33 ثم زحف ×1.73 لآخر اللقطة.
  const graphicPunch = (d, k = 1) => ({ zoom: { kf: [[0, 1, 'quadIn'], [0.167, 1 + 0.40 * k, 'ae:95:75'], [0.333, 1 + 0.55 * k, 'linear'], [Math.max(0.4, d), 1 + 0.73 * k]] } });
  // زحف هادي (للصور الأرشيفية بدون حدث): 1 → 1.08
  const creep = (d, z = 0.08) => ({ zoom: { kf: [[0, 1], [d, 1 + z, 'linear']] } });

  // ── نص (بسيط عن قصد: الطاقة من الكاميرا والطبقات) ── دخول من اليمين ~90px + شفافية، 0.28s quadOut، 0.12 بين الكلمات
  const slideIn = (at, size) => ({ reveal: { by: 'word', at, from: { x: S.px(size * 0.22), opacity: 0 }, dur: 0.28, ease: 'quadOut', stagger: { each: 0.09 } } });
  const fadeIn = (at, dur = 0.3) => ({ opacity: { kf: [[at, 0], [at + dur, 1, 'quadOut']] } });
  const heavy = (text, at, o = {}) => S.text({ text, family: F.head, weight: 900, size: S.px(o.size ?? 170), fill: o.fill ?? C.white, x: o.x ?? S.px(935), y: o.y, anchor: o.anchor ?? 'start', lineHeight: 1.05,
    shadow: o.shadow === false ? undefined : { color: 'rgba(0,0,0,.35)', blur: 14, y: 4 }, ...(o.kash ? { kashida: [{ word: o.kash.word ?? 0, amount: S.px(o.kash.amount ?? 120), at: o.kash.at }] } : {}),
    ...(o.fade ? fadeIn(at, o.fade) : slideIn(at, o.size ?? 170)), ...(o.extra ?? {}) });
  const light = (text, at, o = {}) => S.text({ text, family: F.head, weight: 300, size: S.px(o.size ?? 110), fill: o.fill ?? C.white, x: o.x ?? S.px(935), y: o.y, anchor: o.anchor ?? 'start',
    ...(o.fade ? fadeIn(at, o.fade) : slideIn(at, o.size ?? 110)), ...(o.extra ?? {}) });
  // اسم: حرف حرف (0.028s) بظل أخضر مبثوق، مائل −8°، ثابت بالشاشة، ومسح عكسي
  const nameTag = (text, at, out, o = {}) => S.text({ text, family: F.head, weight: 900, size: S.px(o.size ?? 150), fill: '#fff', x: o.x ?? X, y: o.y ?? S.vh(24), rotation: o.rot ?? -8,
    shadow: { color: '#1a9a4c', blur: 0, x: -6, y: 9 },
    reveal: { by: 'char', at, from: { opacity: 0 }, dur: 0.001, ease: 'hold', stagger: { each: 0.028 } },
    ...(out ? { exit: { by: 'char', at: out, to: { opacity: 0 }, dur: 0.001, ease: 'hold', stagger: { each: 0.028, from: 'end' } } } : {}), sfx: { kind: 'tick', at, gain_db: -18 } });
  // مؤشر مثلث أخضر متوهج (ملزوق بالموضوع)
  const pointer = (x, y, at, r = 30) => S.polygon({ sides: 3, r: S.px(r), rotation: 180, fill: C.glow, glow: { color: C.glow, blur: 30, strength: 1.6 }, x, y: { base: y, wiggle: { freq: 1.4, amp: S.px(4), seed: 2 } },
    opacity: { kf: [[at, 0], [at + 0.06, 1]] }, scale: { at, from: 0.4, to: 1, dur: 0.18, ease: 'quadOut' } });
  // سطور صدى بشفافية متناقصة
  const echoLines = (text, at, o = {}) => [0, 1, 2].map((k) => S.text({ text, family: F.head, weight: 900, size: S.px(o.size ?? 150), fill: o.fill ?? C.white, x: o.x ?? S.px(935), y: o.y + k * S.px((o.size ?? 150) * 1.02), anchor: 'start',
    opacity: [1, 0.5, 0.22][k], ...slideIn(at + k * 0.1, o.size ?? 150), ...(o.kash ? { kashida: [{ word: 0, amount: S.px(o.kash), at: 'last' }] } : {}) }));
  // أرقام: الخانات بتطلع من الآخر للأول (متل FIFA بـ r07)، 0.08 لكل خانة
  const digits = (text, at, o = {}) => S.text({ text, family: F.head, weight: 900, size: S.px(o.size ?? 330), fill: o.fill ?? C.green, x: o.x ?? X, y: o.y, blend: o.blend,
    shadow: o.shadow ?? { color: 'rgba(0,0,0,.3)', blur: 18, y: 6 },
    reveal: { by: 'char', at, from: { opacity: 0, y: S.px(50) }, dur: 0.22, ease: 'quadOut', stagger: { each: 0.08, from: 'end' } }, sfx: { kind: 'impact', at, gain_db: -12 } });

  // ── قصاصة أبيض وأسود بحافة كريمية (ناعمة) ──
  const cutout = (src, o) => S.image({ src: S.asset(src), fit: 'contain', x: o.x ?? 0, y: o.y ?? 0, w: o.w, tone: { contrast: o.contrast ?? 1.3, grain: 0.08, seed: 5, ...(o.color ? { duotone: null } : {}) },
    ...(o.keepColor ? { tone: undefined } : {}),
    outline: [{ width: o.ow ?? 14, color: C.cream, rough: 0.35, scale: 3, offset: o.off ?? [5, 4], seed: o.seed ?? 3 }, ...(o.green ? [{ width: 18, color: o.green, rough: 0.3, scale: 3, seed: 9 }] : [])],
    shadow: o.shadow ?? { color: 'rgba(0,0,0,.35)', blur: 26, y: 12 }, ...(o.extra ?? {}) });
  // صورة خلفية (أرشيف أبيض وأسود)
  const photo = (src, o = {}) => S.image({ src: S.asset(src), x: o.x ?? X, y: o.y ?? S.cy, w: o.w ?? S.W * 1.06, h: o.h ?? S.H * 1.06, fit: 'cover', focus: o.focus, tone: { contrast: o.contrast ?? 1.15, grain: 0.1, brightness: o.bright ?? 0 }, blur: o.blur, opacity: o.opacity });

  // ── خربشة ماركر (12fps، رسم يدوي) ── دائرة/سهم بينرسموا بـ 0.4s
  const markerCircle = (x, y, rx, ry, at, o = {}) => {
    const pts = Array.from({ length: 26 }, (_, i) => { const a = -Math.PI / 2 + (i / 24) * Math.PI * 2.15; const j = 1 + Math.sin(i * 2.7) * 0.05; return [x + Math.cos(a) * rx * j, y + Math.sin(a) * ry * j]; });
    return S.path({ d: S.shapes.smoothPath(pts, false, 0.5), fill: null, stroke: o.color ?? C.lime, strokeWidth: S.px(o.w ?? 10), lineCap: 'round', posterize: 12,
      trim: { at, from: [0, 0], to: [0, 1], dur: 0.42, ease: 'linear' }, x: { base: 0, wiggle: { freq: 12, amp: S.px(1.5), seed: 7 } }, sfx: { kind: 'scribble', at, params: { dur: 0.42 }, gain_db: -14 } });
  };
  const markerArrow = (x0, y0, x1, y1, at, o = {}) => {
    const mx = (x0 + x1) / 2 + (o.bend ?? S.px(60)), my = (y0 + y1) / 2;
    const ang = Math.atan2(y1 - my, x1 - mx), h = S.px(46);
    const d = `M${x0},${y0} Q${mx},${my} ${x1},${y1} M${x1 - h * Math.cos(ang - 0.5)},${y1 - h * Math.sin(ang - 0.5)} L${x1},${y1} L${x1 - h * Math.cos(ang + 0.5)},${y1 - h * Math.sin(ang + 0.5)}`;
    return S.path({ d, fill: null, stroke: o.color ?? C.lime, strokeWidth: S.px(o.w ?? 10), lineCap: 'round', lineJoin: 'round', posterize: 12, trim: { at, from: [0, 0], to: [0, 1], dur: 0.38, ease: 'linear' }, sfx: { kind: 'scribble', at, params: { dur: 0.38 }, gain_db: -14 } });
  };

  // ── عناصر بيئة ──
  const tube = () => S.tube({ inset: S.px(78), bulge: S.px(105), top: 0, vignette: 0.35 });
  const mark = (dark = true) => S.group({ x: S.px(160), y: S.px(170), decor: true }, [
    S.circle({ r: S.px(9), fill: C.lime, x: S.px(-30), y: S.px(4) }),
    S.text({ text: 'رياضة', family: F.head, weight: 900, size: S.px(30), fill: dark ? C.white : C.ink, anchor: 'start', x: S.px(30), decor: true }),
  ]);
  const ball = (o) => S.circle({ r: o.r, fill: { radial: { c: [-o.r * 0.35, -o.r * 0.4], r: o.r * 1.5 }, stops: [[0, '#efff9a'], [0.5, '#c2e324'], [1, '#5c8a12']] }, x: o.x, y: o.y, ...(o.extra ?? {}) });
  const doc = (title, body, o = {}) => S.group({ x: o.x ?? X, y: o.y ?? S.vh(50), opacity: o.opacity ?? 1, decor: true }, [
    S.text({ text: title, family: F.mono, weight: 700, size: S.px(30), fill: o.ink ?? C.ink, x: 0, y: -S.px(560), decor: true }),
    S.text({ text: body, family: F.mono, weight: 400, size: S.px(19), lineHeight: 1.45, fill: o.ink ?? C.ink, x: 0, y: S.px(40), maxWidth: S.px(820), align: 'left', decor: true, opacity: 0.8 }),
  ]);

  return { X, punchFg, punchBg, around, graphicPunch, creep, slideIn, fadeIn, heavy, light, nameTag, pointer, echoLines, digits, cutout, photo, markerCircle, markerArrow, tube, mark, ball, doc };
}
