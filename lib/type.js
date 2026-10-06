// محرك الخط: تشكيل النص (عربي ولاتيني) بـ HarfBuzz وتحويله لحروف مستقلة بمسارات.
// كل حرف/كلمة/سطر وحدة قابلة للتحريك، والوصل العربي بيضل سليم لأن التشكيل بيصير على السطر كامل.

let hb = null;
let bidi = null;
let fontIndex = null;
const faces = new Map(); // path → { face, upem, blob }
const glyphCache = new Map(); // key → { d, ext }

const isBrowser = typeof window !== 'undefined';

export async function initType({ base = '' } = {}) {
  // (كل import لحاله مع webpackIgnore: الـ bundler تبع Remotion بيحلل الفرعين حتى لو بشرط)
  if (!hb) hb = isBrowser ? await import(/* webpackIgnore: true */ `${base}/node_modules/harfbuzzjs/dist/index.mjs`) : await import(/* webpackIgnore: true */ 'harfbuzzjs');
  if (!bidi) { const m = isBrowser ? await import(/* webpackIgnore: true */ `${base}/node_modules/bidi-js/dist/bidi.mjs`) : await import(/* webpackIgnore: true */ 'bidi-js'); bidi = (m.default ?? m)(); }
  if (!fontIndex) fontIndex = await loadJson(`${base}/assets/fonts/index.json`);
  initType.base = base;
}

async function loadJson(p) {
  if (isBrowser) return (await fetch(p)).json();
  const { readFile } = await import(/* webpackIgnore: true */ 'node:fs/promises');
  return JSON.parse(await readFile(new URL(/* webpackIgnore: true */ `../${p.replace(/^\//, '')}`, import.meta.url), 'utf8'));
}

async function loadBytes(p) {
  if (isBrowser) return (await fetch(`${initType.base}/${p}`)).arrayBuffer();
  const { readFile } = await import(/* webpackIgnore: true */ 'node:fs/promises');
  return (await readFile(new URL(/* webpackIgnore: true */ `../${p}`, import.meta.url))).buffer;
}

export function fonts() {
  return fontIndex;
}

// اختيار الملف الأنسب: ملف متغير بيغطي الوزن، وإلا أقرب وزن ثابت
export function resolveFontFile(family, weight = 400, italic = false) {
  const fam = fontIndex?.[family];
  if (!fam) throw new Error(`الخط "${family}" مش موجود. المتاح: ${Object.keys(fontIndex || {}).join('، ')}`);
  const files = fam.files.filter((f) => f.italic === italic).length ? fam.files.filter((f) => f.italic === italic) : fam.files;
  const vf = files.find((f) => f.axes?.wght && weight >= f.axes.wght[0] && weight <= f.axes.wght[2]);
  if (vf) return { file: vf, variable: true };
  const best = files.slice().sort((a, b) => Math.abs(a.weight - weight) - Math.abs(b.weight - weight))[0];
  return { file: best, variable: false };
}

export async function preloadFont(family, weights = [400], italic = false) {
  for (const w of weights) {
    const { file } = resolveFontFile(family, w, italic);
    if (!faces.has(file.path)) {
      const blob = new hb.Blob(await loadBytes(file.path));
      const face = new hb.Face(blob, 0);
      faces.set(file.path, { face, upem: face.upem, blob, axes: file.axes });
    }
  }
}

function getFont(family, weight, italic, axes = {}) {
  const { file, variable } = resolveFontFile(family, weight, italic);
  const f = faces.get(file.path);
  if (!f) throw new Error(`لازم تعمل preloadFont("${family}", [${weight}]) قبل الاستعمال`);
  const vars = { ...axes };
  // تقريب المحاور (خطوة 4) لحتى ما يتولّد خط جديد لكل قيمة كسرية (كان بيستهلك الذاكرة)
  if (variable && file.axes.wght) vars.wght = Math.round(weight / 4) * 4;
  for (const k of Object.keys(vars)) if (k !== 'wght') vars[k] = Math.round(vars[k] * 4) / 4;
  const varKey = Object.entries(vars).map(([k, v]) => `${k}=${Math.round(v * 10) / 10}`).join(',');
  const key = `${file.path}|${varKey}`;
  if (!f.fonts) f.fonts = new Map();
  if (!f.fonts.has(key)) {
    if (f.fonts.size > 64) { for (const k of [...f.fonts.keys()].slice(0, 32)) f.fonts.delete(k); }
    const font = new hb.Font(f.face);
    const vlist = Object.entries(vars).filter(([k]) => f.axes?.[k]).map(([k, v]) => new hb.Variation(k, v));
    if (vlist.length) font.setVariations(vlist);
    f.fonts.set(key, font);
  }
  return { font: f.fonts.get(key), upem: f.upem, key };
}

function glyph(fontInfo, gid) {
  const k = `${fontInfo.key}#${gid}`;
  let g = glyphCache.get(k);
  if (!g) {
    if (glyphCache.size > 30000) glyphCache.clear();
    g = { d: fontInfo.font.glyphToPath(gid), ext: fontInfo.font.glyphExtents(gid) };
    glyphCache.set(k, g);
  }
  return g;
}

const TATWEEL = 'ـ';
// حروف بتتصل باللي بعدها (dual-joining)
const DUAL = new Set('بتثجحخسشصضطظعغفقكلمنهيئى'.split('').concat(['ـ']));
// أفضل أماكن الكشيدة جمالياً (بعد هالحروف)
const KASHIDA_PREF = 'سشصضكبتثنيفقلطظ';
const isArabic = (s) => /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(s);

// موقع الكشيدة التلقائي بكلمة: بيرجع index الحرف اللي بعده بتنحط الكشيدة
export function kashidaSlot(word) {
  const chars = [...word];
  let best = -1, bestScore = -1;
  for (let i = 0; i < chars.length - 1; i++) {
    if (!DUAL.has(chars[i]) || !isArabic(chars[i + 1]) || /[ً-ْ]/.test(chars[i + 1])) continue;
    const pref = KASHIDA_PREF.indexOf(chars[i]);
    const centrality = 1 - Math.abs(i / (chars.length - 1) - 0.55);
    const score = (pref >= 0 ? 2 + (KASHIDA_PREF.length - pref) / KASHIDA_PREF.length : 0) + centrality;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

// ───────────────────────── التخطيط ─────────────────────────
// opts: family, size, weight, italic, axes, features[], tracking (لاتيني فقط), lineHeight,
//       align: 'center'|'start'|'end', maxWidth, kashida: [{ word, amount, at? }]
// الناتج: وحدات بالترتيب المنطقي (ترتيب القراءة) مع مواقعها البصرية.

const MISSING = new Set();
export function layoutText(text, opts = {}) {
  const {
    family = 'IBM Plex Sans Arabic', size = 64, weight = 400, italic = false, axes = {}, features = [],
    tracking = 0, lineHeight = 1.25, align = 'center', maxWidth = Infinity, kashida = [],
  } = opts;
  const fi = getFont(family, weight, italic, axes);
  const scale = size / fi.upem;
  const rtl = isArabic(text);
  const feats = features.map((f) => (typeof f === 'string' ? hb.Feature.fromString(f) : f)).filter(Boolean);

  // تقسيم لكلمات منطقية مع تطبيق الكشيدة (إدخال حرف تطويل واحد بيتمدد)
  const paragraphs = text.split('\n');
  let wordCounter = 0;
  const lines = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean).map((w) => {
      const idx = wordCounter++;
      const k = kashida.find((k) => k.word === idx);
      if (k && (k.amount ?? 0) > 0.5) {
        // at: رقم الحرف، أو 'last' (آخر موضع ممكن: ركنيـــة) أو 'first' (أول موضع: تمـــاس)
        const slots = [...w].map((c, i, a) => (i < a.length - 1 && DUAL.has(c) && isArabic(a[i + 1]) && !/[ً-ْ]/.test(a[i + 1]) ? i : -1)).filter((i) => i >= 0);
        const slot = k.at === 'last' ? (slots.at(-1) ?? -1) : k.at === 'first' ? (slots[0] ?? -1) : k.at ?? kashidaSlot(w);
        if (slot >= 0) {
          const chars = [...w];
          chars.splice(slot + 1, 0, TATWEEL);
          return { text: chars.join(''), src: w, index: idx, stretch: k.amount };
        }
      }
      return { text: w, src: w, index: idx, stretch: 0 };
    });
    // كسر الأسطر
    let cur = [];
    for (const w of words) {
      const trial = [...cur, w];
      if (cur.length && measure(trial) > maxWidth) {
        lines.push(cur);
        cur = [w];
      } else cur = trial;
    }
    if (cur.length) lines.push(cur);
  }

  // تشكيل سطر مع خوارزمية الاتجاه (bidi): الأرقام واللاتيني جوّا العربي بيضلّوا من اليسار لليمين
  function shapeLine(ws) {
    const str = ws.map((w) => w.text).join(' ');
    const { levels } = bidi.getEmbeddingLevels(str, rtl ? 'rtl' : 'ltr');
    const runs = [];
    for (let i = 0; i < str.length; i++) {
      const lv = levels[i];
      if (runs.length && runs[runs.length - 1].level === lv) runs[runs.length - 1].end = i + 1;
      else runs.push({ start: i, end: i + 1, level: lv });
    }
    // ترتيب بصري للـ runs (قاعدة L2): عكس كل تسلسل مستواه ≥ k من الأعلى للأدنى الفردي
    const order = runs.map((_, i) => i);
    const maxL = Math.max(...runs.map((r) => r.level));
    const minOdd = Math.min(...runs.map((r) => r.level).filter((l) => l % 2 === 1), maxL + 1);
    for (let k = maxL; k >= minOdd && k >= 1; k--) {
      let i = 0;
      while (i < order.length) {
        if (runs[order[i]].level >= k) {
          let j = i;
          while (j + 1 < order.length && runs[order[j + 1]].level >= k) j++;
          const seg = order.slice(i, j + 1).reverse();
          order.splice(i, seg.length, ...seg);
          i = j + 1;
        } else i++;
      }
    }
    const infos = [], pos = [];
    for (const ri of order) {
      const r = runs[ri];
      const buf = new hb.Buffer();
      buf.addText(str.slice(r.start, r.end));
      buf.guessSegmentProperties();
      buf.setDirection(r.level % 2 ? hb.Direction.RTL : hb.Direction.LTR);
      hb.shape(fi.font, buf, feats);
      const inf = buf.getGlyphInfos(), ps = buf.getGlyphPositions();
      for (let k = 0; k < inf.length; k++) {
        infos.push({ ...inf[k], cluster: inf[k].cluster + r.start });
        pos.push(ps[k]);
      }
    }
    const ranges = [];
    let off = 0;
    for (const w of ws) {
      ranges.push([off, off + w.text.length]);
      off += w.text.length + 1;
    }
    return { str, infos, pos, ranges };
  }

  function measure(ws) {
    const { infos, pos, str } = shapeLine(ws);
    let w = 0;
    for (let i = 0; i < infos.length; i++) {
      const tw = str[infos[i].cluster] === TATWEEL ? ws.find((x) => x.stretch)?.stretch : null;
      w += (tw ?? pos[i].xAdvance * scale) + (rtl ? 0 : tracking);
    }
    return w;
  }

  const ext = fi.font.hExtents();
  const ascent = ext.ascender * scale, descent = -ext.descender * scale;
  const lh = size * lineHeight;
  const out = { lines: [], words: [], glyphs: [], width: 0, height: lines.length * lh, ascent, descent, size, rtl, scale };

  lines.forEach((ws, li) => {
    const { str, infos, pos, ranges } = shapeLine(ws);
    let x = 0;
    const lineGlyphs = [];
    for (let i = 0; i < infos.length; i++) {
      const gid = infos[i].codepoint, cl = infos[i].cluster;
      const g = glyph(fi, gid);
      const ch = str[cl];
      // حرف مش موجود بالخط = مربع فاضي (tofu) بالفيديو. بلّغ مرة وحدة لكل حرف/خط
      if (gid === 0 && ch && ch.trim()) {
        const k = `${family}|${ch}`;
        if (!MISSING.has(k)) { MISSING.add(k); console.error(`✗ حرف ناقص: "${ch}" (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}) مش موجود بخط ${family} — رح يطلع مربع فاضي. بدّله أو ارسمه كشكل.`); }
      }
      const wi = ranges.findIndex(([a, b]) => cl >= a && cl < b);
      const isTatweel = ch === TATWEEL;
      const stretch = isTatweel && wi >= 0 ? ws[wi].stretch : 0;
      const adv = pos[i].xAdvance * scale;
      const e = g.ext || { xBearing: 0, yBearing: 0, width: 0, height: 0 };
      lineGlyphs.push({
        d: g.d, gid, cluster: cl, char: ch, word: wi >= 0 ? ws[wi].index : -1, line: li,
        x: x + pos[i].xOffset * scale, y: -pos[i].yOffset * scale, adv: isTatweel && stretch ? stretch : adv,
        // التطويل بيبلّش من صفر (بدون قفزة) وبيتمدد لأي طول
        sx: isTatweel && stretch ? stretch / Math.max(adv, 1e-3) : 1,
        box: { x: e.xBearing * scale, y: -e.yBearing * scale, w: e.width * scale, h: -e.height * scale },
        space: ch === ' ',
      });
      x += (isTatweel && stretch ? stretch : adv) + (rtl ? 0 : tracking);
    }
    const width = x;
    const y = li * lh;
    lineGlyphs.forEach((g) => (g.y += y));
    out.lines.push({ index: li, width, y, glyphs: lineGlyphs });
    out.width = Math.max(out.width, width);
  });

  // محاذاة + بناء وحدات الكلمات والحروف
  for (const line of out.lines) {
    const dx = align === 'center' ? (out.width - line.width) / 2 : (align === 'end') !== rtl ? out.width - line.width : 0;
    for (const g of line.glyphs) g.x += dx;
    line.x = dx;
  }
  // تمركز حول (0,0): x من -w/2، وy خط الأساس للسطر الأول متمركز عمودياً
  const totalH = (out.lines.length - 1) * lh + ascent + descent;
  const oy = -totalH / 2 + ascent;
  for (const line of out.lines) {
    line.x -= out.width / 2;
    line.y += oy;
    for (const g of line.glyphs) { g.x -= out.width / 2; g.y += oy; }
  }
  out.height = totalH;

  const allGlyphs = out.lines.flatMap((l) => l.glyphs).filter((g) => !g.space);
  // ترتيب القراءة: حسب السطر ثم الـ cluster (المنطقي)
  allGlyphs.sort((a, b) => a.line - b.line || a.cluster - b.cluster);
  allGlyphs.forEach((g, i) => (g.index = i));
  out.glyphs = allGlyphs;

  const wordMap = new Map();
  for (const g of allGlyphs) {
    if (g.word < 0) continue;
    if (!wordMap.has(g.word)) wordMap.set(g.word, { index: g.word, line: g.line, glyphs: [] });
    wordMap.get(g.word).glyphs.push(g);
  }
  out.words = [...wordMap.values()].sort((a, b) => a.index - b.index);
  for (const w of out.words) w.box = unionBox(w.glyphs);
  for (const l of out.lines) l.box = unionBox(l.glyphs.filter((g) => !g.space));
  out.box = unionBox(allGlyphs);
  return out;
}

function unionBox(glyphs) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const g of glyphs) {
    const bx = g.x + g.box.x, by = g.y + g.box.y;
    const bw = g.box.w * g.sx;
    x0 = Math.min(x0, bx); x1 = Math.max(x1, bx + bw);
    y0 = Math.min(y0, by); y1 = Math.max(y1, by + g.box.h);
  }
  if (x0 === Infinity) return { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 };
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
