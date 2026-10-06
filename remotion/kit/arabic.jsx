// نص عربي بمستوى الحرف/الكلمة جوّا Remotion — عبر محرك HarfBuzz تبعنا (lib/type.js)، فالوصل ما بينكسر أبداً.
//
//   anchor: center | start | end | right | left
//   <ArabicText text="الحقيقة أولاً" size={120} weight={700} fill="#fff" x={540} y={800}
//     reveal={{ by: 'word', at: 0.4, dur: 0.6, ease: 'out', stagger: 0.08, from: { y: 60, opacity: 0, blur: 8 }, mask: true }}
//     exit={{ by: 'word', at: 3.2, dur: 0.35, to: { y: -40, opacity: 0 } }}
//     draw={{ at: 0, dur: 1.2 }} words={{ 1: { fill: '#4FDCFF' } }} />
//
// by: glyph | word | line | all · الترتيب افتراضياً من اليمين (بداية القراءة) · mask: كل وحدة بتطلع من ورا حافتها
// حرف ناقص بالخط → console.error "✗ حرف ناقص" (بيطلع بالرندر)
import React, { useEffect, useMemo, useState } from 'react';
import { delayRender, continueRender, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { initType, preloadFont, layoutText } from '../../lib/type.js';
import { base } from './base.js';

const ready = new Map();
function useFont(family, weight) {
  const key = `${family}|${weight}`;
  const [ok, setOk] = useState(ready.get(key) === true);
  const [h] = useState(() => (ready.get(key) === true ? null : delayRender(`font ${key}`)));
  useEffect(() => {
    if (ready.get(key) === true) return;
    if (!ready.has(key)) ready.set(key, (async () => { await initType({ base: base() }); await preloadFont(family, [weight]); ready.set(key, true); })());
    Promise.resolve(ready.get(key)).then(() => { setOk(true); continueRender(h); });
  }, [key]);
  return ok;
}

const EASE = {
  linear: (u) => u,
  out: (u) => 1 - (1 - u) ** 3,
  outQuint: (u) => 1 - (1 - u) ** 5,
  inOut: (u) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2),
  in: (u) => u ** 3,
  back: (u) => { const c = 1.7; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; },
};
const clamp = (u) => Math.max(0, Math.min(1, u));

// تقدّم وحدة (0→1) لحركة دخول/خروج
function progress(an, i, n, t, fps) {
  const st = an.stagger ?? 0.06;
  const order = an.order === 'reverse' ? n - 1 - i : i;
  const at = an.at + order * st;
  if (an.spring) return spring({ frame: (t - at) * fps, fps, config: typeof an.spring === 'object' ? an.spring : { damping: 14, mass: 1, stiffness: 160 } });
  return (EASE[an.ease ?? 'out'] ?? EASE.out)(clamp((t - at) / (an.dur ?? 0.5)));
}

export function ArabicText({ text, family = 'IBM Plex Sans Arabic', weight = 700, size = 80, fill = '#fff', stroke, strokeWidth = 0,
  x = 0, y = 0, anchor = 'center', lineHeight = 1.3, align = 'center', maxWidth, reveal, exit, draw, words = {}, glow, style }) {
  const ok = useFont(family, weight);
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const lay = useMemo(() => (ok ? layoutText(text, { family, size, weight, lineHeight, align, maxWidth }) : null), [ok, text, family, size, weight, lineHeight, align, maxWidth]);
  const by = reveal?.by ?? exit?.by ?? 'word';
  // وحدات الحركة مرتبة حسب القراءة (يمين ← يسار بالعربي)
  const units = useMemo(() => {
    if (!lay) return [];
    const gs = lay.glyphs.filter((g) => g.d);
    const key = (g) => (by === 'glyph' ? `${g.line}:${g.cluster}:${g.gid}:${g.x.toFixed(1)}` : by === 'word' ? g.word : by === 'line' ? g.line : 0);
    const m = new Map();
    for (const g of gs) { const k = key(g); if (!m.has(k)) m.set(k, []); m.get(k).push(g); }
    const us = [...m.values()].map((glyphs) => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const g of glyphs) { x0 = Math.min(x0, g.x + g.box.x); x1 = Math.max(x1, g.x + g.box.x + g.box.w * g.sx); y0 = Math.min(y0, g.y + g.box.y); y1 = Math.max(y1, g.y + g.box.y + g.box.h); }
      return { glyphs, box: { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }, line: glyphs[0].line };
    });
    us.sort((a, b) => a.line - b.line || (lay.rtl ? b.box.cx - a.box.cx : a.box.cx - b.box.cx));
    return us;
  }, [lay, by]);
  if (!lay) return null;
  const s = lay.scale;

  const B = lay.box, pad = size * 0.6;
  const W = B.w + pad * 2, Hh = B.h + pad * 2;
  // anchor: center = مركز الحبر على x · start = حافة بداية القراءة (يمين بالعربي) على x · end = حافة النهاية
  const right = -(B.x + B.w), left = -B.x;
  // right/left صريحين (مفيدين للأرقام: اتجاهها LTR حتى جوّا تصميم عربي)
  const dx = anchor === 'center' ? -B.cx : anchor === 'right' ? right : anchor === 'left' ? left : anchor === 'start' ? (lay.rtl ? right : left) : (lay.rtl ? left : right);
  const n = units.length;
  const drawP = draw ? (EASE[draw.ease ?? 'inOut'])(clamp((t - draw.at) / (draw.dur ?? 1))) : 1;

  return <svg width={W} height={Hh} viewBox={`${B.x - pad} ${B.y - pad} ${W} ${Hh}`}
    style={{ position: 'absolute', left: x + dx + (B.x - pad), top: y - B.cy + (B.y - pad), overflow: 'visible', ...style }}>
    {glow && <defs><filter id={`g${frame}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={glow.radius ?? 12} /></filter></defs>}
    {units.map((u, i) => {
      let p = reveal ? progress(reveal, i, n, t, fps) : 1;
      const st = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0, blur: 0 };
      for (const [k, v] of Object.entries(reveal?.from ?? {})) st[k] = v + (st[k] - v) * p;
      if (exit && t >= exit.at) { const q = progress(exit, i, n, t, fps); for (const [k, v] of Object.entries(exit.to ?? {})) st[k] = st[k] + (v - st[k]) * q; }
      if (st.opacity <= 0.001) return null;
      const cx = u.box.cx, cy = u.box.cy;
      const tr = `translate(${st.x} ${st.y}) translate(${cx} ${cy}) rotate(${st.rotate}) scale(${st.scale}) translate(${-cx} ${-cy})`;
      const clipId = `c${i}-${u.box.x0.toFixed(0)}`;
      const m = reveal?.mask;
      const paths = u.glyphs.map((g, j) => {
        const wf = words[g.word] ?? {};
        const col = wf.fill ?? fill;
        const t2 = `translate(${g.x} ${g.y}) scale(${s * g.sx} ${-s})`;
        return <path key={j} d={g.d} transform={t2} fill={draw ? 'transparent' : col}
          stroke={draw ? col : stroke} strokeWidth={draw ? (draw.width ?? 2.2) / s : strokeWidth / s}
          pathLength={draw ? 1 : undefined} strokeDasharray={draw ? `${drawP} 1` : undefined}
          style={draw && drawP >= 1 ? { fill: col, transition: 'none' } : undefined} />;
      });
      return <g key={i} opacity={st.opacity} style={st.blur > 0.2 ? { filter: `blur(${st.blur.toFixed(1)}px)` } : undefined}>
        {m && <clipPath id={clipId}><rect x={u.box.x0 - size * 0.4} y={u.box.y0 - size * 0.5} width={u.box.x1 - u.box.x0 + size * 0.8} height={u.box.y1 - u.box.y0 + size * 0.75} /></clipPath>}
        <g clipPath={m ? `url(#${clipId})` : undefined}>
          {glow && <g transform={tr} filter={`url(#g${frame})`} opacity={glow.strength ?? 0.6}>{paths}</g>}
          <g transform={tr}>{paths}</g>
        </g>
      </g>;
    })}
  </svg>;
}
