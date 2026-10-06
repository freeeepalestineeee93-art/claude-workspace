// صفحة المشغّل: بتحمّل المشهد وبتعرض window.studio للرندر والمعاينة.
// الرابط: /engine/player.html?comp=projects/x/videos/y/main.js&aspect=9:16&fps=30&scale=1

import { createStudio } from '../../lib/studio.js';
import { buildTimeline, renderFrame, preloadAll, prepareFrame } from './timeline.js';
import { plugins } from './plugins.js';
import { Post } from './post.js';

const q = new URLSearchParams(location.search);
const compPath = q.get('comp');
const aspect = q.get('aspect') || '9:16';
const fps = +(q.get('fps') || 30);
const scale = +(q.get('scale') || 1);
const quality = q.get('quality') || 'final'; // draft: بدون motion blur وpost خفيف

async function findBrand(path) {
  const parts = path.split('/');
  for (let i = parts.length - 1; i > 0; i--) {
    const p = parts.slice(0, i).join('/') + '/brand.json';
    const r = await fetch('/' + p);
    if (r.ok) return { brand: await r.json(), project: parts.slice(0, i).join('/') };
  }
  return { brand: {}, project: parts.slice(0, -1).join('/') };
}

async function boot() {
  const { brand, project } = await findBrand(compPath);
  const S = createStudio({ aspect, fps, brand, project, video: compPath.split('/').slice(0, -1).join('/'), scale });
  const mod = await import('/' + compPath + '?v=' + Date.now());
  let comp = await mod.default(S);
  comp = buildTimeline({ width: S.W, height: S.H, fps, ...comp });
  await preloadAll(comp, { W: S.W, H: S.H, fps });

  // الكانفاس الظاهر هو كانفاس WebGL نفسه (بدون نسخ إضافي)
  document.getElementById('out').remove();
  const work = document.createElement('canvas');
  work.width = S.W; work.height = S.H;
  const wctx = work.getContext('2d');
  const env = { W: S.W, H: S.H, S, plugins };
  const post = new Post(S.W, S.H, comp.post ?? {}, quality);
  await post.ready;
  const out = null;
  post.canvas.id = 'out';
  document.body.appendChild(post.canvas);
  const mb = comp.motionBlur === false || quality === 'draft' ? null : { samples: 8, shutter: 180, ...(comp.motionBlur || {}) };

  // فحص سريع: إذا الفريم ما فيه حركة ملحوظة خلال فتحة الغالق، منوفّر الـ samples
  const probe = document.createElement('canvas');
  probe.width = 96; probe.height = Math.round(96 * S.H / S.W);
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  function snapshot(t) {
    renderFrame(wctx, comp, t, env);
    pctx.drawImage(work, 0, 0, probe.width, probe.height);
    return pctx.getImageData(0, 0, probe.width, probe.height).data;
  }
  function moving(t) {
    const span = (mb.shutter / 360) / fps;
    const a = snapshot(Math.max(0, t - span / 2)), b = snapshot(t + span / 2);
    let mx = 0;
    for (let i = 0; i < a.length; i += 4) mx = Math.max(mx, Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]));
    return mx > (mb.threshold ?? 6);
  }

  function draw(t) {
    if (mb && mb.samples > 1 && moving(t)) {
      // motion blur حقيقي: متوسط عدة لحظات خلال فتحة الغالق
      post.beginAccum();
      const span = (mb.shutter / 360) / fps;
      for (let i = 0; i < mb.samples; i++) {
        const ts = t - span / 2 + (span * (i + 0.5)) / mb.samples;
        renderFrame(wctx, comp, Math.max(0, ts), env);
        post.accumulate(work, 1 / mb.samples);
      }
      post.endAccum(out, t);
    } else {
      renderFrame(wctx, comp, t, env);
      post.apply(work, out, t);
    }
  }

  window.studio = {
    W: S.W, H: S.H, fps, duration: comp.duration, comp, S,
    async seek(t) { await prepareFrame(comp, t); draw(t); return true; },
    async frame(t, type = 'image/png', q = 0.95) { await prepareFrame(comp, t); draw(t); return post.canvas.toDataURL(type, q); },
    // أسرع طريق: البكسلات الخام بتنبعت للسيرفر مباشرة
    async push(t, url) { await prepareFrame(comp, t); draw(t); await fetch(url, { method: 'POST', body: post.pixels() }); return true; },
    profile(t) {
      const T = (f) => { const a = performance.now(); f(); return +(performance.now() - a).toFixed(1); };
      const flush = (c) => (c ? c.getContext('2d').getImageData(0, 0, 1, 1) : post.pixels());
      return {
        renderFrame: T(() => { renderFrame(wctx, comp, t, env); flush(work); }),
        upload: T(() => { post.upload(work); post.gl.finish(); }),
        postApply: T(() => { post.apply(work, out, t); flush(out); }),
        pixels: T(() => post.pixels()),
        copyPass: T(() => { post.pass(post.prog.copy, post.full, { w: 1 }, { t: post.input }); post.gl.finish(); }),
        accumPass: T(() => { post.accumulate(work, 0.1); post.gl.finish(); }),
        finishOnly: T(() => { post.finish(post.full.tex, out, t); flush(out); }),
        finishNoBloom: T(() => { const b = post.cfg.bloom; post.cfg.bloom = null; post.finish(post.full.tex, out, t); flush(out); post.cfg.bloom = b; }),
        fullDraw: T(() => { draw(t); flush(out); }),
        motionBlurSamples: mb?.samples ?? 0,
        layers: (() => {
          const sc = comp.scenes.find((x) => t >= x.start && t < x.end);
          if (!sc) return '';
          return sc.layers.map((L, i) => {
            const c = { ...comp, scenes: [{ ...sc, layers: [L] }], overlay: null, underlay: null, layers: null };
            return `${i}:${L.type}${L.type === 'text' ? '(' + L.text + ')' : ''}=${T(() => { renderFrame(wctx, c, t, env); flush(work); })}`;
          }).join(' | ');
        })(),
      };
    },
    audio: comp.audio ?? null,
    cues: () => comp.__cues ?? [],
  };
  window.ready = true;
}

boot().catch((e) => { console.error(e); window.bootError = String(e.stack || e); });
