// طبقة الخريطة: بلاطات (قمر صناعي/تضاريس/NASA) + دول ومحافظات بأسماء عربية + مسارات + نقاط نابضة + غيوم.
// { type:'map', w, h, camera, base, style, borders, countries[], regions[], routes[], markers[], clouds }
// كل شي حتمي: البلاطات اللازمة لكل فريم بتنحمّل قبل الرسم (prepareMap).

import { value as v, colorToCss, parseColor, clamp, rng } from '../../lib/anim.js';
import { cameraAt, lonLatToWorld, unproject, routeWorld, alongWorld, metersPerPixel, TILE } from '../../lib/geo.js';

const K = 256; // المسارات محفوظة بإحداثيات زوم 8 (دقة كافية لحد زوم ~17)
const SOURCES = {
  satellite: { max: 18, kind: 'img' },
  bluemarble: { max: 8, kind: 'img' },
  osm: { max: 18, kind: 'img' },
  terrain: { max: 13, kind: 'dem' }, // تضاريس مولّدة (relief)
};

// ───────────────────────── البيانات الجغرافية ─────────────────────────

const geo = { countries: null, countriesHi: null, admin1: new Map(), paths: new Map() };

async function loadJSON(u) { return (await fetch(u)).json(); }
const pending = new Map();
async function once(key, url, set) {
  if (!pending.has(key)) pending.set(key, loadJSON(url).then((d) => { set(d); return d; }));
  return pending.get(key);
}
const countries = (hi) => (hi ? once('hi', '/assets/geo/countries.json', (d) => (geo.countriesHi = d)) : once('lo', '/assets/geo/countries-110.json', (d) => (geo.countries = d)));
const admin1 = (c) => once(`a1:${c}`, `/assets/geo/admin1/${c}.json`, (d) => geo.admin1.set(c, d));

// Path2D من geometry بإحداثيات K
function geomPath(key, geom) {
  if (geo.paths.has(key)) return geo.paths.get(key);
  const p = new Path2D();
  let length = 0;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : geom.type === 'LineString' ? [[geom.coordinates]] : geom.type === 'MultiLineString' ? [geom.coordinates] : [];
  const closed = geom.type.includes('Polygon');
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const poly of polys) for (const ring of poly) {
    let px, py;
    ring.forEach((c, i) => {
      const [x, y] = lonLatToWorld(c);
      const X = x * K, Y = y * K;
      if (i === 0) p.moveTo(X, Y); else { p.lineTo(X, Y); length += Math.hypot(X - px, Y - py); }
      px = X; py = Y;
      x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y);
    });
    if (closed) p.closePath();
  }
  const res = { p, length, bbox: [x0, y0, x1, y1] };
  geo.paths.set(key, res);
  return res;
}

function findFeature(fc, sel) {
  const s = String(sel).toLowerCase();
  return fc.features.find((f) => [f.properties.id, f.properties.iso, f.properties.name, f.properties.ar].some((x) => x && String(x).toLowerCase() === s));
}

// ───────────────────────── البلاطات ─────────────────────────

const tiles = new Map(); // key → canvas
const order = [];
const MAX_TILES = 700;

function styleKey(L) { return JSON.stringify([L.base, L.style ?? {}]); }

async function loadTile(L, z, x, y) {
  const src = L.base;
  const key = `${styleKey(L)}|${z}/${x}/${y}`;
  if (tiles.has(key)) return tiles.get(key);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    img.src = `/__tile/${src}/${z}/${x}/${y}${attempt ? `?r=${attempt}` : ''}`;
    try { await img.decode(); ok = true; } catch { await new Promise((r) => setTimeout(r, 300 * (attempt + 1))); }
  }
  if (!ok) return null; // ما منحفظ الفشل: بالرسم بنستعمل بلاطة أب بدالها
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d', { willReadFrequently: SOURCES[src].kind === 'dem' });
  const st = L.style ?? {};
  if (SOURCES[src].kind === 'dem') {
    g.drawImage(img, 0, 0);
    relief(g, z, y, st);
  } else {
    const f = [];
    if (st.saturation != null) f.push(`saturate(${st.saturation})`);
    if (st.brightness != null) f.push(`brightness(${st.brightness})`);
    if (st.contrast != null) f.push(`contrast(${st.contrast})`);
    if (st.blur) f.push(`blur(${st.blur}px)`);
    g.filter = f.join(' ') || 'none';
    g.drawImage(img, 0, 0);
    g.filter = 'none';
    if (st.tint) { g.globalCompositeOperation = st.tintMode ?? 'multiply'; g.fillStyle = colorToCss(st.tint); g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = 'source-over'; }
  }
  tiles.set(key, c);
  order.push(key);
  if (order.length > MAX_TILES) tiles.delete(order.shift());
  return c;
}

// تضاريس مرسومة: ظل الجبال (hillshade) + ألوان بحسب الارتفاع + بحر بعمق
function relief(g, z, ty, st) {
  const d = g.getImageData(0, 0, 256, 256);
  const px = d.data;
  const N = 256;
  const elev = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) elev[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty + 0.5)) / 2 ** z))) * 180) / Math.PI;
  const mpp = metersPerPixel(lat, z);
  const ex = st.exaggeration ?? 1.6;
  const land = parseColor(st.land ?? '#56524c'), high = parseColor(st.high ?? '#8a857b'), water = parseColor(st.water ?? '#16191c'), deep = parseColor(st.deep ?? st.water ?? '#0e1012');
  const az = ((st.azimuth ?? 315) * Math.PI) / 180, alt = ((st.altitude ?? 40) * Math.PI) / 180;
  const shadeK = st.shade ?? 0.85;
  const at = (x, y) => elev[Math.min(N - 1, Math.max(0, y)) * N + Math.min(N - 1, Math.max(0, x))];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = elev[y * N + x];
    const dzdx = ((at(x + 1, y) - at(x - 1, y)) / (2 * mpp)) * ex, dzdy = ((at(x, y + 1) - at(x, y - 1)) / (2 * mpp)) * ex;
    const slope = Math.atan(Math.hypot(dzdx, dzdy)), aspect = Math.atan2(dzdy, -dzdx);
    let hs = Math.cos(alt) * Math.cos(slope) + Math.sin(alt) * Math.sin(slope) * Math.cos(az - aspect);
    hs = clamp(hs);
    const i = (y * N + x) * 4;
    let c;
    if (e <= 0.5) {
      const k = clamp(-e / 4000);
      c = water.map((w, j) => w + (deep[j] - w) * k);
      const sh = 1 - (1 - hs) * 0.25;
      c = c.map((w) => w * sh);
    } else {
      const k = clamp(e / (st.highAt ?? 2500));
      const base = land.map((l, j) => l + (high[j] - l) * k);
      const sh = 1 - shadeK + shadeK * hs * 1.25;
      c = base.map((b) => b * sh);
    }
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
}

function tileZoom(L, z) {
  const src = SOURCES[L.base];
  return Math.max(0, Math.min(src.max, Math.round(z + (L.tileBias ?? 0.15))));
}

function visibleTiles(L, cam, W, H) {
  const tz = tileZoom(L, cam.zoom);
  const n = 2 ** tz;
  const corners = [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].map((p) => lonLatToWorld(unproject(cam, p)));
  const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
  const x0 = Math.floor((Math.min(...xs) / TILE) * n), x1 = Math.floor((Math.max(...xs) / TILE) * n);
  const y0 = Math.max(0, Math.floor((Math.min(...ys) / TILE) * n)), y1 = Math.min(n - 1, Math.floor((Math.max(...ys) / TILE) * n));
  const out = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([tz, x, y]);
  return out;
}

// ───────────────────────── تحضير ─────────────────────────

export async function prepMap(L, env) {
  await countries(false);
  if (L.detail !== 'low') await countries(true);
  for (const r of L.regions ?? []) await admin1(r.country);
  L.__W = L.w ?? env.W;
  L.__H = L.h ?? env.H;
  L.__routes = (L.routes ?? []).map(routeWorld);
}

export async function ensureMapTiles(L, t) {
  if (!L.base || L.base === 'none' || L.base === 'vector') return;
  const jobs = [];
  for (const dt of [0, -0.02, 0.02]) {
    const cam = cameraAt(L.camera, t + dt);
    for (const [z, x, y] of visibleTiles(L, cam, L.__W, L.__H)) {
      const n = 2 ** z;
      jobs.push(loadTile(L, z, ((x % n) + n) % n, y).then((r) => {
        if (r || z < 2) return r;
        const pz = z - 2, pn = 2 ** pz; // احتياط: الأب
        return loadTile(L, pz, ((Math.floor(x / 4) % pn) + pn) % pn, Math.floor(y / 4));
      }));
    }
  }
  await Promise.all(jobs);
}

// ───────────────────────── الرسم ─────────────────────────

let hatchCache = new Map();
function hatchPattern(ctx, h) {
  const key = JSON.stringify(h);
  if (!hatchCache.has(key)) {
    const s = h.spacing ?? 9;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    g.strokeStyle = colorToCss(h.color ?? '#ffffff55');
    g.lineWidth = h.width ?? 1.5;
    g.beginPath(); g.moveTo(-1, s + 1); g.lineTo(s + 1, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(s - 1, s + 1); g.lineTo(s + 1, s - 1); g.stroke();
    hatchCache.set(key, c);
  }
  return ctx.createPattern(hatchCache.get(key), 'repeat');
}

let cloudTex = null;
function cloudTexture() {
  if (cloudTex) return cloudTex;
  const N = 512, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const d = g.createImageData(N, N);
  const r = rng(77);
  const grid = (s) => { const a = new Float32Array((s + 1) * (s + 1)); for (let i = 0; i < a.length; i++) a[i] = r(); return a; };
  const octs = [4, 8, 16, 32, 64].map((s) => ({ s, a: grid(s) }));
  const sample = ({ s, a }, x, y) => {
    const fx = x * s, fy = y * s, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, w = fy - iy;
    const su = u * u * (3 - 2 * u), sw = w * w * (3 - 2 * w);
    const A = a[iy * (s + 1) + ix], B = a[iy * (s + 1) + ix + 1], C = a[(iy + 1) * (s + 1) + ix], D = a[(iy + 1) * (s + 1) + ix + 1];
    return A + (B - A) * su + (C - A) * sw + (A - B - C + D) * su * sw;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let n = 0, amp = 1, tot = 0;
    for (const o of octs) { n += sample(o, x / N, y / N) * amp; tot += amp; amp *= 0.5; }
    n /= tot;
    const edge = Math.min(x, y, N - x, N - y) / (N * 0.18);
    const a = clamp((n - 0.5) * 3.2) * clamp(edge);
    const i = (y * N + x) * 4;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = 245; d.data[i + 3] = a * 255;
  }
  g.putImageData(d, 0, 0);
  return (cloudTex = c);
}

function withWorld(ctx, cam, fn) {
  const [cx, cy] = lonLatToWorld(cam.center);
  const s = 2 ** cam.zoom / K;
  ctx.save();
  ctx.rotate((-(cam.rotation ?? 0) * Math.PI) / 180);
  ctx.scale(s, s);
  ctx.translate(-cx * K, -cy * K);
  fn(s);
  ctx.restore();
}

function styleShape(ctx, s, item, t, path) {
  const op = clamp(v(item.opacity ?? 1, t));
  if (op <= 0.002) return;
  ctx.save();
  ctx.globalAlpha *= op;
  // wipe: البلد (تعبئة وحدود) بيظهر بمسح عبره (من اليمين افتراضياً)
  const wipe = item.wipe != null ? clamp(v(item.wipe, t)) : 1;
  if (wipe <= 0.001) { ctx.restore(); return; }
  if (wipe < 1) {
    const [x0, y0, x1, y1] = path.bbox;
    const pad = (x1 - x0) * 0.02;
    const w = (x1 - x0 + pad * 2) * wipe;
    ctx.beginPath();
    if (item.wipeFrom === 'left') ctx.rect(x0 - pad, y0 - pad, w, y1 - y0 + pad * 2); else ctx.rect(x1 + pad - w, y0 - pad, w, y1 - y0 + pad * 2);
    ctx.clip();
  }
  if (item.fill) {
    ctx.save();
    if (item.glow) { ctx.shadowColor = colorToCss(item.glow.color ?? item.fill); ctx.shadowBlur = item.glow.blur ?? 30; }
    ctx.fillStyle = colorToCss(v(item.fill, t));
    ctx.fill(path.p, 'evenodd');
    ctx.shadowBlur = 0;
    if (item.hatch) {
      const pat = hatchPattern(ctx, item.hatch);
      pat.setTransform(new DOMMatrix().scale(1 / s));
      ctx.fillStyle = pat;
      ctx.fill(path.p, 'evenodd');
    }
    ctx.restore();
  }
  if (item.stroke) {
    ctx.strokeStyle = colorToCss(v(item.stroke, t));
    ctx.lineWidth = v(item.strokeWidth ?? 2, t) / s;
    ctx.lineJoin = 'round';
    if (item.glow) { ctx.shadowColor = colorToCss(item.glow.color ?? item.stroke); ctx.shadowBlur = item.glow.blur ?? 20; }
    if (item.dash) ctx.setLineDash(item.dash.map((d) => d / s));
    if (item.trim) {
      const tr = clamp(v(item.trim, t));
      ctx.setLineDash([path.length * tr, path.length * 2]);
    }
    ctx.stroke(path.p);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

export function drawMap(ctx, L, t) {
  const W = L.__W, H = L.__H;
  const cam = cameraAt(L.camera, t);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-W / 2, -H / 2, W, H);
  ctx.clip();
  const st = L.style ?? {};
  ctx.fillStyle = colorToCss(st.background ?? st.water ?? '#101214');
  ctx.fillRect(-W / 2, -H / 2, W, H);
  const hiRes = cam.zoom > 3.2;
  const cc = hiRes ? geo.countriesHi : geo.countries;

  withWorld(ctx, cam, (s) => {
    // ١. الأساس
    if (L.base && L.base !== 'none' && L.base !== 'vector') {
      ctx.imageSmoothingQuality = 'high';
      for (const [z, x, y] of visibleTiles(L, cam, W, H)) {
        const n = 2 ** z;
        const size = (TILE * K) / n;
        const pad = 0.6 / s; // تداخل نص بكسل لمنع الخطوط بين البلاطات
        let img = tiles.get(`${styleKey(L)}|${z}/${((x % n) + n) % n}/${y}`);
        if (img) { ctx.drawImage(img, x * size - pad, y * size - pad, size + pad * 2, size + pad * 2); continue; }
        // بلاطة ناقصة: منرسم الجزء المقابل من أقرب بلاطة أب (بدل مربع أسود)
        for (let up = 1; up <= 6 && !img; up++) {
          const pz = z - up, k = 2 ** up, pn = 2 ** pz;
          if (pz < 0) break;
          const px = Math.floor(x / k), py = Math.floor(y / k);
          img = tiles.get(`${styleKey(L)}|${pz}/${((px % pn) + pn) % pn}/${py}`);
          if (img) {
            const sub = 256 / k;
            ctx.drawImage(img, (x - px * k) * sub, (y - py * k) * sub, sub, sub, x * size - pad, y * size - pad, size + pad * 2, size + pad * 2);
          }
        }
      }
    }
    // اليابسة كأشكال (للخرائط المرسومة)
    if (L.base === 'vector' || L.land) {
      ctx.fillStyle = colorToCss(st.land ?? '#2b2d31');
      for (const f of cc?.features ?? []) ctx.fill(geomPath(`${hiRes ? 'h' : 'l'}:${f.properties.id}`, f.geometry).p, 'evenodd');
    }
    // ٢. حدود كل الدول
    if (L.borders) {
      const b = L.borders;
      ctx.strokeStyle = colorToCss(b.color ?? '#ffffff');
      ctx.globalAlpha = v(b.opacity ?? 0.25, t);
      ctx.lineWidth = (b.width ?? 1) / s;
      for (const f of cc?.features ?? []) ctx.stroke(geomPath(`${hiRes ? 'h' : 'l'}:${f.properties.id}`, f.geometry).p);
      ctx.globalAlpha = 1;
    }
    // ٣. دول ومحافظات مميزة
    for (const c of L.countries ?? []) {
      const f = findFeature(cc, c.id);
      if (!f) continue;
      styleShape(ctx, s, c, t, geomPath(`${hiRes ? 'h' : 'l'}:${f.properties.id}`, f.geometry));
    }
    for (const r of L.regions ?? []) {
      const src = geo.admin1.get(r.country);
      const f = src && findFeature(src, r.id);
      if (f) styleShape(ctx, s, r, t, geomPath(`a1:${f.properties.id}:${f.properties.name}`, f.geometry));
    }
    // ٤. مسارات
    (L.routes ?? []).forEach((r, i) => {
      const rw = L.__routes[i];
      const op = clamp(v(r.opacity ?? 1, t));
      if (op <= 0.002) return;
      const [a, b] = r.trim ? v(r.trim, t) : [0, 1];
      if (b - a <= 0.0005) return;
      ctx.save();
      ctx.globalAlpha *= op;
      ctx.beginPath();
      // نرسم بس الجزء الظاهر (بالطول)
      const start = alongWorld(rw, a).pt, end = alongWorld(rw, b).pt;
      ctx.moveTo(start[0] * K, start[1] * K);
      for (let k = 0; k < rw.pts.length; k++) { const fr = rw.len[k] / rw.total; if (fr > a && fr < b) ctx.lineTo(rw.pts[k][0] * K, rw.pts[k][1] * K); }
      ctx.lineTo(end[0] * K, end[1] * K);
      ctx.strokeStyle = colorToCss(v(r.color ?? '#ffffff', t));
      ctx.lineWidth = v(r.width ?? 3, t) / s;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (r.glow) { ctx.shadowColor = colorToCss(r.glow.color ?? r.color ?? '#fff'); ctx.shadowBlur = r.glow.blur ?? 16; }
      if (r.dash) { ctx.setLineDash(r.dash.map((d) => d / s)); ctx.lineDashOffset = (-(r.dashSpeed ?? 0) * t) / s; }
      ctx.stroke();
      ctx.restore();
    });
  });

  // ٥. نقاط (بإحداثيات الشاشة عشان أحجامها ثابتة)
  for (const m of L.markers ?? []) {
    const appear = m.appear ?? 0;
    if (t < appear) continue;
    const p = localOf(cam, m.at);
    const a = clamp((t - appear) / 0.35);
    const col = colorToCss(v(m.color ?? '#ff3b3b', t));
    const size = (m.size ?? 10) * (m.type === 'dot' ? 1 : 1);
    ctx.save();
    ctx.translate(p[0], p[1]);
    if (m.type === 'pulse' || m.type == null) {
      for (let k = 0; k < (m.rings ?? 2); k++) {
        const ph = ((t - appear) * (m.speed ?? 0.8) + k / (m.rings ?? 2)) % 1;
        ctx.globalAlpha = (1 - ph) * 0.8 * a;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, size + ph * size * 3.2, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = size * 1.5;
    ctx.beginPath(); ctx.arc(0, 0, size * (0.6 + 0.4 * a), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ٦. غيوم (طيران من خلالها)
  if (L.clouds) {
    const op = clamp(v(L.clouds.opacity ?? 0.8, t));
    if (op > 0.003) {
      const tex = cloudTexture();
      const base = L.clouds.zoomRef ?? cam.zoom;
      const layers = L.clouds.layers ?? 3;
      for (let i = 0; i < layers; i++) {
        const depth = 1 + i * 0.6;
        const sc = 2 ** ((cam.zoom - base) * depth * 0.9) * (L.clouds.scale ?? 2.4) * (1 + i * 0.35);
        const size = Math.max(W, H) * sc;
        const off = rng(i + 3)();
        ctx.save();
        ctx.globalAlpha = op * (0.55 - i * 0.12);
        ctx.rotate(off * 6);
        ctx.drawImage(tex, -size / 2 + (off - 0.5) * W * 0.6, -size / 2 + (off - 0.5) * H * 0.4, size, size);
        ctx.restore();
      }
    }
  }
  ctx.restore();
}

function localOf(cam, lonlat) {
  // نفس project بس مستورد محلياً لتجنب الدوران المزدوج
  const [cx, cy] = lonLatToWorld(cam.center);
  const [wx, wy] = lonLatToWorld(lonlat);
  const s = 2 ** cam.zoom;
  const dx = (wx - cx) * s, dy = (wy - cy) * s;
  const r = (-(cam.rotation ?? 0) * Math.PI) / 180;
  return [dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r)];
}

// للمساعدات: الفيتشر المحمّل لبلد/محافظة (للمراكز والحدود)
export function featureOf(sel, country) {
  const src = country ? geo.admin1.get(country) : geo.countriesHi ?? geo.countries;
  return src ? findFeature(src, sel) : null;
}
