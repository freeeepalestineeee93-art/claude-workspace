// تحويل كل الأشكال لمسارات SVG موحدة (d)، لنقدر نعمل trim (رسم تدريجي) وmorph وتصدير لأي مكان.

const f = (n) => +n.toFixed(3);

export function rectPath(w, h, r = 0) {
  const x = -w / 2, y = -h / 2;
  const rr = Array.isArray(r) ? r : [r, r, r, r];
  const [tl, tr, br, bl] = rr.map((v) => Math.max(0, Math.min(v, w / 2, h / 2)));
  // بيبلّش من نص الضلع العلوي، فالـ trim بيطلع متناظر وأحلى
  return [
    `M${f(0)},${f(y)}`,
    `L${f(x + w - tr)},${f(y)}`, tr ? `A${f(tr)},${f(tr)} 0 0 1 ${f(x + w)},${f(y + tr)}` : '',
    `L${f(x + w)},${f(y + h - br)}`, br ? `A${f(br)},${f(br)} 0 0 1 ${f(x + w - br)},${f(y + h)}` : '',
    `L${f(x + bl)},${f(y + h)}`, bl ? `A${f(bl)},${f(bl)} 0 0 1 ${f(x)},${f(y + h - bl)}` : '',
    `L${f(x)},${f(y + tl)}`, tl ? `A${f(tl)},${f(tl)} 0 0 1 ${f(x + tl)},${f(y)}` : '',
    'Z',
  ].join('');
}

export function ellipsePath(w, h = w) {
  const rx = w / 2, ry = h / 2;
  return `M0,${f(-ry)}A${f(rx)},${f(ry)} 0 1 1 0,${f(ry)}A${f(rx)},${f(ry)} 0 1 1 0,${f(-ry)}Z`;
}

export function polygonPath(sides = 3, r = 50, inner = null, rotation = 0) {
  const pts = [];
  const n = inner ? sides * 2 : sides;
  for (let i = 0; i < n; i++) {
    const a = rotation * (Math.PI / 180) - Math.PI / 2 + (i / n) * Math.PI * 2;
    const rad = inner && i % 2 ? inner : r;
    pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  return 'M' + pts.map(([x, y]) => `${f(x)},${f(y)}`).join('L') + 'Z';
}

export function linePath(points, closed = false) {
  return 'M' + points.map(([x, y]) => `${f(x)},${f(y)}`).join('L') + (closed ? 'Z' : '');
}

// منحنى ناعم يمر بكل النقاط (Catmull-Rom → Bezier)
export function smoothPath(points, closed = false, tension = 0.5) {
  if (points.length < 3) return linePath(points, closed);
  const p = closed ? [points[points.length - 1], ...points, points[0], points[1]] : [points[0], ...points, points[points.length - 1]];
  let d = `M${f(p[1][0])},${f(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const t = tension / 3 * 2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t / 2, p1[1] + (p2[1] - p0[1]) * t / 2];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t / 2, p2[1] - (p3[1] - p1[1]) * t / 2];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}

// دائرة/إطار "مرسوم باليد" حول كلمة (للتأشير)
export function handCirclePath(w, h, seed = 1, loops = 1.15) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = [];
  const N = 28;
  for (let i = 0; i <= N * loops; i++) {
    const a = -Math.PI * 0.6 + (i / N) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 0.06 + (i / N) * 0.04;
    pts.push([Math.cos(a) * (w / 2) * k, Math.sin(a) * (h / 2) * k]);
  }
  return smoothPath(pts, false, 0.9);
}

// خط تحت كلمة بأسلوب الفرشاة
export function handUnderlinePath(w, seed = 1) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push([w / 2 - (i / 6) * w, (r() - 0.5) * w * 0.025 + Math.sin(i * 1.3) * w * 0.008]);
  return smoothPath(pts, false, 0.8);
}
