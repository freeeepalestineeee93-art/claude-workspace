// صفحة المشغّل: بتحمّل المشهد وبتعرض window.studio للرندر والمعاينة.
// الرابط: /engine/player.html?comp=projects/x/videos/y/main.js&aspect=9:16&fps=30&scale=1

import { createStudio } from '../../lib/studio.js';
import { buildTimeline, renderFrame, preloadAll, prepareFrame } from './timeline.js';
import { plugins } from './plugins.js';
import { computeCues } from './cues.js';
import { parseColor } from '../../lib/anim.js';
const parseColorSafe = (c) => { try { return parseColor(c); } catch { return [255, 255, 255, 1]; } };
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
    // فحص فريم: صناديق النصوص على الشاشة + التباين مع الخلفية
    audit(t) {
      const texts = [];
      renderFrame(wctx, comp, t, { ...env, rec: { text: (r) => { if (r.alpha > 0.5 && r.box.w > 2) texts.push(r); } } });
      renderFrame(wctx, comp, t, { ...env, hideText: true });
      const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      return texts.map((r) => {
        const x = Math.max(0, Math.floor(r.box.x)), y = Math.max(0, Math.floor(r.box.y));
        const w = Math.max(1, Math.min(S.W - x, Math.ceil(r.box.w))), h = Math.max(1, Math.min(S.H - y, Math.ceil(r.box.h)));
        let bgL = 0;
        try {
          const d = wctx.getImageData(x, y, w, h).data;
          const ls = [];
          for (let i = 0; i < d.length; i += 4 * 7) ls.push(lum([d[i], d[i + 1], d[i + 2]]));
          ls.sort((a, b) => a - b);
          bgL = ls[Math.floor(ls.length / 2)] ?? 0;
        } catch { /* خارج الكانفاس */ }
        const fg = lum(parseColorSafe(r.fill));
        const contrast = (Math.max(fg, bgL) + 0.05) / (Math.min(fg, bgL) + 0.05);
        return { text: r.text, box: r.box, size: r.size, contrast: +contrast.toFixed(2), layer: r.L.id ?? null, scene: r.scene };
      });
    },
    // ملخص أسلوب التحريك (لكشف "علامات AI")
    styleReport() {
      const texts = [], moves = [];
      const walk = (ls, sc) => (ls || []).forEach((L) => { if (!L) return; if (L.type === 'text') texts.push({ sc, x: typeof L.x === 'number' ? L.x : null, reveal: L.reveal, exit: L.exit, family: L.family, size: L.size }); if (L.children) walk(L.children, sc); });
      comp.scenes.forEach((s, i) => walk(s.layers, i));
      walk(comp.layers, -1); walk(comp.overlay, -1);
      return { W: S.W, H: S.H, safe: S.safe, duration: comp.duration, scenes: comp.scenes.map((s) => ({ start: s.start, duration: s.duration, transition: s.transition?.type ?? null })),
        texts: texts.map((x) => ({ ...x, reveal: x.reveal ? { by: x.reveal.by, from: Object.keys(x.reveal.from || {}), spring: x.reveal.spring ?? null, ease: x.reveal.ease ?? null, jitter: x.reveal.stagger?.jitter ?? 0.15 } : null, exit: !!x.exit })),
        post: Object.keys(comp.post || {}), motionBlur: comp.motionBlur !== false, audio: !!(comp.audio || brand.audio?.music) };
    },
    // منحنى الحركة: كم بيتغير الفريم كل step (لكشف الجمود والزحمة)
    motion(step = 0.1) {
      const out = [];
      let prev = null;
      for (let t = 0; t <= comp.duration; t += step) {
        renderFrame(wctx, comp, t, env);
        pctx.drawImage(work, 0, 0, probe.width, probe.height);
        const d = pctx.getImageData(0, 0, probe.width, probe.height).data;
        if (prev) { let s = 0; for (let i = 0; i < d.length; i += 4) s += Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2]); out.push(+(s / (d.length / 4) / 3).toFixed(3)); }
        prev = d;
      }
      return out;
    },
    audio: comp.audio ?? null,
    cues: () => computeCues(comp, env),
    // خطة الصوت الكاملة (بتنبنى بـ Python): موسيقى + صوت + مؤثرات تلقائية ويدوية
    audioPlan() {
      const a = comp.audio ?? {};
      const bm = brand.audio?.music;
      let music = a.music === false ? null : a.music ?? (bm ? { ...bm } : null);
      if (music && !music.src) music = { bpm: brand.audio?.bpm, sections: comp.scenes.slice(1).map((s) => s.start + (s.overlap || 0) / 2), ...music };
      if (music?.src) music = { ...music, src: S.asset(music.src) };
      const voice = [].concat(a.voice ?? []).map((x) => ({ ...x, src: S.asset(x.src) }));
      const sfx = [...computeCues(comp, env), ...(a.sfx ?? []).map((x) => (x.src ? { ...x, src: S.asset(x.src) } : x))];
      return { duration: comp.duration, music, voice, sfx, duck: a.duck, master: a.master ?? { lufs: -14, ceiling_db: -1 } };
    },
  };
  window.ready = true;
  if (q.get('ui')) (await import('./preview-ui.js')).mountPreview(window.studio, { aspect, quality });
}

boot().catch((e) => { console.error(e); window.bootError = String(e.stack || e); });
