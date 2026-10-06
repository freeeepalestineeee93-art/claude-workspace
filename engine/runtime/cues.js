// المؤثرات الصوتية التلقائية: بنقرأ المشهد ومنطلع "مين بيتحرك وإيمتى وقديش"، وكل حركة بتاخد صوتها.
// L.sfx = false (اسكت هالطبقة) | { kind, at, gain_db, params } | [...]
// comp.audio.auto = false (وقّف التلقائي كلياً)

import { value as v, motionSpan, stagger as staggerFn, spring } from '../../lib/anim.js';
import { textUnitCount } from './runtime.js';

const GAIN = { impact: -5, boom: -4, whoosh: -9, swish: -13, pop: -15, tick: -19, click: -17, marker: -13, scribble: -15, sparkle: -13, swell: -11, glitch: -12, hit: -10, chime: -12, riser: -10, shutter: -12, count: -18, typing: -16 };

const spCache = new Map();
const settle = (c) => { const k = JSON.stringify(c); if (!spCache.has(k)) spCache.set(k, spring(c).duration); return spCache.get(k); };

function unitDelays(an, n) {
  if (an.times) return Array.from({ length: n }, (_, i) => (an.times[i] ?? an.times[an.times.length - 1]) - an.at);
  const out = [];
  const fract = (x) => x - Math.floor(x);
  for (let i = 0; i < n; i++) out.push(an.order === 'random' ? (an.stagger?.each ?? 0.05) * (n - 1) * fract(Math.sin((i + 1) * 12.9898) * 43758.5453) : staggerFn(i, n, an.stagger || {}));
  return out;
}

function panOf(x, W) { return Math.max(-0.8, Math.min(0.8, ((x ?? W / 2) / W - 0.5) * 1.4)); }

function textCues(L, t0, W, out) {
  const x = v(L.x ?? W / 2, 0);
  const pan = panOf(x, W);
  for (const [an, isExit] of [[L.reveal, false], [L.exit, true]]) {
    if (!an) continue;
    const n = textUnitCount(L, an.by ?? 'all');
    const delays = unitDelays(an, n);
    const dur = an.spring ? settle(an.spring) : an.dur ?? 0.6;
    const at = t0 + an.at;
    const from = (isExit ? an.to : an.from) || {};
    const total = Math.max(...delays) + dur;
    if (from.draw === 0) out.push({ kind: 'scribble', at, params: { dur: Math.min(3, total) }, pan });
    else if (an.ease === 'hold' || dur < 0.01) delays.forEach((d, i) => out.push({ kind: 'tick', at: at + d, seed: i + 1, pan }));
    else if ((from.scale ?? 1) >= 1.8) delays.forEach((d, i) => out.push({ kind: 'impact', at: at + d + 0.06, params: { weight: 0.7 }, seed: i + 3 }));
    else if (from.scale === 0 && n <= 40) delays.forEach((d, i) => out.push({ kind: 'pop', at: at + d, seed: i + 7, params: { pitch: 0.85 + (i % 5) * 0.08 }, pan }));
    else if (isExit) out.push({ kind: 'whoosh', at: at + total * 0.5, align: 'peak', params: { dur: Math.max(0.3, total), brightness: 1.2, pan_from: 0, pan_to: 0.5 }, gain_db: -13 });
    else out.push({ kind: 'whoosh', at: at + Math.min(total * 0.45, 0.5), align: 'peak', params: { dur: Math.max(0.35, Math.min(1.2, total)), brightness: from.blur ? 0.7 : 1.0, pan_from: pan - 0.3, pan_to: pan + 0.3 }, gain_db: from.blur ? -14 : -11 });
  }
  for (const mk of L.marks || []) {
    const kind = mk.type === 'highlight' || mk.type === 'box' ? 'marker' : 'scribble';
    out.push({ kind, at: t0 + mk.at, params: { dur: mk.dur ?? 0.5 }, pan });
  }
}

// حركة طبقة عادية: كم بتتحرك نسبةً للشاشة
function moveCues(L, t0, W, H, out) {
  const props = ['x', 'y', 'scale', 'w', 'h', 'rotation', 'trim'];
  let best = null;
  for (const k of props) {
    const p = L[k];
    const span = motionSpan(p);
    if (!span) continue;
    const a = v(p, span[0] - 1e-3), b = v(p, span[1] + 5);
    let mag = 0;
    if (k === 'x' || k === 'w') mag = Math.abs(b - a) / W;
    else if (k === 'y' || k === 'h') mag = Math.abs(b - a) / H;
    else if (k === 'scale') { const A = Array.isArray(a) ? a[0] : a, B = Array.isArray(b) ? b[0] : b; mag = Math.abs(B - A) * 0.6; if (A === 0) mag = Math.max(mag, 0.2); }
    else if (k === 'rotation') mag = Math.abs(b - a) / 360;
    else if (k === 'trim') mag = 0.15;
    if (!best || mag > best.mag) best = { k, mag, span, a, b };
  }
  if (!best || best.mag < 0.04) return;
  const at = t0 + best.span[0];
  const dur = Math.min(1.5, best.span[1] - best.span[0]);
  const x = v(L.x ?? W / 2, at - t0);
  const pan = panOf(x, W);
  if (best.k === 'trim') out.push({ kind: L.type === 'icon' ? 'swish' : 'scribble', at, params: { dur: Math.max(0.2, dur * 0.8) }, pan });
  else if (best.k === 'scale' && (Array.isArray(best.a) ? best.a[0] : best.a) === 0) out.push({ kind: 'pop', at, params: { pitch: 0.7 }, pan, gain_db: -13 });
  else if (best.mag > 0.25) out.push({ kind: 'whoosh', at: at + dur * 0.4, align: 'peak', params: { dur: Math.max(0.3, dur), pan_from: pan - 0.4 * Math.sign(best.b - best.a || 1), pan_to: pan + 0.4 * Math.sign(best.b - best.a || 1) } });
  else out.push({ kind: 'swish', at: at + Math.min(0.05, dur * 0.2), params: { dur: Math.max(0.15, Math.min(0.35, dur)) }, pan });
}

function layerCues(layers, t0, env, out) {
  for (const L of layers || []) {
    if (!L || L.sfx === false) continue;
    const lt0 = t0 + (L.shift ?? 0);
    if (L.sfx) {
      for (const s of [].concat(L.sfx)) out.push({ ...s, at: lt0 + (s.at ?? (L.in ?? 0)), manual: true });
      if (!L.sfxAuto) continue;
    }
    if (L.type === 'text') textCues(L, lt0, env.W, out);
    else if (L.type === 'particles' && (L.count ?? 0) >= 40) out.push({ kind: 'sparkle', at: lt0 + (L.start ?? 0), params: { dur: 1.2, density: Math.min(24, Math.round(L.count / 10)) } });
    else if (L.type !== 'group') moveCues(L, lt0, env.W, env.H, out);
    if (L.children) layerCues(L.children, lt0, env, out);
  }
}

const TRANSITION_SFX = {
  whip: (d) => ({ kind: 'whoosh', params: { dur: d * 1.3, brightness: 1.3, weight: 1.2 }, gain_db: -6 }),
  push: (d) => ({ kind: 'whoosh', params: { dur: d * 1.2 } }),
  slide: (d) => ({ kind: 'whoosh', params: { dur: d * 1.2, brightness: 0.9 } }),
  zoom: (d) => ({ kind: 'whoosh', params: { dur: d * 1.4, brightness: 0.8, weight: 1.4 }, gain_db: -7 }),
  spin: (d) => ({ kind: 'whoosh', params: { dur: d * 1.3, weight: 1.3 } }),
  flash: () => ({ kind: 'impact', params: { weight: 0.6, bright: 1 }, gain_db: -8 }),
  dip: (d) => ({ kind: 'swell', params: { dur: d * 0.55 }, align: 'peak', gain_db: -13 }),
  glitch: (d) => ({ kind: 'glitch', params: { dur: d }, align: 'start' }),
  iris: (d) => ({ kind: 'whoosh', params: { dur: d * 1.2, brightness: 0.75 } }),
  shape: (d) => ({ kind: 'whoosh', params: { dur: d * 1.2, brightness: 0.85 } }),
  wipe: (d) => ({ kind: 'swish', params: { dur: Math.min(0.45, d) } }),
  blinds: (d) => ({ kind: 'swish', params: { dur: Math.min(0.45, d) } }),
  split: (d) => ({ kind: 'whoosh', params: { dur: d * 1.2, weight: 1.3 } }),
  fade: () => null,
  cut: () => ({ kind: 'hit', align: 'start', gain_db: -16 }),
};

export function computeCues(comp, env) {
  const out = [];
  const auto = comp.audio?.auto !== false;
  if (auto) {
    layerCues(comp.layers, 0, env, out);
    layerCues(comp.overlay, 0, env, out);
    comp.scenes.forEach((s, i) => {
      layerCues(s.layers, s.start, env, out);
      const tr = i > 0 ? s.transition : null;
      if (tr && tr.sfx !== false) {
        const d = tr.dur ?? 0.6;
        const mk = (tr.sfx && typeof tr.sfx === 'object') ? () => tr.sfx : TRANSITION_SFX[tr.type] ?? (tr.type.startsWith('gl:') ? (dd) => ({ kind: 'whoosh', params: { dur: dd * 1.2, brightness: 0.9 } }) : null);
        const c = mk?.(d);
        if (c) out.push({ align: 'peak', ...c, at: s.start + d * 0.5, transition: true });
      }
    });
  } else {
    // حتى بدون تلقائي: الأصوات اليدوية بتنحسب
    const manual = [];
    const walk = (ls, t0) => (ls || []).forEach((L) => { if (L?.sfx) [].concat(L.sfx).forEach((x) => manual.push({ ...x, at: t0 + (x.at ?? 0) })); if (L?.children) walk(L.children, t0); });
    walk(comp.layers, 0); comp.scenes.forEach((s) => walk(s.layers, s.start));
    out.push(...manual);
  }
  // تنظيف: دمج المتكرر القريب، وحد للكثافة
  out.sort((a, b) => a.at - b.at);
  const res = [];
  const last = {};
  for (const c of out) {
    if (c.at < 0 || c.at > comp.duration + 0.5) continue;
    const gap = { tick: 0.03, pop: 0.045, impact: 0.12, whoosh: 0.16, swish: 0.09 }[c.kind] ?? 0.06;
    if (!c.manual && last[c.kind] != null && c.at - last[c.kind] < gap) continue;
    last[c.kind] = c.at;
    res.push({ gain_db: GAIN[c.kind] ?? -12, ...c, params: { ...(c.params || {}), ...(c.pan != null && !c.params?.pan_from ? { pan: c.pan } : {}) } });
  }
  return res;
}
