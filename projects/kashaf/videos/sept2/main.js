// كشاف — "شهر أيلول بالأرقام" — النسخة الإبداعية: «الضو بيكشف الحقيقة».
// نفس النص والهوية والموسيقى. الفكرة: الشائعات نقاط رمادية (ضجيج)، وشعاع كشّاف (من الشعار) هو المحقق.
//  ١ الغلاف: النص موجود بالعتمة وما بينقرا إلا وين بيمر الشعاع.
//  ٢ 125: شريط 30 يوم بيمشي، كل يوم بيرمي شائعاته، والـ125 نقطة نفسها بتبني الرقم 125.
//  ٣ 113: الشعاع بيمسح الرقم: 113 بتضوي سيان و12 بيضلوا رماديين؛ النقاط نفسها بتعيد ترتيب حالها لـ113.
//  ٤ بالأدلّة: مقطع أعزاز بالنص وكل أداة بنشوفها عم تشتغل عليه.  ٥ نفس المقطع بيصير ملف القضية ← ختم مضلّل (25.0).
//  ٦ سربين شائعات، الشعاع بيضرب كل سرب فبينهار لبطاقة الحملة.  ٧ خط متذبذب بيهدى لخط مستقر.  ٨ الشعاع بيصير شعاع الشعار.
// الكاميرا شبه ثابتة (بتتحرك بس لما بتخدم)، وكل عنصر بيدخل ويطلع بحركته الخاصة.
import { initType, preloadFont, layoutText } from '../../../../lib/type.js';

export default async (S) => {
  const { W, H, cx } = S;
  const px = S.px, vh = S.vh;
  const C = { cyan: '#4FDCFF', white: '#FFFFFF', muted: '#C9CDF0', dim: '#9AA0D6', red: '#FF4F5E', green: '#3EE08F', grey: '#AEB5E0' };
  const F = 'IBM Plex Sans Arabic';
  const D = 43.87;
  const sfx = [];
  const XR = px(985); // عمود يمين (حافة بداية القراءة)

  // ── أدوات زمن وحركة ──
  const clamp = (u, a = 0, b = 1) => Math.max(a, Math.min(b, u));
  const io3 = (u) => { u = clamp(u); return u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2; };
  const io5 = (u) => { u = clamp(u); return u < 0.5 ? 16 * u ** 5 : 1 - (-2 * u + 2) ** 5 / 2; };
  const out3 = (u) => 1 - (1 - clamp(u)) ** 3;
  const outBack = (u) => { u = clamp(u); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const bez = (a, c, b, k) => (1 - k) ** 2 * a + 2 * (1 - k) * k * c + k * k * b;

  // ── نقاط على شكل رقم (من مسارات الخط نفسه عبر HarfBuzz، فبتنطبق تماماً) ──
  await initType();
  await preloadFont(F, [700]);
  const numberShape = (str, size, X, Y, N) => {
    const lay = layoutText(str, { family: F, size, weight: 700 });
    const s = lay.scale;
    const path = new Path2D();
    for (const g of lay.glyphs) if (g.d) path.addPath(new Path2D(g.d), new DOMMatrix().translate(X + g.x, Y + g.y).scale(s * g.sx, -s));
    const Wc = Math.ceil(lay.width + size * 0.6), Hc = Math.ceil(size * 1.5);
    const oc = new OffscreenCanvas(Wc, Hc), c = oc.getContext('2d');
    c.translate(Wc / 2 - X, Hc / 2 - Y);
    c.fill(path);
    const img = c.getImageData(0, 0, Wc, Hc).data;
    const ins = (x, y) => { x = Math.round(x - X + Wc / 2); y = Math.round(y - Y + Hc / 2); return x < 0 || y < 0 || x >= Wc || y >= Hc ? 0 : img[(y * Wc + x) * 4 + 3] / 255; };
    const grid = (h) => { const o = []; for (let y = Y - Hc / 2 + h / 2; y < Y + Hc / 2; y += h) for (let x = X - Wc / 2 + h / 2; x < X + Wc / 2; x += h) if (ins(x, y) > 0.5) o.push([x, y]); return o; };
    let lo = 4, hi = size / 3, pts = grid(lo);
    for (let i = 0; i < 26; i++) { const h = (lo + hi) / 2, p = grid(h); if (p.length >= N) { pts = p; lo = h; } else hi = h; }
    const cover = ([x, y]) => { let a = 0; for (const dx of [-0.45, 0, 0.45]) for (const dy of [-0.45, 0, 0.45]) a += ins(x + dx * lo, y + dy * lo); return a; };
    pts = pts.map((p, i) => ({ p, c: cover(p) + i * 1e-6 })).sort((a, b) => b.c - a.c).slice(0, N).map((o) => o.p);
    return { pts, h: lo, path };
  };
  const N125 = numberShape('125', px(560), cx, vh(45), 125);
  const N113 = numberShape('113', px(430), cx, vh(29), 113);

  // ═══ الشعاع: حالات زمنية (apex، اتجاه، فتحة) + تحوّل لشعاع الشعار بالآخر ═══
  const LX = cx, LY = vh(40), LW = 788, LH = 252, L0 = [LX - LW / 2, LY - LH / 2];
  const LOGO = { ax: L0[0] + 186, ay: L0[1] + 24, r0: 22, len: 228, wid: 263 };
  const A = { tl: [px(130), px(330)], tr: [W - px(130), px(300)], top: [cx, px(230)] };
  // [وقت الوصول، apex، اتجاه°، نص الفتحة°] — بين كل حالتين انتقال ناعم
  const BK = [
    [0, A.tl, 118, 5], [0.45, A.tl, 118, 12], [1.55, A.tl, 50, 24], [2.95, A.tl, 52, 24],
    [3.55, A.top, 90, 30], [7.8, A.top, 90, 30], [8.12, A.top, 130, 7], [9.75, A.top, 50, 7, 'full'], [10.15, A.top, 90, 30], [14.35, A.top, 90, 30],
    [14.85, A.tr, 122, 19], [19.55, A.tr, 122, 19], [20.15, A.tl, 46, 27], [28.45, A.tl, 46, 27],
    [28.95, A.top, 90, 22], [29.6, A.top, 90, 22], [29.85, A.top, 53, 9], [30.05, A.top, 53, 9], [30.27, A.top, 112, 9], [30.45, A.top, 112, 9], [30.85, A.top, 90, 24],
    [32.95, A.top, 90, 24], [33.5, A.top, 90, 15], [34.45, A.top, 90, 15], [35.3, A.top, 90, 33], [35.85, A.top, 90, 33],
  ];
  const beam = (t) => {
    let st;
    if (t <= BK[0][0]) st = BK[0];
    else {
      let i = 0; while (i < BK.length - 1 && t >= BK[i + 1][0]) i++;
      if (i === BK.length - 1) st = BK[i];
      else {
        const [t0, a0, g0, s0] = BK[i], [t1, a1, g1, s1, mode] = BK[i + 1];
        const span = t1 - t0, travel = mode === 'full' ? span : Math.min(span, 0.55); // الحركة بآخر 0.55 من كل مقطع (المسح: كل المدة)
        const k = mode === 'full' ? (t - t0) / span * 0.15 + 0.85 * io3((t - t0) / span) : io3((t - (t1 - travel)) / travel);
        st = [t, [lerp(a0[0], a1[0], k), lerp(a0[1], a1[1], k)], lerp(g0, g1, k), lerp(s0, s1, k)];
      }
    }
    const [, [ax, ay], ang, spr] = st;
    const logo = io3((t - 35.95) / 0.75);
    // رجفة التشغيل
    const fl = [[0.15, 0], [0.22, 0.9], [0.27, 0.2], [0.34, 1], [0.39, 0.5], [0.46, 1]];
    let on = 1;
    if (t < 0.46) { on = 0; for (let i = 0; i < fl.length - 1; i++) if (t >= fl[i][0] && t < fl[i + 1][0]) on = lerp(fl[i][1], fl[i + 1][1], (t - fl[i][0]) / (fl[i + 1][0] - fl[i][0])); }
    on *= 1 + 0.05 * Math.sin(t * 2.3) + 0.025 * Math.sin(t * 7.9);
    return { ax: lerp(ax, LOGO.ax, logo), ay: lerp(ay, LOGO.ay, logo), ang, spr, logo, on };
  };
  const beamPts = (b, len = H * 1.45) => {
    const r = (d) => (d * Math.PI) / 180;
    const L = len;
    const tri = [[b.ax, b.ay], [b.ax, b.ay], [b.ax + Math.cos(r(b.ang - b.spr)) * L, b.ay + Math.sin(r(b.ang - b.spr)) * L], [b.ax + Math.cos(r(b.ang + b.spr)) * L, b.ay + Math.sin(r(b.ang + b.spr)) * L]];
    const q = [[LOGO.ax - LOGO.r0, LOGO.ay], [LOGO.ax + LOGO.r0, LOGO.ay], [LOGO.ax + LOGO.wid, LOGO.ay + LOGO.len], [LOGO.ax - LOGO.r0, LOGO.ay + LOGO.len]];
    if (b.logo <= 0) return tri;
    // المثلث بيتحول للشكل الرباعي تبع الشعار
    const triL = [tri[0], tri[1], tri[2], tri[3]];
    return triL.map((p, i) => [lerp(p[0], q[i][0], b.logo), lerp(p[1], q[i][1], b.logo)]);
  };
  const beamD = (t) => { const p = beamPts(beam(t)); return `M${p[0][0]},${p[0][1]} L${p[1][0]},${p[1][1]} L${p[2][0]},${p[2][1]} L${p[3][0]},${p[3][1]} Z`; };
  const beamLayer = S.custom({
    draw(ctx, t) {
      const b = beam(t);
      if (b.on <= 0.001) return;
      const p = beamPts(b);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const mid = [(p[2][0] + p[3][0]) / 2, (p[2][1] + p[3][1]) / 2];
      const g = ctx.createLinearGradient(b.ax, b.ay, lerp(b.ax, mid[0], 1 - b.logo * 0.5), lerp(b.ay, mid[1], 1 - b.logo * 0.5));
      g.addColorStop(0, `rgba(95,200,255,${lerp(0.24, 0.34, b.logo) * b.on})`);
      g.addColorStop(1, `rgba(60,140,255,${lerp(0.0, 0.3, b.logo) * b.on})`);
      ctx.fillStyle = g;
      const P2 = new Path2D(); P2.moveTo(...p[0]); P2.lineTo(...p[1]); P2.lineTo(...p[2]); P2.lineTo(...p[3]); P2.closePath();
      ctx.fill(P2);
      // مصدر الضو
      const rg = ctx.createRadialGradient(b.ax, b.ay, 0, b.ax, b.ay, px(110));
      rg.addColorStop(0, `rgba(140,230,255,${0.6 * b.on * (1 - b.logo * 0.7)})`); rg.addColorStop(1, 'rgba(79,220,255,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(b.ax, b.ay, px(110), 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = clamp(b.on) * (1 - b.logo);
      ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(b.ax, b.ay, px(15), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  });

  // ═══ خلفية + ضجيج (فقاعات شائعات باهتة بتطفو طول الفيديو) ═══
  const background = { layers: [
    S.rect({ x: cx, y: H / 2, w: W, h: H, fill: { linear: [[0, 0], [0, H]], stops: [[0, '#050827'], [0.5, '#0C1553'], [1, '#162186']] } }),
    S.ellipse({ x: cx, y: H * 0.62, w: W * 1.6, h: H * 0.7, fill: { radial: { c: [cx, H * 0.62], r: W * 0.9 }, stops: [[0, 'rgba(40,70,200,0.32)'], [1, 'rgba(40,70,200,0)']] } }),
  ] };
  let tri = '';
  for (let gy = 0; gy < H + px(120); gy += px(118)) for (let gx = -px(60); gx < W + px(120); gx += px(118)) { const ox = (Math.round(gy / px(118)) % 2) * px(59), s = px(32); tri += `M${gx + ox},${gy} L${gx + ox},${gy + s} L${gx + ox + s},${gy + s} Z`; }
  const pattern = S.path({ d: tri, fill: 'rgba(130,160,255,0.04)', y: (t) => -((t * px(6)) % px(118)) });
  const noise = S.custom({
    draw(ctx, t) {
      ctx.save();
      for (let i = 0; i < 46; i++) {
        const sp = 8 + hash(i) * 14, x0 = hash(i + 50) * W, ph = hash(i + 90) * H;
        const y = H + px(60) - ((ph + t * sp * 3) % (H + px(120)));
        const x = x0 + Math.sin(t * 0.3 + i) * px(18);
        const a = 0.06 + 0.05 * hash(i + 7);
        const w = px(26 + hash(i + 3) * 22), h = w * 0.62;
        ctx.globalAlpha = a; ctx.strokeStyle = '#9FB2FF'; ctx.lineWidth = px(2);
        ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2.4); ctx.moveTo(x - w * 0.15, y + h / 2); ctx.lineTo(x - w * 0.28, y + h * 0.85); ctx.lineTo(x - w * 0.02, y + h / 2); ctx.stroke();
      }
      ctx.restore();
    },
  });

  // ═══ مساعدات ═══
  const txt = (o) => S.text({ family: F, weight: 700, fill: C.white, ...o });
  const exitW = (at, o = {}) => ({ by: 'word', at, to: { y: -px(60), opacity: 0, blur: 10 }, dur: 0.36, ease: 'quadIn', stagger: { each: 0.045, from: 'end' }, ...o });
  const label = (y, text, at, outAt, { x = XR, center = false } = {}) => S.group({ opacity: { kf: [[outAt, 1], [outAt + 0.3, 0]] }, y: { kf: [[outAt, 0, 'quadIn'], [outAt + 0.3, -px(30)]] } }, [
    ...(center ? [S.rect({ x, y: y - px(42), w: px(46), h: px(5), radius: px(3), fill: C.cyan, scale: { at, from: [0, 1], to: [1, 1], spring: 'snappy' } })]
      : [0, 1].map((i) => S.rect({ x: x - px(3) - i * px(13), y, w: px(6), h: px(26), radius: px(2), fill: C.cyan, scale: { at: at + i * 0.06, from: [1, 0], to: [1, 1], spring: 'snappy' } }))),
    txt({ text, size: px(36), weight: 500, fill: C.muted, x: center ? x : x - px(34), y, anchor: center ? 'center' : 'start',
      reveal: { by: 'word', at: at + 0.08, mask: true, from: { y: px(40), opacity: 0 }, dur: 0.45, ease: 'ae:80:33', stagger: { each: 0.06 } } }),
  ]);
  const glass = (w, h, o = {}) => S.rect({ w, h, radius: px(28), fill: { linear: [[-w / 2, -h / 2], [w / 2, h / 2]], stops: [[0, 'rgba(70,100,230,0.34)'], [1, 'rgba(30,50,150,0.24)']] }, stroke: 'rgba(140,170,255,0.30)', strokeWidth: px(2), shadow: { color: 'rgba(0,0,30,0.35)', blur: 30, y: 12 }, ...o });
  const iconBox = (x, y, icon, at, size = px(92), o = {}) => S.group({ x, y, ...o }, [
    S.rect({ w: size, h: size, radius: size * 0.27, fill: 'rgba(79,220,255,0.10)', stroke: 'rgba(79,220,255,0.5)', strokeWidth: px(2), scale: { at, from: 0.3, to: 1, spring: 'playful' }, opacity: { kf: [[at - 0.01, 0], [at + 0.08, 1]] } }),
    S.icon({ icon, size: size * 0.5, color: C.cyan, strokeWidth: 2, trim: { at: at + 0.08, from: [0, 0], to: [0, 1], dur: 0.55, ease: 'ae:50:80' } }),
  ]);
  const checkMark = (x, y, at) => S.group({ x, y, scale: { at, from: 0.3, to: 1, spring: 'playful' }, opacity: { kf: [[at - 0.01, 0], [at + 0.08, 1]] } }, [
    S.circle({ r: px(24), fill: 'rgba(79,220,255,0.12)', stroke: 'rgba(79,220,255,0.6)', strokeWidth: px(2.5) }),
    S.path({ d: `M${-px(10)},${px(1)} L${-px(3)},${px(8)} L${px(11)},${-px(8)}`, fill: null, stroke: C.cyan, strokeWidth: px(4), lineCap: 'round', lineJoin: 'round', trim: { at: at + 0.08, from: [0, 0], to: [0, 1], dur: 0.3, ease: 'ae:60:80' } }),
  ]);
  // نقطة مرسومة (مش حرف "●" — الخط ما فيه هالرمز)
  const bullet = (x, y, color, at, hollow = false) => S.circle({ x, y, r: px(8), fill: hollow ? null : color, stroke: hollow ? color : null, strokeWidth: px(2.5), dash: hollow ? [px(3), px(3)] : null, scale: { at, from: 0, to: 1, spring: 'playful' } });

  // ════════ ١. الغلاف — النص بالعتمة، والشعاع بيقراه ════════
  const coverTexts = (lit) => {
    const dimFill = 'rgba(150,170,255,0.10)';
    const f = (c) => (lit ? c : dimFill);
    const ex = (i) => exitW(2.72 + i * 0.07);
    return [
      txt({ text: 'تقرير فريق التحقق', size: px(38), weight: 500, fill: f(C.muted), x: XR, y: vh(30), anchor: 'start', exit: ex(0) }),
      txt({ text: 'شهر أيلول', size: px(128), fill: f(C.white), x: XR, y: vh(37.5), anchor: 'start', exit: ex(1) }),
      txt({ text: 'بالأرقام', size: px(240), fill: f(C.cyan), x: XR + px(6), y: vh(48.5), anchor: 'start', glow: lit ? { color: C.cyan, radius: px(34), strength: 0.5 } : null, exit: ex(2) }),
      txt({ text: 'من 1 حتى 30 أيلول 2026', size: px(42), weight: 500, fill: f(C.dim), x: XR, y: vh(57), anchor: 'start', exit: ex(3) }),
    ];
  };
  const s1 = S.group({ opacity: { kf: [[0.1, 0], [0.5, 1]] } }, [
    S.group({}, coverTexts(false)),
    // النسخة المضوية: بس جوّا الشعاع، وبعد ما يمر الشعاع بتثبت (الحقيقة انكشفت)
    S.group({ isolate: true, mask: S.path({ d: beamD }), opacity: { kf: [[1.7, 1], [2.0, 0]] } }, coverTexts(true)),
    S.group({ opacity: { kf: [[1.55, 0], [1.95, 1]] } }, coverTexts(true)),
    // خط سيان صغير بيتمدد تحت التاريخ
    S.rect({ x: XR, y: vh(60.3), w: px(340), h: px(5), radius: px(3), fill: { linear: [[px(170), 0], [-px(170), 0]], stops: [[0, '#30D1FF'], [1, '#0373FF']] }, origin: [px(170), 0], scale: { kf: [[1.9, [0, 1], 'ae:70:85'], [2.4, [1, 1]], [2.85, [1, 1], 'quadIn'], [3.1, [0, 1]]] } }),
  ]);
  sfx.push({ kind: 'click', at: 0.2, params: { pitch: 0.7 }, gain_db: -26 }, { kind: 'swell', at: 0.45, params: { dur: 1.0 }, gain_db: -27 }, { kind: 'whoosh', at: 1.0, align: 'peak', params: { dur: 1.1, brightness: 0.5 }, gain_db: -27 });

  // ════════ ٢+٣. الشائعات: 125 نقطة بتبني الرقم، الشعاع بيمسحها، وبتعيد ترتيب حالها لـ113 ════════
  const T125 = N125.pts.slice().sort((a, b) => b[0] - a[0] || a[1] - b[1]); // يمين ← يسار (RTL)
  const STRIP = { y: vh(23.5), x0: px(960), x1: px(120) };
  const E0 = 3.55, ED = 2.35;
  const dayOf = (k) => Math.floor((k * 30) / 125);
  const emit = (k) => E0 + (dayOf(k) / 30) * ED + (k % 4) * 0.035;
  const stripX = (d) => lerp(STRIP.x0, STRIP.x1, d / 29);
  const playX = (t) => lerp(STRIP.x0, STRIP.x1, clamp((t - E0) / ED) * 30 / 29);
  // المسح: زاوية مركز الشعاع (من apex فوق بالنص) بتمر على كل نقطة ← وقت معالجتها
  const AP = A.top;
  const angOf = ([x, y]) => (Math.atan2(y - AP[1], x - AP[0]) * 180) / Math.PI;
  const scanAng = (t) => beam(t).ang;
  const scanTime = (a) => { let lo = 8.12, hi = 9.75; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (scanAng(m) > a) lo = m; else hi = m; } return (lo + hi) / 2; };
  const UNV = new Set(Array.from({ length: 12 }, (_, i) => Math.round(((i + 0.5) * 125) / 12)));
  const handled = [...Array(125).keys()].filter((k) => !UNV.has(k));
  const T113 = N113.pts.slice().sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const dest = new Array(125);
  handled.forEach((k, i) => (dest[k] = T113[i]));
  const ROW12 = { x: px(270), y: vh(54.2) };
  [...UNV].sort((a, b) => a - b).forEach((k, i) => (dest[k] = [ROW12.x + (i - 5.5) * px(30), ROW12.y]));
  const dots = T125.map((p, k) => ({
    k, p125: p, from: [stripX(dayOf(k)), STRIP.y], e: emit(k), scan: scanTime(angOf(p)), unv: UNV.has(k), d: dest[k],
    re: 9.95 + (1 - (p[0] - px(100)) / px(880)) * 0.35 + hash(k) * 0.12, // إعادة الترتيب بتموج من اليمين
    out: 14.18 + hash(k + 9) * 0.22,
  }));
  // نقطة توهج جاهزة (أرخص من gradient لكل نقطة)
  const glowSprite = (() => { const s = 64, oc = new OffscreenCanvas(s, s), c = oc.getContext('2d'); const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(79,220,255,0.55)'); g.addColorStop(1, 'rgba(79,220,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); return oc; })();
  const R = px(11);
  const dotLayer = S.custom({
    draw(ctx, t) {
      if (t < E0 - 0.1 || t > 14.9) return;
      ctx.save();
      for (const d of dots) {
        if (t < d.e) continue;
        let x, y, r = R, col = C.grey, a = 0.9, glow = 0, ring = 0;
        // ١) الطيران من الشريط للرقم (قوس)
        const kf = clamp((t - d.e) / 0.6);
        const ke = out3(kf);
        const cxp = (d.from[0] + d.p125[0]) / 2 + (hash(d.k) - 0.5) * px(160), cyp = Math.min(d.from[1], d.p125[1]) - px(120);
        x = bez(d.from[0], cxp, d.p125[0], ke); y = bez(d.from[1], cyp, d.p125[1], ke);
        r = R * (0.4 + 0.6 * outBack(kf));
        // ٢) المسح
        if (t >= d.scan) {
          const ks = clamp((t - d.scan) / 0.35);
          if (!d.unv) { col = C.cyan; a = 1; glow = ks; r *= 1 + 0.6 * Math.sin(Math.PI * ks); }
          else { a = 0.55; ring = ks; }
        }
        // ٣) إعادة الترتيب
        if (t >= d.re) {
          const kr = io3((t - d.re) / 0.85);
          const mx = (d.p125[0] + d.d[0]) / 2 + (hash(d.k + 3) - 0.5) * px(220), my = (d.p125[1] + d.d[1]) / 2 + (d.unv ? px(60) : -px(80));
          x = bez(d.p125[0], mx, d.d[0], kr); y = bez(d.p125[1], my, d.d[1], kr);
          r = d.unv ? lerp(r, R * 0.9, kr) : lerp(r, R * 0.92, kr);
        }
        // ٤) الخروج: بتتطاير لبرا
        if (t >= d.out) {
          const ko = clamp((t - d.out) / 0.45);
          const ang = Math.atan2(y - vh(35), x - cx) + (hash(d.k + 1) - 0.5);
          x += Math.cos(ang) * px(260) * io3(ko); y += Math.sin(ang) * px(260) * io3(ko);
          a *= 1 - ko; r *= 1 - 0.6 * ko;
        }
        if (glow > 0) { ctx.globalAlpha = a * glow; ctx.drawImage(glowSprite, x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2); }
        ctx.globalAlpha = a;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fill();
        if (ring > 0) { ctx.globalAlpha = a * ring; ctx.strokeStyle = C.muted; ctx.lineWidth = px(2); ctx.setLineDash([px(3), px(4)]); ctx.beginPath(); ctx.arc(x, y, r + px(6) * ring, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      }
      ctx.restore();
    },
  });
  // خطوط الأرقام الخفيفة (بتنرسم مع وصول النقاط) — من نفس مسار الخط
  const outline = (shape, a, b, c, d2) => S.custom({
    draw(ctx, t) {
      const o = clamp((t - c) / 0.3);
      const alpha = 0.2 * io3((t - a) / (b - a)) * (1 - (t > c ? o : 0)) * (t < d2 ? 1 : 0);
      if (alpha <= 0) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.cyan; ctx.lineWidth = px(2.5);
      ctx.stroke(shape.path); ctx.restore();
    },
  });
  // شريط 30 يوم (RTL) مع رأس تشغيل بيرمي الشائعات
  const strip = S.group({ opacity: { kf: [[3.25, 0], [3.5, 1], [6.3, 1], [6.8, 0]] } }, [
    S.line({ points: [[STRIP.x0 + px(20), STRIP.y], [STRIP.x1 - px(20), STRIP.y]], stroke: 'rgba(160,180,255,0.35)', strokeWidth: px(2), trim: { at: 3.3, from: [0, 0], to: [0, 1], dur: 0.5, ease: 'ae:60:85' } }),
    ...Array.from({ length: 30 }, (_, d) => S.rect({ x: stripX(d), y: STRIP.y, w: px(3), h: d % 7 === 0 ? px(22) : px(12), radius: px(1), fill: (t) => (playX(t) <= stripX(d) + 1 && t > E0 ? C.cyan : 'rgba(160,180,255,0.5)'),
      scale: { at: 3.35 + d * 0.012, from: [1, 0], to: [1, 1], spring: 'snappy' } })),
    S.group({ x: playX, y: STRIP.y, opacity: { kf: [[E0 - 0.05, 0], [E0 + 0.05, 1], [E0 + ED, 1], [E0 + ED + 0.3, 0]] } }, [
      S.circle({ r: px(10), fill: C.cyan, glow: { color: C.cyan, radius: px(16), strength: 0.8 } }),
      S.rect({ y: -px(30), w: px(2), h: px(40), fill: C.cyan }),
    ]),
  ]);
  for (let d = 0; d < 30; d += 3) sfx.push({ kind: 'tick', at: E0 + (d / 30) * ED, params: { pitch: 0.9 + d * 0.01 }, gain_db: -31 });
  const s2 = S.group({}, [
    label(vh(17), 'خلال 30 يومًا', 3.3, 7.45, { x: cx, center: true }),
    strip,
    txt({ text: 'شائعةً رصدها الفريق', size: px(70), x: cx, y: vh(64),
      reveal: { by: 'word', at: 6.05, mask: true, from: { y: px(90), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.11 } }, exit: exitW(7.45) }),
    S.group({ opacity: { kf: [[7.5, 1], [7.8, 0]] }, y: { kf: [[7.5, 0, 'quadIn'], [7.8, px(30)]] } }, [
      txt({ text: 'بمعدّل يتجاوز 4 شائعات يوميًا', size: px(36), weight: 500, fill: C.muted, x: cx - px(14), y: vh(70.5),
        box: { fill: 'rgba(25,45,140,0.55)', stroke: 'rgba(79,220,255,0.38)', strokeWidth: px(2), radius: px(40), pad: [px(52), px(16)], reveal: { at: 6.45, spring: 'snappy', from: 'center' } },
        reveal: { by: 'word', at: 6.55, from: { opacity: 0, y: px(14) }, dur: 0.32, ease: 'ae:70:33', stagger: { each: 0.05 } } }),
      bullet(cx + px(230), vh(70.5), C.cyan, 6.7),
    ]),
  ]);
  sfx.push({ kind: 'swish', at: 6.05, gain_db: -28 }, { kind: 'pop', at: 6.45, params: { pitch: 0.9 }, gain_db: -29 });

  // ٣. 113
  const s3 = S.group({}, [
    label(vh(9.5), 'وماذا فعلنا بها؟', 7.8, 14.2),
    txt({ text: 'شائعةً تمّت معالجتها', size: px(66), x: cx, y: vh(43.5),
      reveal: { by: 'word', at: 10.75, mask: true, from: { y: px(80), opacity: 0 }, dur: 0.55, ease: 'ae:85:33', stagger: { each: 0.1 } }, exit: exitW(14.15) }),
    // كبسولتين: "113 عولجت" (نقطة سيان مرسومة) و"12 بلا مصادر موثوقة" (النقاط الـ12 نفسها تحتها)
    S.group({ opacity: { kf: [[14.2, 1], [14.5, 0]] }, x: { kf: [[14.2, 0, 'quadIn'], [14.5, px(60)]] } }, [
      txt({ text: '113 عولجت', size: px(36), weight: 600, x: px(790), y: vh(50), words: { 0: { color: C.cyan } },
        box: { fill: 'rgba(25,45,140,0.6)', stroke: 'rgba(79,220,255,0.38)', strokeWidth: px(2), radius: px(36), pad: [px(56), px(15)], reveal: { at: 11.3, spring: 'snappy', from: 'center' } },
        reveal: { by: 'word', at: 11.38, from: { opacity: 0, y: px(14) }, dur: 0.3, ease: 'ae:70:33', stagger: { each: 0.06 } } }),
      bullet(px(790) + px(118), vh(50), C.cyan, 11.45),
    ]),
    S.group({ opacity: { kf: [[14.25, 1], [14.55, 0]] }, x: { kf: [[14.25, 0, 'quadIn'], [14.55, -px(60)]] } }, [
      txt({ text: '12 بلا مصادر موثوقة', size: px(36), weight: 500, fill: C.muted, x: px(270), y: vh(50),
        box: { fill: 'rgba(25,45,140,0.45)', stroke: 'rgba(201,205,240,0.3)', strokeWidth: px(2), radius: px(36), pad: [px(56), px(15)], reveal: { at: 11.45, spring: 'snappy', from: 'center' } },
        reveal: { by: 'word', at: 11.52, from: { opacity: 0, y: px(14) }, dur: 0.3, ease: 'ae:70:33', stagger: { each: 0.05 } } }),
      bullet(px(270) + px(175), vh(50), C.muted, 11.6, true),
    ]),
    // عدّاد نصف دائري لـ90%
    S.group({ x: cx, y: vh(70), opacity: { kf: [[14.3, 1], [14.6, 0]] }, scale: { kf: [[14.3, 1, 'quadIn'], [14.6, 0.85]] } }, [
      S.path({ d: `M${-px(170)},0 A${px(170)},${px(170)} 0 0 1 ${px(170)},0`, fill: null, stroke: 'rgba(140,170,255,0.2)', strokeWidth: px(16), lineCap: 'round', trim: { at: 11.95, from: [0, 0], to: [0, 1], dur: 0.45, ease: 'ae:60:85' } }),
      S.path({ d: `M${-px(170)},0 A${px(170)},${px(170)} 0 0 1 ${px(170)},0`, fill: null, stroke: C.cyan, strokeWidth: px(16), lineCap: 'round', glow: { color: C.cyan, radius: px(14), strength: 0.5 }, trim: { at: 12.35, from: [0, 0], to: [0, 0.9], dur: 1.2, ease: 'ae:40:85' } }),
      ...Array.from({ length: 11 }, (_, i) => { const a = Math.PI + (i / 10) * Math.PI; return S.line({ points: [[Math.cos(a) * px(198), Math.sin(a) * px(198)], [Math.cos(a) * px(210), Math.sin(a) * px(210)]], stroke: 'rgba(160,180,255,0.45)', strokeWidth: px(2), opacity: { kf: [[12.0 + i * 0.03, 0], [12.15 + i * 0.03, 1]] } }); }),
      txt({ text: 'نسبة المعالجة تتجاوز 90%', size: px(42), weight: 500, fill: C.muted, y: px(70), words: { 3: { color: C.cyan } },
        reveal: { by: 'word', at: 12.15, mask: true, from: { y: px(50), opacity: 0 }, dur: 0.45, ease: 'ae:80:33', stagger: { each: 0.08 } } }),
    ]),
  ]);
  sfx.push({ kind: 'scribble', at: 8.15, params: { dur: 1.5 }, gain_db: -31 }, { kind: 'whoosh', at: 10.3, align: 'peak', params: { dur: 0.9, brightness: 0.8 }, gain_db: -27 },
    { kind: 'pop', at: 11.3, params: { pitch: 1.0 }, gain_db: -29 }, { kind: 'pop', at: 11.45, params: { pitch: 0.8 }, gain_db: -29 }, { kind: 'swish', at: 12.35, params: { dur: 1.0 }, gain_db: -29 },
    { kind: 'whoosh', at: 14.3, align: 'peak', params: { dur: 0.6, brightness: 1.0 }, gain_db: -27 });

  // ════════ ٤. بالأدلّة — المقطع بالنص والأدوات عم تشتغل عليه ════════
  const CL = { w: px(340), h: px(420) };
  const clipX = { kf: [[19.55, cx, 'ae:70:40'], [20.35, cx - px(290)]] };
  const clipS = { kf: [[19.55, 1, 'ae:70:40'], [20.35, 0.85], [28.25, 0.85, 'quadIn'], [28.6, 0.6]] };
  const slices = (t) => clamp(Math.sin(Math.PI * clamp((t - 16.62) / 0.8)) * 1.3);
  const clip = S.group({ x: clipX, y: { at: 15.2, from: vh(50) + px(160), to: vh(50), spring: 'default' }, scale: clipS, rotation: { at: 15.2, from: -8, to: 0, spring: 'default' },
    opacity: { kf: [[15.19, 0], [15.3, 1], [28.3, 1], [28.6, 0]] } }, [
    S.group({ y: { kf: [[19.55, 0, 'ae:70:40'], [20.35, vh(31.5) - vh(50)]] } }, [
      S.rect({ w: CL.w + px(14), h: CL.h + px(14), radius: px(26), fill: 'rgba(20,35,110,0.9)', stroke: 'rgba(140,170,255,0.4)', strokeWidth: px(2), shadow: { color: 'rgba(0,0,30,0.5)', blur: 40, y: 18 } }),
      // الصورة مقسومة لـ4 شرائح بتنفصل وقت "تفكيك المقاطع"
      ...[0, 1, 2, 3].map((i) => S.group({ isolate: true, mask: S.rect({ y: -CL.h / 2 + CL.h * (i + 0.5) / 4, w: CL.w, h: CL.h / 4 - px(1), radius: i === 0 || i === 3 ? px(14) : 0 }), x: (t) => slices(t) * px(46) * (i % 2 ? 1 : -1) * (1 + i * 0.15) }, [
        S.image({ src: 'assets/azaz-clip.png', w: CL.w, h: CL.h, fit: 'cover', scale: { kf: [[15.2, 1.12], [D, 1.0]] } }),
      ])),
      // ١: حلقة بحث عكسي
      S.group({ x: (t) => Math.sin((t - 15.8) * 5) * px(70), y: (t) => Math.cos((t - 15.8) * 3.7) * px(95), opacity: { kf: [[15.8, 0], [15.9, 1], [16.45, 1], [16.6, 0]] }, scale: { kf: [[15.8, 1.6, 'ae:70:30'], [16.05, 1]] } }, [
        S.circle({ r: px(56), fill: 'rgba(79,220,255,0.12)', stroke: C.cyan, strokeWidth: px(3) }),
        S.line({ points: [[px(40), px(40)], [px(78), px(78)]], stroke: C.cyan, strokeWidth: px(6), lineCap: 'round' }),
        S.line({ points: [[-px(18), 0], [px(18), 0]], stroke: C.cyan, strokeWidth: px(2) }), S.line({ points: [[0, -px(18)], [0, px(18)]], stroke: C.cyan, strokeWidth: px(2) }),
      ]),
      // ٣: موجة صوت (سيان) أسفل الصورة — بتضل وبتنسخ حمرا بالمثال
      ...Array.from({ length: 24 }, (_, i) => S.rect({ x: -CL.w / 2 + px(26) + i * px(12.4), y: CL.h / 2 - px(40), w: px(6), radius: px(2), fill: C.cyan, origin: [0, 0],
        h: (t) => (t < 17.45 ? 0 : px(6) + px(40) * clamp((t - 17.45 - i * 0.012) / 0.3) * Math.abs(Math.sin(t * (4.5 + (i % 5) * 0.8) + i * 1.9)) * (0.45 + 0.55 * Math.abs(Math.sin(i * 0.7)))) })),
      S.rect({ x: (t) => -CL.w / 2 + CL.w * clamp((t - 17.5) / 0.75), y: CL.h / 2 - px(40), w: px(3), h: px(70), fill: '#FFFFFF', opacity: { kf: [[17.5, 0], [17.55, 0.9], [18.2, 0.9], [18.3, 0]] } }),
      // ٤: دبوس ميداني بينزل
      S.group({ y: { at: 18.35, from: -CL.h / 2 - px(260), to: -px(40), spring: { stiffness: 260, damping: 14, mass: 1 } }, opacity: { kf: [[18.34, 0], [18.4, 1], [19.5, 1], [19.75, 0]] } }, [
        S.icon({ icon: 'lucide:map-pin', size: px(96), color: '#FFFFFF', strokeWidth: 2.2, y: -px(40) }),
      ]),
      ...[0, 1].map((i) => S.circle({ y: -px(40), r: px(30), fill: null, stroke: C.cyan, strokeWidth: px(3), scale: { kf: [[18.6 + i * 0.22, 0.2, 'quadOut'], [19.3 + i * 0.22, 2.4]] }, opacity: { kf: [[18.6 + i * 0.22, 0], [18.65 + i * 0.22, 0.9], [19.3 + i * 0.22, 0]] } })),
      // زوايا المسح
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => S.path({ d: `M${sx * (CL.w / 2 + px(20))},${sy * (CL.h / 2 + px(20)) - sy * px(44)} L${sx * (CL.w / 2 + px(20))},${sy * (CL.h / 2 + px(20))} L${sx * (CL.w / 2 + px(20)) - sx * px(44)},${sy * (CL.h / 2 + px(20))}`, fill: null, stroke: C.cyan, strokeWidth: px(4), lineCap: 'round', trim: { at: 15.45 + i * 0.05, from: [0.5, 0.5], to: [0, 1], dur: 0.4, ease: 'ae:70:80' } })),
      // ٥ (بالمثال): موجة حمرا بتنفصل عن الأصلية = هتافات مركّبة
      ...Array.from({ length: 24 }, (_, i) => S.rect({ x: -CL.w / 2 + px(26) + i * px(12.4), w: px(6), radius: px(2), fill: C.red,
        y: (t) => CL.h / 2 - px(40) - px(70) * io3((t - 23.4) / 0.6) + (t > 23.4 && t < 24.0 ? Math.sin(t * 90 + i) * px(4) : 0),
        h: (t) => px(6) + px(36) * Math.abs(Math.sin(t * (6 + (i % 4)) + i * 2.3)), opacity: { kf: [[23.35, 0], [23.45, 0.95]] } })),
      // الختم على المقطع
      S.rect({ w: CL.w, h: CL.h, radius: px(16), fill: C.red, blend: 'multiply', opacity: { kf: [[24.99, 0], [25.05, 0.7, 'quadOut'], [25.9, 0.35]] } }),
    ]),
  ]);
  const tools = [
    { x: px(880), y: vh(37), icon: 'lucide:scan-search', text: 'بحث عكسي\nعن الصور', at: 15.72, end: 16.6 },
    { x: px(200), y: vh(37), icon: 'lucide:film', text: 'تفكيك المقاطع\nإلى لقطات', at: 16.55, end: 17.45 },
    { x: px(880), y: vh(63), icon: 'lucide:audio-lines', text: 'تدقيق صوتي\nللمقاطع', at: 17.4, end: 18.3 },
    { x: px(200), y: vh(63), icon: 'lucide:map-pin', text: 'مراسلون\nميدانيون', at: 18.25, end: 19.1 },
  ];
  const toolLayers = tools.map((o, i) => {
    const out = 19.35 + i * 0.06;
    const active = (t) => (t > o.at && t < o.end ? 1 : 0.0);
    return S.group({ x: o.x, y: o.y, opacity: { kf: [[out, 1], [out + 0.3, 0]] }, scale: { kf: [[out, 1, 'quadIn'], [out + 0.3, 0.7]] } }, [
      // خط واصل للمقطع
      S.line({ points: [[0, 0], [(cx - o.x) * 0.42, 0]], stroke: 'rgba(79,220,255,0.45)', strokeWidth: px(2), dash: [px(6), px(6)], trim: { at: o.at, from: [0, 0], to: [0, 1], dur: 0.35, ease: 'ae:60:80' }, y: -px(60) }),
      S.circle({ y: -px(60), r: px(46) + px(6), fill: null, stroke: C.cyan, strokeWidth: px(2), opacity: (t) => active(t) * (0.5 + 0.5 * Math.sin(t * 12)), scale: (t) => 1 + 0.08 * Math.sin(t * 12) }),
      iconBox(0, -px(60), o.icon, o.at),
      txt({ text: o.text, size: px(36), lineHeight: 1.28, y: px(40), fill: { kf: [[o.end, '#FFFFFF'], [o.end + 0.3, C.muted]] }, reveal: { by: 'line', at: o.at + 0.12, mask: true, from: { y: px(40), opacity: 0 }, dur: 0.42, ease: 'ae:80:33', stagger: { each: 0.08 } } }),
    ]);
  });
  const s4 = S.group({}, [
    label(vh(10), 'كيف نتحقّق؟', 14.75, 19.6),
    // (الشطب ما بيطلع مع exit النص، فالمجموعة كلها بتختفي)
    S.group({ opacity: { kf: [[19.55, 1], [19.95, 0]] } }, [txt({ text: 'بالأدلّة، لا بالرأي', size: px(108), x: XR, y: vh(17), anchor: 'start', words: { 0: { color: C.cyan } },
      marks: [{ word: 2, type: 'strike', color: 'rgba(255,79,94,0.85)', at: 15.55, dur: 0.35 }],
      reveal: { by: 'word', at: 14.92, mask: true, from: { y: px(130), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.15 } }, exit: exitW(19.55) })]),
    ...toolLayers,
  ]);
  sfx.push({ kind: 'drop', at: 15.25, gain_db: -27 }, { kind: 'marker', at: 15.55, gain_db: -29 },
    { kind: 'sparkle', at: 15.8, gain_db: -29 }, { kind: 'glitch', at: 16.65, params: { dur: 0.5 }, gain_db: -30 }, { kind: 'swish', at: 17.45, gain_db: -29 }, { kind: 'hit', at: 18.55, params: { pitch: 0.9 }, gain_db: -27 },
    { kind: 'whoosh', at: 19.95, align: 'peak', params: { dur: 0.9, brightness: 0.7 }, gain_db: -27 });

  // ════════ ٥. مثال من ملفّات الشهر ════════
  const STAMP = 25.0;
  const caseOut = 28.2;
  const row = (y, icon, text, at, i) => S.group({ y, x: { kf: [[caseOut + i * 0.06, 0, 'quadIn'], [caseOut + 0.4 + i * 0.06, px(1300)]] }, opacity: { kf: [[caseOut + 0.15 + i * 0.06, 1], [caseOut + 0.4 + i * 0.06, 0]] } }, [S.group({ x: { at, from: px(220), to: 0, spring: 'default' }, opacity: { kf: [[at - 0.01, 0], [at + 0.15, 1]] } }, [
    glass(px(940), px(112), { radius: px(26), x: cx }),
    iconBox(cx + px(405), 0, icon, at + 0.1, px(66), icon === 'lucide:map-pin' ? { y: { at: at + 0.6, from: -px(14), to: 0, spring: 'playful' } } : {}),
    txt({ text, size: px(38), x: cx + px(352), anchor: 'start', reveal: { by: 'word', at: at + 0.14, from: { opacity: 0, x: px(24) }, dur: 0.32, ease: 'ae:70:33', stagger: { each: 0.05 } } }),
    checkMark(cx - px(410), 0, at + 0.6),
  ])]);
  const s5 = S.group({}, [
    label(vh(13.5), 'مثال من ملفّات الشهر', 20.1, caseOut),
    S.group({ opacity: { kf: [[caseOut, 1], [caseOut + 0.35, 0]] }, scale: { kf: [[caseOut, 1, 'quadIn'], [caseOut + 0.35, 0.92]] }, x: cx, y: vh(31.5) }, [
      S.group({ x: -cx, y: -vh(31.5) }, [
        S.group({ opacity: { kf: [[20.2, 0], [20.45, 1]] }, scale: { at: 20.2, from: [0.4, 1], to: [1, 1], spring: { stiffness: 200, damping: 20, mass: 1 } } }, [glass(px(940), px(450), { x: cx, y: vh(31.5) })]),
        txt({ text: 'ادّعاء متداول', size: px(28), weight: 600, fill: '#FFC2C8', x: XR - px(45), y: vh(23.6), anchor: 'start',
          box: { fill: 'rgba(255,79,94,0.14)', stroke: 'rgba(255,79,94,0.5)', strokeWidth: px(2), radius: px(30), pad: [px(48), px(10)], reveal: { at: 20.65, spring: 'snappy', from: 'start' } },
          reveal: { by: 'word', at: 20.72, from: { opacity: 0 }, dur: 0.25, ease: 'linear', stagger: { each: 0.05 } } }),
        S.circle({ x: XR - px(52) + px(20), y: vh(23.6), r: px(7), fill: C.red, scale: { at: 20.75, from: 0, to: 1, spring: 'playful' }, opacity: (t) => 0.6 + 0.4 * Math.sin(t * 6) }),
        txt({ text: 'مقطع فيديو يوثّق\nاحتجاجات في مدينة أعزاز', size: px(50), lineHeight: 1.36, x: XR - px(45), y: vh(30), anchor: 'start', align: 'start',
          reveal: { by: 'word', at: 20.9, mask: true, from: { y: px(60), opacity: 0 }, dur: 0.5, ease: 'ae:85:33', stagger: { each: 0.08 } } }),
        txt({ text: 'اكتمل التحقّق', size: px(28), weight: 500, fill: C.muted, x: XR - px(80), y: vh(38.6), anchor: 'start',
          reveal: { by: 'word', at: 26.1, from: { opacity: 0, x: px(18) }, dur: 0.35, ease: 'ae:70:33', stagger: { each: 0.06 } } }),
        S.circle({ x: XR - px(57), y: vh(38.6), r: px(7), fill: C.green, scale: { at: 26.05, from: 0, to: 1, spring: 'playful' }, glow: { color: C.green, radius: px(10), strength: 0.6 } }),
      ]),
    ]),
    row(vh(49.5), 'lucide:map-pin', 'المقطع مصوَّر في معرّة النعمان', 22.15, 0),
    row(vh(56.3), 'lucide:audio-lines', 'الهتافات مركّبة على الصوت الأصلي', 23.2, 1),
    // الختم
    S.group({ x: cx - px(300), y: vh(31.5), opacity: { kf: [[STAMP - 0.01, 0], [STAMP + 0.04, 1], [caseOut, 1], [caseOut + 0.3, 0]] } }, [
      S.group({ rotation: { at: STAMP, from: -26, to: -9, spring: 'heavy' }, scale: { at: STAMP, from: 2.8, to: 1, spring: { stiffness: 420, damping: 22, mass: 1 } } }, [
        S.rect({ w: px(330), h: px(150), radius: px(22), fill: 'rgba(255,79,94,0.12)', stroke: C.red, strokeWidth: px(9), glow: { color: C.red, radius: px(20), strength: 0.5 } }),
        txt({ text: 'مضلّل', size: px(118), fill: C.red, y: px(4) }),
      ]),
      S.circle({ r: px(120), fill: null, stroke: C.red, strokeWidth: px(4), scale: { kf: [[STAMP + 0.02, 0.6, 'quadOut'], [STAMP + 0.5, 2.4]] }, opacity: { kf: [[STAMP + 0.01, 0], [STAMP + 0.03, 0.8], [STAMP + 0.5, 0]] } }),
    ]),
    S.particles({ count: 26, start: STAMP + 0.02, rate: 600, emitter: { x: cx - px(300), y: vh(31.5), r: px(60) }, life: [0.4, 0.8], angle: [0, 360], speed: [px(400), px(900)], drag: 5, size: [px(4), px(9)], color: [C.red, '#FF8A94'], shape: 'square', spin: [-300, 300] }),
    txt({ text: 'صوتٌ مفبرك على مشهد من مكان وسياق مختلفين', size: px(36), weight: 500, fill: C.muted, x: cx, y: vh(63.5),
      reveal: { by: 'word', at: 25.6, from: { opacity: 0, y: px(20), blur: 6 }, dur: 0.42, ease: 'ae:70:33', stagger: { each: 0.06 } }, exit: exitW(caseOut + 0.1) }),
  ]);
  sfx.push({ kind: 'swish', at: 20.25, gain_db: -28 }, { kind: 'swish', at: 22.15, gain_db: -29 }, { kind: 'tick', at: 22.75, gain_db: -28 }, { kind: 'swish', at: 23.2, gain_db: -29 }, { kind: 'glitch', at: 23.4, params: { dur: 0.4 }, gain_db: -30 }, { kind: 'tick', at: 23.8, gain_db: -28 },
    { kind: 'impact', at: STAMP, params: { weight: 0.6 }, gain_db: -21 }, { kind: 'chime', at: 26.1, gain_db: -29 }, { kind: 'whoosh', at: 28.45, align: 'peak', params: { dur: 0.6, brightness: 0.9 }, gain_db: -27 });

  // ════════ ٦. حملتين — سربين شائعات بيضربهم الشعاع ════════
  const ROWS6 = [{ y: vh(37), hit: 29.9, from: 1, num: '01', text: 'إعادة تدوير مشاهد قديمة\nفي سياق الاحتجاجات' }, { y: vh(47.5), hit: 30.33, from: -1, num: '02', text: 'ادّعاءات عن مقاتلين\nسوريين في اليمن' }];
  const BADGE = (r) => [cx + px(392), r.y];
  const swarm = S.custom({
    draw(ctx, t) {
      if (t < 28.9 || t > 31.0) return;
      ctx.save();
      ROWS6.forEach((r, si) => {
        const [bx, by] = BADGE(r);
        const sc = [si === 0 ? cx + px(230) : cx - px(230), r.y];
        for (let i = 0; i < 34; i++) {
          const h1 = hash(i + si * 100), h2 = hash(i + si * 100 + 1), h3 = hash(i + si * 100 + 2);
          const t0 = 28.95 + h1 * 0.35;
          if (t < t0) continue;
          const kin = io3((t - t0) / 0.7);
          const sx = r.from > 0 ? W + px(80) + h2 * px(200) : -px(80) - h2 * px(200), sy = r.y + (h3 - 0.5) * px(500);
          const orb = [sc[0] + Math.cos(t * 3 + i) * px(60 + h2 * 110), sc[1] + Math.sin(t * 2.4 + i * 1.3) * px(30 + h3 * 70)];
          let x = lerp(sx, orb[0], kin), y = lerp(sy, orb[1], kin), a = 0.85, rr = px(8 + h1 * 5);
          if (t > r.hit) { const kc = io3((t - r.hit) / 0.32); x = lerp(x, bx, kc); y = lerp(y, by, kc); a *= 1 - kc; rr *= 1 - 0.5 * kc; }
          if (a <= 0.01) continue;
          ctx.globalAlpha = a; ctx.fillStyle = C.grey;
          ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.restore();
    },
  });
  const camp = (r, i) => {
    const at = r.hit + 0.3, out = 32.85 + i * 0.08;
    return S.group({ y: r.y, opacity: { kf: [[out, 1], [out + 0.3, 0]] }, scale: { kf: [[out, [1, 1], 'quadIn'], [out + 0.3, [1, 0.1]]] } }, [
      // البطاقة بتتمدد من عند الرقم (يمين) لليسار
      S.group({ x: cx + px(470), origin: [0, 0] }, [S.group({ scale: { at, from: [0, 1], to: [1, 1], spring: { stiffness: 190, damping: 21, mass: 1 } } }, [glass(px(940), px(172), { x: -px(470) })])]),
      S.group({ x: BADGE(r)[0], scale: { at: r.hit + 0.2, from: 0, to: 1, spring: 'playful' } }, [
        txt({ text: r.num, size: px(72), fill: C.cyan, glow: { color: C.cyan, radius: px(18), strength: 0.5 } }),
      ]),
      S.circle({ x: BADGE(r)[0], r: px(60), fill: null, stroke: C.cyan, strokeWidth: px(3), scale: { kf: [[r.hit + 0.25, 0.4, 'quadOut'], [r.hit + 0.8, 2.2]] }, opacity: { kf: [[r.hit + 0.24, 0], [r.hit + 0.26, 0.9], [r.hit + 0.8, 0]] } }),
      S.rect({ x: cx + px(325), w: px(2), h: px(100), fill: 'rgba(140,170,255,0.3)', scale: { at: at + 0.15, from: [1, 0], to: [1, 1], spring: 'snappy' } }),
      txt({ text: r.text, size: px(40), lineHeight: 1.36, x: cx + px(295), anchor: 'start', align: 'start', reveal: { by: 'word', at: at + 0.15, mask: true, from: { y: px(40), opacity: 0 }, dur: 0.4, ease: 'ae:80:33', stagger: { each: 0.06 } } }),
      checkMark(cx - px(410), 0, at + 0.7),
    ]);
  };
  const s6 = S.group({}, [
    label(vh(13), 'أكثر من شائعة عابرة', 28.95, 32.85),
    txt({ text: 'تفنيد حملتَي تضليل', size: px(112), x: XR, y: vh(20.5), anchor: 'start', words: { 1: { color: C.cyan } },
      reveal: { by: 'word', at: 29.1, mask: true, from: { y: px(130), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.13 } }, exit: exitW(32.85) }),
    swarm,
    ...ROWS6.map(camp),
    txt({ text: 'العدد المؤكَّد خلال فترة التقرير', size: px(32), weight: 500, fill: C.dim, x: cx, y: vh(56),
      reveal: { by: 'word', at: 31.35, from: { opacity: 0, y: px(16) }, dur: 0.38, ease: 'ae:70:33', stagger: { each: 0.06 } }, exit: exitW(32.9) }),
  ]);
  sfx.push({ kind: 'swell', at: 29.0, params: { dur: 0.8 }, gain_db: -29 }, { kind: 'hit', at: 29.9, params: { pitch: 1.0 }, gain_db: -25 }, { kind: 'hit', at: 30.33, params: { pitch: 0.85 }, gain_db: -25 },
    { kind: 'tick', at: 30.9, gain_db: -29 }, { kind: 'tick', at: 31.33, gain_db: -29 }, { kind: 'whoosh', at: 33.05, align: 'peak', params: { dur: 0.6, brightness: 0.7 }, gain_db: -27 });

  // ════════ ٧. الخلاصة — خط متذبذب بيهدى لخط مستقر ════════
  const LINE = { y: vh(55), w: px(780) };
  const lineAmp = (t) => px(62) * (1 - io3((t - 34.0) / 1.0));
  const lineLayer = S.custom({
    draw(ctx, t) {
      if (t < 33.55 || t > 36.6) return;
      const draw = io3((t - 33.55) / 0.6), shrink = io3((t - 35.95) / 0.45);
      const half = (LINE.w / 2) * (1 - shrink);
      ctx.save();
      ctx.strokeStyle = C.cyan; ctx.lineWidth = px(5); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(79,220,255,0.8)'; ctx.shadowBlur = px(14);
      ctx.beginPath();
      const n = 90;
      for (let i = 0; i <= n * draw; i++) {
        const u = i / n, x = cx + half - u * half * 2; // من اليمين لليسار
        const y = LINE.y + lineAmp(t) * (Math.sin(u * 23 + t * 9) * 0.6 + Math.sin(u * 51 - t * 6) * 0.4) * Math.sin(Math.PI * u);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.globalAlpha = 1 - clamp((t - 36.25) / 0.25);
      ctx.stroke();
      ctx.restore();
    },
  });
  const s7 = S.group({}, [
    label(vh(30), 'الخلاصة', 33.4, 36.0, { x: cx, center: true }),
    txt({ text: 'أداءٌ مستقرّ', size: px(156), x: cx, y: vh(38),
      reveal: { by: 'word', at: 33.55, mask: true, from: { y: px(180), opacity: 0 }, dur: 0.65, ease: 'ae:85:33', stagger: { each: 0.14 } }, exit: exitW(35.95) }),
    txt({ text: 'في مواجهة التضليل', size: px(104), x: cx, y: vh(46.5), words: { 1: { color: C.cyan }, 2: { color: C.cyan } }, glow: { color: C.cyan, radius: px(20), strength: 0.25 },
      reveal: { by: 'word', at: 33.85, mask: true, from: { y: px(130), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.12 } }, exit: exitW(36.0) }),
    lineLayer,
    txt({ text: 'ونواصل توسيع الرصد وتسريع الاستجابة', size: px(40), weight: 500, fill: C.muted, x: cx, y: vh(62),
      reveal: { by: 'word', at: 34.5, from: { opacity: 0, y: px(18), blur: 6 }, dur: 0.42, ease: 'ae:70:33', stagger: { each: 0.07 } }, exit: exitW(36.05) }),
  ]);
  sfx.push({ kind: 'riser', at: 33.6, params: { dur: 1.3, intensity: 0.4 }, gain_db: -30 }, { kind: 'swell', at: 35.2, params: { dur: 0.7 }, gain_db: -29 });

  // ════════ ٨. الأوترو — الشعاع بيصير شعاع الشعار وبيلوّن الحروف ════════
  const LT = 36.6;
  const wipe = (t) => io3((t - LT) / 0.8);
  const logo = S.group({}, [
    S.group({ isolate: true, mask: S.rect({ x: (t) => L0[0] + LW + px(20) - (LW + px(40)) * wipe(t) / 2, y: LY, w: (t) => Math.max(0.1, (LW + px(40)) * wipe(t)), h: LH + px(40) }) }, [
      S.image({ src: 'assets/logo-word.png', x: LX, y: LY, w: LW, h: LH, scale: { at: LT, from: 1.08, to: 1, spring: 'heavy' } }),
    ]),
    S.group({ isolate: true, mask: S.path({ d: beamD }), opacity: { kf: [[LT + 0.25, 0], [LT + 0.7, 1]] } }, [
      S.image({ src: 'assets/logo-word-cyan.png', x: LX, y: LY, w: LW, h: LH, scale: { at: LT, from: 1.08, to: 1, spring: 'heavy' } }),
    ]),
    txt({ text: 'عينك على الحقيقة', size: px(80), x: LX, y: LY + px(250), words: { 2: { color: C.cyan } },
      reveal: { by: 'word', at: 38.05, mask: true, from: { y: px(100), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.13 } } }),
    txt({ text: 'تابعوا كشّاف', size: px(32), weight: 500, fill: C.dim, x: LX, y: LY + px(345),
      reveal: { by: 'word', at: 38.7, from: { opacity: 0, y: px(14) }, dur: 0.4, ease: 'ae:70:33', stagger: { each: 0.07 } } }),
    S.text({ text: '@kashaffacts', family: 'Inter', weight: 700, size: px(42), fill: C.white, x: LX, y: LY + px(440),
      box: { fill: 'rgba(25,45,140,0.55)', stroke: 'rgba(79,220,255,0.75)', strokeWidth: px(2.5), radius: px(44), pad: [px(40), px(18)], glow: { color: C.cyan, radius: px(18), strength: 0.35 }, reveal: { at: 39.0, spring: 'snappy', from: 'center' } },
      reveal: { by: 'char', at: 39.1, from: { opacity: 0, y: px(16) }, dur: 0.3, ease: 'ae:70:33', stagger: { each: 0.022 } } }),
  ]);
  sfx.push({ kind: 'whoosh', at: 36.2, align: 'peak', params: { dur: 1.0, brightness: 0.55 }, gain_db: -26 }, { kind: 'shutter', at: LT + 0.05, gain_db: -29 }, { kind: 'chime', at: LT + 0.7, gain_db: -26 }, { kind: 'pop', at: 39.05, gain_db: -29 });

  // ── HUD: شعار صغير + نقاط تقدّم مرسومة ──
  const SEC = [0, 3.2, 7.7, 14.7, 20.0, 28.8, 33.3, 36.5];
  const act = (t) => { let a = 0; for (let k = 1; k < 7; k++) a += io3((t - SEC[k] + 0.2) / 0.4); return a; };
  const dotW = (i, t) => px(10) + px(34) * Math.max(0, 1 - Math.abs(act(t) - i));
  const dotX = (i, t) => { let x = px(72); for (let j = 0; j < i; j++) x += dotW(j, t) + px(10); return x + dotW(i, t) / 2; };
  const hud = S.group({ opacity: { kf: [[0.4, 0], [0.8, 1], [35.9, 1], [36.3, 0]] } }, [
    S.image({ src: 'assets/kashaf_logo.png', x: W - px(167), y: px(96), w: px(190), h: px(77) }),
    ...Array.from({ length: 7 }, (_, i) => S.rect({ x: (t) => dotX(i, t), y: px(96), w: (t) => dotW(i, t), h: px(10), radius: px(5), fill: (t) => (Math.abs(act(t) - i) < 0.5 ? C.cyan : 'rgba(150,170,255,0.45)') })),
  ]);
  const dust = S.particles({ count: 70, rate: 7, start: -10, loop: true, seed: 4, emitter: { x: cx, y: H / 2, w: W, h: H }, life: [6, 10], angle: [-100, -80], speed: [6, 22], size: [px(2), px(5)], color: ['rgba(150,225,255,0.55)', 'rgba(200,235,255,0.4)'], turbulence: { amp: px(30), freq: 0.25 } });

  // الكاميرا: ثابتة غالباً — دفع خفيف وقت بناء الرقم، وهزّة الختم
  const shake = (t, f) => (t > STAMP && t < STAMP + 0.8 ? Math.exp(-(t - STAMP) * 7) * Math.sin((t - STAMP) * f) : 0);
  const camera = {
    zoom: { kf: [[0, 1], [3.5, 1, 'sineInOut'], [7.45, 1.045, 'ae:70:70'], [8.05, 1], [33.4, 1, 'sineInOut'], [35.95, 1.04, 'ae:70:30'], [36.5, 1]] },
    x: (t) => px(12) * shake(t, 58), y: (t) => px(9) * shake(t, 47), rotation: (t) => 0.7 * shake(t, 40),
  };

  return {
    duration: D,
    background,
    audio: { auto: false, music: { src: 'assets/music.wav', gain_db: 0, fade_out: 0.6 }, sfx, master: { lufs: -16, ceiling_db: -1.5 } },
    post: { grain: { amount: 0.03, size: 1.2 }, bloom: { strength: 0.35, threshold: 0.72, radius: 0.6 }, vignette: { strength: 0.3, softness: 0.6 } },
    scenes: [{
      duration: D,
      camera,
      layers: [pattern, noise, s1, outline(N125, 3.6, 6.0, 7.55, 8.0), outline(N113, 10.25, 11.0, 14.15, 14.6), dotLayer, s2, s3, clip, s4, s5, s6, s7],
    }],
    overlay: [beamLayer, dust, logo, hud],
  };
};
