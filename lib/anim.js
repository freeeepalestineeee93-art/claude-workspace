// قلب الحركة: كل قيمة متحركة هي دالة نقية بالزمن.
// بيشتغل بالمتصفح وبـ Node، وما بيعتمد على أي حالة سابقة، فبنقدر نرندر أي فريم لحاله.

// ───────────────────────── عشوائية مضبوطة ─────────────────────────

export function rng(seed = 1) {
  let a = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ضجيج 1D ناعم (value noise مع interpolation خماسي) للحركة العضوية والاهتزاز
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * f * (f * (f * 6 - 15) + 10);
  const h = (n) => {
    let v = Math.imul((n + seed * 7919) | 0, 0x27d4eb2d);
    v ^= v >>> 15;
    v = Math.imul(v, 0x85ebca6b);
    v ^= v >>> 13;
    return ((v >>> 0) / 4294967296) * 2 - 1;
  };
  return h(i) * (1 - u) + h(i + 1) * u;
}

// اهتزاز طبيعي بعدة طبقات (متل wiggle بالأفتر إفكت بس أنعم)
export function wiggle(t, freq = 2, amp = 1, seed = 0, octaves = 2) {
  let v = 0, a = 1, f = freq, norm = 0;
  for (let o = 0; o < octaves; o++) {
    v += noise1(t * f, seed + o * 101) * a;
    norm += a;
    a *= 0.5;
    f *= 2.03;
  }
  return (v / norm) * amp;
}

// ───────────────────────── منحنيات التسهيل ─────────────────────────

export function cubicBezier(x1, y1, x2, y2) {
  const ax = 3 * x1 - 3 * x2 + 1, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

const pow = (p) => ({
  in: (t) => t ** p,
  out: (t) => 1 - (1 - t) ** p,
  inOut: (t) => (t < 0.5 ? 2 ** (p - 1) * t ** p : 1 - (-2 * t + 2) ** p / 2),
});

export const ease = {
  linear: (t) => t,
  hold: (t) => (t < 1 ? 0 : 1),
  quadIn: pow(2).in, quadOut: pow(2).out, quadInOut: pow(2).inOut,
  cubicIn: pow(3).in, cubicOut: pow(3).out, cubicInOut: pow(3).inOut,
  quartIn: pow(4).in, quartOut: pow(4).out, quartInOut: pow(4).inOut,
  quintIn: pow(5).in, quintOut: pow(5).out, quintInOut: pow(5).inOut,
  sineIn: (t) => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t) => Math.sin((t * Math.PI) / 2),
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  expoIn: (t) => (t === 0 ? 0 : 2 ** (10 * t - 10)),
  expoOut: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  expoInOut: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2),
  circIn: (t) => 1 - Math.sqrt(1 - t * t),
  circOut: (t) => Math.sqrt(1 - (t - 1) ** 2),
  circInOut: (t) => (t < 0.5 ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2 : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2),
  backIn: (t) => 2.70158 * t ** 3 - 1.70158 * t * t,
  backOut: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  // منحنيات بأسلوب المصممين المحترفين
  smooth: cubicBezier(0.45, 0, 0.15, 1), // دخول هادي وهبوط ناعم طويل
  snap: cubicBezier(0.7, 0, 0.1, 1), // انطلاق قوي ووقوف حاد (انتقالات)
  glide: cubicBezier(0.16, 1, 0.3, 1), // خروج سريع وانزلاق طويل (العناوين)
  anticipate: cubicBezier(0.6, -0.28, 0.3, 1), // رجوع خفيف لورا قبل الانطلاق
  whip: cubicBezier(0.85, 0, 0.05, 1), // whip pan
};

export function resolveEase(e) {
  if (!e) return ease.smooth;
  if (typeof e === 'function') return e;
  if (Array.isArray(e)) return cubicBezier(...e);
  if (typeof e === 'object' && e.spring) return springEase(e.spring);
  const f = ease[e];
  if (!f) throw new Error(`منحنى تسهيل غير معروف: ${e}`);
  return f;
}

// ───────────────────────── Springs (معادلة مغلقة) ─────────────────────────
// حل تحليلي لنابض مخمَّد: القيمة بأي لحظة بدون محاكاة الفريمات اللي قبلها.

export const springPresets = {
  snappy: { stiffness: 420, damping: 32, mass: 1 }, // أزرار، حواف، UI
  default: { stiffness: 190, damping: 21, mass: 1 }, // كروت، حاويات، كاميرا
  heavy: { stiffness: 110, damping: 26, mass: 1.6 }, // خط ضخم، لوغو، مجسمات
  playful: { stiffness: 240, damping: 11, mass: 1 }, // شخصيات، ستيكرات (overshoot واضح)
  gentle: { stiffness: 70, damping: 17, mass: 1 }, // حركات خلفية بطيئة
  rubber: { stiffness: 320, damping: 9, mass: 0.8 }, // مطاطي
  stiff: { stiffness: 700, damping: 50, mass: 1 }, // شبه بدون overshoot
};

function springParams(cfg) {
  const p = typeof cfg === 'string' ? springPresets[cfg] : { ...springPresets.default, ...cfg };
  if (!p) throw new Error(`spring غير معروف: ${cfg}`);
  const { stiffness: k, damping: c, mass: m, velocity: v0 = 0 } = p;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  return { w0, zeta, v0 };
}

// من 0 لـ 1. v0 بوحدة "المسافة الكاملة بالثانية".
export function spring(cfg = 'default') {
  const { w0, zeta, v0 } = springParams(cfg);
  const x0 = -1; // الإزاحة من الهدف
  let fn;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const B = (v0 + zeta * w0 * x0) / wd;
    fn = (t) => 1 + Math.exp(-zeta * w0 * t) * (x0 * Math.cos(wd * t) + B * Math.sin(wd * t));
  } else if (zeta === 1) {
    fn = (t) => 1 + Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t);
  } else {
    const s = w0 * Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta * w0 + s, r2 = -zeta * w0 - s;
    const A = (v0 - r2 * x0) / (r1 - r2), Bc = x0 - A;
    fn = (t) => 1 + A * Math.exp(r1 * t) + Bc * Math.exp(r2 * t);
  }
  const f = (t) => (t <= 0 ? 0 : fn(t));
  f.duration = settleTime(f);
  return f;
}

// الوقت لحتى يستقر النابض (الخطأ أقل من 0.1%)
export function settleTime(f, eps = 1e-3) {
  let last = 0;
  for (let t = 0; t < 10; t += 1 / 240) if (Math.abs(f(t) - 1) > eps) last = t;
  return Math.min(10, last + 1 / 240);
}

// spring كـ ease (0..1 → 0..1) بمدة مضبوطة، مفيد مع keyframes
export function springEase(cfg) {
  const s = spring(cfg);
  return (p) => (p >= 1 ? 1 : s(p * s.duration));
}

const _springCache = new Map();
function cachedSpring(cfg) {
  const key = typeof cfg === 'string' ? cfg : JSON.stringify(cfg);
  if (!_springCache.has(key)) _springCache.set(key, spring(cfg));
  return _springCache.get(key);
}

// ───────────────────────── الألوان (تدرج بفضاء OKLab) ─────────────────────────

export function parseColor(c) {
  if (Array.isArray(c)) return c.length === 3 ? [...c, 1] : c;
  if (typeof c !== 'string') throw new Error(`لون غير صالح: ${c}`);
  let s = c.trim();
  if (s[0] === '#') {
    s = s.slice(1);
    if (s.length <= 4) s = [...s].map((x) => x + x).join('');
    const n = parseInt(s, 16);
    if (s.length === 8) return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, (n & 255) / 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  if (s === 'transparent') return [0, 0, 0, 0];
  throw new Error(`لون غير مدعوم: ${c}`);
}

const toLin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function rgbToOklab([r, g, b, a]) {
  r = toLin(r); g = toLin(g); b = toLin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s, a];
}

export function oklabToRgb([L, A, B, a]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const c = (v) => Math.max(0, Math.min(255, fromLin(v)));
  return [c(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), c(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), c(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s), a];
}

export function mixColor(c1, c2, t) {
  const a = rgbToOklab(parseColor(c1)), b = rgbToOklab(parseColor(c2));
  return oklabToRgb(a.map((v, i) => v + (b[i] - v) * t));
}

export function colorToCss(c) {
  const [r, g, b, a] = parseColor(c);
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${+a.toFixed(4)})`;
}

const isColor = (v) => typeof v === 'string' && (v[0] === '#' || v.startsWith('rgb'));

// ───────────────────────── interpolation عام ─────────────────────────

export function lerp(a, b, t) {
  if (typeof a === 'number') return a + (b - a) * t;
  if (isColor(a) || isColor(b)) return mixColor(a, b, t);
  if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], t));
  return t < 1 ? a : b; // نصوص وقيم منفصلة
}

// ───────────────────────── الخصائص المتحركة ─────────────────────────
// صيغ القيمة:
//   5                                  ثابتة
//   { kf: [[t, v, ease?], ...] }       keyframes (الـ ease على المقطع اللي بعد المفتاح)
//   { spring: 'heavy', from: 0, to: [[t, v], ...] }  نابض بأهداف متعددة (track)
//   { from, to, at, dur?, ease? }      اختصار لحركة واحدة
//   { base, wiggle: { freq, amp, seed } }  قيمة مع اهتزاز
//   { expr: (t) => v }                 دالة (ما بتتصدّر لـ AE)
//   (t) => v                           دالة مباشرة

export function isAnimated(p) {
  return typeof p === 'function' || (p && typeof p === 'object' && !Array.isArray(p) && ('kf' in p || 'spring' in p || 'at' in p || 'expr' in p || 'wiggle' in p));
}

export function value(p, t) {
  if (p == null) return p;
  if (typeof p === 'function') return p(t);
  if (typeof p !== 'object' || Array.isArray(p)) return p;
  if ('expr' in p) return p.expr(t);
  if ('wiggle' in p) {
    const w = p.wiggle, base = value(p.base ?? 0, t);
    const off = (s) => wiggle(t, w.freq ?? 2, w.amp ?? 1, (w.seed ?? 0) + s, w.octaves ?? 2);
    return Array.isArray(base) ? base.map((b, i) => b + off(i * 37)) : base + off(0);
  }
  if ('kf' in p) return keyframes(p.kf, t);
  if ('spring' in p && !('at' in p)) return springTrack(p, t);
  if ('at' in p) {
    if (p.spring || p.ease?.spring) return springTrack({ spring: p.spring ?? p.ease.spring, from: p.from, to: [[p.at, p.to]] }, t);
    const dur = p.dur ?? 0.6;
    return keyframes([[p.at, p.from, p.ease], [p.at + dur, p.to]], t);
  }
  return p;
}

function keyframes(kf, t) {
  if (t <= kf[0][0]) return kf[0][1];
  const last = kf[kf.length - 1];
  if (t >= last[0]) return last[1];
  let i = 0;
  while (t > kf[i + 1][0]) i++;
  const [t0, v0, e] = kf[i];
  const [t1, v1] = kf[i + 1];
  const p = (t - t0) / (t1 - t0);
  return lerp(v0, v1, resolveEase(e)(p));
}

// track(): كل تغيير بالهدف بيضيف نابض جديد من لحظته، فالحركة بتضل متصلة ومش لازم نعيد التشغيل
function springTrack({ spring: cfg = 'default', from, to }, t) {
  const s = cachedSpring(cfg);
  let v = from, prev = from;
  for (const [ti, target, c] of to) {
    if (t <= ti) break;
    const sp = c ? cachedSpring(c) : s;
    const k = sp(t - ti);
    v = addScaled(v, diff(target, prev), k);
    prev = target;
  }
  return v;
}

function diff(a, b) {
  if (typeof a === 'number') return a - b;
  if (Array.isArray(a)) return a.map((v, i) => v - b[i]);
  if (isColor(a)) {
    const A = rgbToOklab(parseColor(a)), B = rgbToOklab(parseColor(b));
    return { __lab: A.map((v, i) => v - B[i]) };
  }
  return a;
}

function addScaled(v, d, k) {
  if (typeof v === 'number') return v + d * k;
  if (Array.isArray(v) && Array.isArray(d)) return v.map((x, i) => x + d[i] * k);
  if (d && d.__lab) {
    const L = rgbToOklab(parseColor(v));
    return oklabToRgb(L.map((x, i) => x + d.__lab[i] * k));
  }
  return k >= 0.5 ? d : v;
}

// مدة الحركة الكاملة لخاصية (مفيد للصوت التلقائي والنقد)
export function motionSpan(p) {
  if (!isAnimated(p) || typeof p === 'function' || 'expr' in p || 'wiggle' in p) return null;
  if ('kf' in p) return [p.kf[0][0], p.kf[p.kf.length - 1][0]];
  if ('spring' in p && !('at' in p)) {
    const last = p.to[p.to.length - 1];
    return [p.to[0][0], last[0] + cachedSpring(last[2] || p.spring).duration];
  }
  if ('at' in p) return [p.at, p.at + (p.spring ? cachedSpring(p.spring).duration : p.dur ?? 0.6)];
  return null;
}

// ───────────────────────── Stagger عضوي ─────────────────────────
// المصمم ما بيعمل تأخير منتظم 0.1 0.2 0.3، بيعمل تأخير بيتسارع أو بيتباطأ مع شوية عشوائية.

export function stagger(i, n, opts = {}) {
  const { each = 0.06, from = 'start', ease: e = 'quadOut', jitter = 0.15, seed = 7 } = opts;
  if (n <= 1) return 0;
  let idx;
  if (from === 'start') idx = i;
  else if (from === 'end') idx = n - 1 - i;
  else if (from === 'center') idx = Math.abs(i - (n - 1) / 2) * 2;
  else if (from === 'edges') idx = (n - 1) - Math.abs(i - (n - 1) / 2) * 2;
  else if (typeof from === 'number') idx = Math.abs(i - from);
  else idx = i;
  const span = each * (n - 1);
  const p = idx / (n - 1);
  const base = resolveEase(e)(Math.min(1, p)) * span;
  const r = rng(seed * 1000 + i)();
  return Math.max(0, base + (r - 0.5) * 2 * jitter * each);
}

// ───────────────────────── أدوات مساعدة ─────────────────────────

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mapRange = (v, a, b, c, d, clampIt = true) => {
  const t = (v - a) / (b - a);
  return c + (d - c) * (clampIt ? clamp(t) : t);
};
export const progress = (t, start, dur) => clamp((t - start) / dur);
