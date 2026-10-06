// جسر المحرك القديم: أي مشهد مكتوب بـ API القديم (S.*) بيشتغل كطبقة جوّا Remotion — بدون ما نخسر شي.
// خرائط، جزيئات، رسوم بيانية، أيقونات، علامات النص، كشيدة متحركة، spray، أشكال مرسومة باليد، lottie، Three…
//
//   <Legacy project="projects/bees" build={(S) => ({ layers: [ S.map({...}), S.text({...}) ] })} />
//   (build = نفس دالة main.js القديمة؛ ممكن ترجّع { scenes } أو { layers } بس)
//
// الخلفية شفافة افتراضياً، فالطبقة بتتركّب فوق/تحت مكوّنات Remotion عادي (وجوّا <Layer> كمان).
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { delayRender, continueRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { createStudio } from '../../lib/studio.js';
import { buildTimeline, renderFrame, preloadAll, prepareFrame } from '../../engine/runtime/timeline.js';
import { plugins } from '../../engine/runtime/plugins.js';
import { initType } from '../../lib/type.js';
import { base } from './base.js';

// المحرك القديم بيطلب ملفاته بمسارات من الجذر ('/assets/…'، '/__tile/…'). صفحة Remotion على origin تاني،
// فمنحوّل هالمسارات بس (مش مسارات Remotion نفسه) لسيرفر الاستوديو.
const OURS = /^\/(assets|node_modules|projects|engine|lib|library|__tile|__video|\.cache)\//;
let shimmed = false;
function shim() {
  if (shimmed || !base()) return;
  shimmed = true;
  const B = base();
  globalThis.__studioBase = B;
  const fix = (u) => (typeof u === 'string' && OURS.test(u) ? B + u : u);
  const f0 = window.fetch.bind(window);
  window.fetch = (u, o) => f0(fix(u), o);
  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', { ...desc, set(v) { desc.set.call(this, fix(v)); } });
  const vdesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
  Object.defineProperty(HTMLMediaElement.prototype, 'src', { ...vdesc, set(v) { vdesc.set.call(this, fix(v)); } });
}

const built = new Map(); // build → comp (مشترك بين نسخ motion blur)
async function buildComp(key, build, { project, fps, W, H, aspect }) {
  if (built.has(key)) return built.get(key);
  const p = (async () => {
    shim();
    await initType({ base: base() });
    let brand = {};
    try { brand = await (await fetch(`/${project}/brand.json`)).json(); } catch {}
    const S = createStudio({ aspect, fps, brand, project, video: project, scale: W / 1080 });
    let comp = await build(S);
    if (comp.layers && !comp.scenes) comp = { ...comp, scenes: [{ duration: comp.duration ?? 9999, layers: comp.layers }], layers: null };
    comp = buildTimeline({ width: W, height: H, fps, background: 'rgba(0,0,0,0)', ...comp });
    await preloadAll(comp, { W, H, fps });
    return { comp, env: { W, H, S, plugins } };
  })();
  built.set(key, p);
  return p;
}

export function Legacy({ build, project = '', id, aspect = '9:16', from = 0, style }) {
  const frame = useCurrentFrame(), { fps, width: W, height: H } = useVideoConfig();
  const key = id ?? build;
  const [ready, setReady] = useState(null);
  const [h0] = useState(() => delayRender('legacy build'));
  const cv = useRef(null);
  useEffect(() => { buildComp(key, build, { project, fps, W, H, aspect }).then((r) => { setReady(r); continueRender(h0); }); }, [key]);
  useLayoutEffect(() => {
    if (!ready || !cv.current) return;
    const t = frame / fps - from;
    const h = delayRender(`legacy frame ${frame}`);
    prepareFrame(ready.comp, Math.max(0, t)).then(() => {
      const ctx = cv.current.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      renderFrame(ctx, ready.comp, Math.max(0, t), ready.env);
      continueRender(h);
    });
  }, [ready, frame]);
  return <canvas ref={cv} width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, ...style }} />;
}
