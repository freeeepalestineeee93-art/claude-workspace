// نظام الكاميرا: عالم 2.5D بعمق حقيقي + مسار كاميرا متصل السرعة + لحاق عنصر + اهتزاز يد.
//
//   const cam = useCamera({ keys: [{ t: 0, x: 0, y: 0 }, { t: 2, x: 400, y: 120, z: -300, profile: 'push-pan' }, { t: 3, x: 900, y: 0, ease: 80 }], handheld: { amp: 5 } });
//   أنواع المقاطع: (افتراضي) منحنى متصل السرعة · profile: منحنى متعلّم (drift للثبات) · ease: influence الأفتر (للانتقالات)
//   <World camera={cam}>
//     <Layer z={900}> خلفية بعيدة (بتتحرك أبطأ) </Layer>
//     <Layer z={0}>   <At x={400} y={300}>…</At> </Layer>
//     <Layer z={-250}> مقدّمة قريبة (بتتحرك أسرع، ممكن blur) </Layer>
//   </World>
//
// الإسقاط: نقطة (X,Y) بعمق z بتطلع على الشاشة: W/2 + R(-roll)·s·(P − cam)، و s = f / (f + z − cam.z)
// يعني parallax حقيقي: القريب (z سالب) بيتحرك أكتر من البعيد. cam.z سالب = الكاميرا بتقرب (dolly in).
import React, { createContext, useContext, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise2D } from '@remotion/noise';

import LIB from '../../library/camera/library.json';

const Ctx = createContext(null);

// منحنى تقدّم متعلّم من المراجع (0→1) لنوع حركة: push-pan, pull-pan, pan, push, pull, travel …
export const profiles = Object.fromEntries(Object.entries(LIB.kinds).map(([k, v]) => [k, v.position_curve]));
export function profileAt(kind, u) {
  const c = profiles[kind];
  if (!c) throw new Error(`ما في منحنى كاميرا باسم "${kind}" — المتاح: ${Object.keys(profiles).join(', ')}`);
  u = Math.max(0, Math.min(1, u));
  const x = u * (c.length - 1), i = Math.min(c.length - 2, Math.floor(x));
  return c[i] + (c[i + 1] - c[i]) * (x - i);
}
export const useWorld = () => useContext(Ctx);

// ── منحنيات: Hermite غير منتظم (Catmull-Rom) — السرعة متصلة عبر المفاتيح (متل Continuous Bezier بالأفتر) ──
// مفتاح فيه hold:true (أو أول/آخر مفتاح) سرعته صفر = ease in/out ووقفة.
export function spline(keys, t, ch) {
  const k = keys.filter((q) => q[ch] != null);
  if (!k.length) return 0;
  if (t <= k[0].t) return k[0][ch];
  if (t >= k[k.length - 1].t) return k[k.length - 1][ch];
  let i = 0;
  while (t > k[i + 1].t) i++;
  const a = k[i], b = k[i + 1];
  const tan = (j) => {
    const q = k[j];
    if (q.hold || j === 0 || j === k.length - 1) return 0;
    const p = k[j - 1], n = k[j + 1];
    // ميل متوسط موزون (بيمنع overshoot لما المسافات مش متساوية)
    const s0 = (q[ch] - p[ch]) / (q.t - p.t), s1 = (n[ch] - q[ch]) / (n.t - q.t);
    if (s0 * s1 <= 0 && q.smooth !== true) return 0; // تغيير اتجاه = وقفة طبيعية
    return (s0 * (n.t - q.t) + s1 * (q.t - p.t)) / (n.t - p.t);
  };
  const h = b.t - a.t, u = (t - a.t) / h;
  if (b.profile) return a[ch] + (b[ch] - a[ch]) * profileAt(b.profile, u); // المقطع بيمشي على منحنى سرعة متعلّم (للثبات/drift)
  if (b.ease != null) { const [o, n] = Array.isArray(b.ease) ? b.ease : [b.ease, b.ease]; return a[ch] + (b[ch] - a[ch]) * aeEase(o, n)(u); } // انتقال بأسلوب الأفتر
  const m0 = tan(i) * h, m1 = tan(i + 1) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * a[ch] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[ch] + (u3 - u2) * m1;
}

// Ease بأرقام الأفتر: influence الخروج من المفتاح السابق والدخول للمفتاح الحالي (0–100).
// easy ease بالأفتر = 33/33؛ الانتقالات السلسة القوية عادة 70–90. ease: 80 أو ease: [70, 90]
const bezCache = new Map();
export function aeEase(outInf = 33, inInf = 33) {
  const key = `${outInf}:${inInf}`;
  if (bezCache.has(key)) return bezCache.get(key);
  const x1 = outInf / 100, x2 = 1 - inInf / 100; // y1 = 0، y2 = 1 (سرعة صفر بالطرفين)
  const bx = (t) => 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3;
  const by = (t) => 3 * (1 - t) * t * t + t ** 3;
  const dbx = (t) => 3 * (1 - t) ** 2 * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
  const f = (u) => {
    if (u <= 0) return 0; if (u >= 1) return 1;
    let t = u;
    for (let i = 0; i < 8; i++) { const d = dbx(t); if (Math.abs(d) < 1e-6) break; t -= (bx(t) - u) / d; t = Math.max(0, Math.min(1, t)); }
    let lo = 0, hi = 1; for (let i = 0; i < 20 && Math.abs(bx(t) - u) > 1e-5; i++) { t = (lo + hi) / 2; if (bx(t) < u) lo = t; else hi = t; }
    return by(t);
  };
  bezCache.set(key, f);
  return f;
}

// لحاق عنصر بـ spring مخمّد حرجياً (حتمي: محاكاة من الصفر ومخزّنة)
const followCache = new Map();
function follow(target, t, fps, { stiffness = 6, key = 'f' } = {}) {
  let c = followCache.get(key);
  if (!c || c.fps !== fps) { c = { fps, xs: [], ys: [], vx: 0, vy: 0 }; followCache.set(key, c); }
  const n = Math.floor(t * fps * 4); // 4 خطوات لكل فريم
  const w = Math.sqrt(stiffness) * 2, dt = 1 / (fps * 4);
  while (c.xs.length <= n) {
    const i = c.xs.length, tt = i * dt, [tx, ty] = target(tt);
    if (!i) { c.xs.push(tx); c.ys.push(ty); continue; }
    const x = c.xs[i - 1], y = c.ys[i - 1];
    c.vx += (w * w * (tx - x) - 2 * w * c.vx) * dt; c.vy += (w * w * (ty - y) - 2 * w * c.vy) * dt;
    c.xs.push(x + c.vx * dt); c.ys.push(y + c.vy * dt);
  }
  return [c.xs[n], c.ys[n]];
}

// الكاميرا كدالة بالزمن. channels: x y z roll zoom
export function cameraAt(t, { keys = [], handheld = null, track = null, fps = 30 } = {}) {
  const cam = { x: spline(keys, t, 'x'), y: spline(keys, t, 'y'), z: spline(keys, t, 'z'), roll: spline(keys, t, 'roll'), zoom: keys.some((k) => k.zoom != null) ? spline(keys, t, 'zoom') : 1 };
  if (track) { // لحاق: الكاميرا بتلحق دالة هدف بتأخير طبيعي، ممزوجة بالمسار
    const [fx, fy] = follow(track.target, t, fps, track);
    const mix = typeof track.mix === 'function' ? track.mix(t) : track.mix ?? 1;
    cam.x += (fx - cam.x) * mix; cam.y += (fy - cam.y) * mix;
  }
  if (handheld) { // اهتزاز يد: ضجيج ناعم بترددات منخفضة (مش random)
    const { amp = 4, freq = 0.35, rot = 0.15, seed = 'h' } = handheld;
    cam.x += noise2D(seed + 'x', t * freq, 0) * amp + noise2D(seed + 'x2', t * freq * 2.7, 0) * amp * 0.3;
    cam.y += noise2D(seed + 'y', t * freq, 1) * amp + noise2D(seed + 'y2', t * freq * 2.3, 1) * amp * 0.3;
    cam.roll += noise2D(seed + 'r', t * freq * 0.8, 2) * rot;
  }
  return cam;
}

export function useCamera(opts) {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  return cameraAt(frame / fps, { fps, ...opts });
}

// العالم: بيحمل الكاميرا والمنظور. perspective = البعد البؤري بالبكسل (أكبر = parallax أخف)
export function World({ camera, perspective = 1400, focus = 0, dof = 0, style, children }) {
  const { width: W, height: H } = useVideoConfig();
  const value = useMemo(() => {
    const f = perspective;
    // cam.z سالب = الكاميرا أقرب (dolly in)
    const scaleAt = (z) => { const d = f + z + camera.z; return d <= 1 ? 0 : (f / d) * camera.zoom; };
    const project = (X, Y, z = 0) => {
      const s = scaleAt(z), r = (-camera.roll * Math.PI) / 180;
      const dx = (X - camera.x) * s, dy = (Y - camera.y) * s;
      return [W / 2 + dx * Math.cos(r) - dy * Math.sin(r), H / 2 + dx * Math.sin(r) + dy * Math.cos(r), s];
    };
    return { camera, W, H, f, scaleAt, project, focus, dof };
  }, [camera.x, camera.y, camera.z, camera.roll, camera.zoom, W, H, perspective, focus, dof]);
  return <Ctx.Provider value={value}><AbsoluteFill style={{ overflow: 'hidden', ...style }}>{children}</AbsoluteFill></Ctx.Provider>;
}

// طبقة بعمق z. الأولاد بإحداثيات العالم (بكسل). blur اختياري حسب البعد عن البؤرة (dof).
export function Layer({ z = 0, children, style, blur }) {
  const w = useWorld();
  const s = w.scaleAt(z);
  if (s <= 0) return null;
  const { camera: c, W, H } = w;
  const db = blur ?? (w.dof ? Math.abs(z - w.focus) * w.dof : 0);
  const transform = `translate(${W / 2}px, ${H / 2}px) rotate(${-c.roll}deg) scale(${s}) translate(${-c.x}px, ${-c.y}px)`;
  return <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform, filter: db > 0.3 ? `blur(${db.toFixed(1)}px)` : undefined, willChange: 'transform', ...style }}>{children}</div>;
}

// تموضع عنصر بمركزه على نقطة بالعالم
export function At({ x = 0, y = 0, w, h, rotate = 0, scale = 1, opacity = 1, origin = 'center', children, style }) {
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`, transformOrigin: origin, opacity, ...style }}>{children}</div>;
}
