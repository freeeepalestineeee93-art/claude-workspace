// تصدير لـ After Effects: من تسجيل المحرك (bake) لسكربت JSX بيبني المشروع كطبقات حقيقية.
// - كل مشهد precomp، والمشاهد متسلسلة بالكومب الرئيسي مع تقريب للانتقالات
// - الأشكال → shape layers (مسارات حقيقية)، النص بالكلمة/السطر → text layers قابلة للتعديل،
//   النص بالحرف → shape layers لأشكال الحروف (لأن تقطيع العربي لحروف بيكسر الوصل)
// - الحركة → keyframes مضغوطة (بدون فقدان ملحوظ) من الحركة الفعلية (springs، كاميرا، parallax)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontIndex = JSON.parse(readFileSync(path.join(ROOT, 'assets/fonts/index.json'), 'utf8'));

const r2 = (x) => Math.round(x * 100) / 100;
const r4 = (x) => Math.round(x * 10000) / 10000;

// ───────────────────────── رياضيات ─────────────────────────

export function decompose([a, b, c, d, e, f]) {
  const sx = Math.hypot(a, b);
  const rot = Math.atan2(b, a);
  const sy = sx ? (a * d - b * c) / sx : 0;
  return { x: e, y: f, sx, sy, rot: (rot * 180) / Math.PI };
}

const apply = ([a, b, c, d, e, f], [x, y]) => [a * x + c * y + e, b * x + d * y + f];
const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];

// تقليل الـ keyframes (Ramer–Douglas–Peucker على الزمن): بنحتفظ بس بالمفاتيح اللي بدونها الخط بينحرف أكتر من tol
export function reduceKeys(times, vals, tol) {
  const n = times.length;
  if (n <= 2) return [...Array(n).keys()];
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let worst = -1, wi = -1;
    for (let k = i + 1; k < j; k++) {
      const u = (times[k] - times[i]) / (times[j] - times[i]);
      let err = 0;
      for (let dIdx = 0; dIdx < vals[k].length; dIdx++) {
        const lin = vals[i][dIdx] + (vals[j][dIdx] - vals[i][dIdx]) * u;
        err = Math.max(err, Math.abs(vals[k][dIdx] - lin) / tol[dIdx]);
      }
      if (err > worst) { worst = err; wi = k; }
    }
    if (worst > 1) { keep[wi] = 1; stack.push([i, wi], [wi, j]); }
  }
  return [...keep.keys()].filter((k) => keep[k]);
}

// ───────────────────────── SVG path → AE Shape ─────────────────────────

export function pathToShapes(d, m = [1, 0, 0, 1, 0, 0]) {
  const toks = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g) || [];
  let i = 0, cmd = null;
  const num = () => +toks[i++];
  const isNum = () => i < toks.length && !/^[a-zA-Z]$/.test(toks[i]);
  const shapes = [];
  let cur = null, x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null;
  const start = () => { cur = { v: [], i: [], o: [], closed: false }; shapes.push(cur); };
  const P = (px, py) => apply(m, [px, py]);
  const moveTo = (px, py) => { start(); cur.v.push(P(px, py)); cur.i.push([0, 0]); cur.o.push([0, 0]); x = sx = px; y = sy = py; };
  const cubic = (x1, y1, x2, y2, px, py) => {
    if (!cur) moveTo(x, y);
    const a = P(x, y), c1 = P(x1, y1), c2 = P(x2, y2), e = P(px, py);
    const k = cur.v.length - 1;
    cur.o[k] = [c1[0] - a[0], c1[1] - a[1]];
    cur.v.push(e); cur.i.push([c2[0] - e[0], c2[1] - e[1]]); cur.o.push([0, 0]);
    lc = [2 * px - x2, 2 * py - y2]; x = px; y = py;
  };
  const line = (px, py) => { if (!cur) moveTo(x, y); cur.v.push(P(px, py)); cur.i.push([0, 0]); cur.o.push([0, 0]); x = px; y = py; };
  const quad = (qx, qy, px, py) => { cubic(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), px + (2 / 3) * (qx - px), py + (2 / 3) * (qy - py), px, py); lq = [2 * px - qx, 2 * py - qy]; };
  const arc = (rx, ry, rotDeg, large, sweep, px, py) => {
    // تحويل قوس SVG لـ cubic beziers (الطريقة القياسية)
    if (rx === 0 || ry === 0) return line(px, py);
    const phi = (rotDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
    const dx = (x - px) / 2, dy = (y - py) / 2;
    const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
    rx = Math.abs(rx); ry = Math.abs(ry);
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const sgn = large === sweep ? -1 : 1;
    const num_ = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const coef = sgn * Math.sqrt(Math.max(0, num_ / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
    const cxp = (coef * rx * y1p) / ry, cyp = (-coef * ry * x1p) / rx;
    const cx = cos * cxp - sin * cyp + (x + px) / 2, cy = sin * cxp + cos * cyp + (y + py) / 2;
    const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
    const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && dt > 0) dt -= 2 * Math.PI;
    if (sweep && dt < 0) dt += 2 * Math.PI;
    const segs = Math.ceil(Math.abs(dt) / (Math.PI / 2));
    const da = dt / segs;
    const kk = (4 / 3) * Math.tan(da / 4);
    let a0 = t1;
    for (let s = 0; s < segs; s++) {
      const a1 = a0 + da;
      const e0 = [Math.cos(a0), Math.sin(a0)], e1 = [Math.cos(a1), Math.sin(a1)];
      const q1 = [e0[0] - kk * e0[1], e0[1] + kk * e0[0]], q2 = [e1[0] + kk * e1[1], e1[1] - kk * e1[0]];
      const T = (p) => [cx + rx * p[0] * cos - ry * p[1] * sin, cy + rx * p[0] * sin + ry * p[1] * cos];
      const c1 = T(q1), c2 = T(q2), e = T(e1);
      cubic(c1[0], c1[1], c2[0], c2[1], e[0], e[1]);
      a0 = a1;
    }
  };
  while (i < toks.length) {
    if (!isNum()) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': { const px = num() + ox, py = num() + oy; moveTo(px, py); cmd = rel ? 'l' : 'L'; break; }
      case 'L': line(num() + ox, num() + oy); break;
      case 'H': line(num() + ox, y); break;
      case 'V': line(x, num() + oy); break;
      case 'C': { const a = [num() + ox, num() + oy, num() + ox, num() + oy, num() + ox, num() + oy]; cubic(...a); break; }
      case 'S': { const c1 = lc ?? [x, y]; const a = [num() + ox, num() + oy, num() + ox, num() + oy]; cubic(c1[0], c1[1], ...a); break; }
      case 'Q': { const a = [num() + ox, num() + oy, num() + ox, num() + oy]; quad(...a); break; }
      case 'T': { const q = lq ?? [x, y]; quad(q[0], q[1], num() + ox, num() + oy); break; }
      case 'A': { const a = [num(), num(), num(), num(), num(), num() + ox, num() + oy]; arc(...a); break; }
      case 'Z': {
        if (cur) {
          cur.closed = true;
          // دمج آخر نقطة مع أول نقطة إذا متطابقين
          const n = cur.v.length;
          if (n > 1 && Math.hypot(cur.v[n - 1][0] - cur.v[0][0], cur.v[n - 1][1] - cur.v[0][1]) < 1e-3) { cur.i[0] = cur.i[n - 1]; cur.v.pop(); cur.i.pop(); cur.o.pop(); }
        }
        x = sx; y = sy; cur = null; break;
      }
      default: i++;
    }
    if (!'CS'.includes(cmd.toUpperCase())) lc = null;
    if (!'QT'.includes(cmd.toUpperCase())) lq = null;
  }
  return shapes.filter((s) => s.v.length > 1);
}

// ───────────────────────── الخطوط ─────────────────────────

export function fontPostScript(family, weight = 400) {
  const fam = fontIndex[family];
  if (!fam) return family.replace(/\s+/g, '');
  const vf = fam.files.find((f) => f.axes?.wght);
  if (vf && vf.instances?.length) {
    const best = vf.instances.slice().sort((a, b) => Math.abs((a.coords.wght ?? 400) - weight) - Math.abs((b.coords.wght ?? 400) - weight))[0];
    return best.ps;
  }
  const best = fam.files.slice().sort((a, b) => Math.abs(a.weight - weight) - Math.abs(b.weight - weight))[0];
  return best.ps ?? family.replace(/\s+/g, '');
}

export function fontFiles(families) {
  const out = new Set();
  for (const f of families) for (const file of fontIndex[f]?.files ?? []) out.add(file.path);
  return [...out];
}

// ───────────────────────── JSX ─────────────────────────

const J = (x) => JSON.stringify(x);
const col = (c) => (c ? [r4(c[0] / 255), r4(c[1] / 255), r4(c[2] / 255)] : [1, 1, 1]);

function trackFor(el, fps, t0) {
  const fr = Object.entries(el.frames).map(([f, v]) => [+f, v]).sort((a, b) => a[0] - b[0]);
  if (!fr.length) return null;
  const first = fr[0][0], last = fr[fr.length - 1][0];
  // تحويل كل فريم لقيم AE (مع نقطة الارتكاز للنص)
  const rows = [];
  for (let f = first; f <= last; f++) {
    const v = el.frames[f];
    if (!v) { rows.push({ f, vis: false }); continue; }
    let m = v.m;
    if (el.kind === 'text') m = mul(m, [1, 0, 0, 1, el.anchor[0], el.anchor[1]]);
    const d = decompose(m);
    rows.push({ f, vis: true, x: d.x, y: d.y, sx: d.sx * 100, sy: d.sy * 100, rot: d.rot, o: Math.max(0, Math.min(100, v.o * 100)), blur: v.blur ?? 0, geo: v.geo });
  }
  // تسوية الدوران (بدون قفزات 360)
  let prev = null;
  for (const r of rows) if (r.vis) { if (prev != null) { while (r.rot - prev > 180) r.rot -= 360; while (r.rot - prev < -180) r.rot += 360; } prev = r.rot; }
  // الفريمات المخفية: شفافية 0 بنفس آخر تحويل
  let lastVis = rows.find((r) => r.vis);
  for (const r of rows) { if (r.vis) lastVis = r; else Object.assign(r, { x: lastVis.x, y: lastVis.y, sx: lastVis.sx, sy: lastVis.sy, rot: lastVis.rot, o: 0, blur: 0 }); }
  const times = rows.map((r) => r4(r.f / fps - t0));
  const pick = (keys, tol) => {
    const vals = rows.map((r) => keys.map((k) => r[k]));
    const idx = reduceKeys(times, vals, tol);
    const allSame = idx.length === 2 && keys.every((k, ki) => Math.abs(vals[0][ki] - vals[vals.length - 1][ki]) < tol[ki] * 0.5);
    return allSame ? { value: vals[0].map(r2) } : { times: idx.map((k) => times[k]), values: idx.map((k) => vals[k].map(r2)) };
  };
  return {
    inPoint: r4(first / fps - t0), outPoint: r4((last + 1) / fps - t0),
    x: pick(['x'], [0.35]), y: pick(['y'], [0.35]), scale: pick(['sx', 'sy'], [0.25, 0.25]), rot: pick(['rot'], [0.1]), o: pick(['o'], [0.6]),
    blur: rows.some((r) => r.blur > 0.2) ? pick(['blur'], [0.3]) : null,
    geos: rows.filter((r) => r.geo).map((r) => ({ t: r4(r.f / fps - t0), geo: r.geo })),
  };
}

function shapeContents(geo) {
  // بيرجع قائمة مجموعات: { shapes:[...], fill, stroke, sw, trim }
  if (!geo) return [];
  if (geo.parts) return geo.parts.map((p) => ({ shapes: pathToShapes(p.d, mul(geo.local, p.m)), fill: p.fill, stroke: null }));
  const local = geo.local ?? [1, 0, 0, 1, 0, 0];
  return [{ shapes: geo.paths.flatMap((d) => pathToShapes(d, local)), fill: geo.fill, stroke: geo.stroke, sw: geo.strokeWidth, trim: geo.trim }];
}

const roundShape = (s) => ({ v: s.v.map((p) => p.map(r2)), i: s.i.map((p) => p.map(r2)), o: s.o.map((p) => p.map(r2)), c: s.closed });

export function buildJSX(bake, opts = {}) {
  const { name = 'Motion Studio', guide = null, audio = null, images = {} } = opts;
  const { W, H, fps, duration } = bake;
  const L = [];
  const w = (s) => L.push(s);
  w(`// ${name} — مولّد من استوديو الموشن. شغّله من: File › Scripts › Run Script File`);
  w('// مهم للعربي: Preferences › Type › Text Engine Options › Middle Eastern and South Asian (ثم أعد تشغيل AE).');
  w('(function () {');
  w('var ROOT = File($.fileName).parent;');
  w(`app.beginUndoGroup(${J(name)});`);
  w(`var FPS = ${fps}, W = ${W}, H = ${H};`);
  w(`function K(p, t, v, val) { if (val !== undefined) { p.setValue(val); return; } p.setValuesAtTimes(t, v); for (var k = 1; k <= p.numKeys; k++) { try { p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR); } catch (e) {} } }`);
  w(`function T(layer, tr) { var g = layer.property("ADBE Transform Group"); g.property("ADBE Anchor Point").setValue([0, 0, 0]);
  var pos = g.property("ADBE Position"); pos.dimensionsSeparated = true;
  K(g.property("ADBE Position_0"), tr.x.times, tr.x.values ? flat(tr.x.values) : null, tr.x.value ? tr.x.value[0] : undefined);
  K(g.property("ADBE Position_1"), tr.y.times, tr.y.values ? flat(tr.y.values) : null, tr.y.value ? tr.y.value[0] : undefined);
  K(g.property("ADBE Scale"), tr.scale.times, tr.scale.values ? s3(tr.scale.values) : null, tr.scale.value ? [tr.scale.value[0], tr.scale.value[1], 100] : undefined);
  K(g.property("ADBE Rotate Z"), tr.rot.times, tr.rot.values ? flat(tr.rot.values) : null, tr.rot.value ? tr.rot.value[0] : undefined);
  K(g.property("ADBE Opacity"), tr.o.times, tr.o.values ? flat(tr.o.values) : null, tr.o.value ? tr.o.value[0] : undefined);
  if (tr.blur) { var fx = layer.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2"); K(fx.property(1), tr.blur.times, tr.blur.values ? flat(tr.blur.values) : null, tr.blur.value ? tr.blur.value[0] : undefined); }
  layer.inPoint = Math.max(0, tr.inPoint); layer.outPoint = tr.outPoint; }`);
  w('function flat(a) { var r = []; for (var i = 0; i < a.length; i++) r.push(a[i][0]); return r; }');
  w('function s3(a) { var r = []; for (var i = 0; i < a.length; i++) r.push([a[i][0], a[i][1], 100]); return r; }');
  w('function SH(s) { var x = new Shape(); x.vertices = s.v; x.inTangents = s.i; x.outTangents = s.o; x.closed = s.c; return x; }');
  w(`function SL(comp, name, groups, trims) { var l = comp.layers.addShape(); l.name = name; var root = l.property("ADBE Root Vectors Group");
  for (var g = 0; g < groups.length; g++) { var G = groups[g]; var grp = root.addProperty("ADBE Vector Group"); var vs = grp.property("ADBE Vectors Group");
    for (var s = 0; s < G.s.length; s++) { var pg = vs.addProperty("ADBE Vector Shape - Group"); if (G.k) { var ts = [], sv = []; for (var q = 0; q < G.k.length; q++) { ts.push(G.k[q].t); sv.push(SH(G.k[q].s[s] || G.k[q].s[0])); } pg.property("ADBE Vector Shape").setValuesAtTimes(ts, sv); } else pg.property("ADBE Vector Shape").setValue(SH(G.s[s])); }
    if (G.st) { var st = vs.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(G.st); st.property("ADBE Vector Stroke Width").setValue(G.sw); try { st.property("ADBE Vector Stroke Line Cap").setValue(2); st.property("ADBE Vector Stroke Line Join").setValue(2); } catch (e) {} }
    if (G.fl) { var fl = vs.addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue(G.fl); }
    if (G.tr) { var tm = vs.addProperty("ADBE Vector Filter - Trim"); K(tm.property("ADBE Vector Trim Start"), G.tr.t, G.tr.s, G.tr.t ? undefined : G.tr.s[0]); K(tm.property("ADBE Vector Trim End"), G.tr.t, G.tr.e, G.tr.t ? undefined : G.tr.e[0]); }
  } return l; }`);
  w(`function TX(comp, name, d) { var l = comp.layers.addText(d.text); l.name = name; var tp = l.property("ADBE Text Properties").property("ADBE Text Document"); var doc = tp.value;
  try { doc.resetCharStyle(); doc.resetParagraphStyle(); } catch (e) {}
  doc.text = d.text; doc.font = d.font; doc.fontSize = d.size; doc.applyFill = true; doc.fillColor = d.fill; doc.applyStroke = false;
  doc.justification = ParagraphJustification.CENTER_JUSTIFY;
  if (d.lh) { try { doc.autoLeading = false; doc.leading = d.lh; } catch (e) {} }
  if (d.rtl) { try { doc.composerEngine = ComposerEngine.UNIVERSAL_TYPE_ENGINE; } catch (e) {} try { doc.direction = ParagraphDirection.DIRECTION_RIGHT_TO_LEFT; } catch (e) {} }
  tp.setValue(doc); return l; }`);
  w('var missing = [];');

  const sceneComps = bake.scenes.map((s, i) => ({ i, start: s.start, dur: s.end - s.start, tr: s.transition }));
  // كومب رئيسي
  w(`var main = app.project.items.addComp(${J(name)}, W, H, 1, ${r4(duration)}, FPS);`);
  w('var folder = app.project.items.addFolder(' + J(name + ' — مشاهد') + ');');
  sceneComps.forEach((sc) => {
    w(`var S${sc.i} = app.project.items.addComp(${J(`مشهد ${sc.i + 1}`)}, W, H, 1, ${r4(sc.dur)}, FPS); S${sc.i}.parentFolder = folder;`);
  });

  const bg = typeof bake.background === 'string' ? bake.background : null;
  const hexToRgb = (h) => { const n = parseInt(h.slice(1, 7), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(r4); };
  if (bg) w(`var bgL = main.layers.addSolid(${J(hexToRgb(bg))}, "Background", W, H, 1, ${r4(duration)});`);

  // العناصر (بترتيب الرسم: أول عنصر تحت)
  const fontsUsed = new Set();
  const byComp = new Map();
  for (const el of bake.elements) {
    const target = el.scene >= 0 ? `S${el.scene}` : 'main';
    if (!byComp.has(target)) byComp.set(target, []);
    byComp.get(target).push(el);
  }
  for (const [target, els] of byComp) {
    const t0 = target === 'main' ? 0 : sceneComps[+target.slice(1)].start;
    // AE بيضيف الطبقات الجديدة فوق، فمنضيفهم بالترتيب ومنخلّي الأحدث فوق (نفس ترتيب الرسم)
    for (const el of els) {
      const tr = trackFor(el, fps, t0);
      if (!tr) continue;
      const nm = J(el.name || el.key);
      if (el.kind === 'text') {
        fontsUsed.add(el.family);
        w(`try { var l = TX(${target}, ${nm}, ${J({ text: el.text, font: fontPostScript(el.family, el.weight), size: r2(el.size), fill: col(el.fill), rtl: el.rtl, lh: el.lines > 1 ? r2(el.lineHeight) : 0 })}); T(l, ${J(tr)}); } catch (e) { missing.push(${nm} + ": " + e); }`);
      } else if (el.kind === 'glyphs') {
        fontsUsed.add(el.family);
        const groups = [{ s: el.glyphs.flatMap((g) => pathToShapes(g.d, g.m)).map(roundShape), fl: col(el.fill) }];
        w(`try { var l = SL(${target}, ${nm}, ${J(groups)}); T(l, ${J(tr)}); } catch (e) { missing.push(${nm} + ": " + e); }`);
      } else if (el.type === 'image') {
        const g0 = tr.geos[0]?.geo;
        const file = images[g0?.src] ?? null;
        if (!file) { w(`missing.push(${J('صورة: ' + (g0?.src ?? '?'))});`); continue; }
        w(`try { var it = app.project.importFile(new ImportOptions(File(ROOT.fsName + "/" + ${J(file)}))); var l = ${target}.layers.add(it); l.name = ${nm};
  var tr_ = ${J(tr)}; var ks = ${J([r4(g0.w), r4(g0.h)])}; T(l, tr_); var sc = l.property("ADBE Transform Group").property("ADBE Scale");
  var fx = ks[0] / it.width * 100, fy = ks[1] / it.height * 100; if (sc.numKeys) { for (var k = 1; k <= sc.numKeys; k++) { var vv = sc.keyValue(k); sc.setValueAtKey(k, [vv[0] * fx / 100, vv[1] * fy / 100, 100]); } } else { var vv = sc.value; sc.setValue([vv[0] * fx / 100, vv[1] * fy / 100, 100]); }
  l.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([it.width / 2, it.height / 2, 0]); } catch (e) { missing.push(${nm} + ": " + e); }`);
      } else {
        // أشكال: مسار ثابت أو متحرك + trim
        const geos = tr.geos;
        if (!geos.length) continue;
        const groups0 = shapeContents(geos[0].geo);
        const animated = geos.length > 1 && geos.some((g) => JSON.stringify(g.geo.paths ?? g.geo.parts?.map((p) => p.d)) !== JSON.stringify(geos[0].geo.paths ?? geos[0].geo.parts?.map((p) => p.d)));
        const groups = groups0.map((g, gi) => {
          const out = { s: g.shapes.map(roundShape), fl: g.fill ? col(g.fill) : null, st: g.stroke ? col(g.stroke) : null, sw: r2(g.sw ?? 2) };
          if (animated) {
            const idx = reduceKeys(geos.map((x) => x.t), geos.map((x, k) => [k]), [0.5]);
            out.k = geos.filter((_, k) => idx.includes(k) || k === geos.length - 1).map((x) => ({ t: x.t, s: shapeContents(x.geo)[gi].shapes.map(roundShape) }));
          }
          const trims = geos.filter((x) => x.geo.trim);
          if (trims.length) out.tr = trims.length === 1 ? { s: [trims[0].geo.trim[0] * 100], e: [trims[0].geo.trim[1] * 100] } : { t: trims.map((x) => x.t), s: trims.map((x) => r2(x.geo.trim[0] * 100)), e: trims.map((x) => r2(x.geo.trim[1] * 100)) };
          return out;
        });
        w(`try { var l = SL(${target}, ${nm}, ${J(groups)}); T(l, ${J(tr)});${el.blend ? ` try { l.blendingMode = ${blendMode(el.blend)}; } catch (e) {}` : ''} } catch (e) { missing.push(${nm} + ": " + e); }`);
      }
    }
  }

  // المشاهد بالكومب الرئيسي + تقريب الانتقالات
  sceneComps.forEach((sc) => {
    w(`var P${sc.i} = main.layers.add(S${sc.i}); P${sc.i}.startTime = ${r4(sc.start)};`);
    const t = sc.tr;
    if (sc.i > 0 && t && t.type !== 'cut') {
      const d = t.dur ?? 0.6, a = r4(sc.start), b = r4(sc.start + d);
      const type = t.type;
      if (['push', 'slide', 'whip'].includes(type)) {
        const dir = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[t.dir ?? 'right'];
        w(`(function(){ var p = P${sc.i}.property("ADBE Transform Group").property("ADBE Position"); K(p, [${a}, ${b}], [[W/2 - ${dir[0]} * W, H/2 - ${dir[1]} * H, 0], [W/2, H/2, 0]]); if (${type === 'whip'}) { try { P${sc.i}.motionBlur = true; main.motionBlur = true; } catch (e) {} } })();`);
      } else if (type === 'zoom') {
        w(`K(P${sc.i}.property("ADBE Transform Group").property("ADBE Scale"), [${a}, ${b}], [[65, 65, 100], [100, 100, 100]]); K(P${sc.i}.property("ADBE Transform Group").property("ADBE Opacity"), [${a}, ${r4(sc.start + d * 0.6)}], [0, 100]);`);
      } else if (type === 'iris') {
        w(`(function(){ var m = P${sc.i}.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var sp = m.property("ADBE Mask Shape"); function circ(r) { var s = new Shape(); var k = 0.5523 * r; s.vertices = [[W/2, H/2 - r], [W/2 + r, H/2], [W/2, H/2 + r], [W/2 - r, H/2]]; s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]]; s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]]; s.closed = true; return s; }
  K(sp, [${a}, ${b}], [circ(1), circ(Math.sqrt(W*W + H*H) / 2)]); })();`);
      } else {
        w(`K(P${sc.i}.property("ADBE Transform Group").property("ADBE Opacity"), [${a}, ${b}], [0, 100]);`);
      }
      w(`// الانتقال الأصلي: ${type} (تقريب بـ AE)`);
    }
  });

  // معالجة نهائية تقريبية
  const post = bake.post ?? {};
  if (post.grain || post.bloom || post.vignette) {
    w(`(function(){ var adj = main.layers.addSolid([1,1,1], "Post (تقريب)", W, H, 1, ${r4(duration)}); adj.adjustmentLayer = true; var fx = adj.property("ADBE Effect Parade");`);
    if (post.bloom) w(`try { var g = fx.addProperty("ADBE Glo2"); g.property("ADBE Glo2-0002").setValue(${r2(100 - (post.bloom.threshold ?? 0.72) * 100)}); g.property("ADBE Glo2-0003").setValue(${r2(40 * (post.bloom.radius ?? 1))}); g.property("ADBE Glo2-0004").setValue(${r2((post.bloom.strength ?? 0.6))}); } catch (e) { missing.push("Glow: " + e); }`);
    if (post.vignette) w(`try { var vg = fx.addProperty("CC Vignette"); vg.property(1).setValue(${r2((post.vignette.strength ?? 0.35) * 100)}); } catch (e) { missing.push("Vignette: " + e); }`);
    if (post.grain) w(`try { var n = fx.addProperty("ADBE Noise"); n.property(1).setValue(${r2((post.grain.amount ?? 0.05) * 100)}); } catch (e) { missing.push("Grain: " + e); }`);
    w('})();');
  }
  if (audio) w(`try { var au = app.project.importFile(new ImportOptions(File(ROOT.fsName + "/" + ${J(audio)}))); var al = main.layers.add(au); al.moveToEnd(); al.name = "Audio"; } catch (e) { missing.push("audio: " + e); }`);
  if (guide) w(`try { var gv = app.project.importFile(new ImportOptions(File(ROOT.fsName + "/" + ${J(guide)}))); var gl = main.layers.add(gv); gl.name = "Guide (الرندر الأصلي)"; gl.guideLayer = true; gl.enabled = false; gl.audioEnabled = false; } catch (e) { missing.push("guide: " + e); }`);
  if (bg) w('bgL.moveToEnd();');
  w('main.openInViewer();');
  w('app.endUndoGroup();');
  w(`if (missing.length) alert("تم البناء مع ملاحظات:\\n" + missing.slice(0, 15).join("\\n")); else alert("✓ تم بناء المشروع: " + ${J(name)});`);
  w('})();');
  return { jsx: L.join('\n'), fonts: [...fontsUsed] };
}

function blendMode(b) {
  const m = { screen: 'SCREEN', multiply: 'MULTIPLY', overlay: 'OVERLAY', add: 'ADD', lighter: 'ADD', 'soft-light': 'SOFT_LIGHT', 'hard-light': 'HARD_LIGHT', difference: 'DIFFERENCE', 'color-dodge': 'COLOR_DODGE', lighten: 'LIGHTEN', darken: 'DARKEN' }[b];
  return m ? `BlendingMode.${m}` : 'BlendingMode.NORMAL';
}
