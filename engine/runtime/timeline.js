// التايملاين: مشاهد متتالية + انتقالات + طبقات فوق وتحت الكل + كاميرا.
// comp = { width, height, fps, duration?, background, camera?, underlay[], scenes[], overlay[], layers[] }
// scene = { id, duration, layers[], camera?, background?, transition?: { type, dur, ease, ...opts } }

import { value as v, resolveEase, clamp, colorToCss } from '../../lib/anim.js';
import { drawLayers, evalCamera, preload } from './runtime.js';
import { transitions2d } from './transitions2d.js';
import { glTransition, loadGlTransitions } from './gltransitions.js';
import { preparePlugins, ensureVideoFrames, ensureMapTiles } from './plugins.js';

export function buildTimeline(comp) {
  const scenes = (comp.scenes || []).map((s) => ({ ...s }));
  let t = 0;
  scenes.forEach((s, i) => {
    const tr = i > 0 ? s.transition : null;
    const overlap = tr && tr.type !== 'cut' ? (tr.dur ?? 0.6) : 0;
    s.start = Math.max(0, t - overlap);
    s.end = s.start + s.duration;
    s.overlap = overlap;
    t = s.end;
  });
  const duration = comp.duration ?? (scenes.length ? t : 5);
  return { ...comp, scenes, duration };
}

// كانفاس لكل مشهد (لما نحتاج ندمج مشهدين بانتقال)
const sceneCanvases = [];
function sceneCanvas(i, W, H) {
  let c = sceneCanvases[i];
  if (!c) { c = sceneCanvases[i] = document.createElement('canvas'); }
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  const ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  return c;
}

function fillBg(ctx, bg, t, W, H) {
  if (!bg) return;
  const b = v(bg, t);
  if (typeof b === 'string' || Array.isArray(b)) { ctx.fillStyle = colorToCss(b); ctx.fillRect(0, 0, W, H); }
  else if (b.layers) drawLayers(ctx, b.layers, t, { W, H });
}

function drawScene(ctx, comp, s, t, env) {
  const lt = t - s.start;
  const cam = evalCamera(s.camera ?? comp.camera, lt, env.W, env.H);
  if (s.background) fillBg(ctx, s.background, lt, env.W, env.H);
  ctx.save();
  if (cam) {
    ctx.translate(env.W / 2, env.H / 2);
    if (cam.rotation) ctx.rotate(cam.rotation * Math.PI / 180);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-env.W / 2 - cam.x, -env.H / 2 - cam.y);
  }
  drawLayers(ctx, s.layers || [], lt, { ...env, camera: cam, scene: s });
  ctx.restore();
}

// الرسم الأساسي لفريم واحد (بدون post و motion blur)
export function renderFrame(ctx, comp, t, env) {
  const { W, H } = env;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);
  fillBg(ctx, comp.background ?? '#000', t, W, H);
  if (comp.underlay) drawLayers(ctx, comp.underlay, t, env);
  if (comp.layers) {
    const cam = evalCamera(comp.camera, t, W, H);
    drawLayers(ctx, comp.layers, t, { ...env, camera: cam });
  }

  const live = comp.scenes.map((s, i) => ({ s, i })).filter(({ s }) => t >= s.start && t < s.end + 1e-9);
  // قطع حاد: عند الحد بالظبط بيكون في مشهدين "حيين"؛ الجديد هو اللي بينرسم
  if (live.length >= 2 && !(live.at(-1).s.transition && live.at(-1).s.overlap)) drawScene(ctx, comp, live.at(-1).s, t, env);
  else if (live.length === 1) drawScene(ctx, comp, live[0].s, t, env);
  else if (live.length >= 2) {
    const [a, b] = live.slice(-2);
    const tr = b.s.transition;
    const raw = clamp((t - b.s.start) / (b.s.overlap || 1e-6));
    const p = resolveEase(tr.ease ?? 'snap')(raw);
    const ca = sceneCanvas(0, W, H), cb = sceneCanvas(1, W, H);
    drawScene(ca.getContext('2d'), comp, a.s, t, env);
    drawScene(cb.getContext('2d'), comp, b.s, t, env);
    const fn = tr.type.startsWith('gl:') ? glTransition : env.transitions?.[tr.type] ?? transitions2d[tr.type];
    if (!fn) throw new Error(`انتقال غير معروف: ${tr.type}`);
    fn(ctx, ca, cb, p, { ...tr, W, H, raw, t });
  }

  if (comp.overlay) drawLayers(ctx, comp.overlay, t, env);
  ctx.restore();
}

function flatten(layers, shift = 0, out = []) {
  for (const L of layers || []) {
    if (!L) continue;
    L.__shift = shift;
    out.push(L);
    if (L.children) flatten(L.children, shift + (L.shift ?? 0), out);
  }
  return out;
}

export function allLayers(comp) {
  return [
    ...flatten(comp.layers), ...flatten(comp.underlay), ...flatten(comp.overlay),
    ...(comp.scenes || []).flatMap((s) => flatten(s.layers, s.start)),
  ];
}

// تجهيز موارد لحظة معينة (فريمات الفيديو) قبل الرسم
export async function prepareFrame(comp, t) {
  if (!comp.__videos) comp.__videos = allLayers(comp).filter((L) => L.type === 'video');
  if (comp.__videos.length) await ensureVideoFrames(comp.__videos, t);
  if (!comp.__maps) comp.__maps = allLayers(comp).filter((L) => L.type === 'map');
  for (const L of comp.__maps) await ensureMapTiles(L, t - (L.__shift ?? 0));
}

export async function preloadAll(comp, env = {}) {
  await preload(comp);
  await preparePlugins(allLayers(comp), env);
  if ((comp.scenes || []).some((s) => s.transition?.type?.startsWith('gl:'))) await loadGlTransitions();
}
