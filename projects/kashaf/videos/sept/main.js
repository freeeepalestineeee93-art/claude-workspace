// كشاف — "شهر أيلول بالأرقام" بأسلوب الاستوديو.
// نفس المحتوى والهوية والموسيقى، بس كعالم واحد متصل: كاميرا وحدة سموث بتسافر بين الأقسام،
// وشعاع الكشّاف (من الشعار نفسه) بيقلب جهته مع كل انتقال، وبالآخر بيصغر وبيصير شعاع الشعار وبيلوّن الحروف سيان.
// النقاط بتتحول عبر المشاهد: 30 يوم (تقويم) ← حلقة 125 ← أول خانات شبكة 113.
// التوقيتات متزامنة مع قطعات الفيديو الأصلي (والموسيقى): 3.2 · 7.7 · 14.7 · 20 · (ختم 25) · 28.8 · 33.3 · 36.5
import { value as V } from '../../../../lib/anim.js';

export default async (S) => {
  const { W, H, cx, cy } = S;
  const px = S.px;
  const C = { cyan: '#4FDCFF', blue: '#0373FF', white: '#FFFFFF', muted: '#C9CDF0', dim: '#9AA0D6', red: '#FF4F5E', green: '#3EE08F' };
  const F = 'IBM Plex Sans Arabic';
  const D = 43.87;
  const T = [0, 3.2, 7.7, 14.7, 20.0, 28.8, 33.3, 36.5, D];
  const P = [[0, 0], [620, 2050], [-380, 4150], [560, 6250], [-420, 8350], [520, 10450], [-300, 12550], [0, 14650]].map(([x, y]) => [px(x), px(y)]);
  const sfx = [];

  // ── أدوات ──
  const clamp = (u) => Math.max(0, Math.min(1, u));
  const io = (u) => { u = clamp(u); return u < 0.5 ? 16 * u ** 5 : 1 - (-2 * u + 2) ** 5 / 2; }; // quint in-out: انطلاق وهبوط ناعمين
  const io3 = (u) => { u = clamp(u); return u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2; };
  const out3 = (u) => 1 - (1 - clamp(u)) ** 3;
  const PRE = 0.5, POST = 0.62; // الطيران بين قسمين: بيبلش قبل الحد بنص ثانية
  const trav = (k, t) => (t - (T[k] - PRE)) / (PRE + POST);
  const sectionAt = (t) => { let s = 0; while (s < 7 && t >= T[s + 1]) s++; return s; };

  // ── الكاميرا: مسار واحد متصل ──
  const cam = (t) => {
    let x = P[0][0], y = P[0][1], dip = 0, rot = 0, drift = null;
    for (let k = 1; k < 8; k++) {
      const u = trav(k, t), e = io(u);
      x += (P[k][0] - P[k - 1][0]) * e;
      y += (P[k][1] - P[k - 1][1]) * e;
      if (u > 0 && u < 1) {
        dip += Math.sin(Math.PI * u) ** 2 * 0.14;
        rot += Math.sin(Math.PI * u) * 2.2 * (P[k][0] > P[k - 1][0] ? -1 : 1);
        drift = 0.035 * (1 - io3(u)); // الدفع البطيء بيرجع لصفر خلال الطيران
      }
    }
    if (drift == null) {
      const s = sectionAt(t);
      const hs = T[s] + (s ? POST : 0), he = T[s + 1] - (s < 7 ? PRE : 0);
      drift = s === 0 ? 0.11 * (1 - out3(t / 2.6)) - 0.0 : 0.035 * io3((t - hs) / (he - hs));
      if (s === 0) drift += 0.035 * io3((t - 0.6) / 2.1) * 0; // الغلاف: بيرجع لورا بدل ما يدفع
    }
    // هزّة الختم
    if (t > 25.0 && t < 25.8) { const a = Math.exp(-(t - 25.0) * 7); x += px(13) * a * Math.sin((t - 25) * 58); y += px(9) * a * Math.cos((t - 25) * 47); rot += 0.7 * a * Math.sin((t - 25) * 40); }
    return { x, y, zoom: 1 + drift - dip, rotation: rot };
  };

  // ── الشعاع (طبقة شاشة): جهته بتنقلب مع كل طيران، وبالآخر بيصير شعاع الشعار ──
  const SIDE = [1, -1, 1, -1, 1, -1, 1, 1];
  const LX = cx, LY = S.vh(40), LW = 788, LH = 252; // الشعار: صورة الكلمة 788×252 (من فريم الأصل بدقة 1080)
  const L0 = [LX - LW / 2, LY - LH / 2];
  const beamOf = (s) => s === 7
    ? { ax: L0[0] + 186, ay: L0[1] + 24, s: 1, len: 228, wid: 263, r0: 22, logo: 1 }
    : { ax: SIDE[s] > 0 ? px(112) : W - px(112), ay: s % 2 ? px(250) : px(300), s: SIDE[s], len: H * 1.3, wid: W * 1.05, r0: px(13), logo: 0 };
  const beam = (t) => {
    let b = { ...beamOf(0) };
    for (let k = 1; k < 8; k++) {
      const e = io(trav(k, t));
      if (e <= 0) break;
      const n = beamOf(k), o = b;
      b = {}; for (const key in n) b[key] = o[key] + (n[key] - o[key]) * e;
    }
    // تشغيل الشعاع بالبداية (رجفة لمبة)
    const fl = [[0.3, 0], [0.38, 0.85], [0.44, 0.15], [0.52, 1], [0.57, 0.45], [0.66, 1]];
    let on = 1;
    if (t < 0.66) { on = 0; for (let i = 0; i < fl.length - 1; i++) if (t >= fl[i][0] && t < fl[i + 1][0]) on = fl[i][1] + (fl[i + 1][1] - fl[i][1]) * ((t - fl[i][0]) / (fl[i + 1][0] - fl[i][0])); }
    b.on = on * (1 + 0.06 * Math.sin(t * 2.1) + 0.03 * Math.sin(t * 7.3));
    return b;
  };
  const conePath = (b, grow = 1) => {
    const { ax, ay, s, len, wid, r0 } = b;
    const L = len * grow, Wd = wid * grow;
    return `M${ax - s * r0},${ay} L${ax + s * r0},${ay} L${ax + s * Wd},${ay + L} L${ax - s * r0},${ay + L} Z`;
  };
  const beamLayer = S.custom({
    draw(ctx, t) {
      const b = beam(t);
      if (b.on <= 0.001) return;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      // هالة عريضة + الشعاع نفسه
      for (const [grow, a0, a1] of [[1.12, 0.07, 0.0], [1, 0.2, 0.025]]) {
        const g = ctx.createLinearGradient(b.ax, b.ay, b.ax + b.s * b.wid * 0.35, b.ay + b.len);
        const A0 = grow > 1 ? a0 * (1 - b.logo) : a0 + (0.34 - a0) * b.logo, A1 = grow > 1 ? 0 : a1 + (0.3 - a1) * b.logo;
        g.addColorStop(0, `rgba(79,190,255,${A0 * b.on})`);
        g.addColorStop(1, `rgba(60,140,255,${A1 * b.on})`);
        ctx.fillStyle = g;
        ctx.fill(new Path2D(conePath(b, grow)));
      }
      // مصدر الضو
      const rg = ctx.createRadialGradient(b.ax, b.ay, 0, b.ax, b.ay, px(90));
      rg.addColorStop(0, `rgba(120,225,255,${0.55 * b.on})`); rg.addColorStop(1, 'rgba(79,220,255,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(b.ax, b.ay, px(90), 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = C.cyan; ctx.globalAlpha = Math.min(1, 0.3 + b.on) * (1 - b.logo);
      ctx.beginPath(); ctx.arc(b.ax, b.ay, px(15), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  });

  // ── خلفية ثابتة (شاشة) ──
  const background = { layers: [
    S.rect({ x: cx, y: cy, w: W, h: H, fill: { linear: [[0, 0], [0, H]], stops: [[0, '#050827'], [0.5, '#0D1656'], [1, '#17238A']] } }),
    S.ellipse({ x: cx, y: H * 0.62, w: W * 1.6, h: H * 0.7, fill: { radial: { c: [cx, H * 0.62], r: W * 0.9 }, stops: [[0, 'rgba(40,70,200,0.35)'], [1, 'rgba(40,70,200,0)']] } }),
  ] };

  // ── نقش المثلثات (عالم، parallax أبطأ من الكاميرا) ──
  let tri = '';
  const cell = px(118);
  for (let gy = -px(1600); gy < px(16800); gy += cell) for (let gx = -px(1700); gx < px(2600); gx += cell) {
    const ox = ((Math.round(gy / cell) % 2) * cell) / 2, s = px(34);
    tri += `M${gx + ox},${gy} L${gx + ox},${gy + s} L${gx + ox + s},${gy + s} Z`;
  }
  const pattern = S.group({ x: (t) => cam(t).x * 0.42, y: (t) => cam(t).y * 0.42 }, [S.path({ d: tri, fill: 'rgba(130,160,255,0.045)' })]);

  // ── مساعدات النص ──
  const XR = px(440); // عمود يمين (محاذاة تحريرية مش كل شي بالنص)
  const txt = (o) => S.text({ family: F, weight: 700, fill: C.white, ...o });
  const label = (y, text, at, { x = XR, center = false } = {}) => S.group({}, [
    ...(center ? [S.rect({ x, y: y - px(40), w: px(46), h: px(5), radius: px(3), fill: C.cyan, scale: { at, from: [0, 1], to: [1, 1], spring: 'snappy' } })]
      : [0, 1].map((i) => S.rect({ x: x - px(4) - i * px(13), y, w: px(6), h: px(26), radius: px(2), fill: C.cyan, scale: { at: at + i * 0.05, from: [1, 0], to: [1, 1], spring: 'snappy' } }))),
    txt({ text, size: px(36), weight: 500, fill: C.muted, x: center ? x : x - px(36), y, anchor: center ? 'center' : 'start',
      reveal: { by: 'word', at: at + 0.06, mask: true, from: { y: px(40), opacity: 0 }, dur: 0.5, ease: 'ae:80:33', stagger: { each: 0.06 } } }),
  ]);
  const exitText = (at) => ({ by: 'word', at, to: { y: -px(70), opacity: 0, blur: 8 }, dur: 0.38, ease: 'quadIn', stagger: { each: 0.035 } });
  const sec = (k, layers) => S.group({ x: cx + P[k][0], y: cy + P[k][1] }, layers);
  const glass = (w, h, o = {}) => S.rect({ w, h, radius: px(30), fill: { linear: [[-w / 2, -h / 2], [w / 2, h / 2]], stops: [[0, 'rgba(70,100,230,0.32)'], [1, 'rgba(30,50,150,0.22)']] }, stroke: 'rgba(140,170,255,0.30)', strokeWidth: px(2), shadow: { color: 'rgba(0,0,30,0.35)', blur: 30, y: 12 }, ...o });
  const checkMark = (x, y, at) => S.group({ x, y, scale: { at, from: 0.4, to: 1, spring: 'playful' }, opacity: { kf: [[at - 0.01, 0], [at + 0.08, 1]] } }, [
    S.circle({ r: px(24), fill: 'rgba(79,220,255,0.12)', stroke: 'rgba(79,220,255,0.6)', strokeWidth: px(2.5) }),
    S.path({ d: `M${-px(10)},${px(1)} L${-px(3)},${px(8)} L${px(11)},${-px(8)}`, fill: null, stroke: C.cyan, strokeWidth: px(4), lineCap: 'round', lineJoin: 'round', trim: { at: at + 0.08, from: [0, 0], to: [0, 1], dur: 0.35, ease: 'ae:60:80' } }),
  ]);
  const iconBox = (x, y, icon, at, size = px(96)) => S.group({ x, y }, [
    S.rect({ w: size, h: size, radius: size * 0.26, fill: 'rgba(79,220,255,0.10)', stroke: 'rgba(79,220,255,0.45)', strokeWidth: px(2), scale: { at, from: 0.5, to: 1, spring: 'playful' }, opacity: { kf: [[at - 0.01, 0], [at + 0.1, 1]] } }),
    S.icon({ icon, size: size * 0.5, color: C.cyan, strokeWidth: 2, trim: { at: at + 0.1, from: [0, 0], to: [0, 1], dur: 0.6, ease: 'ae:50:80' } }),
  ]);

  // ════════ ١. الغلاف ════════
  // تقويم 30 يوم (نقاط) — هي نفسها بتصير حلقة الـ125 وأول خانات شبكة الـ113
  const ringR = px(300), ringC = [0, -px(40)];
  const GRID = { cols: 13, sp: px(62), top: -px(250) };
  const gridPos = (k) => { const r = Math.floor(k / GRID.cols), c = k % GRID.cols; return [(6 - c) * GRID.sp, GRID.top + r * GRID.sp]; };
  const calPos = (k) => { const r = Math.floor(k / 10), c = k % 10; return [XR - px(8) - c * px(74), px(430) + r * px(70)]; };
  const ringPos = (k) => { const a = -Math.PI / 2 + (k / 30) * Math.PI * 2; return [ringC[0] + Math.cos(a) * ringR, ringC[1] + Math.sin(a) * ringR]; };
  const c2 = (t) => 125 * out3((t - 3.7) / 2.4); // عداد 125
  const c3 = (t) => 113 * out3((t - 8.55) / 2.7); // عداد 113
  const world = (k, [x, y]) => [cx + P[k][0] + x, cy + P[k][1] + y];
  const dayAt = (k) => 1.55 + k * 0.026 + ((k * 7) % 5) * 0.012;
  const dayDots = Array.from({ length: 30 }, (_, k) => {
    const A = world(0, calPos(k)), B = world(1, ringPos(k)), G = world(2, gridPos(k));
    // كل نقطة بتطير بتأخير بسيط (مش كلهم سوا) — overlapping action
    const d1 = (k % 6) * 0.025, d2 = ((k * 5) % 7) * 0.02;
    const leg = (t, ta, tb, p, q) => { const e = io3((t - ta) / (tb - ta)); return p + (q - p) * e; };
    const pos = (t, i) => t < 5 ? leg(t, T[1] - 0.42 + d1, T[1] + 0.55 + d1, A[i], B[i]) : leg(t, T[2] - 0.4 + d2, T[2] + 0.6 + d2, B[i], G[i]);
    const rad = (t) => t < 5 ? px(9) + (px(12) - px(9)) * io3((t - T[1] + 0.4) / 0.9) : px(12) + (px(18) - px(12)) * io3((t - T[2] + 0.4) / 0.9);
    const lit = (t) => t < T[1] ? 0.55 : t < T[2] - 0.4 ? 0.3 + 0.7 * clamp(c2(t) / 125 * 30 - k) : 1;
    const ex = T[3] - 0.5 + (Math.floor(k / 13) + (k % 13)) * 0.008;
    return S.group({ x: (t) => pos(t, 0), y: (t) => pos(t, 1), scale: { at: dayAt(k), from: 0, to: 1, spring: 'playful' }, opacity: { kf: [[ex, 1, 'quadIn'], [ex + 0.3, 0]] } }, [
      S.circle({ r: px(40), scale: (t) => rad(t) / px(18), fill: { radial: { c: [0, 0], r: px(40) }, stops: [[0, 'rgba(79,220,255,0.35)'], [1, 'rgba(79,220,255,0)']] }, opacity: (t) => clamp(lit(t) * 1.4 - 0.4) * clamp((t - T[1] - 0.3) * 2) }),
      S.circle({ r: px(18), scale: (t) => rad(t) / px(18), fill: C.cyan, opacity: lit }),
    ]);
  });
  for (let k = 0; k < 30; k += 6) sfx.push({ kind: 'tick', at: dayAt(k), params: { pitch: 1 + k * 0.01 }, gain_db: -30 });

  const s1 = sec(0, [
    label(-px(220), 'تقرير فريق التحقق', 0.55),
    txt({ text: 'شهر أيلول', size: px(124), x: XR, y: -px(95), anchor: 'start',
      reveal: { by: 'word', at: 0.72, mask: true, from: { y: px(150), opacity: 0 }, dur: 0.7, ease: 'ae:85:33', stagger: { each: 0.11 } }, exit: exitText(T[1] - 0.42) }),
    txt({ text: 'بالأرقام', size: px(236), fill: C.cyan, x: XR + px(6), y: px(110), anchor: 'start', glow: { color: C.cyan, radius: px(34), strength: 0.55 },
      reveal: { by: 'all', at: 0.98, mask: true, from: { y: px(260), opacity: 0 }, dur: 0.85, ease: 'ae:90:30' }, exit: exitText(T[1] - 0.38) }),
    txt({ text: 'من 1 حتى 30 أيلول 2026', size: px(40), weight: 500, fill: C.dim, x: XR, y: px(285), anchor: 'start',
      reveal: { by: 'word', at: 1.3, from: { y: px(24), opacity: 0, blur: 6 }, dur: 0.45, ease: 'ae:70:33', stagger: { each: 0.06 } }, exit: exitText(T[1] - 0.45) }),
  ]);
  sfx.push({ kind: 'swell', at: 0.3, params: { dur: 0.7 }, gain_db: -27 }, { kind: 'swish', at: 0.98, gain_db: -26 });

  // ════════ ٢. 125 ════════
  const s2 = sec(1, [
    // حلقة متقطعة بتلف ببطء + توهج داخلي
    S.circle({ r: ringR + px(62), fill: null, stroke: 'rgba(79,220,255,0.22)', strokeWidth: px(2), dash: [px(4), px(14)], rotation: (t) => t * 8, x: ringC[0], y: ringC[1],
      scale: { at: 3.45, from: 0.7, to: 1, spring: 'gentle' }, opacity: { kf: [[3.45, 0], [3.9, 1], [T[2] - 0.3, 1], [T[2] + 0.1, 0]] } }),
    S.circle({ r: ringR * 0.92, x: ringC[0], y: ringC[1], fill: { radial: { c: [0, 0], r: ringR }, stops: [[0, 'rgba(60,120,255,0.28)'], [1, 'rgba(60,120,255,0)']] },
      opacity: { kf: [[3.5, 0], [4.2, 1], [T[2] - 0.3, 1], [T[2] + 0.1, 0]] } }),
    label(-px(560), 'خلال 30 يومًا', 3.4, { x: 0, center: true }),
    txt({ text: { expr: (t) => String(Math.round(c2(t))) }, size: px(250), x: ringC[0], y: ringC[1] + px(10), glow: { color: '#7FE6FF', radius: px(30), strength: 0.45 },
      opacity: { kf: [[3.55, 0], [3.75, 1]] }, scale: { at: 3.55, from: 0.8, to: 1, spring: 'default' }, exit: { by: 'all', at: T[2] - 0.45, to: { scale: 1.3, opacity: 0, blur: 14 }, dur: 0.4, ease: 'quadIn' } }),
    txt({ text: 'شائعةً رصدها الفريق', size: px(70), x: 0, y: px(390),
      reveal: { by: 'word', at: 5.0, mask: true, from: { y: px(90), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.1 } }, exit: exitText(T[2] - 0.45) }),
    txt({ text: 'بمعدّل يتجاوز 4 شائعات يوميًا', size: px(36), weight: 500, fill: C.muted, x: 0, y: px(500),
      box: { fill: 'rgba(25,45,140,0.55)', stroke: 'rgba(79,220,255,0.38)', strokeWidth: px(2), radius: px(40), pad: [px(34), px(16)], reveal: { at: 5.45, spring: 'snappy', from: 'center' } },
      reveal: { by: 'word', at: 5.55, from: { opacity: 0, y: px(14) }, dur: 0.35, ease: 'ae:70:33', stagger: { each: 0.05 } }, exit: exitText(T[2] - 0.5) }),
  ]);
  sfx.push({ kind: 'whoosh', at: T[1] + 0.05, align: 'peak', params: { dur: 0.9, brightness: 0.6 }, gain_db: -24 }, { kind: 'count', at: 3.75, gain_db: -30 }, { kind: 'pop', at: 5.45, params: { pitch: 0.9 }, gain_db: -28 });

  // ════════ ٣. 113 ════════
  const gridDots = [];
  for (let k = 30; k < 125; k++) {
    const [x, y] = gridPos(k);
    const r = Math.floor(k / GRID.cols), c = k % GRID.cols;
    const at = 7.95 + (r + c) * 0.03;
    const hollow = k >= 113;
    const exitAt = T[3] - 0.5 + (r + c) * 0.008;
    gridDots.push(S.group({ x, y, scale: { kf: [[exitAt, 1, 'quadIn'], [exitAt + 0.3, 0]] } }, [S.group({ scale: { at, from: 0, to: 1, spring: 'playful' } }, hollow
      ? [S.circle({ r: px(17), fill: null, stroke: 'rgba(201,205,240,0.75)', strokeWidth: px(2.5), dash: [px(4), px(5)], rotation: (t) => t * 30 })]
      : [
        S.circle({ r: px(17), fill: null, stroke: 'rgba(79,220,255,0.35)', strokeWidth: px(2) }),
        S.circle({ r: px(18), fill: C.cyan, opacity: (t) => clamp(c3(t) - k), scale: (t) => 0.6 + 0.4 * clamp(c3(t) - k) }),
      ])]));
  }
  const s3 = sec(2, [
    label(-px(700), 'وماذا فعلنا بها؟', 7.85),
    txt({ text: { expr: (t) => String(Math.round(c3(t))) }, size: px(240), fill: C.cyan, x: XR, y: -px(500), anchor: 'start', glow: { color: C.cyan, radius: px(30), strength: 0.5 },
      opacity: { kf: [[8.0, 0], [8.2, 1]] }, scale: { at: 8.0, from: 0.82, to: 1, spring: 'default' }, origin: [XR, 0], exit: exitText(T[3] - 0.45) }),
    txt({ text: 'شائعةً\nتمّت معالجتها', size: px(58), lineHeight: 1.25, x: XR - px(450), y: -px(500), anchor: 'start', align: 'start',
      reveal: { by: 'line', at: 8.35, mask: true, from: { y: px(70), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.12 } }, exit: exitText(T[3] - 0.48) }),
    ...gridDots,
    // الـ12 بلا مصادر: هالة بتنبض بعد ما يخلص العد
    S.rect({ x: (gridPos(117)[0] + gridPos(124)[0]) / 2, y: gridPos(117)[1], w: px(8 * 62 + 30), h: px(62), radius: px(31), fill: 'rgba(201,205,240,0.06)', stroke: 'rgba(201,205,240,0.35)', strokeWidth: px(2), dash: [px(8), px(8)],
      scale: { at: 11.25, from: [0, 1], to: [1, 1], spring: 'snappy' }, opacity: { kf: [[11.24, 0], [11.3, 1], [T[3] - 0.5, 1], [T[3] - 0.25, 0]] } }),
    txt({ text: '● 113 عولجت', size: px(34), weight: 600, x: px(330), y: px(450), anchor: 'start', words: { 0: { color: C.cyan }, 1: { color: C.cyan } },
      box: { fill: 'rgba(25,45,140,0.6)', stroke: 'rgba(79,220,255,0.35)', strokeWidth: px(2), radius: px(36), pad: [px(28), px(14)], reveal: { at: 11.4, spring: 'snappy', from: 'start' } },
      reveal: { by: 'word', at: 11.48, from: { opacity: 0, x: px(20) }, dur: 0.3, ease: 'ae:70:33', stagger: { each: 0.05 } }, exit: exitText(T[3] - 0.5) }),
    txt({ text: '◌ 12 بلا مصادر موثوقة', size: px(34), weight: 500, fill: C.muted, x: -px(330), y: px(450), anchor: 'end',
      box: { fill: 'rgba(25,45,140,0.45)', stroke: 'rgba(201,205,240,0.28)', strokeWidth: px(2), radius: px(36), pad: [px(28), px(14)], reveal: { at: 11.6, spring: 'snappy', from: 'start' } },
      reveal: { by: 'word', at: 11.68, from: { opacity: 0, x: px(20) }, dur: 0.3, ease: 'ae:70:33', stagger: { each: 0.05 } }, exit: exitText(T[3] - 0.52) }),
    txt({ text: 'نسبة المعالجة تتجاوز 90%', size: px(44), weight: 500, fill: C.muted, x: 0, y: px(570), words: { 3: { color: C.cyan } },
      reveal: { by: 'word', at: 12.05, mask: true, from: { y: px(50), opacity: 0 }, dur: 0.5, ease: 'ae:80:33', stagger: { each: 0.08 } }, exit: exitText(T[3] - 0.5) }),
    S.rect({ x: 0, y: px(640), w: px(640), h: px(10), radius: px(5), fill: 'rgba(140,170,255,0.18)', scale: { kf: [[12.2, [0, 1], 'ae:80:33'], [12.6, [1, 1]], [T[3] - 0.5, [1, 1], 'quadIn'], [T[3] - 0.2, [0, 1]]] } }),
    S.rect({ x: px(32), y: px(640), w: px(576), h: px(10), radius: px(5), fill: { linear: [[px(288), 0], [-px(288), 0]], stops: [[0, '#30D1FF'], [1, '#0373FF']] }, origin: [px(288), 0], glow: { color: C.cyan, radius: px(12), strength: 0.5 },
      scale: { kf: [[12.5, [0, 1], 'ae:60:85'], [13.6, [1, 1]], [T[3] - 0.5, [1, 1], 'quadIn'], [T[3] - 0.25, [0, 1]]] } }),
  ]);
  sfx.push({ kind: 'whoosh', at: T[2] + 0.05, align: 'peak', params: { dur: 0.9, brightness: 0.7 }, gain_db: -24 }, { kind: 'count', at: 8.6, gain_db: -30 },
    { kind: 'click', at: 11.4, gain_db: -28 }, { kind: 'click', at: 11.6, params: { pitch: 0.8 }, gain_db: -29 }, { kind: 'swish', at: 12.5, params: { dur: 0.6 }, gain_db: -28 });

  // ════════ ٤. بالأدلّة ════════
  const cards = [
    { x: px(215), y: -px(150), icon: 'lucide:scan-search', text: 'بحث عكسي\nعن الصور' },
    { x: -px(215), y: -px(150), icon: 'lucide:film', text: 'تفكيك المقاطع\nإلى لقطات' },
    { x: px(215), y: px(205), icon: 'lucide:audio-lines', text: 'تدقيق صوتي\nللمقاطع' },
    { x: -px(215), y: px(205), icon: 'lucide:map-pin', text: 'مراسلون\nميدانيون' },
  ];
  const scanY = (t) => -px(360) + (px(400) + px(360)) * io3((t - 17.0) / 1.25);
  const cardLayers = cards.map((cd, i) => {
    const at = 15.55 + i * 0.16 + (i === 2 ? 0.04 : 0);
    const exitAt = T[4] - 0.55 + i * 0.04;
    const hit = (t) => Math.max(0, 1 - Math.abs(scanY(t) - cd.y) / px(170)) * (t > 16.9 && t < 18.4 ? 1 : 0);
    return S.group({ x: cd.x, y: { at, from: cd.y + px(90), to: cd.y, spring: 'default' }, scale: { kf: [[exitAt, 1, 'quadIn'], [exitAt + 0.32, 0.85]] },
      opacity: { kf: [[at - 0.01, 0], [at + 0.12, 1], [exitAt, 1], [exitAt + 0.32, 0]] } }, [S.group({ scale: { at, from: [0.15, 0.8], to: [1, 1], spring: { stiffness: 210, damping: 17, mass: 1 } } }, [
      glass(px(400), px(320)),
      S.rect({ w: px(400), h: px(320), radius: px(30), fill: 'rgba(79,220,255,0.10)', stroke: 'rgba(79,220,255,0.7)', strokeWidth: px(2), opacity: hit }),
      S.group({ y: -px(62), scale: (t) => 1 + 0.1 * hit(t) }, [iconBox(0, 0, cd.icon, at + 0.25)]),
      txt({ text: cd.text, size: px(40), lineHeight: 1.3, y: px(72), reveal: { by: 'line', at: at + 0.3, mask: true, from: { y: px(40), opacity: 0 }, dur: 0.45, ease: 'ae:80:33', stagger: { each: 0.08 } } }),
    ])]);
  });
  const s4 = sec(3, [
    label(-px(640), 'كيف نتحقّق؟', 14.9),
    txt({ text: 'بالأدلّة، لا بالرأي', size: px(112), x: XR, y: -px(500), anchor: 'start', words: { 0: { color: C.cyan } },
      reveal: { by: 'word', at: 15.08, mask: true, from: { y: px(130), opacity: 0 }, dur: 0.65, ease: 'ae:85:33', stagger: { each: 0.14 } }, exit: exitText(T[4] - 0.45) }),
    ...cardLayers,
    // خط المسح الضوئي
    S.rect({ x: 0, y: scanY, w: px(880), h: px(5), radius: px(3), fill: C.cyan, glow: { color: C.cyan, radius: px(22), strength: 0.9 }, opacity: (t) => (t > 16.95 && t < 18.3 ? Math.min(1, (t - 16.95) * 6, (18.3 - t) * 6) : 0) }),
  ]);
  sfx.push({ kind: 'whoosh', at: T[3] + 0.05, align: 'peak', params: { dur: 0.9, brightness: 0.8 }, gain_db: -24 });
  cards.forEach((_, i) => sfx.push({ kind: 'pop', at: 15.6 + i * 0.16, params: { pitch: 0.75 + i * 0.08 }, gain_db: -29 }));
  sfx.push({ kind: 'scribble', at: 17.0, params: { dur: 1.2 }, gain_db: -31 });

  // ════════ ٥. مثال من ملفّات الشهر ════════
  const PH = { x: -px(290), y: -px(255), w: px(290), h: px(330) };
  const wave = Array.from({ length: 22 }, (_, i) => S.rect({ x: PH.x - PH.w / 2 + px(18) + i * px(11.5), y: PH.y + PH.h / 2 - px(26), w: px(6), h: (t) => px(8) + px(30) * Math.abs(Math.sin(t * (5 + (i % 5)) + i * 1.7)) * (0.5 + 0.5 * Math.sin(i * 0.9 + t * 1.3)) ** 2, radius: px(2), fill: C.red, opacity: { kf: [[21.4, 0], [21.7, 0.95]] }, origin: [0, px(0)] }));
  const corner = (sx, sy, at) => S.path({ d: `M${PH.x + sx * (PH.w / 2 + px(12))},${PH.y + sy * (PH.h / 2 + px(12)) - sy * px(40)} L${PH.x + sx * (PH.w / 2 + px(12))},${PH.y + sy * (PH.h / 2 + px(12))} L${PH.x + sx * (PH.w / 2 + px(12)) - sx * px(40)},${PH.y + sy * (PH.h / 2 + px(12))}`, fill: null, stroke: C.cyan, strokeWidth: px(4), lineCap: 'round', trim: { at, from: [0.5, 0.5], to: [0, 1], dur: 0.4, ease: 'ae:70:80' } });
  const STAMP = 25.0;
  const row = (y, icon, text, at) => S.group({ y, x: { at, from: px(160), to: 0, spring: 'default' }, opacity: { kf: [[at - 0.01, 0], [at + 0.15, 1], [T[5] - 0.5, 1], [T[5] - 0.2, 0]] } }, [
    glass(px(940), px(112), { radius: px(26) }),
    iconBox(px(405), 0, icon, at + 0.1, px(66)),
    txt({ text, size: px(38), x: px(352), anchor: 'start', reveal: { by: 'word', at: at + 0.12, from: { opacity: 0, x: px(20) }, dur: 0.35, ease: 'ae:70:33', stagger: { each: 0.05 } } }),
    checkMark(-px(410), 0, at + 0.55),
  ]);
  const s5 = sec(4, [
    label(-px(560), 'مثال من ملفّات الشهر', 20.15),
    S.group({ y: { at: 20.35, from: px(120), to: 0, spring: 'default' }, opacity: { kf: [[20.34, 0], [20.5, 1], [T[5] - 0.45, 1], [T[5] - 0.15, 0]] }, scale: { at: 20.35, from: 0.94, to: 1, spring: 'default' } }, [
      glass(px(940), px(440), { y: -px(255) }),
      // الصورة مع زووم بطيء، خط مسح، موجة صوت حمرا، زوايا
      S.group({ mask: S.rect({ x: PH.x, y: PH.y, w: PH.w, h: PH.h, radius: px(18) }), isolate: true }, [
        S.image({ src: 'assets/azaz-clip.png', x: PH.x, y: PH.y, w: PH.w, h: PH.h, fit: 'cover', scale: { kf: [[20.4, 1.0], [D, 1.18]] } }),
        S.rect({ x: PH.x, y: (t) => PH.y - PH.h / 2 + ((t * 0.55) % 1) * PH.h, w: PH.w, h: px(3), fill: 'rgba(79,220,255,0.8)', glow: { color: C.cyan, radius: px(14), strength: 0.8 }, opacity: (t) => (t > 21.0 && t < STAMP ? 1 : 0) }),
        S.rect({ x: PH.x, y: PH.y, w: PH.w, h: PH.h, fill: C.red, blend: 'multiply', opacity: { kf: [[STAMP - 0.01, 0], [STAMP + 0.05, 0.75, 'quadOut'], [STAMP + 0.8, 0.35]] } }),
        ...wave,
      ]),
      corner(-1, -1, 20.9), corner(1, -1, 20.95), corner(-1, 1, 21.0), corner(1, 1, 21.05),
      txt({ text: '● ادّعاء متداول', size: px(28), weight: 600, fill: '#FFC2C8', x: px(420), y: -px(415), anchor: 'start', words: { 0: { color: C.red } },
        box: { fill: 'rgba(255,79,94,0.14)', stroke: 'rgba(255,79,94,0.5)', strokeWidth: px(2), radius: px(30), pad: [px(22), px(10)], reveal: { at: 20.8, spring: 'snappy', from: 'start' } },
        reveal: { by: 'word', at: 20.86, from: { opacity: 0 }, dur: 0.25, ease: 'linear', stagger: { each: 0.05 } } }),
      txt({ text: 'مقطع فيديو يوثّق\nاحتجاجات في مدينة أعزاز', size: px(50), lineHeight: 1.36, x: px(420), y: -px(285), anchor: 'start', align: 'start',
        reveal: { by: 'line', at: 21.05, mask: true, from: { y: px(60), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.14 } } }),
      txt({ text: '● اكتمل التحقّق', size: px(28), weight: 500, fill: C.muted, x: px(420), y: -px(110), anchor: 'start', words: { 0: { color: C.green } },
        reveal: { by: 'word', at: 26.1, from: { opacity: 0, x: px(18) }, dur: 0.35, ease: 'ae:70:33', stagger: { each: 0.06 } } }),
    ]),
    row(px(70), 'lucide:map-pin', 'المقطع مصوَّر في معرّة النعمان', 22.2),
    row(px(200), 'lucide:audio-lines', 'الهتافات مركّبة على الصوت الأصلي', 23.25),
    // الختم: بينزل من فوق الكاميرا تقريباً
    S.group({ x: PH.x - px(10), y: PH.y + px(10), rotation: { at: STAMP, from: -24, to: -9, spring: 'heavy' },
      scale: { at: STAMP, from: 2.6, to: 1, spring: { stiffness: 380, damping: 22, mass: 1 } }, opacity: { kf: [[STAMP - 0.01, 0], [STAMP + 0.05, 1], [T[5] - 0.45, 1], [T[5] - 0.15, 0]] } }, [
      S.rect({ w: px(330), h: px(150), radius: px(22), fill: 'rgba(255,79,94,0.12)', stroke: C.red, strokeWidth: px(9), glow: { color: C.red, radius: px(20), strength: 0.5 } }),
      txt({ text: 'مضلّل', size: px(118), fill: C.red, y: px(4) }),
    ]),
    txt({ text: 'صوتٌ مفبرك على مشهد من مكان وسياق مختلفين', size: px(36), weight: 500, fill: C.muted, x: 0, y: px(335),
      reveal: { by: 'word', at: 25.65, from: { opacity: 0, y: px(20), blur: 6 }, dur: 0.45, ease: 'ae:70:33', stagger: { each: 0.06 } }, exit: exitText(T[5] - 0.5) }),
  ]);
  sfx.push({ kind: 'whoosh', at: T[4] + 0.05, align: 'peak', params: { dur: 0.9, brightness: 0.7 }, gain_db: -24 }, { kind: 'shutter', at: 20.9, gain_db: -29 },
    { kind: 'swish', at: 22.2, gain_db: -28 }, { kind: 'tick', at: 22.75, gain_db: -28 }, { kind: 'swish', at: 23.25, gain_db: -28 }, { kind: 'tick', at: 23.8, gain_db: -28 },
    { kind: 'impact', at: STAMP, params: { weight: 0.6 }, gain_db: -21 }, { kind: 'chime', at: 26.1, gain_db: -29 });

  // ════════ ٦. حملتين ════════
  const camp = (y, num, text, at) => S.group({ y, x: { at, from: px(180), to: 0, spring: 'default' }, opacity: { kf: [[at - 0.01, 0], [at + 0.15, 1], [T[6] - 0.5, 1], [T[6] - 0.2, 0]] } }, [
    glass(px(940), px(172)),
    txt({ text: num, family: 'IBM Plex Sans Arabic', size: px(72), fill: C.cyan, x: px(392), y: px(4), glow: { color: C.cyan, radius: px(18), strength: 0.4 },
      reveal: { by: 'all', at: at + 0.1, mask: true, from: { y: px(70), opacity: 0 }, dur: 0.45, ease: 'ae:85:33' } }),
    S.rect({ x: px(325), w: px(2), h: px(100), fill: 'rgba(140,170,255,0.3)', scale: { at: at + 0.2, from: [1, 0], to: [1, 1], spring: 'snappy' } }),
    txt({ text, size: px(40), lineHeight: 1.36, x: px(295), anchor: 'start', align: 'start', reveal: { by: 'line', at: at + 0.18, mask: true, from: { y: px(40), opacity: 0 }, dur: 0.45, ease: 'ae:80:33', stagger: { each: 0.1 } } }),
    checkMark(-px(410), 0, at + 0.6),
  ]);
  const s6 = sec(5, [
    label(-px(520), 'أكثر من شائعة عابرة', 29.0),
    txt({ text: 'تفنيد حملتَي تضليل', size: px(112), x: XR, y: -px(375), anchor: 'start', words: { 1: { color: C.cyan } },
      reveal: { by: 'word', at: 29.18, mask: true, from: { y: px(130), opacity: 0 }, dur: 0.65, ease: 'ae:85:33', stagger: { each: 0.13 } }, exit: exitText(T[6] - 0.45) }),
    camp(-px(120), '01', 'إعادة تدوير مشاهد قديمة\nفي سياق الاحتجاجات', 29.95),
    camp(px(85), '02', 'ادّعاءات عن مقاتلين\nسوريين في اليمن', 30.35),
    txt({ text: 'العدد المؤكَّد خلال فترة التقرير', size: px(32), weight: 500, fill: C.dim, x: 0, y: px(250),
      reveal: { by: 'word', at: 31.2, from: { opacity: 0, y: px(16) }, dur: 0.4, ease: 'ae:70:33', stagger: { each: 0.06 } }, exit: exitText(T[6] - 0.5) }),
  ]);
  sfx.push({ kind: 'whoosh', at: T[5] + 0.05, align: 'peak', params: { dur: 0.9, brightness: 0.75 }, gain_db: -24 }, { kind: 'swish', at: 29.95, gain_db: -28 }, { kind: 'swish', at: 30.35, params: { pitch: 1.1 }, gain_db: -28 }, { kind: 'tick', at: 30.55, gain_db: -28 }, { kind: 'tick', at: 30.95, gain_db: -28 });

  // ════════ ٧. الخلاصة ════════
  const s7 = sec(6, [
    label(-px(330), 'الخلاصة', 33.45, { x: 0, center: true }),
    txt({ text: 'أداءٌ مستقرّ', size: px(156), x: 0, y: -px(170),
      reveal: { by: 'word', at: 33.6, mask: true, from: { y: px(180), opacity: 0 }, dur: 0.7, ease: 'ae:85:33', stagger: { each: 0.14 } }, exit: exitText(T[7] - 0.45) }),
    txt({ text: 'في مواجهة التضليل', size: px(108), x: 0, y: px(10), words: { 1: { color: C.cyan }, 2: { color: C.cyan } }, glow: { color: C.cyan, radius: px(20), strength: 0.25 },
      reveal: { by: 'word', at: 33.92, mask: true, from: { y: px(130), opacity: 0 }, dur: 0.65, ease: 'ae:85:33', stagger: { each: 0.12 } }, exit: exitText(T[7] - 0.42) }),
    S.rect({ y: px(130), w: px(460), h: px(8), radius: px(4), fill: { linear: [[-px(230), 0], [px(230), 0]], stops: [[0, '#0373FF'], [1, '#30D1FF']] }, glow: { color: C.cyan, radius: px(14), strength: 0.5 },
      scale: { kf: [[34.35, [0, 1], 'ae:70:85'], [34.95, [1, 1]], [T[7] - 0.45, [1, 1], 'quadIn'], [T[7] - 0.15, [0, 1]]] } }),
    txt({ text: 'ونواصل توسيع الرصد وتسريع الاستجابة', size: px(40), weight: 500, fill: C.muted, x: 0, y: px(225),
      reveal: { by: 'word', at: 34.6, from: { opacity: 0, y: px(18), blur: 6 }, dur: 0.45, ease: 'ae:70:33', stagger: { each: 0.06 } }, exit: exitText(T[7] - 0.48) }),
  ]);
  sfx.push({ kind: 'whoosh', at: T[6] + 0.05, align: 'peak', params: { dur: 0.9, brightness: 0.65 }, gain_db: -24 }, { kind: 'swell', at: 33.6, params: { dur: 0.8 }, gain_db: -28 });

  // ════════ ٨. الشعار (طبقة شاشة، الشعاع بيصير شعاع الشعار) ════════
  const LT = 36.75;
  const wipe = (t) => io3((t - LT) / 0.75); // الكلمة بتنكشف من اليمين لليسار
  const logo = S.group({}, [
    S.group({ isolate: true, mask: S.rect({ x: (t) => L0[0] + LW - (LW + px(40)) * wipe(t) / 2, y: LY, w: (t) => (LW + px(40)) * wipe(t), h: LH + px(40) }) }, [
      S.image({ src: 'assets/logo-word.png', x: LX, y: LY, w: LW, h: LH, scale: { at: LT, from: 1.06, to: 1, spring: 'heavy' } }),
    ]),
    // الحروف اللي تحت الشعاع بتصير سيان (نفس فكرة الشعار)
    S.group({ isolate: true, mask: S.path({ d: (t) => conePath(beam(t)) }), opacity: { kf: [[LT + 0.3, 0], [LT + 0.7, 1]] } }, [
      S.image({ src: 'assets/logo-word-cyan.png', x: LX, y: LY, w: LW, h: LH, scale: { at: LT, from: 1.06, to: 1, spring: 'heavy' } }),
    ]),
    txt({ text: 'عينك على الحقيقة', size: px(80), x: LX, y: LY + px(250), words: { 2: { color: C.cyan } },
      reveal: { by: 'word', at: 38.1, mask: true, from: { y: px(100), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.12 } } }),
    txt({ text: 'تابعوا كشّاف', size: px(32), weight: 500, fill: C.dim, x: LX, y: LY + px(345),
      reveal: { by: 'word', at: 38.75, from: { opacity: 0, y: px(14) }, dur: 0.4, ease: 'ae:70:33', stagger: { each: 0.06 } } }),
    S.text({ text: '@kashaffacts', family: 'Inter', weight: 700, size: px(42), fill: C.white, x: LX, y: LY + px(440),
      box: { fill: 'rgba(25,45,140,0.55)', stroke: 'rgba(79,220,255,0.7)', strokeWidth: px(2.5), radius: px(44), pad: [px(40), px(18)], glow: { color: C.cyan, radius: px(18), strength: 0.35 }, reveal: { at: 39.0, spring: 'snappy', from: 'center' } },
      reveal: { by: 'char', at: 39.1, from: { opacity: 0, y: px(16) }, dur: 0.3, ease: 'ae:70:33', stagger: { each: 0.022 } } }),
  ]);
  sfx.push({ kind: 'whoosh', at: T[7] + 0.05, align: 'peak', params: { dur: 1.0, brightness: 0.6 }, gain_db: -24 }, { kind: 'shutter', at: LT + 0.05, gain_db: -29 }, { kind: 'chime', at: LT + 0.65, gain_db: -26 }, { kind: 'pop', at: 39.05, params: { pitch: 1.0 }, gain_db: -29 });

  // ── HUD: شعار صغير + نقاط التقدم ──
  const act = (t) => { let a = 0; for (let k = 1; k < 8; k++) a += io3(trav(k, t)); return a; };
  const hudOut = { kf: [[0.3, 0], [0.7, 1], [T[7] - 0.4, 1], [T[7] + 0.1, 0]] };
  const dotW = (i, t) => px(10) + px(34) * Math.max(0, 1 - Math.abs(act(t) - i));
  const dotX = (i, t) => { let x = px(72); for (let j = 0; j < i; j++) x += dotW(j, t) + px(10); return x + dotW(i, t) / 2; };
  const hud = S.group({ opacity: hudOut, y: { at: 0.3, from: -px(30), to: 0, spring: 'default' } }, [
    S.image({ src: 'assets/kashaf_logo.png', x: W - px(72) - px(95), y: px(96), w: px(190), h: px(77) }),
    ...Array.from({ length: 7 }, (_, i) => S.rect({ x: (t) => dotX(i, t), y: px(96), w: (t) => dotW(i, t), h: px(10), radius: px(5), fill: (t) => (Math.abs(act(t) - i) < 0.5 ? C.cyan : 'rgba(150,170,255,0.45)') })),
  ]);

  // غبار بالضو (مستمر، حياة بالكادر)
  const dust = S.particles({ count: 70, rate: 7, start: -10, loop: true, seed: 4, emitter: { x: cx, y: cy, w: W, h: H }, life: [6, 10], angle: [-100, -80], speed: [6, 22], size: [px(2), px(5)], color: ['rgba(150,225,255,0.55)', 'rgba(200,235,255,0.4)'], turbulence: { amp: px(30), freq: 0.25 } });

  return {
    duration: D,
    background,
    audio: { auto: false, music: { src: 'assets/music.wav', gain_db: 0, fade_out: 0.6 }, sfx, master: { lufs: -16, ceiling_db: -1.5 } },
    post: { grain: { amount: 0.03, size: 1.2 }, bloom: { strength: 0.35, threshold: 0.72, radius: 0.6 }, vignette: { strength: 0.3, softness: 0.6 } },
    scenes: [{
      duration: D,
      camera: { x: (t) => cam(t).x, y: (t) => cam(t).y, zoom: (t) => cam(t).zoom, rotation: (t) => cam(t).rotation },
      layers: [pattern, s1, s2, s3, s4, s5, s6, s7, ...dayDots],
    }],
    overlay: [beamLayer, dust, logo, hud],
  };
};
