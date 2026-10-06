// المركّب (compositor): بياخد وصف المشهد وبيرسم أي لحظة t على canvas.
// كل شي حتمي: نفس t = نفس الفريم بالضبط.

import { value, lerp, parseColor, colorToCss, clamp, spring, resolveEase, stagger as staggerFn, springPresets } from '../../lib/anim.js';
import { initType, preloadFont, layoutText } from '../../lib/type.js';
import { rectPath, ellipsePath, polygonPath, linePath, handCirclePath, handUnderlinePath } from '../../lib/shapes.js';

const DEG = Math.PI / 180;
const v = value;

// ───────────────────────── موارد ─────────────────────────

const path2d = new Map();
const pathLen = new Map();
let svgMeasure;

export function P(d) {
  let p = path2d.get(d);
  if (!p) { if (path2d.size > 20000) path2d.clear(); p = new Path2D(d); path2d.set(d, p); }
  return p;
}

export function pathLength(d) {
  let l = pathLen.get(d);
  if (l == null) {
    if (!svgMeasure) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
      svgMeasure = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(svgMeasure);
      document.body.appendChild(svg);
    }
    if (pathLen.size > 20000) pathLen.clear();
    svgMeasure.setAttribute('d', d);
    l = svgMeasure.getTotalLength();
    pathLen.set(d, l);
  }
  return l;
}

const images = new Map();
async function loadImage(src) {
  if (images.has(src)) return images.get(src);
  const img = new Image();
  img.decoding = 'sync';
  img.src = src;
  await img.decode();
  images.set(src, img);
  return img;
}

const icons = new Map();
const ICON_SETS = {
  lucide: (n) => `/node_modules/lucide-static/icons/${n}.svg`,
  tabler: (n) => `/node_modules/@tabler/icons/icons/outline/${n}.svg`,
  'tabler-filled': (n) => `/node_modules/@tabler/icons/icons/filled/${n}.svg`,
  phosphor: (n) => `/node_modules/@phosphor-icons/core/assets/regular/${n}.svg`,
  'phosphor-bold': (n) => `/node_modules/@phosphor-icons/core/assets/bold/${n}-bold.svg`,
  'phosphor-fill': (n) => `/node_modules/@phosphor-icons/core/assets/fill/${n}-fill.svg`,
  'phosphor-duotone': (n) => `/node_modules/@phosphor-icons/core/assets/duotone/${n}-duotone.svg`,
  iconoir: (n) => `/node_modules/iconoir/icons/regular/${n}.svg`,
  remix: (n) => `/node_modules/remixicon/icons/${n}.svg`,
  brand: (n) => `/node_modules/simple-icons/icons/${n}.svg`,
};

// تحويل أيقونة SVG لقائمة مسارات d موحّدة مع معرفة إذا هي stroke ولا fill
async function loadIcon(name) {
  if (icons.has(name)) return icons.get(name);
  const [set, id] = name.includes(':') ? name.split(':') : ['lucide', name];
  const url = ICON_SETS[set]?.(id) ?? name;
  const txt = await (await fetch(url)).text();
  const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
  const svg = doc.documentElement;
  const vb = (svg.getAttribute('viewBox') || '0 0 24 24').split(/[ ,]+/).map(Number);
  const rootStroke = svg.getAttribute('stroke');
  const isStroke = rootStroke && rootStroke !== 'none';
  const parts = [];
  for (const el of svg.querySelectorAll('path,circle,ellipse,rect,line,polyline,polygon')) {
    let d;
    const a = (k) => +el.getAttribute(k) || 0;
    switch (el.tagName) {
      case 'path': d = el.getAttribute('d'); break;
      case 'circle': d = shiftPath(ellipsePath(a('r') * 2), a('cx'), a('cy')); break;
      case 'ellipse': d = shiftPath(ellipsePath(a('rx') * 2, a('ry') * 2), a('cx'), a('cy')); break;
      case 'rect': d = shiftPath(rectPath(a('width'), a('height'), a('rx')), a('x') + a('width') / 2, a('y') + a('height') / 2); break;
      case 'line': d = `M${a('x1')},${a('y1')}L${a('x2')},${a('y2')}`; break;
      case 'polyline': case 'polygon': {
        const pts = el.getAttribute('points').trim().split(/[\s,]+/).map(Number);
        d = 'M' + pts.reduce((s, n, i) => s + (i % 2 ? ',' : i ? 'L' : '') + n, '') + (el.tagName === 'polygon' ? 'Z' : '');
      }
    }
    const fill = el.getAttribute('fill');
    const opacity = +(el.getAttribute('opacity') ?? 1);
    if (d) parts.push({ d, opacity, fillNone: fill === 'none' });
  }
  const res = { vb, parts, stroke: isStroke };
  icons.set(name, res);
  return res;
}

function shiftPath(d, dx, dy) {
  // إزاحة مسار بسيط (M/L/A/Z بإحداثيات مطلقة) — كافي للأشكال الأساسية
  return d.replace(/([MLA])([^MLAZC]+)/g, (m, cmd, args) => {
    const n = args.trim().split(/[\s,]+/).map(Number);
    if (cmd === 'A') { n[5] += dx; n[6] += dy; return `A${n[0]},${n[1]} ${n[2]} ${n[3]} ${n[4]} ${n[5]},${n[6]}`; }
    return `${cmd}${n[0] + dx},${n[1] + dy}`;
  });
}

// ── رسومات SVG كاملة (لوغو، illustration) بألوانها وتحويلاتها ──
const arts = new Map();
function parseTransform(tr) {
  let m = [1, 0, 0, 1, 0, 0];
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  for (const [, fn, args] of (tr || '').matchAll(/(\w+)\(([^)]*)\)/g)) {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === 'translate') m = mul(m, [1, 0, 0, 1, n[0], n[1] ?? 0]);
    else if (fn === 'scale') m = mul(m, [n[0], 0, 0, n[1] ?? n[0], 0, 0]);
    else if (fn === 'matrix') m = mul(m, n);
    else if (fn === 'rotate') { const a = (n[0] * Math.PI) / 180, c = Math.cos(a), si = Math.sin(a); m = mul(m, [c, si, -si, c, 0, 0]); }
  }
  return m;
}
async function loadArt(src) {
  if (arts.has(src)) return arts.get(src);
  const doc = new DOMParser().parseFromString(await (await fetch(src)).text(), 'image/svg+xml');
  const svg = doc.documentElement;
  const vb = (svg.getAttribute('viewBox') || `0 0 ${parseFloat(svg.getAttribute('width')) || 100} ${parseFloat(svg.getAttribute('height')) || 100}`).split(/[ ,]+/).map(Number);
  const parts = [];
  const visit = (el, m) => {
    const own = parseTransform(el.getAttribute?.('transform'));
    const M = [m[0] * own[0] + m[2] * own[1], m[1] * own[0] + m[3] * own[1], m[0] * own[2] + m[2] * own[3], m[1] * own[2] + m[3] * own[3], m[0] * own[4] + m[2] * own[5] + m[4], m[1] * own[4] + m[3] * own[5] + m[5]];
    if (el.tagName === 'path' && el.getAttribute('d')) {
      const fill = el.getAttribute('fill') ?? (el.getAttribute('style') || '').match(/fill:\s*([^;]+)/)?.[1] ?? '#000';
      const stroke = el.getAttribute('stroke');
      parts.push({ d: el.getAttribute('d'), m: M, fill: fill === 'none' ? null : fill, stroke: stroke && stroke !== 'none' ? stroke : null, sw: +(el.getAttribute('stroke-width') || 1), op: +(el.getAttribute('opacity') ?? 1) });
    }
    for (const c of el.children || []) visit(c, M);
  };
  visit(svg, [1, 0, 0, 1, 0, 0]);
  // مركز كل قطعة (لتحريكها من مكانها)
  const meas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  meas.style.cssText = 'position:absolute;visibility:hidden';
  document.body.appendChild(meas);
  for (const p of parts) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    e.setAttribute('d', p.d);
    meas.appendChild(e);
    const b = e.getBBox();
    p.c = [p.m[0] * (b.x + b.width / 2) + p.m[2] * (b.y + b.height / 2) + p.m[4], p.m[1] * (b.x + b.width / 2) + p.m[3] * (b.y + b.height / 2) + p.m[5]];
    p.area = b.width * b.height;
  }
  meas.remove();
  const res = { vb, parts };
  arts.set(src, res);
  return res;
}

// { type:'svg', src, size (العرض), reveal: { mode:'draw'|'pop'|'rise'|'fade'|'assemble', at, each, dur, spring, order:'area'|'doc'|'x'|'random' }, recolor: { '#e43946': '#fff' } }
function drawArt(ctx, L, t) {
  const art = arts.get(L.src);
  if (!art) throw new Error(`الرسمة ما انحمّلت: ${L.src}`);
  const [vx, vy, vw, vh] = art.vb;
  const k = v(L.size ?? vw, t) / vw;
  ctx.save();
  ctx.scale(k, k);
  ctx.translate(-vx - vw / 2, -vy - vh / 2);
  const rv = L.reveal;
  let order = art.parts.map((p, i) => i);
  if (rv?.order === 'area') order.sort((a, b) => art.parts[b].area - art.parts[a].area);
  else if (rv?.order === 'x') order.sort((a, b) => art.parts[b].c[0] - art.parts[a].c[0]);
  else if (rv?.order === 'random') order.sort((a, b) => Math.sin(a * 91.7) - Math.sin(b * 91.7));
  const rank = new Map(order.map((idx, r) => [idx, r]));
  art.parts.forEach((p, i) => {
    let prog = 1;
    if (rv) {
      const lt = t - rv.at - rank.get(i) * (rv.each ?? 0.06);
      prog = lt <= 0 ? 0 : rv.spring ? cachedSp(rv.spring)(lt) : resolveEase(rv.ease ?? 'glide')(clamp(lt / (rv.dur ?? 0.7)));
    }
    if (prog <= 0.001 && rv?.mode !== 'draw') return;
    ctx.save();
    const mode = rv?.mode ?? 'fade';
    const [cx, cy] = p.c;
    if (mode === 'pop' || mode === 'assemble' || mode === 'rise') {
      ctx.translate(cx, cy);
      if (mode === 'pop') ctx.scale(prog, prog);
      if (mode === 'rise') ctx.translate(0, (1 - prog) * vh * 0.12);
      if (mode === 'assemble') { const a = Math.sin(i * 12.9898) * 43758.5453 % 1; ctx.translate((1 - prog) * vw * 0.5 * Math.cos(a * 6.28), (1 - prog) * vh * 0.5 * Math.sin(a * 6.28)); ctx.rotate((1 - prog) * a * 2); }
      ctx.translate(-cx, -cy);
    }
    ctx.globalAlpha *= p.op * (mode === 'draw' ? 1 : clamp(prog * 1.6));
    ctx.transform(...p.m);
    const path = P(p.d);
    const col = (c) => colorToCss(L.recolor?.[c?.toLowerCase()] ?? L.recolor?.[c] ?? c);
    if (mode === 'draw') {
      // حدود بتنرسم أولاً، بعدين بتتعبّى
      const len = pathLength(p.d);
      const dp = clamp(prog * 1.6);
      ctx.lineWidth = (L.drawWidth ?? 2) / k;
      ctx.strokeStyle = col(p.stroke ?? p.fill ?? '#fff');
      ctx.setLineDash([len * dp, len * 2]);
      if (dp > 0) ctx.stroke(path);
      ctx.setLineDash([]);
      const fa = clamp(prog * 2 - 1);
      if (p.fill && fa > 0) { ctx.globalAlpha *= fa; ctx.fillStyle = col(p.fill); ctx.fill(path); }
    } else {
      if (p.fill) { ctx.fillStyle = col(p.fill); ctx.fill(path); }
      if (p.stroke) { ctx.strokeStyle = col(p.stroke); ctx.lineWidth = p.sw; ctx.stroke(path); }
    }
    ctx.restore();
  });
  ctx.restore();
}

// ───────────────────────── canvases مؤقتة ─────────────────────────

const pool = [];
function getCanvas(w, h) {
  let c = pool.pop();
  if (!c) c = document.createElement('canvas');
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.clearRect(0, 0, w, h);
  return c;
}
const release = (c) => pool.push(c);

// ───────────────────────── الألوان والتعبئة ─────────────────────────

function paint(ctx, spec, t) {
  if (spec == null) return null;
  const s = v(spec, t);
  if (typeof s === 'string' || Array.isArray(s)) return colorToCss(s);
  if (s.linear || s.radial || s.conic) {
    let g;
    if (s.linear) { const [[x0, y0], [x1, y1]] = v(s.linear, t); g = ctx.createLinearGradient(x0, y0, x1, y1); }
    else if (s.radial) { const { c = [0, 0], r = 100, c0, r0 = 0 } = v(s.radial, t); g = ctx.createRadialGradient(...(c0 ?? c), r0, ...c, r); }
    else { const { c = [0, 0], angle = 0 } = s.conic; g = ctx.createConicGradient(angle * DEG, ...c); }
    for (const [o, c] of s.stops) g.addColorStop(clamp(v(o, t)), colorToCss(v(c, t)));
    return g;
  }
  return null;
}

// ───────────────────────── التحويلات ─────────────────────────

function applyTransform(ctx, L, t, env) {
  let x = v(L.x ?? 0, t), y = v(L.y ?? 0, t);
  let sc = v(L.scale ?? 1, t);
  let [sx, sy] = Array.isArray(sc) ? sc : [sc, sc];
  // عمق 2.5D: الطبقات البعيدة بتتحرك أبطأ وبتصغر (parallax حقيقي)
  const z = v(L.z ?? 0, t);
  if (z && env.camera && !env.inGroup) {
    const cam = env.camera;
    const persp = cam.perspective;
    const k = persp / Math.max(1, persp + z - cam.z);
    x = cam.cx + (x - cam.cx) * k;
    y = cam.cy + (y - cam.cy) * k;
    sx *= k; sy *= k;
  }
  ctx.translate(x, y);
  const rot = v(L.rotation ?? 0, t);
  if (rot) ctx.rotate(rot * DEG);
  const skx = v(L.skewX ?? 0, t), sky = v(L.skewY ?? 0, t);
  if (skx || sky) ctx.transform(1, Math.tan(sky * DEG), Math.tan(skx * DEG), 1, 0, 0);
  if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
  const o = v(L.origin, t);
  if (o) ctx.translate(-o[0], -o[1]);
}

// كاميرا المشهد: بتنطبق على كل الطبقات (pan/zoom/rotate/shake)
function applyCamera(ctx, cam, W, H) {
  if (!cam) return;
  ctx.translate(W / 2, H / 2);
  if (cam.rotation) ctx.rotate(cam.rotation * DEG);
  if (cam.zoom !== 1) ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-W / 2 - cam.x, -H / 2 - cam.y);
}

export function evalCamera(c, t, W, H) {
  if (!c) return null;
  return {
    x: v(c.x ?? 0, t), y: v(c.y ?? 0, t), z: v(c.z ?? 0, t), zoom: v(c.zoom ?? 1, t), rotation: v(c.rotation ?? 0, t),
    perspective: c.perspective ?? 1200, cx: W / 2 + v(c.x ?? 0, t), cy: H / 2 + v(c.y ?? 0, t),
  };
}

// ───────────────────────── رسم الطبقات ─────────────────────────

const active = (L, t) => t >= (L.in ?? -Infinity) && t < (L.out ?? Infinity);

// توهج الأشكال البسيطة بينعمل بـ shadowBlur (رخيص)؛ النصوص والمجموعات بيحتاجوا طبقة منفصلة
const CHEAP_GLOW = new Set(['circle', 'ellipse', 'rect', 'path', 'line', 'polygon']);
const cheapGlow = (L) => L.glow && CHEAP_GLOW.has(L.type) && !L.shadow && !(L.glow.strength > 1);
function needsIsolation(L, t) {
  return (v(L.blur ?? 0, t) > 0.05) || (L.glow && !cheapGlow(L)) || L.mask || L.matte || L.spray || (L.type === 'group' && (L.isolate || v(L.opacity ?? 1, t) < 1)) || (L.fx && L.fx.length);
}

export function drawLayers(ctx, layers, t, env) {
  for (const L of layers) if (L && active(L, t)) drawLayer(ctx, L, t, env);
}

export function drawLayer(ctx, L, t, env) {
  if (env.hideText && L.type === 'text') return;
  // posterize: الطبقة بتتحرك بفريمات أقل (12fps = خربشة ماركر/رسم يدوي) وهي ضمن فيديو 24/30
  if (L.posterize) t = Math.floor(t * L.posterize + 1e-6) / L.posterize;
  // صدى: نسخ من الطبقة بأزمنة سابقة بشفافية متناقصة (أثر الكرة الطايرة، نص مكرر)
  if (L.echo && !env.inEcho) {
    const e = L.echo, n = e.count ?? 5, step = e.step ?? 0.035, decay = e.decay ?? 0.62;
    const base = (L.__echoL ??= { ...L, echo: null, sfx: false });
    const eenv = { ...env, rec: null, inEcho: true };
    for (let k = n; k >= 1; k--) {
      ctx.save();
      ctx.globalAlpha *= (e.opacity ?? 0.9) * decay ** k;
      drawLayer(ctx, base, t - k * step, eenv);
      ctx.restore();
    }
  }
  const op = clamp(v(L.opacity ?? 1, t));
  if (op <= 0.001) return;
  const lt = t - (L.shift ?? 0); // زمن محلي (precomp)

  if (needsIsolation(L, t)) return drawIsolated(ctx, L, t, env, op);

  ctx.save();
  if (L.blend) ctx.globalCompositeOperation = L.blend === 'add' ? 'lighter' : L.blend;
  ctx.globalAlpha *= op;
  if (cheapGlow(L)) {
    ctx.shadowColor = colorToCss(L.glow.color ?? L.fill ?? '#fff');
    ctx.shadowBlur = L.glow.blur ?? 20;
  }
  if (L.shadow) {
    const s = v(L.shadow, t);
    ctx.shadowColor = colorToCss(s.color ?? 'rgba(0,0,0,.35)');
    ctx.shadowBlur = s.blur ?? 30;
    ctx.shadowOffsetX = s.x ?? 0;
    ctx.shadowOffsetY = s.y ?? 12;
  }
  applyTransform(ctx, L, t, env);
  if (env.rec) env.rec.layer?.(L, ctx.getTransform(), ctx.globalAlpha * (env.recOpacity ?? 1), lt, env);
  drawContent(ctx, L, lt, env);
  ctx.restore();
}

// رسم الطبقة على canvas منفصل لتطبيق blur/glow/mask/matte عليها كوحدة
function drawIsolated(ctx, L, t, env, op) {
  const { W, H } = env;
  const c = getCanvas(W, H);
  const cx = c.getContext('2d');
  cx.setTransform(ctx.getTransform());
  const inner = { ...L, opacity: 1, blur: 0, glow: null, mask: null, matte: null, blend: null, isolate: false, fx: null, spray: null, __spray: L.spray };
  drawLayer(cx, inner, t, env.rec ? { ...env, recOpacity: (env.recOpacity ?? 1) * op, recBlur: v(L.blur ?? 0, t) } : env);

  if (L.mask) {
    // القناع: شكل بيقص الطبقة (بيتحرك لحاله)
    const m = getCanvas(W, H);
    const mx = m.getContext('2d');
    mx.setTransform(ctx.getTransform());
    const masks = Array.isArray(L.mask) ? L.mask : [L.mask];
    for (const mk of masks) drawLayer(mx, { fill: '#fff', ...mk }, t, env);
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.globalCompositeOperation = L.maskInvert ? 'destination-out' : 'destination-in';
    cx.drawImage(m, 0, 0);
    release(m);
  }
  if (L.matte) {
    const m = getCanvas(W, H);
    const mx = m.getContext('2d');
    mx.setTransform(ctx.getTransform());
    drawLayer(mx, L.matte.layer, t, env);
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.globalCompositeOperation = L.matte.invert ? 'destination-out' : 'destination-in';
    cx.drawImage(m, 0, 0);
    release(m);
  }

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const blur = v(L.blur ?? 0, t);
  if (L.glow) {
    const g = v(L.glow, t);
    const radius = g.radius ?? 40, strength = g.strength ?? 1;
    const gc = getCanvas(W, H);
    const gx = gc.getContext('2d');
    gx.filter = `blur(${radius}px)`;
    gx.drawImage(c, 0, 0);
    if (g.color) { gx.filter = 'none'; gx.globalCompositeOperation = 'source-in'; gx.fillStyle = colorToCss(g.color); gx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = op * Math.min(1, strength);
    ctx.drawImage(gc, 0, 0);
    if (strength > 1) { ctx.globalAlpha = op * (strength - 1); ctx.drawImage(gc, 0, 0); }
    release(gc);
  }
  ctx.globalCompositeOperation = L.blend ? (L.blend === 'add' ? 'lighter' : L.blend) : 'source-over';
  ctx.globalAlpha = op;
  if (blur > 0.05) ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(c, 0, 0);
  ctx.restore();
  release(c);
}

// ملمس رذاذ (أسلوب Bauhaus/riso): الشكل بيتآكل بحبيبات باتجاه معين
let sprayNoise = null;
function sprayPattern(ctx) {
  if (!sprayNoise) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const d = g.createImageData(256, 256);
    let sd = 99;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 256 * 256; i++) d.data[i * 4 + 3] = r() < 0.5 ? 255 : r() * 255;
    g.putImageData(d, 0, 0);
    sprayNoise = c;
  }
  return ctx.createPattern(sprayNoise, 'repeat');
}
function applySpray(ctx, sp, d) {
  const p = P(d);
  // صندوق المسار (منقيسه من SVG مرة وحدة)
  let bb = sprayBoxes.get(d);
  if (!bb) {
    if (!svgMeasure) pathLength('M0,0');
    svgMeasure.setAttribute('d', d);
    bb = svgMeasure.getBBox();
    sprayBoxes.set(d, bb);
  }
  const ang = ((sp.angle ?? 0) * Math.PI) / 180;
  const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, R = Math.hypot(bb.width, bb.height) / 2;
  const tmp = document.createElement('canvas');
  const m = ctx.getTransform();
  tmp.width = ctx.canvas.width; tmp.height = ctx.canvas.height;
  const g = tmp.getContext('2d');
  g.setTransform(m);
  const grad = g.createLinearGradient(cx - Math.cos(ang) * R, cy - Math.sin(ang) * R, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
  const st = sp.start ?? 0.35, amt = sp.amount ?? 0.9;
  grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(st, 'rgba(0,0,0,0)'); grad.addColorStop(1, `rgba(0,0,0,${amt})`);
  g.fillStyle = grad;
  g.fill(p);
  g.globalCompositeOperation = 'destination-in';
  g.setTransform(1, 0, 0, 1, 0, 0);
  const pat = sprayPattern(g);
  pat.setTransform(new DOMMatrix().scale(sp.grain ?? 1.4));
  g.fillStyle = pat;
  g.fillRect(0, 0, tmp.width, tmp.height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}
const sprayBoxes = new Map();

function strokeAndFill(ctx, L, t, d, len) {
  const p = P(d);
  const fill = paint(ctx, L.fill, t);
  if (fill && L.__spray) { ctx.fillStyle = fill; ctx.fill(p, L.fillRule || 'nonzero'); applySpray(ctx, L.__spray, d); }
  else if (fill) {
    ctx.fillStyle = fill;
    const fo = L.fillOpacity != null ? clamp(v(L.fillOpacity, t)) : 1;
    if (fo < 1) { ctx.save(); ctx.globalAlpha *= fo; ctx.fill(p, L.fillRule || 'nonzero'); ctx.restore(); }
    else ctx.fill(p, L.fillRule || 'nonzero');
  }
  if (L.stroke) {
    const sw = v(L.strokeWidth ?? 2, t);
    if (sw <= 0) return;
    ctx.strokeStyle = paint(ctx, L.stroke, t);
    ctx.lineWidth = sw;
    ctx.lineCap = L.lineCap ?? 'round';
    ctx.lineJoin = L.lineJoin ?? 'round';
    if (L.trim) {
      const [s, e] = v(L.trim, t);
      const off = v(L.trimOffset ?? 0, t);
      if (e - s <= 0.0005) return;
      const total = len ?? pathLength(d);
      ctx.setLineDash([Math.max(0.01, (e - s) * total), total * 2]);
      ctx.lineDashOffset = -(s + off) * total;
    } else if (L.dash) {
      ctx.setLineDash(v(L.dash, t));
      ctx.lineDashOffset = v(L.dashOffset ?? 0, t);
    }
    ctx.stroke(p);
    ctx.setLineDash([]);
  }
}

function drawContent(ctx, L, t, env) {
  switch (L.type) {
    case 'group': {
      const sub = { ...env, inGroup: env.inGroup || false };
      drawLayers(ctx, L.children || [], t, sub);
      break;
    }
    case 'rect': strokeAndFill(ctx, L, t, rectPath(v(L.w, t), v(L.h, t), v(L.radius ?? 0, t))); break;
    case 'ellipse': { const w = L.w != null ? v(L.w, t) : v(L.r, t) * 2; strokeAndFill(ctx, L, t, ellipsePath(w, v(L.h ?? w, t))); break; }
    case 'polygon': strokeAndFill(ctx, L, t, polygonPath(L.sides ?? 3, v(L.r ?? 50, t), L.inner != null ? v(L.inner, t) : null, v(L.angle ?? 0, t))); break;
    case 'line': strokeAndFill(ctx, { fill: null, ...L }, t, linePath(v(L.points, t), L.closed)); break;
    case 'path': strokeAndFill(ctx, L, t, v(L.d, t)); break;
    case 'text': drawText(ctx, L, t, env); break;
    case 'image': drawImageLayer(ctx, L, t); break;
    case 'icon': drawIcon(ctx, L, t); break;
    case 'svg': drawArt(ctx, L, t); break;
    case 'custom': L.draw(ctx, t, env, L); break;
    case 'canvas': { const src = L.source(t, env); if (src) ctx.drawImage(src, -v(L.w, t) / 2, -v(L.h, t) / 2, v(L.w, t), v(L.h, t)); break; }
    default:
      if (env.plugins?.[L.type]) env.plugins[L.type](ctx, L, t, env);
      else throw new Error(`نوع طبقة غير معروف: ${L.type}`);
  }
}

// ضجيج قيمي حتمي (لحواف القصاصات الخشنة)
function hash2(x, y, seed) { let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// معالجة صورة (مرة وحدة وبتنحفظ): أبيض وأسود، تباين، grain، dither خشن، halftone، duotone
const toned = new Map();
function toneImage(img, o) {
  const key = `${img.src}|${JSON.stringify(o)}`;
  if (toned.has(key)) return toned.get(key);
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, w, h), d = id.data;
  const con = o.contrast ?? 1.25, bri = o.brightness ?? 0, gam = o.gamma ?? 1, grain = o.grain ?? 0, dither = o.dither ?? 0, seed = o.seed ?? 1;
  const duo = o.duotone ? o.duotone.map(parseColor) : null;
  const L = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    let l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    l = Math.pow(Math.max(0, Math.min(1, (l - 0.5) * con + 0.5 + bri)), gam);
    if (grain) l += (hash2(p % w, (p / w) | 0, seed) - 0.5) * grain;
    if (dither) { const th = hash2(p % w, (p / w) | 0, seed + 7); l = l * (1 - dither) + (l > th ? 1 : 0) * dither; }
    L[p] = Math.max(0, Math.min(1, l));
  }
  if (o.halftone) {
    // نقاط halftone: كل خلية بنقطة سودا حجمها حسب العتمة
    const cell = o.halftone.cell ?? 6, mix = o.halftone.mix ?? 1;
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    const og = out.getContext('2d');
    og.fillStyle = '#fff'; og.fillRect(0, 0, w, h); og.fillStyle = '#000';
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      let s = 0, n = 0;
      for (let yy = y; yy < Math.min(h, y + cell); yy += 2) for (let xx = x; xx < Math.min(w, x + cell); xx += 2) { s += L[yy * w + xx]; n++; }
      const r = Math.sqrt(1 - s / n) * cell * 0.72;
      if (r > 0.3) { og.beginPath(); og.arc(x + cell / 2, y + cell / 2, r, 0, Math.PI * 2); og.fill(); }
    }
    const hd = og.getImageData(0, 0, w, h).data;
    for (let p = 0; p < L.length; p++) L[p] = L[p] * (1 - mix) + (hd[p * 4] / 255) * mix;
  }
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const l = L[p];
    if (duo) { d[i] = duo[0][0] + (duo[1][0] - duo[0][0]) * l; d[i + 1] = duo[0][1] + (duo[1][1] - duo[0][1]) * l; d[i + 2] = duo[0][2] + (duo[1][2] - duo[0][2]) * l; }
    else d[i] = d[i + 1] = d[i + 2] = l * 255;
  }
  g.putImageData(id, 0, 0);
  c.naturalWidth = w; c.naturalHeight = h; c.src = key;
  toned.set(key, c);
  return c;
}

// تنظيف حافة القص (rembg بيترك هالة رمادية): تقليص ألفا بكسل-اتنين + شد الحافة لتصير حادة وناعمة
const choked = new Map();
function chokeImage(img, px) {
  const key = `${img.src}|choke${px}`;
  if (choked.has(key)) return choked.get(key);
  const w = img.naturalWidth ?? img.width, h = img.naturalHeight ?? img.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, w, h), d = id.data, a0 = new Uint8ClampedArray(w * h);
  for (let p = 0; p < w * h; p++) a0[p] = d[p * 4 + 3];
  const r = Math.max(1, Math.round(px));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let mn = 255;
    for (let k = -r; k <= r && mn > 0; k++) { const xx = x + k, yy = y + k; if (xx >= 0 && xx < w) mn = Math.min(mn, a0[y * w + xx]); if (yy >= 0 && yy < h) mn = Math.min(mn, a0[yy * w + x]); }
    const a = mn / 255, s = Math.max(0, Math.min(1, (a - 0.35) / 0.4));
    d[(y * w + x) * 4 + 3] = s * s * (3 - 2 * s) * 255;
  }
  g.putImageData(id, 0, 0);
  c.naturalWidth = w; c.naturalHeight = h; c.src = key;
  choked.set(key, c);
  return c;
}

// قصاصة بإطار (sticker): حدود حول الأجزاء غير الشفافة بالصورة (للصور المقصوصة)
// rough: حافة متعرجة عضوية متل قص المقص (أسلوب الجزيرة رياضة) · offset: إزاحة الورقة ورا الصورة
const outlined = new Map();
function outlineImage(img, width, color, o = {}) {
  const key = `${img.src}|${width}|${color}|${JSON.stringify(o)}`;
  if (outlined.has(key)) return outlined.get(key);
  const iw = img.naturalWidth ?? img.width, ih = img.naturalHeight ?? img.height;
  const rough = o.rough ?? 0, off = o.offset ?? [0, 0];
  const pad = Math.ceil(width * (1 + rough) + Math.max(Math.abs(off[0]), Math.abs(off[1])) + 4);
  const c = document.createElement('canvas');
  c.width = iw + pad * 2; c.height = ih + pad * 2;
  const g = c.getContext('2d', { willReadFrequently: true });
  const R = width * (1 + rough * 0.6);
  const steps = Math.max(16, Math.ceil(R * 2));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    g.drawImage(img, pad + off[0] + Math.cos(a) * R, pad + off[1] + Math.sin(a) * R);
  }
  g.drawImage(img, pad + off[0], pad + off[1]);
  if (rough > 0 || o.smooth) {
    // تنعيم + عتبة متغيرة بالضجيج = حافة عضوية
    const b = document.createElement('canvas'); b.width = c.width; b.height = c.height;
    const bg = b.getContext('2d', { willReadFrequently: true });
    bg.filter = `blur(${Math.max(1, width * 0.45)}px)`; bg.drawImage(c, 0, 0); bg.filter = 'none';
    const id = bg.getImageData(0, 0, b.width, b.height), d = id.data, sc = 1 / Math.max(8, width * (o.scale ?? 2.2)), seed = o.seed ?? 3;
    for (let i = 3, p = 0; i < d.length; i += 4, p++) {
      const x = p % b.width, y = (p / b.width) | 0;
      const th = 0.5 + (vnoise(x * sc, y * sc, seed) - 0.5) * rough * 0.9 + (vnoise(x * sc * 3, y * sc * 3, seed + 1) - 0.5) * rough * 0.25;
      d[i] = Math.max(0, Math.min(255, ((d[i] / 255 - th) / 0.06 + 0.5) * 255)); // عتبة ناعمة (حافة بدون تسنين)
    }
    g.clearRect(0, 0, c.width, c.height);
    g.putImageData(id, 0, 0);
  }
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = colorToCss(color);
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-over';
  g.drawImage(img, pad, pad);
  c.naturalWidth = c.width; c.naturalHeight = c.height; c.src = key;
  const res = { canvas: c, pad };
  outlined.set(key, res);
  return res;
}

function drawImageLayer(ctx, L, t) {
  let img = images.get(L.src);
  if (!img) throw new Error(`الصورة ما انحمّلت: ${L.src}`);
  if (L.tone) img = toneImage(img, L.tone);
  if (L.outline && L.choke !== 0) img = chokeImage(img, L.choke ?? 1);
  if (L.outline) {
    // الإطار محسوب بأبعاد الصورة الأصلية، ومنرسمه بنفس نسبة الحجم المطلوب. أكتر من إطار = طبقات (كريمي ثم أخضر...)
    const w0 = v(L.w ?? img.naturalWidth, t), h0 = v(L.h ?? (img.naturalHeight * w0) / img.naturalWidth, t);
    const kx = w0 / img.naturalWidth, ky = h0 / img.naturalHeight;
    let src = img;
    for (const ol of Array.isArray(L.outline) ? L.outline : [L.outline]) {
      src = outlineImage(src, ol.width ?? Math.round(Math.max(img.naturalWidth, img.naturalHeight) * 0.02), ol.color ?? '#ffffff', ol).canvas;
    }
    const W2 = src.width * kx, H2 = src.height * ky;
    ctx.drawImage(src, -W2 / 2, -H2 / 2, W2, H2);
    return;
  }
  const w = v(L.w ?? img.naturalWidth, t), h = v(L.h ?? img.naturalHeight, t);
  const fit = L.fit ?? 'cover';
  const ir = img.naturalWidth / img.naturalHeight, br = w / h;
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  let dw = w, dh = h;
  const focus = v(L.focus ?? [0.5, 0.5], t);
  if (fit === 'cover') {
    if (ir > br) { sw = sh * br; sx = (img.naturalWidth - sw) * focus[0]; } else { sh = sw / br; sy = (img.naturalHeight - sh) * focus[1]; }
  } else if (fit === 'contain') {
    if (ir > br) dh = w / ir; else dw = h * ir;
  }
  // Ken Burns داخل الإطار
  const zoom = v(L.zoom ?? 1, t);
  if (zoom !== 1) { const nw = sw / zoom, nh = sh / zoom; sx += (sw - nw) * focus[0]; sy += (sh - nh) * focus[1]; sw = nw; sh = nh; }
  const r = v(L.radius ?? 0, t);
  if (r) { ctx.save(); ctx.clip(P(rectPath(dw, dh, r))); }
  ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  if (r) ctx.restore();
  if (L.stroke) strokeAndFill(ctx, { ...L, fill: null }, t, rectPath(dw, dh, r));
}

function drawIcon(ctx, L, t) {
  const ic = icons.get(L.icon);
  if (!ic) throw new Error(`الأيقونة ما انحمّلت: ${L.icon}`);
  const size = v(L.size ?? 96, t);
  const [vx, vy, vw, vh] = ic.vb;
  const unit = Math.max(vw, vh);
  const k = size / unit;
  ctx.save();
  ctx.scale(k, k);
  ctx.translate(-vx - vw / 2, -vy - vh / 2);
  const color = L.color ?? '#fff';
  const asStroke = L.mode ? L.mode === 'stroke' : ic.stroke;
  // سماكة الخط بوحدات أيقونة 24px، فبتضل متناسقة مهما كبر الحجم
  const sw = v(L.strokeWidth ?? 2, t) * (unit / 24);
  for (const part of ic.parts) {
    const sub = asStroke
      ? { stroke: color, strokeWidth: sw, trim: L.trim, fill: L.fill ?? null }
      : { fill: part.fillNone ? null : color, fillOpacity: part.opacity !== 1 ? part.opacity : L.fillOpacity, stroke: L.stroke, strokeWidth: sw, trim: L.trim };
    strokeAndFill(ctx, sub, t, part.d);
  }
  ctx.restore();
}

// ───────────────────────── النص ─────────────────────────

const layoutCache = new Map();

function textLayout(L, t) {
  const opts = {
    family: L.family, size: v(L.size ?? 72, t), weight: v(L.weight ?? 400, t), italic: L.italic,
    axes: L.axes ? Object.fromEntries(Object.entries(L.axes).map(([k, a]) => [k, v(a, t)])) : undefined,
    features: L.features, tracking: v(L.tracking ?? 0, t), lineHeight: L.lineHeight, align: L.align ?? 'center',
    maxWidth: L.maxWidth ?? Infinity,
    kashida: (L.kashida || []).map((k) => ({ word: k.word, at: k.at, amount: v(k.amount, t) })),
  };
  const text = v(L.text, t);
  const key = text + JSON.stringify(opts);
  let lay = layoutCache.get(key);
  if (!lay) {
    lay = layoutText(text, opts);
    if (layoutCache.size > 400) layoutCache.clear();
    layoutCache.set(key, lay);
  }
  return lay;
}

export function textUnitCount(L, by) {
  return units(textLayout(L, L.reveal?.at ?? 0), by).length;
}

// وحدات التحريك: glyph | char (الحرف مع نقاطه) | word | line | all
function units(lay, by) {
  if (by === 'all') return [{ glyphs: lay.glyphs, box: lay.box, i: 0 }];
  if (by === 'line') return lay.lines.map((l, i) => ({ glyphs: l.glyphs.filter((g) => !g.space), box: l.box, i }));
  if (by === 'word') return lay.words.map((w, i) => ({ glyphs: w.glyphs, box: w.box, i, word: w.index }));
  if (by === 'glyph') return lay.glyphs.map((g, i) => ({ glyphs: [g], box: gbox(g), i }));
  // char: تجميع حسب الـ cluster
  const m = new Map();
  for (const g of lay.glyphs) {
    const k = `${g.line}:${g.cluster}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(g);
  }
  return [...m.values()].map((gs, i) => ({ glyphs: gs, box: ubox(gs), i }));
}
const gbox = (g) => ({ x: g.x + g.box.x, y: g.y + g.box.y, w: g.box.w * g.sx, h: g.box.h, cx: g.x + g.box.x + (g.box.w * g.sx) / 2, cy: g.y + g.box.y + g.box.h / 2 });
function ubox(gs) {
  const bs = gs.map(gbox);
  const x0 = Math.min(...bs.map((b) => b.x)), x1 = Math.max(...bs.map((b) => b.x + b.w));
  const y0 = Math.min(...bs.map((b) => b.y)), y1 = Math.max(...bs.map((b) => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

// حالة الوحدة بلحظة t حسب الـ animator (reveal/exit/loop)
const IDENT = { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, blur: 0, skewX: 0, draw: 1, fill: 1, clip: 0 };

function animProgress(an, u, n, t) {
  const delay = an.times ? (an.times[u.i] ?? an.times[an.times.length - 1]) - an.at : an.order === 'random'
    ? (an.stagger?.each ?? 0.05) * (n - 1) * fract(Math.sin((u.i + 1) * 12.9898) * 43758.5453)
    : staggerFn(u.i, n, an.stagger || {});
  const lt = t - an.at - delay;
  if (lt <= 0) return 0;
  if (an.spring) {
    const s = cachedSp(an.spring);
    return s(lt);
  }
  const dur = an.dur ?? 0.6;
  return resolveEase(an.ease ?? 'glide')(clamp(lt / dur));
}
const fract = (x) => x - Math.floor(x);
const spCache = new Map();
const cachedSp = (c) => { const k = JSON.stringify(c); if (!spCache.has(k)) spCache.set(k, spring(c)); return spCache.get(k); };

function unitState(L, u, n, t) {
  const st = { ...IDENT };
  const rv = L.reveal;
  if (rv) {
    const p = animProgress(rv, u, n, t);
    for (const [k, from] of Object.entries(rv.from || {})) st[k] = lerpNum(from, IDENT[k], p, k);
  }
  const ex = L.exit;
  if (ex && t >= ex.at - 0.0001) {
    const p = animProgress(ex, u, n, t);
    for (const [k, to] of Object.entries(ex.to || {})) st[k] = lerpNum(st[k], to, p, k);
  }
  if (L.loop) {
    const lp = L.loop;
    const ph = (lp.phase ?? 0.6) * u.i;
    const w = Math.sin((t * (lp.freq ?? 1) * Math.PI * 2) - ph);
    for (const [k, amp] of Object.entries(lp.amp || {})) st[k] += w * amp;
  }
  return st;
}
const lerpNum = (a, b, p, k) => (k === 'opacity' || k === 'draw' || k === 'fill' ? clamp(a + (b - a) * p, 0, 1) : a + (b - a) * p);

function drawText(ctx, L, t, env) {
  const lay = textLayout(L, t);
  // anchor: وين x بالنسبة للنص — start = بداية القراءة (يمين بالعربي)، end = نهايتها
  if (L.anchor && L.anchor !== 'center') {
    const half = lay.box.w / 2, cxOff = lay.box.cx;
    const startSide = lay.rtl ? 1 : -1; // جهة بداية القراءة
    const k = L.anchor === 'start' ? startSide : -startSide;
    ctx.translate(-cxOff - k * half, 0);
  }
  if (L.vAnchor === 'top') ctx.translate(0, -lay.box.y);
  else if (L.vAnchor === 'bottom') ctx.translate(0, -(lay.box.y + lay.box.h));
  const s = lay.scale;
  const fill = L.fill ?? L.color ?? '#ffffff';
  const by = L.reveal?.by ?? L.exit?.by ?? L.loop?.by ?? 'all';
  const us = units(lay, by);
  const n = us.length;
  if (env.rec?.text) {
    const m = ctx.getTransform();
    const b = lay.box;
    const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    env.rec.text({ L, scene: env.scene?.start ?? -1, text: v(L.text, t), box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) },
      size: lay.size * Math.hypot(m.a, m.b), fill: solidOf(v(fill, t)), alpha: ctx.globalAlpha * (env.recOpacity ?? 1), lay, matrix: m, units: us, by, state: (u) => unitState(L, u, n, t), env,
      visible: us.reduce((mx, u) => {
        // الظهور الفعلي: شفافية الوحدة، ومع الـ mask: لازم يكون الدخول بلّش والخروج ما خلص
        let o = unitState(L, u, n, t).opacity;
        if (L.reveal && animProgress(L.reveal, u, n, t) < 0.05) o = Math.min(o, L.reveal.mask || L.reveal.from?.opacity === 0 ? 0 : o);
        if (L.exit?.mask && t >= L.exit.at && animProgress(L.exit, u, n, t) > 0.95) o = 0;
        return Math.max(mx, o);
      }, 0), boxFill: L.box?.fill ? solidOf(v(L.box.fill, t)) : null });
  }

  // صندوق خلفية للنص (label/pill/عنوان بصندوق) — حجمه من النص نفسه، وبيختفي مع النص
  if (L.box) {
    let vis = 0;
    for (const u of us) {
      let o = unitState(L, u, n, t).opacity;
      if (L.exit && t >= L.exit.at) o = Math.min(o, 1 - clamp(animProgress(L.exit, u, n, t)));
      vis = Math.max(vis, o);
    }
    if (vis > 0.002) { ctx.save(); ctx.globalAlpha *= L.exit && t >= L.exit.at ? vis : 1; drawTextBox(ctx, L, lay, t); ctx.restore(); }
  }
  // علامات تحت النص (تظليل كلمة) — بتنرسم قبل النص
  for (const mk of L.marks || []) if (mk.layer !== 'over') drawMark(ctx, lay, mk, t);

  const wordStyle = (wi) => (L.words && L.words[wi]) || null;

  for (const u of us) {
    const st = unitState(L, u, n, t);
    if (st.opacity <= 0.002) continue;
    ctx.save();
    ctx.globalAlpha *= st.opacity;
    // نقطة الارتكاز: منتصف الوحدة على خط القاعدة (طبيعي أكتر للحروف)
    const ox = u.box.cx, oy = L.reveal?.pivot === 'center' ? u.box.cy : u.box.y + u.box.h;
    if (st.clip > 0.001 || L.reveal?.mask || (L.exit?.mask && t >= L.exit.at)) {
      // قص على مستوى السطر/الكلمة: الحرف بيطلع من ورا خط وهمي
      const pad = lay.size * 0.35;
      ctx.beginPath();
      ctx.rect(u.box.x - pad, u.box.y - pad * 0.6, u.box.w + pad * 2, u.box.h + pad * 1.2);
      ctx.clip();
    }
    ctx.translate(ox + st.x, oy + st.y);
    if (st.rotation) ctx.rotate(st.rotation * DEG);
    if (st.skewX) ctx.transform(1, 0, Math.tan(st.skewX * DEG), 1, 0, 0);
    const sx = st.scale * st.scaleX, sy = st.scale * st.scaleY;
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    ctx.translate(-ox, -oy);
    // blur رخيص: ظل مضبّب للحرف (Skia بيحسبه بس على مساحة الحرف) بدل فلتر على كل الكانفاس
    const blurPx = st.blur > 0.1 ? st.blur * Math.hypot(ctx.getTransform().a, ctx.getTransform().b) : 0;

    for (const g of u.glyphs) {
      if (!g.d) continue;
      const ws = wordStyle(g.word);
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.scale(s * g.sx, -s);
      const p = P(g.d);
      const fillA = st.fill * (L.draw ? clamp(st.draw * 2 - 1) : 1);
      if (fillA > 0.002) {
        ctx.fillStyle = ws?.color ? colorToCss(v(ws.color, t)) : paintText(ctx, fill, t, lay, g, s);
        if (fillA < 1) ctx.globalAlpha *= fillA;
        if (blurPx) {
          const m = ctx.getTransform();
          const OFF = 20000;
          ctx.shadowColor = typeof ctx.fillStyle === 'string' ? ctx.fillStyle : colorToCss(solidOf(v(fill, t)));
          ctx.shadowBlur = blurPx;
          ctx.shadowOffsetX = OFF;
          ctx.setTransform(m.a, m.b, m.c, m.d, m.e - OFF, m.f);
          ctx.fill(p);
          ctx.setTransform(m);
          ctx.shadowColor = 'transparent';
        } else ctx.fill(p);
        if (fillA < 1) ctx.globalAlpha /= fillA;
      }
      const strokeOn = L.stroke || (L.draw && st.draw < 1);
      if (strokeOn) {
        ctx.strokeStyle = colorToCss(v(L.stroke ?? fill, t));
        ctx.lineWidth = v(L.strokeWidth ?? 2, t) / s;
        ctx.lineJoin = 'round';
        if (L.draw && st.draw < 1) {
          const len = pathLength(g.d);
          const dp = clamp(st.draw * 2);
          ctx.setLineDash([len * dp, len * 2]);
        }
        if (!(L.draw && st.draw >= 1 && !L.stroke)) ctx.stroke(p);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  for (const mk of L.marks || []) if (mk.layer === 'over') drawMark(ctx, lay, mk, t);
}

const solidOf = (f) => (typeof f === 'string' || Array.isArray(f) ? f : f.stops?.[0]?.[1] ?? '#fff');

function paintText(ctx, fill, t, lay, g, s) {
  const f = v(fill, t);
  if (typeof f === 'string' || Array.isArray(f)) return colorToCss(f);
  // تدرج على كامل مربع النص، محسوب بإحداثيات الحرف المحلية (مقلوبة ومكبّرة)
  const b = lay.box;
  const a = (f.angle ?? 90) * DEG;
  const r = (Math.abs(Math.cos(a)) * b.w + Math.abs(Math.sin(a)) * b.h) / 2;
  const X0 = b.cx - Math.cos(a) * r, Y0 = b.cy - Math.sin(a) * r;
  const X1 = b.cx + Math.cos(a) * r, Y1 = b.cy + Math.sin(a) * r;
  const loc = (X, Y) => [(X - g.x) / (s * g.sx), -(Y - g.y) / s];
  const grad = ctx.createLinearGradient(...loc(X0, Y0), ...loc(X1, Y1));
  for (const [o, c] of f.stops) grad.addColorStop(o, colorToCss(c));
  return grad;
}

// box: { fill, stroke, strokeWidth, radius, pad: [x, y], shadow, reveal: { at, dur, ease, spring, from: 'start'|'end'|'center' } }
function drawTextBox(ctx, L, lay, t) {
  const B = L.box;
  const b = lay.box;
  const [px, py] = Array.isArray(B.pad) ? B.pad : [B.pad ?? lay.size * 0.45, (B.pad ?? lay.size * 0.45) * 0.55];
  // ارتفاع ثابت حسب مقاييس الخط (مش حسب الحروف) لحتى كل الصناديق بنفس الارتفاع
  const first = lay.lines[0], last = lay.lines[lay.lines.length - 1];
  const x0 = b.x - px, w = b.w + px * 2;
  const top = first.y - lay.size * (B.ascent ?? 0.78) - py;
  const h = last.y + lay.size * (B.descent ?? 0.36) + py - top;
  let p = 1;
  if (B.reveal) {
    const r = B.reveal;
    const lt = t - r.at;
    p = lt <= 0 ? 0 : r.spring ? cachedSp(r.spring)(lt) : resolveEase(r.ease ?? 'glide')(clamp(lt / (r.dur ?? 0.45)));
  }
  if (p <= 0.001) return;
  const from = B.reveal?.from ?? (lay.rtl ? 'start' : 'start');
  const ww = w * Math.max(0, p);
  let xx = x0;
  if (from === 'center') xx = x0 + (w - ww) / 2;
  else if ((from === 'start') === lay.rtl) xx = x0 + w - ww; // RTL: البداية يمين
  ctx.save();
  if (B.shadow) { const sh = B.shadow; ctx.shadowColor = colorToCss(sh.color ?? 'rgba(0,0,0,.4)'); ctx.shadowBlur = sh.blur ?? 24; ctx.shadowOffsetY = sh.y ?? 8; }
  if (B.glow) { ctx.shadowColor = colorToCss(B.glow.color ?? B.fill); ctx.shadowBlur = B.glow.blur ?? 30; }
  ctx.beginPath();
  ctx.roundRect(xx, top, ww, h, Math.min(B.radius ?? lay.size * 0.22, h / 2, ww / 2));
  if (B.fill) { ctx.fillStyle = colorToCss(v(B.fill, t)); ctx.fill(); }
  ctx.shadowBlur = 0;
  if (B.stroke) { ctx.strokeStyle = colorToCss(v(B.stroke, t)); ctx.lineWidth = B.strokeWidth ?? 2; ctx.stroke(); }
  ctx.restore();
}

// علامات المصمم: تظليل، خط تحت، دائرة يدوية، شطب، إطار
function drawMark(ctx, lay, mk, t) {
  const ws = Array.isArray(mk.word) ? mk.word : [mk.word, mk.word];
  const gs = lay.words.filter((w) => w.index >= ws[0] && w.index <= ws[1]).flatMap((w) => w.glyphs);
  if (!gs.length) return;
  const b = ubox(gs);
  const pad = mk.pad ?? lay.size * 0.12;
  const p = mk.spring ? cachedSp(mk.spring)(Math.max(0, t - mk.at)) : resolveEase(mk.ease ?? 'smooth')(clamp((t - mk.at) / (mk.dur ?? 0.5)));
  if (p <= 0) return;
  const color = colorToCss(v(mk.color ?? '#ffd84d', t));
  const dir = lay.rtl ? -1 : 1; // بالعربي التظليل بيمشي من اليمين لليسار
  ctx.save();
  if (mk.type === 'highlight' || mk.type === 'box') {
    const h = mk.type === 'highlight' ? b.h * (mk.height ?? 0.55) : b.h + pad * 2;
    const y = mk.type === 'highlight' ? b.y + b.h - h + pad * 0.3 : b.y - pad;
    const w = (b.w + pad * 2) * clamp(p, 0, 1.2);
    const x = dir < 0 ? b.x + b.w + pad - w : b.x - pad;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, mk.radius ?? h * 0.18);
    ctx.fill();
  } else if (mk.type === 'underline' || mk.type === 'strike') {
    const y = mk.type === 'underline' ? b.y + b.h + pad * 0.9 : b.cy;
    ctx.translate(b.cx, y);
    const d = handUnderlinePath(b.w + pad * 2, mk.seed ?? 3);
    strokeAndFill(ctx, { stroke: color, strokeWidth: mk.width ?? lay.size * 0.07, trim: dir < 0 ? [0, clamp(p)] : [1 - clamp(p), 1] }, t, d);
  } else if (mk.type === 'circle') {
    ctx.translate(b.cx, b.cy);
    const d = handCirclePath(b.w + pad * 4, b.h + pad * 3, mk.seed ?? 5);
    strokeAndFill(ctx, { stroke: color, strokeWidth: mk.width ?? lay.size * 0.05, trim: [0, clamp(p)] }, t, d);
  }
  ctx.restore();
}

// ───────────────────────── معلومات التصدير (After Effects) ─────────────────────────
// شكل الطبقة بلحظة t بإحداثياتها المحلية: مسارات + ألوان
export function exportGeometry(L, t) {
  const fillC = (f) => { const x = v(f, t); return x == null ? null : typeof x === 'string' || Array.isArray(x) ? parseColor(x) : parseColor(x.stops?.[0]?.[1] ?? '#fff'); };
  const base = { fill: fillC(L.fill), stroke: L.stroke ? fillC(L.stroke) : null, strokeWidth: v(L.strokeWidth ?? 2, t), trim: L.trim ? v(L.trim, t) : null };
  switch (L.type) {
    case 'rect': return { ...base, paths: [rectPath(v(L.w, t), v(L.h, t), v(L.radius ?? 0, t))] };
    case 'ellipse': { const w = L.w != null ? v(L.w, t) : v(L.r, t) * 2; return { ...base, paths: [ellipsePath(w, v(L.h ?? w, t))] }; }
    case 'polygon': return { ...base, paths: [polygonPath(L.sides ?? 3, v(L.r ?? 50, t), L.inner != null ? v(L.inner, t) : null, v(L.angle ?? 0, t))] };
    case 'line': return { ...base, fill: null, paths: [linePath(v(L.points, t), L.closed)] };
    case 'path': return { ...base, paths: [v(L.d, t)] };
    case 'icon': {
      const ic = icons.get(L.icon); const size = v(L.size ?? 96, t); const [vx, vy, vw, vh] = ic.vb; const k = size / Math.max(vw, vh);
      const col = parseColor(L.color ?? '#fff');
      return { local: [k, 0, 0, k, -k * (vx + vw / 2), -k * (vy + vh / 2)], fill: ic.stroke ? null : col, stroke: ic.stroke ? col : null, strokeWidth: v(L.strokeWidth ?? 2, t) * (Math.max(vw, vh) / 24) * k, trim: base.trim, paths: ic.parts.map((p) => p.d) };
    }
    case 'svg': {
      const art = arts.get(L.src); const [vx, vy, vw, vh] = art.vb; const k = v(L.size ?? vw, t) / vw;
      return { local: [k, 0, 0, k, -k * (vx + vw / 2), -k * (vy + vh / 2)], parts: art.parts.map((p) => ({ d: p.d, m: p.m, fill: p.fill ? parseColor(L.recolor?.[p.fill.toLowerCase()] ?? p.fill) : null })) };
    }
    case 'image': return { src: L.src, w: v(L.w, t), h: v(L.h, t) };
    default: return null;
  }
}

// ───────────────────────── تحميل الموارد ─────────────────────────

function walk(layers, fn) {
  for (const L of layers || []) {
    if (!L) continue;
    fn(L);
    if (L.children) walk(L.children, fn);
    if (L.mask) walk(Array.isArray(L.mask) ? L.mask : [L.mask], fn);
    if (L.matte) walk([L.matte.layer], fn);
  }
}

export async function preload(comp) {
  await initType();
  const fontsNeeded = new Map();
  const imgs = new Set(), ics = new Set(), arts_ = new Set();
  const all = [...(comp.layers || []), ...(comp.overlay || []), ...(comp.underlay || []), ...(comp.scenes || []).flatMap((s) => s.layers || [])];
  walk(all, (L) => {
    if (L.type === 'text') {
      const fam = L.family ?? 'IBM Plex Sans Arabic';
      L.family = fam;
      if (!fontsNeeded.has(fam)) fontsNeeded.set(fam, new Set());
      const w = L.weight ?? 400;
      // للأوزان المتحركة: منحمّل أطراف المدى (الملف المتغير بيغطي الباقي)
      const ws = typeof w === 'number' ? [w] : sampleWeights(w);
      ws.forEach((x) => fontsNeeded.get(fam).add(x));
    }
    if (L.type === 'image') imgs.add(L.src);
    if (L.type === 'icon') ics.add(L.icon);
    if (L.type === 'svg') arts_.add(L.src);
  });
  await Promise.all([...arts_].map(loadArt));
  for (const [fam, ws] of fontsNeeded) await preloadFont(fam, [...ws]);
  await Promise.all([...imgs].map(loadImage));
  await Promise.all([...ics].map(loadIcon));
}

function sampleWeights(w) {
  const out = new Set();
  for (let t = 0; t < 30; t += 0.25) out.add(Math.round(value(w, t)));
  return [...out];
}

export { springPresets, lerp, parseColor };
