// سياق التأليف (S): كل شي بيحتاجه كاتب المشهد بمكان واحد.
// المشهد بينكتب كـ: export default async (S) => ({ scenes: [...] })

import * as A from './anim.js';
import * as shapes from './shapes.js';
import { textFx } from './text-fx.js';
import { captionLayers, groupPhrases } from './captions.js';
import * as G from './geo.js';

export const ASPECTS = {
  '9:16': [1080, 1920], '4:5': [1080, 1350], '1:1': [1080, 1080], '16:9': [1920, 1080], '21:9': [2520, 1080], '2:3': [1080, 1620],
};

// مناطق آمنة لكل منصة (بالنسبة لـ 1080 عرض): الأماكن اللي بتغطيها واجهة التطبيق
const SAFE = {
  '9:16': { top: 0.11, bottom: 0.2, left: 0.06, right: 0.12 }, // ريلز/تيك توك: أزرار يمين، كابشن تحت
  '4:5': { top: 0.06, bottom: 0.08, left: 0.06, right: 0.06 },
  '1:1': { top: 0.06, bottom: 0.06, left: 0.06, right: 0.06 },
  '16:9': { top: 0.07, bottom: 0.1, left: 0.05, right: 0.05 },
};

export function createStudio({ aspect = '9:16', fps = 30, brand = {}, project = '', video = '', scale = 1 } = {}) {
  const [bw, bh] = ASPECTS[aspect] ?? aspect.split('x').map(Number);
  const W = Math.round(bw * scale), H = Math.round(bh * scale);
  const u = W / 1080; // وحدة مرجعية: كل القيم مكتوبة كأن العرض 1080
  const sf = SAFE[aspect] ?? SAFE['1:1'];
  const safe = { top: sf.top * H, bottom: H - sf.bottom * H, left: sf.left * W, right: W - sf.right * W };
  safe.w = safe.right - safe.left;
  safe.h = safe.bottom - safe.top;
  safe.cx = (safe.left + safe.right) / 2;
  safe.cy = (safe.top + safe.bottom) / 2;

  const colors = brand.colors ?? {};
  const fonts = brand.fonts ?? {};
  const motion = brand.motion ?? {};

  const S = {
    W, H, aspect, fps, scale, u,
    vertical: H > W, landscape: W > H, square: W === H,
    cx: W / 2, cy: H / 2,
    vw: (n) => (n / 100) * W, vh: (n) => (n / 100) * H, vmin: (n) => (n / 100) * Math.min(W, H), vmax: (n) => (n / 100) * Math.max(W, H),
    px: (n) => n * u, // قيمة مصممة على عرض 1080 → المقاس الحالي
    safe,
    // اختيار قيمة حسب المقاس: S.pick({ '9:16': 140, '16:9': 110, default: 120 })
    pick: (m) => m[aspect] ?? (H > W ? m.vertical : W > H ? m.landscape : m.square) ?? m.default,

    brand, colors, fonts, motion,
    color: (k, fallback = '#fff') => colors[k] ?? fallback,
    font: (role = 'display') => fonts[role]?.family ?? fonts.display?.family ?? 'IBM Plex Sans Arabic',
    weight: (role = 'display') => fonts[role]?.weight ?? 700,
    // شخصية الحركة من الهوية: S.spring('enter') → preset مناسب للبراند
    spring: (role = 'default') => motion.springs?.[role] ?? { enter: 'default', ui: 'snappy', hero: 'heavy', fun: 'playful', bg: 'gentle' }[role] ?? role,

    asset: (p) => (p.startsWith('/') || p.startsWith('http') ? p : `/${project}/${p}`),
    video, project,

    ...A,
    shapes,
    fx: textFx,

    // إيقاع: S.beat(n) = وقت الـ beat رقم n
    bpm: brand.audio?.bpm ?? 120,
    beatOffset: 0,
    beat(n) { return S.beatOffset + (n * 60) / S.bpm; },
    bar(n, beatsPerBar = 4) { return S.beat(n * beatsPerBar); },
    snap(t) { const b = 60 / S.bpm; return S.beatOffset + Math.round((t - S.beatOffset) / b) * b; },

    // موسيقى محللة: const m = await S.music('assets/song.beats.json') → S.beat/S.snap بيمشوا على الأغنية
    async music(p) {
      const m = await (await fetch(S.asset(p))).json();
      S.bpm = m.bpm; S.beatOffset = m.bars?.[0] ?? m.beats?.[0] ?? 0; S.beats = m.beats; S.bars = m.bars; S.drops = m.drops;
      S.beat = (n) => m.beats[n] ?? S.beatOffset + (n * 60) / S.bpm;
      S.snap = (t) => m.beats.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a), m.beats[0] ?? t);
      return m;
    },
    // كابشن متزامن مع تعليق صوتي
    async captions(p, o = {}) {
      const words = Array.isArray(p) ? p : await (await fetch(S.asset(p))).json();
      return captionLayers(S, words, o);
    },
    groupPhrases,

    // عدّاد أرقام: S.text({ ...S.counter({ to: 1250, at: 0.5, dur: 1.4, suffix: '+' }), size: 200 })
    counter({ from = 0, to, at = 0, dur = 1.2, ease = 'expoOut', digits = 'ar', decimals = 0, prefix = '', suffix = '', group = true, ticks = 12 } = {}) {
      const e = A.resolveEase(ease);
      const fmt = (n) => {
        let s = n.toFixed(decimals);
        if (group) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, digits === 'ar' ? '٬' : ',');
        if (digits === 'ar') s = s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]).replace('.', '٫');
        return prefix + s + suffix;
      };
      const val = (t) => from + (to - from) * e(A.clamp((t - at) / dur));
      // تكات صوت بتبطّى مع تباطؤ العد
      const sfx = Array.from({ length: ticks }, (_, i) => {
        const p = i / ticks;
        let lo = 0, hi = 1;
        for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (e(m) < p) lo = m; else hi = m; }
        return { kind: 'count', at: at + lo * dur, seed: i + 1, gain_db: -20 };
      });
      return { text: { expr: (t) => fmt(val(t)) }, sfx: [...sfx, { kind: 'chime', at: at + dur, gain_db: -16 }], sfxAuto: true };
    },

    // دونات/حلقة نسبة: S.donut({ value: {at, from:0, to:.62, dur:1}, r: 160, width: 34, color, track })
    donut(o) {
      const r = o.r ?? 150, w = o.width ?? 30;
      return S.group({ x: o.x ?? S.cx, y: o.y ?? S.cy, rotation: -90, ...(o.layer ?? {}) }, [
        S.ellipse({ w: r * 2, fill: null, stroke: o.track ?? '#ffffff22', strokeWidth: w }),
        S.ellipse({ w: r * 2, fill: null, stroke: o.color ?? colors.primary ?? '#ff5a36', strokeWidth: w, lineCap: o.cap ?? 'butt',
          trim: typeof o.value === 'number' ? [0, o.value] : { expr: (t) => [0, Math.max(0.0001, A.value(o.value, t))] }, sfx: false }),
      ]);
    },
    // أعمدة: S.bars({ values:[.3,.8,.5], at, w, h, gap, color })
    bars(o) {
      const n = o.values.length, bw = o.barWidth ?? 70, gap = o.gap ?? 30, H = o.h ?? 400;
      const total = n * bw + (n - 1) * gap;
      return S.group({ x: o.x ?? S.cx, y: o.y ?? S.cy }, o.values.map((val, i) => S.rect({
        x: (S.vertical || true ? -1 : 1) * (total / 2 - bw / 2 - i * (bw + gap)), w: bw, radius: o.radius ?? 10, fill: Array.isArray(o.color) ? o.color[i] : o.color ?? colors.primary,
        h: { at: (o.at ?? 0) + i * (o.each ?? 0.08), from: 1, to: val * H, spring: o.spring ?? 'default' },
        y: { at: (o.at ?? 0) + i * (o.each ?? 0.08), from: 0, to: -val * H / 2, spring: o.spring ?? 'default' },
      })));
    },
    // صورة مقصوصة بإطار أبيض (sticker) — الصورة لازم تكون PNG شفافة (node studio.mjs cutout)
    sticker: (o) => ({ type: 'image', fit: 'contain', outline: { width: o.outlineWidth ?? 14, color: o.outlineColor ?? '#ffffff' }, shadow: o.shadow ?? { color: 'rgba(0,0,0,.35)', blur: 30, y: 14 }, ...o, src: S.asset(o.src) }),

    // إطار أنبوب CRT (الجزيرة رياضة): الحواف اليمين واليسار مقوسة والسواد حواليها. حطه آخر طبقة بالمشهد
    tube: (o = {}) => S.custom({ decor: true, draw: (ctx) => {
      const W = S.W, H = S.H, m = o.inset ?? W * 0.06, b = o.bulge ?? W * 0.075, top = o.top ?? -H * 0.02, bot = H - top;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-10, -10, W + 20, H + 20);
      ctx.moveTo(m, top);
      ctx.bezierCurveTo(m - b, H * 0.3, m - b, H * 0.7, m, bot);
      ctx.lineTo(W - m, bot);
      ctx.bezierCurveTo(W - m + b, H * 0.7, W - m + b, H * 0.3, W - m, top);
      ctx.closePath();
      ctx.fillStyle = o.color ?? '#000';
      ctx.fill('evenodd');
      if (o.vignette !== 0) {
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.62);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${o.vignette ?? 0.45})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    } }),

    // ── خرائط ──
    geo: G,
    map: (o) => ({ type: 'map', x: S.cx, y: S.cy, w: S.W, h: S.H, base: 'terrain', ...o }),
    // كاميرا طيران بين أماكن: S.fly([{ t:0, center:[lon,lat], zoom:3 }, { t:2, center:..., zoom:6, ease:'smooth' }])
    fly: (keys) => G.flyPath(keys, S.W),
    // موقع نقطة جغرافية على الشاشة (بيتحرك مع الكاميرا): { x, y } كدوال زمن
    at(map, lonlat, off = [0, 0]) {
      const mx = typeof map.x === 'number' ? map.x : S.cx, my = typeof map.y === 'number' ? map.y : S.cy;
      const p = (t) => G.project(G.cameraAt(map.camera, t), typeof lonlat === 'function' ? lonlat(t) : lonlat);
      return { x: (t) => mx + p(t)[0] + off[0], y: (t) => my + p(t)[1] + off[1] };
    },
    // عنصر بيمشي على مسار: { x, y, rotation } — progress قيمة متحركة 0..1
    along(map, route, progress, { rotate = true, angleOffset = 0 } = {}) {
      const rw = G.routeWorld(route);
      const ll = (t) => G.worldToLonLat(G.alongWorld(rw, A.value(progress, t)).pt);
      const pos = S.at(map, ll);
      const ang = (t) => {
        const a = G.alongWorld(rw, A.value(progress, t));
        const cam = G.cameraAt(map.camera, t);
        const p1 = G.project(cam, G.worldToLonLat(a.pt));
        const d = 1e-4;
        const b = G.alongWorld(rw, Math.min(1, A.value(progress, t) + d));
        const p2 = G.project(cam, G.worldToLonLat(b.pt));
        return (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI + angleOffset;
      };
      return { ...pos, ...(rotate ? { rotation: ang } : {}) };
    },
    // دبوس صورة دائري على الخريطة (أسلوب r16): صورة بدائرة + حلقة متوهجة + رقم + اسم
    mapPhoto(map, lonlat, o = {}) {
      const size = o.size ?? S.px(150), at = o.at ?? 0, col = o.color ?? colors.primary ?? '#ff6a1a';
      const pos = S.at(map, lonlat, o.off ?? [0, 0]);
      const pop = { at, from: 0, to: 1, spring: o.spring ?? 'playful' };
      const kids = [
        S.ellipse({ w: size + S.px(14), fill: col, glow: { color: col, radius: 30, strength: 1.2 } }),
        S.image({ src: o.src, w: size, h: size, radius: size / 2, fit: 'cover' }),
        S.ellipse({ w: size, fill: null, stroke: '#ffffff', strokeWidth: S.px(4) }),
      ];
      if (o.number != null) kids.push(S.text({ text: String(o.number), size: S.px(44), weight: 800, fill: '#fff', y: size / 2 - S.px(4), box: { fill: col, radius: S.px(40), pad: [S.px(14), S.px(4)] } }));
      if (o.label) kids.push(S.text({ text: o.label, role: 'body', size: S.px(46), weight: 700, fill: '#fff', y: size / 2 + S.px(70), shadow: { color: 'rgba(0,0,0,.6)', blur: 12, y: 3 } }));
      return S.group({ ...pos, scale: pop, sfx: { kind: 'pop', at, gain_db: -12 }, ...(o.out ? { opacity: { kf: [[o.out, 1], [o.out + 0.3, 0]] } } : {}) }, kids);
    },
    // مركز وحدود بلد/محافظة (بالاسم العربي أو الإنجليزي أو الرمز)
    async place(sel, country) {
      const fc = await (await fetch(country ? `/assets/geo/admin1/${country}.json` : '/assets/geo/countries.json')).json();
      const q = String(sel).toLowerCase();
      const f = fc.features.find((x) => [x.properties.id, x.properties.iso, x.properties.name, x.properties.ar].some((y) => y && String(y).toLowerCase() === q));
      if (!f) throw new Error(`مكان غير موجود: ${sel}`);
      // أكبر مضلع (لتجاهل الجزر الصغيرة)
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      let best = null, bestA = -1;
      for (const p of polys) { const r = p[0]; let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = r; } }
      const xs = best.map((c) => c[0]), ys = best.map((c) => c[1]);
      const bounds = [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
      return { ...f.properties, center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2], bounds, fit: (W = S.W, H = S.H, pad) => G.fitBounds(bounds, W, H, pad) };
    },

    // تسلسل زمني مريح: const c = S.cursor(0.3); c.at(); c.wait(0.4); c.at() ...
    cursor(start = 0) {
      let t = start;
      return { at: () => t, wait(d) { t += d; return t; }, set(x) { t = x; return t; }, mark() { return t; } };
    },

    // أنواع الطبقات (اختصارات)
    group: (o, children) => ({ type: 'group', ...o, children: children ?? o.children ?? [] }),
    rect: (o) => ({ type: 'rect', ...o }),
    ellipse: (o) => ({ type: 'ellipse', ...o }),
    circle: (o) => ({ type: 'ellipse', w: (o.r ?? 50) * 2, ...o }),
    polygon: (o) => ({ type: 'polygon', ...o }),
    line: (o) => ({ type: 'line', fill: null, ...o }),
    path: (o) => ({ type: 'path', ...o }),
    text: (o) => ({ type: 'text', family: o.family ?? S.font(o.role ?? 'display'), weight: o.weight ?? S.weight(o.role ?? 'display'), fill: o.fill ?? o.color ?? colors.text ?? '#fff', ...o }),
    image: (o) => ({ type: 'image', ...o, src: S.asset(o.src) }),
    icon: (o) => ({ type: 'icon', color: colors.text ?? '#fff', ...o }),
    custom: (o) => ({ type: 'custom', ...o }),
    svg: (o) => ({ type: 'svg', ...o, src: S.asset(o.src) }),
    // لوغو الهوية (من brand.logo.svg)
    logo: (o = {}) => ({ type: 'svg', size: S.px(420), x: S.cx, y: S.cy, ...o, src: S.asset(brand.logo?.svg ?? 'assets/logo.svg') }),
    particles: (o) => ({ type: 'particles', ...o }),
    three: (o) => ({ type: 'three', ...o }),
    lottie: (o) => ({ type: 'lottie', ...o, src: o.src.startsWith('/') ? o.src : S.asset(o.src) }),
    video: (o) => ({ type: 'video', ...o, src: S.asset(o.src) }),
  };
  return S;
}
