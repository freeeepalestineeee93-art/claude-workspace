// رياضيات الخرائط: إسقاط Web Mercator، كاميرا خريطة، طيران سينمائي بين مكانين، ومسارات.
// إحداثيات "العالم": زوم 0 = 256×256 (متل بلاطات الخرائط). الشاشة = (العالم − المركز) × 2^zoom مع دوران.

import { value as v, resolveEase, clamp } from './anim.js';

export const TILE = 256;
const MAXLAT = 85.05112878;

export function lonLatToWorld([lon, lat]) {
  const la = Math.max(-MAXLAT, Math.min(MAXLAT, lat)) * (Math.PI / 180);
  return [((lon + 180) / 360) * TILE, ((1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2) * TILE];
}

export function worldToLonLat([x, y]) {
  const lon = (x / TILE) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / TILE;
  return [lon, (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))];
}

// متر لكل بكسل (لحساب مقاييس التضاريس)
export const metersPerPixel = (lat, zoom) => (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

// كاميرا الخريطة بلحظة t: { center:[lon,lat], zoom, rotation }
export function cameraAt(cam, t) {
  if (typeof cam === 'function') return cam(t);
  if (cam?.fly) return cam.fly(t);
  return { center: v(cam.center, t), zoom: v(cam.zoom ?? 3, t), rotation: v(cam.rotation ?? 0, t) };
}

// إسقاط نقطة جغرافية لإحداثيات محلية بالطبقة (مركز الطبقة = 0,0)
export function project(cam, lonlat) {
  const [cx, cy] = lonLatToWorld(cam.center);
  const [wx, wy] = lonLatToWorld(lonlat);
  const s = 2 ** cam.zoom;
  let dx = (wx - cx) * s, dy = (wy - cy) * s;
  // تصحيح الالتفاف حول خط الطول 180
  const span = TILE * s;
  if (dx > span / 2) dx -= span; else if (dx < -span / 2) dx += span;
  const r = (-(cam.rotation ?? 0) * Math.PI) / 180;
  return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)];
}

export function unproject(cam, [px, py]) {
  const r = ((cam.rotation ?? 0) * Math.PI) / 180;
  const dx = px * Math.cos(r) - py * Math.sin(r), dy = px * Math.sin(r) + py * Math.cos(r);
  const s = 2 ** cam.zoom;
  const [cx, cy] = lonLatToWorld(cam.center);
  return worldToLonLat([cx + dx / s, cy + dy / s]);
}

// ── طيران سينمائي (van Wijk & Nuij): بيبعد لفوق وبيرجع يقرّب، متل Google Earth ──
const RHO = Math.SQRT2;
function zoomPath(p0, p1, w) {
  // p = [ux, uy, viewWidthWorld]
  const [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1;
  const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
  if (d2 < 1e-12) {
    const S = Math.log(w1 / w0) / RHO;
    return { S, at: (s) => [ux0 + dx * s, uy0 + dy * s, w0 * Math.exp(RHO * s * S)] };
  }
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + RHO ** 4 * d2) / (2 * w0 * RHO * RHO * d1);
  const b1 = (w1 * w1 - w0 * w0 - RHO ** 4 * d2) / (2 * w1 * RHO * RHO * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / RHO;
  return {
    S,
    at: (s) => {
      const sv = s * S;
      const coshr0 = Math.cosh(r0);
      const u = (w0 / (RHO * RHO * d1)) * (coshr0 * Math.tanh(RHO * sv + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / Math.cosh(RHO * sv + r0)];
    },
  };
}

// keys: [{ t, center:[lon,lat], zoom, rotation?, ease?, mode?: 'fly'|'linear' }]
// بيرجع دالة كاميرا. بين كل مفتاحين: طيران (أو خطي)، بالـ ease المحدد.
export function flyPath(keys, W = 1080) {
  const ks = keys.slice().sort((a, b) => a.t - b.t);
  const segs = [];
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    const wa = lonLatToWorld(a.center), wb = lonLatToWorld(b.center);
    const pa = [wa[0], wa[1], W / 2 ** a.zoom], pb = [wb[0], wb[1], W / 2 ** b.zoom];
    const linear = (b.mode ?? a.mode) === 'linear';
    segs.push({ a, b, path: linear ? null : zoomPath(pa, pb), pa, pb, ease: resolveEase(b.ease ?? 'smooth') });
  }
  const f = (t) => {
    if (t <= ks[0].t || ks.length === 1) return { center: ks[0].center, zoom: ks[0].zoom, rotation: ks[0].rotation ?? 0 };
    const last = ks[ks.length - 1];
    if (t >= last.t) return { center: last.center, zoom: last.zoom, rotation: last.rotation ?? 0 };
    const sg = segs.find((s) => t >= s.a.t && t <= s.b.t);
    const p = sg.ease(clamp((t - sg.a.t) / (sg.b.t - sg.a.t)));
    let ux, uy, w;
    if (sg.path) [ux, uy, w] = sg.path.at(p);
    else { ux = sg.pa[0] + (sg.pb[0] - sg.pa[0]) * p; uy = sg.pa[1] + (sg.pb[1] - sg.pa[1]) * p; w = sg.pa[2] * (sg.pb[2] / sg.pa[2]) ** p; }
    const ra = sg.a.rotation ?? 0, rb = sg.b.rotation ?? 0;
    return { center: worldToLonLat([ux, uy]), zoom: Math.log2(W / w), rotation: ra + (rb - ra) * p };
  };
  f.keys = ks;
  return f;
}

// ── مسارات ──
// خط بين نقاط (مع قوس اختياري بين كل نقطتين بالإحداثيات العالمية)
export function routeWorld(route) {
  let pts = (route.points ?? [route.from, route.to]).map(lonLatToWorld);
  if (route.smooth && pts.length > 2) {
    // Catmull-Rom: منحنى ناعم بيمر بكل النقاط
    const P = [pts[0], ...pts, pts[pts.length - 1]], sm = [];
    for (let i = 1; i < P.length - 2; i++) for (let k = 0; k < 16; k++) {
      const u = k / 16, [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      sm.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
    sm.push(pts[pts.length - 1]);
    pts = sm;
  }
  const out = [];
  const bend = route.curve ?? 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (!bend) { if (i === 0) out.push([x0, y0]); out.push([x1, y1]); continue; }
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    const cx = mx - (dy / L) * L * bend, cy = my + (dx / L) * L * bend;
    for (let k = i === 0 ? 0 : 1; k <= 32; k++) {
      const u = k / 32;
      out.push([(1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1]);
    }
  }
  // أطوال تراكمية
  const len = [0];
  for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, len, total: len[len.length - 1] };
}

// نقطة واتجاه على المسار عند نسبة p (0..1) بالإحداثيات العالمية
export function alongWorld(rw, p) {
  const d = clamp(p) * rw.total;
  let i = 1;
  while (i < rw.len.length - 1 && rw.len[i] < d) i++;
  const a = rw.pts[i - 1], b = rw.pts[i];
  const seg = rw.len[i] - rw.len[i - 1] || 1;
  const u = (d - rw.len[i - 1]) / seg;
  return { pt: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
}

export function worldToLocal(cam, [wx, wy]) {
  return project(cam, worldToLonLat([wx, wy]));
}

// مساعد: مركز وزوم يغطّوا مجموعة نقاط/حدود بإطار W×H
export function fitBounds(bounds, W, H, pad = 0.12) {
  const [[w, s], [e, n]] = bounds;
  const a = lonLatToWorld([w, n]), b = lonLatToWorld([e, s]);
  const bw = Math.abs(b[0] - a[0]), bh = Math.abs(b[1] - a[1]);
  const zoom = Math.log2(Math.min((W * (1 - pad * 2)) / bw, (H * (1 - pad * 2)) / bh));
  return { center: worldToLonLat([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]), zoom };
}
