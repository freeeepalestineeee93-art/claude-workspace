#!/usr/bin/env node
// تشغيل build.jsx بمحاكي لـ After Effects (بدون البرنامج) لنكشف أخطاء السكربت قبل ما يوصل للمستخدم.
// node tools/ae-mock.mjs path/build.jsx
// المحاكي بيتحقق من: أسماء الخصائص (matchNames) المعروفة، أنواع القيم، أعداد الـ keyframes.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const KNOWN = new Set([
  'ADBE Transform Group', 'ADBE Anchor Point', 'ADBE Position', 'ADBE Position_0', 'ADBE Position_1', 'ADBE Scale', 'ADBE Rotate Z', 'ADBE Opacity',
  'ADBE Effect Parade', 'ADBE Gaussian Blur 2', 'ADBE Root Vectors Group', 'ADBE Vector Group', 'ADBE Vectors Group', 'ADBE Vector Shape - Group', 'ADBE Vector Shape',
  'ADBE Vector Graphic - Stroke', 'ADBE Vector Stroke Color', 'ADBE Vector Stroke Width', 'ADBE Vector Stroke Line Cap', 'ADBE Vector Stroke Line Join',
  'ADBE Vector Graphic - Fill', 'ADBE Vector Fill Color', 'ADBE Vector Filter - Trim', 'ADBE Vector Trim Start', 'ADBE Vector Trim End',
  'ADBE Text Properties', 'ADBE Text Document', 'ADBE Mask Parade', 'ADBE Mask Atom', 'ADBE Mask Shape', 'ADBE Glo2', 'ADBE Glo2-0002', 'ADBE Glo2-0003', 'ADBE Glo2-0004', 'CC Vignette', 'ADBE Noise',
]);
const stats = { comps: 0, layers: 0, keys: 0, props: 0, texts: [], warnings: [] };

class Prop {
  constructor(name) { this.name = name; this.children = {}; this.numKeys = 0; this.value = name === 'ADBE Text Document' ? new TextDocument('') : [0, 0, 0]; this.dimensionsSeparated = false; }
  property(n) {
    if (typeof n === 'string' && !KNOWN.has(n)) stats.warnings.push(`خاصية غير معروفة: ${n}`);
    stats.props++;
    return (this.children[n] ??= new Prop(n));
  }
  addProperty(n) { if (!KNOWN.has(n)) stats.warnings.push(`addProperty غير معروف: ${n}`); return new Prop(n); }
  setValue(v) {
    if (v === undefined || v === null) throw new Error(`${this.name}: setValue بقيمة فاضية`);
    if (Array.isArray(v) && v.some((x) => typeof x === 'number' && !Number.isFinite(x))) throw new Error(`${this.name}: قيمة مش رقم ${v}`);
    if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`${this.name}: قيمة مش رقم`);
    this.value = v;
  }
  setValuesAtTimes(t, v) {
    if (!Array.isArray(t) || !Array.isArray(v) || t.length !== v.length) throw new Error(`${this.name}: أطوال الأزمنة والقيم مختلفة (${t?.length} vs ${v?.length})`);
    for (let i = 1; i < t.length; i++) if (!(t[i] > t[i - 1])) throw new Error(`${this.name}: أزمنة مش متصاعدة عند ${i}: ${t[i - 1]} → ${t[i]}`);
    if (v.some((x) => x == null || (typeof x === 'number' && !Number.isFinite(x)) || (Array.isArray(x) && x.some((y) => !Number.isFinite(y))))) throw new Error(`${this.name}: قيمة غير صالحة`);
    this.numKeys = t.length; stats.keys += t.length;
  }
  setInterpolationTypeAtKey() {}
  keyValue() { return [100, 100, 100]; }
  setValueAtKey() {}
}
class Layer {
  constructor(name) { this.name = name; this.root = new Prop('root'); this.inPoint = 0; this.outPoint = 1; stats.layers++; }
  property(n) { return this.root.property(n); }
  moveToEnd() {}
}
class Comp {
  constructor(name, w, h, par, dur, fps) {
    if (!(w > 0 && h > 0 && dur > 0 && fps > 0)) throw new Error(`كومب بأبعاد غلط: ${w}x${h} ${dur}s ${fps}`);
    this.name = name; stats.comps++;
    this.layers = {
      addShape: () => new Layer('shape'),
      addText: (t) => { stats.texts.push(t); const l = new Layer('text'); l.root.children['ADBE Text Properties'] = new Prop('tp'); return l; },
      addSolid: () => new Layer('solid'),
      add: () => new Layer('av'),
    };
  }
  openInViewer() {}
}
class TextDocument { constructor(t) { this.text = t; } resetCharStyle() {} resetParagraphStyle() {} }
class Shape {
  set vertices(v) { if (!Array.isArray(v) || v.some((p) => p.length !== 2 || !p.every(Number.isFinite))) throw new Error('رؤوس شكل غلط'); this._v = v; }
  get vertices() { return this._v; }
  set inTangents(v) { if (v.length !== this._v.length) throw new Error('inTangents طولها غلط'); }
  set outTangents(v) { if (v.length !== this._v.length) throw new Error('outTangents طولها غلط'); }
}
const ctx = {
  app: { project: { items: { addComp: (...a) => new Comp(...a), addFolder: () => ({}) }, importFile: () => ({ width: 100, height: 100 }) }, beginUndoGroup() {}, endUndoGroup() {} },
  File: Object.assign(function (p) { return { parent: { fsName: '/x' }, fsName: p }; }, {}), ImportOptions: function () {}, Shape, TextDocument,
  KeyframeInterpolationType: { LINEAR: 1 }, ParagraphJustification: { CENTER_JUSTIFY: 1 }, BlendingMode: new Proxy({}, { get: () => 1 }),
  ComposerEngine: { UNIVERSAL_TYPE_ENGINE: 1 }, ParagraphDirection: { DIRECTION_RIGHT_TO_LEFT: 1 },
  $: { fileName: '/x/build.jsx' }, alert: (m) => { stats.alert = m; },
};
const code = readFileSync(process.argv[2], 'utf8');
try {
  vm.runInNewContext(code, ctx, { timeout: 60000 });
} catch (e) {
  console.error('✗ خطأ بالسكربت:', e.message);
  process.exit(1);
}
const warn = [...new Set(stats.warnings)];
console.log(`✓ السكربت اشتغل بالمحاكي: ${stats.comps} كومب · ${stats.layers} طبقة · ${stats.keys} keyframe · نصوص: ${stats.texts.slice(0, 6).join(' | ')}`);
if (warn.length) console.log('⚠', warn.join('\n⚠ '));
console.log('رسالة النهاية:', stats.alert?.split('\n').slice(0, 6).join(' / '));
