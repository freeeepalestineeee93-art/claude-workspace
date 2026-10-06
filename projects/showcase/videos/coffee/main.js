// "رحلة القهوة" — فيديو تجربة بيجمع كل أنماط الاستوديو بقصة وحدة، والانتقالات بين الأنماط متصلة.
// تايبوغرافي ← خريطة ← أرقام ← كولاج ← شرح flat ← Bauhaus ← لقطة Kling ← ختام
export default async (S) => {
  const C = { esp: '#140e0a', esp2: '#1f1611', cream: '#f2e8d8', paper: '#ece2d0', gold: '#d9a441', red: '#c4512b', blue: '#2a4b8d', ink: '#1a1410', muted: '#9b8b78' };
  const HEAD = 'Al Jazeera', BODY = 'thmanyah sans';
  const words = async (id) => (await fetch(S.asset(`videos/coffee/vo/${id}.words.json`))).json();
  const W2 = await words('s2'), W5 = await words('s5');
  const at = (ws, i) => ws[i].start;

  // ── التايملاين: بدايات الأقسام والانتقالات (نص الانتقال على الحد بالضبط) ──
  const cuts = [0, 7.2, 20, 30.8, 43, 53, 61, 69, 75.5];
  const trs = [null,
    { type: 'zoom', dur: 0.9, amount: 0.5, ease: 'smooth' },
    { type: 'fade', dur: 1.0, ease: 'sineInOut' },
    { type: 'iris', dur: 0.9, at: [S.px(300), S.vh(50)], ring: C.gold, ease: 'quartInOut' },
    { type: 'push', dir: 'right', dur: 0.8, blur: S.px(60), ease: 'quintInOut' },
    { type: 'fade', dur: 0.8, ease: 'sineInOut' },
    { type: 'shape', dur: 1.0, at: [S.cx, S.vh(48)], from: [S.px(330), S.px(260)], radius: S.px(60), ease: 'quartInOut' },
    { type: 'dip', dur: 1.0, color: C.esp, ease: 'sineInOut' },
  ];
  const half = (i) => (trs[i] ? trs[i].dur / 2 : 0);
  const scene = (i, bg, layers, camera) => ({ duration: cuts[i + 1] + half(i + 1) - (cuts[i] - half(i)), transition: trs[i] ?? undefined, background: bg, layers: layers(half(i)), ...(camera ? { camera } : {}) });
  const drift = (i, z = 0.05, r = 0) => { const d = cuts[i + 1] - cuts[i] + half(i) + half(i + 1); return { zoom: { kf: [[0, 1], [d, 1 + z, 'linear']] }, rotation: { kf: [[0, 0], [d, r, 'linear']] } }; };
  const X = S.safe.cx, R = S.safe.right - S.px(10);
  const head = (text, t, o = {}) => S.text({ text, family: HEAD, weight: 900, size: S.px(o.size ?? 92), fill: o.fill ?? C.cream, x: o.x ?? X, y: o.y ?? S.safe.top + S.px(90), maxWidth: S.safe.w, lineHeight: 1.3,
    ...(o.box ? { box: { fill: o.box, radius: S.px(18), pad: [S.px(30), S.px(18)], reveal: { at: t, dur: 0.5, ease: 'glide', from: 'start' } } } : {}),
    ...S.fx.maskRise(t + (o.box ? 0.12 : 0), { size: o.size ?? 92, each: 0.07 }), ...(o.extra ?? {}) });
  const body = (text, t, o = {}) => S.text({ text, family: BODY, weight: o.weight ?? 500, size: S.px(o.size ?? 58), fill: o.fill ?? C.cream, x: o.x ?? X, y: o.y, maxWidth: S.safe.w, ...S.fx.blurIn(t, { size: o.size ?? 58 }), ...(o.extra ?? {}) });

  // خريطة بستايل دافي (بنستعملها بقسمين: الخريطة نفسها، وخلفية الأرقام)
  const mocha = [43.25, 13.32], highlands = [38.6, 7.6];
  const mapCam = S.fly([
    { t: 0, center: [40, 15], zoom: 3.55 },
    { t: 3.1, center: [38.9, 9.4], zoom: 5.5, ease: 'smooth' },
    { t: 7.0, center: [42.2, 12.6], zoom: 6.2, ease: 'quadInOut' },
    { t: 9.3, center: [41.6, 13.4], zoom: 6.3, ease: 'sineInOut' },
    { t: 12.6, center: [26, 31], zoom: 3.15, ease: 'smooth' },
    { t: 14, center: [25, 31], zoom: 3.2, ease: 'sineInOut' },
  ]);
  const mapStyle = { land: '#4b4034', high: '#8f7c62', water: '#110d0b', deep: '#0a0807', exaggeration: 2.3, shade: 0.9 };
  const toIst = { points: [mocha, [41.2, 16.8], [38.6, 21.2], [36.2, 25.6], [33.4, 29.8], [32.4, 31.3], [30.2, 33.6], [28.6, 36.7], [28.98, 41.01]], smooth: true };
  const toVen = { points: [[32.4, 31.3], [27, 33.8], [20.5, 36.3], [17.6, 40.6], [12.33, 45.44]], smooth: true };
  const toAms = { points: [[20.5, 36.3], [12, 37.6], [4, 37.8], [-5.6, 35.95], [-9.6, 39.5], [-6.5, 46.5], [-2, 49.8], [4.9, 52.37]], smooth: true };

  const caps5 = await S.captions('videos/coffee/vo/s5.words.json', { style: 'karaoke', y: S.vh(76.5), size: S.px(52), offset: half(4) + 0.6, color: C.ink, active: C.red, family: BODY, weight: 600 });

  return {
    background: C.esp,
    audio: {
      music: { style: 'arabic', bpm: 90, key: 'D', gain_db: -13 },
      voice: [{ src: 'videos/coffee/vo/s1.wav', at: 0.2 }, { src: 'videos/coffee/vo/s2.wav', at: cuts[1] + 0.3 }, { src: 'videos/coffee/vo/s3.wav', at: cuts[2] + 0.5 },
        { src: 'videos/coffee/vo/s4.wav', at: cuts[3] + 0.7 }, { src: 'videos/coffee/vo/s5.wav', at: cuts[4] + 0.6 }, { src: 'videos/coffee/vo/s7.wav', at: cuts[6] + 1.6 }],
      duck: { amount_db: 8 },
    },
    post: { grain: { amount: 0.045, size: 1.4 }, vignette: { strength: 0.38, softness: 0.6 }, bloom: { strength: 0.25, threshold: 0.8 }, grade: { contrast: 1.04, temperature: 0.1 } },
    scenes: [
      // ═══ ١. تايبوغرافي: "كل شيء بدأ… بحبّة" ثم "قهوة" والكشيدة بتصير خط ═══
      scene(0, C.esp, (c) => [
        S.ellipse({ x: X, y: S.vh(45), w: S.px(1300), fill: { radial: { c: [0, 0], r: S.px(650) }, stops: [[0, C.gold + '30'], [1, C.gold + '00']] }, scale: { at: 0, from: 0.25, to: 1, dur: 1.6, ease: 'expoOut' }, opacity: { at: 0, from: 0, to: 1, dur: 0.5 } }),
        S.text({ text: 'كلُّ شيءٍ بدأ', family: BODY, weight: 300, size: S.px(76), fill: '#e3d3bb', x: X, y: S.vh(33), ...S.fx.combine(S.fx.rise(0.15, { size: 76, each: 0.12 }), S.fx.exitBlur(3.0, { size: 76 })) }),
        // حبة البن: شكل بيضاوي + شق منحني
        S.group({ x: X, y: S.vh(45), rotation: { at: 2.45, from: -70, to: -25, spring: 'playful' }, scale: { kf: [[2.45, 0, { spring: 'playful' }], [3.55, 1], [3.7, 1, 'expoIn'], [4.05, 0]] }, sfx: { kind: 'pop', at: 2.45, params: { pitch: 0.7 } } }, [
          S.ellipse({ w: S.px(150), h: S.px(210), fill: '#6b3f22' }),
          S.path({ d: S.shapes.smoothPath([[0, -S.px(95)], [S.px(26), -S.px(30)], [-S.px(22), S.px(30)], [0, S.px(95)]]), fill: null, stroke: '#2a160b', strokeWidth: S.px(10) }),
        ]),
        S.text({ text: 'بحبّة', family: HEAD, weight: 700, size: S.px(96), fill: C.gold, x: X, y: S.vh(57), ...S.fx.combine(S.fx.pop(2.5, { size: 96 }), S.fx.exitBlur(3.6, { size: 96 })) }),
        S.text({ text: 'قهوة', family: HEAD, weight: 900, size: S.px(270), fill: C.cream, x: X - S.px(8), y: S.vh(47),
          ...S.fx.slam(4.0, { size: 270, from: 2.2, by: 'all' }),
          kashida: [{ word: 0, amount: { kf: [[5.0, 0, 'snap'], [5.6, S.px(140), 'smooth'], [7.2, S.px(170)]] } }],
          sfx: [{ kind: 'swell', at: 5.0, align: 'end', params: { dur: 0.5 }, gain_db: -12 }] }),
        S.rect({ x: X, y: S.vh(55), h: S.px(6), radius: 3, fill: C.gold, w: { kf: [[5.3, 0, 'smooth'], [6.2, S.px(620)], [7.6, S.W * 1.4, 'expoIn']] }, sfx: false }),
      ], drift(0, 0.07)),

      // ═══ ٢. خريطة: إثيوبيا ← المخا ← العالم (متزامنة مع كلمات التعليق) ═══
      scene(1, C.esp, (c) => {
        const vo = c + 0.3 - 0; // بداية التعليق بالنسبة للمشهد
        const map = S.map({
          base: 'terrain', style: mapStyle, camera: mapCam, borders: { color: '#fff3dc', opacity: 0.13, width: 1 },
          countries: [
            { id: 'ETH', fill: C.gold + '55', stroke: '#f0c56a', strokeWidth: 2, glow: { blur: 14 }, wipe: { at: vo + at(W2, 2) - 0.1, from: 0, to: 1, dur: 1.1, ease: 'smooth' }, opacity: { kf: [[0, 1], [vo + 8.6, 1], [vo + 9.6, 0.3]] } },
            { id: 'YEM', fill: C.red + '55', stroke: '#e8794f', strokeWidth: 2, glow: { blur: 14 }, wipe: { at: vo + at(W2, 11) - 0.2, from: 0, to: 1, dur: 1.0, ease: 'smooth' }, opacity: { kf: [[0, 1], [vo + 8.6, 1], [vo + 9.6, 0.3]] } },
          ],
          routes: [
            { points: [highlands, [39.6, 10.4], [41.2, 12.2], mocha], smooth: true, color: C.gold, width: 3.5, dash: [12, 9], dashSpeed: 40, glow: { blur: 10 }, trim: { at: vo + at(W2, 7), from: [0, 0], to: [0, 1], dur: 2.4, ease: 'smooth' } },
            { ...toIst, color: C.cream, width: 3, glow: { blur: 10 }, trim: { at: vo + at(W2, 15), from: [0, 0], to: [0, 1], dur: 2.0, ease: 'smooth' } },
            { ...toVen, color: C.cream, width: 3, glow: { blur: 10 }, trim: { at: vo + at(W2, 16) + 0.3, from: [0, 0], to: [0, 1], dur: 1.6, ease: 'smooth' } },
            { ...toAms, color: C.cream, width: 3, glow: { blur: 10 }, trim: { at: vo + at(W2, 17) + 0.4, from: [0, 0], to: [0, 1], dur: 2.0, ease: 'smooth' } },
          ],
          markers: [{ at: mocha, type: 'pulse', color: C.red, size: 10, appear: vo + at(W2, 12) }],
        });
        const pill = (text, ll, t, o = {}) => S.text({ text, family: BODY, weight: 700, size: S.px(o.size ?? 46), fill: o.dark ? C.ink : '#fff', ...S.at(map, ll, o.off ?? [0, -S.px(60)]),
          box: { fill: o.color ?? C.red, radius: S.px(14), pad: [S.px(22), S.px(12)], shadow: { blur: 18, y: 6 }, reveal: { at: t, spring: 'snappy', from: 'center' } },
          ...S.fx.rise(t + 0.08, { size: 46, by: 'all' }), ...(o.out ? { opacity: { kf: [[o.out, 1], [o.out + 0.35, 0]] } } : {}), sfx: { kind: 'pop', at: t, gain_db: -14 } });
        return [
          map,
          pill('إثيوبيا', [39.2, 8.6], vo + at(W2, 2) + 0.3, { color: C.gold, dark: true, out: vo + 6.4 }),
          pill('ميناء المخا', mocha, vo + at(W2, 12) + 0.1, { off: [-S.px(150), S.px(10)], out: vo + 8.9 }),
          pill('إسطنبول', [28.98, 41.01], vo + at(W2, 15) + 1.6, { size: 40, color: '#7a4a2a', off: [S.px(20), S.px(50)] }),
          pill('البندقية', [12.33, 45.44], vo + at(W2, 16) + 1.6, { size: 40, color: '#7a4a2a' }),
          pill('أمستردام', [4.9, 52.37], vo + at(W2, 17) + 2.0, { size: 40, color: '#7a4a2a' }),
          head('من المخا… إلى العالم', vo + 8.2, { size: 74, box: C.gold, fill: C.ink, y: S.safe.bottom - S.px(70) }),
        ];
      }),

      // ═══ ٣. أرقام: فوق خريطة العالم مغبّشة (استمرارية) ═══
      scene(2, C.esp, (c) => {
        const vals = [['البرازيل', 0.37], ['فيتنام', 0.17], ['كولومبيا', 0.08], ['إندونيسيا', 0.06], ['إثيوبيا', 0.05]];
        const bw = S.px(80), gap = S.px(70), bx0 = S.vw(66), by = S.vh(70);
        return [
          S.map({ base: 'terrain', style: mapStyle, camera: S.fly([{ t: 0, center: [25, 31], zoom: 3.2 }, { t: 13, center: [31, 20], zoom: 3.75, ease: 'sineInOut' }]), blur: 7, opacity: 0.32, sfx: false }),
          S.particles({ count: 45, start: 0, life: [5, 9], emitter: { x: S.cx, y: S.vh(55), w: S.W, h: S.H }, angle: [-100, -80], speed: [S.px(10), S.px(35)], size: [S.px(2), S.px(5)], color: [C.gold + '88', C.cream + '55'], shape: 'circle', turbulence: { amp: S.px(25), freq: 0.3 }, seed: 3 }),
          S.rect({ x: S.cx, y: S.cy, w: S.W, h: S.H, fill: { linear: [[0, -S.H / 2], [0, S.H / 2]] , stops: [[0, C.esp + 'aa'], [0.5, C.esp + '55'], [1, C.esp + 'ee']] } }),
          S.text({ ...S.counter({ from: 0, to: 2.25, decimals: 2, digits: 'latin', at: c + 0.5, dur: 2.7 }), family: HEAD, weight: 900, size: S.px(300), fill: C.gold, x: X, y: S.vh(25),
            opacity: { at: c + 0.35, from: 0, to: 1, dur: 0.3 }, scale: { at: c + 0.35, from: 0.75, to: 1, spring: 'heavy' } }),
          body('مليار كوب… كل يوم', c + 3.0, { y: S.vh(34), size: 64, weight: 600 }),
          // البرازيل: دونات = الفنجان اللي بيفتح على المشهد الجاي
          S.donut({ x: S.px(300), y: S.vh(50), r: S.px(140), width: S.px(34), color: C.gold, track: '#ffffff1c', layer: { scale: { at: c + 4.4, from: 0, to: 1, spring: 'default' } }, value: { at: c + 4.6, from: 0.0001, to: 0.37, dur: 1.4, ease: 'expoOut' } }),
          S.text({ text: '37%', family: HEAD, weight: 900, size: S.px(88), fill: C.cream, x: S.px(300), y: S.vh(50) + S.px(10), ...S.fx.pop(c + 4.9, { size: 88, by: 'all' }) }),
          body('البرازيل وحدها', c + 5.0, { x: S.px(300), y: S.vh(50) - S.px(195), size: 46, weight: 700, fill: C.gold }),
          ...vals.map(([name, v], i) => {
            const x = bx0 + S.px(130) - i * (bw + gap);
            const t = c + 6.7 + [0, 0.1, 0.24, 0.31, 0.47][i];
            return S.group({}, [
              S.rect({ x, w: bw, radius: S.px(10), fill: i === 0 ? C.gold : '#d9c7a8', h: { at: t, from: 1, to: v * S.px(1300), spring: 'default' }, y: { at: t, from: by, to: by - (v * S.px(1300)) / 2, spring: 'default' } }),
              S.text({ text: name, family: BODY, weight: 600, size: S.px(40), fill: C.cream, x, y: by + S.px(46), rotation: 0, ...S.fx.rise(t + 0.15, { size: 40, by: 'all' }) }),
            ]);
          }),
          body('أكبر المنتجين', c + 6.5, { x: bx0 - S.px(150), y: by + S.px(112), size: 38, fill: '#bfae96' }),
          S.text({ text: 'المهد', family: BODY, weight: 700, size: S.px(42), fill: '#fff', x: bx0 + S.px(130) - 4 * (bw + gap), y: by - 0.05 * S.px(1300) - S.px(70),
            box: { fill: C.red, radius: S.px(12), pad: [S.px(18), S.px(10)], reveal: { at: c + 9.0, spring: 'snappy', from: 'center' } }, ...S.fx.rise(c + 9.08, { size: 42, by: 'all' }), sfx: { kind: 'pop', at: c + 9.0, gain_db: -14 } }),
        ];
      }, drift(2, 0.05)),

      // ═══ ٤. كولاج (أسلوب رياضة الجزيرة): ورق، قصاصات، شاشة قديمة، رقم ضخم ═══
      scene(3, C.paper, (c) => {
        const crt = S.group({ x: S.cx - S.px(40), y: S.vh(40), rotation: { at: c + 0.2, from: -9, to: -3, spring: 'default' }, scale: { at: c + 0.15, from: 0.6, to: 1, spring: 'heavy' },
          sfx: { kind: 'shutter', at: c + 0.2 } }, [
          S.rect({ w: S.px(700), h: S.px(560), radius: S.px(46), fill: '#1b1612', shadow: { color: 'rgba(0,0,0,.35)', blur: 40, y: 18 } }),
          S.image({ src: 'assets/coffee/coffeehouse.png', w: S.px(640), h: S.px(500), radius: S.px(34), fit: 'cover', zoom: { kf: [[c, 1.0], [c + 12, 1.12, 'linear']] } }),
          S.custom({ draw: (ctx, t) => { // خطوط شاشة + لمعة
            ctx.save(); ctx.beginPath(); ctx.roundRect(-S.px(320), -S.px(250), S.px(640), S.px(500), S.px(34)); ctx.clip();
            ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = -S.px(250); y < S.px(250); y += 4) ctx.fillRect(-S.px(320), y, S.px(640), 1.6);
            const g = ctx.createRadialGradient(0, 0, S.px(120), 0, 0, S.px(420)); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = g; ctx.fillRect(-S.px(320), -S.px(250), S.px(640), S.px(500));
            ctx.restore(); } }),
          S.text({ text: 'REC ●  1554', family: 'Space Grotesk', weight: 600, size: S.px(26), fill: '#ff5a4a', x: -S.px(200), y: -S.px(205), decor: true, opacity: { base: 0.85, wiggle: { freq: 1.2, amp: 0.15 } } }),
          S.rect({ w: S.px(150), h: S.px(44), x: -S.px(300), y: -S.px(270), rotation: -32, fill: '#f3e7c8cc' }),
          S.rect({ w: S.px(150), h: S.px(44), x: S.px(300), y: S.px(265), rotation: -28, fill: '#f3e7c8cc' }),
        ]);
        const stick = (src, x, y, w, t, rot, o = {}) => S.sticker({ src, x, y: { base: y, wiggle: { freq: 0.35, amp: S.px(8), seed: Math.round(x) } }, w,
          scale: { at: t, from: 0, to: 1, spring: 'playful' }, rotation: { at: t, from: rot - 25, to: rot, spring: 'playful' }, outlineWidth: o.ow ?? 22, sfx: { kind: 'pop', at: t, params: { pitch: o.pitch ?? 0.8 } } });
        return [
          S.text({ text: '1554', family: HEAD, weight: 900, size: S.px(560), decor: true, fill: 'transparent', stroke: C.ink + '26', strokeWidth: 3, x: S.cx, y: S.vh(70), ...S.fx.blurIn(c + 0.1, { size: 560, by: 'all', dur: 1.2 }) }),
          crt,
          stick('assets/coffee/dallah-cut.png', S.vw(78), S.vh(64), S.px(340), c + 1.6, 8),
          stick('assets/coffee/finjan-cut.png', S.vw(24), S.vh(70), S.px(270), c + 2.1, -10, { pitch: 1.1 }),
          stick('assets/coffee/sack-cut.png', S.vw(52), S.vh(77), S.px(300), c + 2.6, 4, { pitch: 0.7 }),
          head('أولى مقاهي إسطنبول', c + 0.5, { size: 70, box: C.ink, fill: C.cream, y: S.safe.top + S.px(70) }),
          S.text({ text: '1554', family: HEAD, weight: 900, size: S.px(140), fill: C.red, x: S.vw(72), y: S.vh(20.5), ...S.fx.slam(c + 1.1, { size: 140, by: 'all' }) }),
          body('القهوة صارت مجلساً… وحكاية', c + 6.6, { y: S.vh(77), size: 54, weight: 700, fill: C.ink, extra: { box: { fill: C.gold, radius: S.px(14), pad: [S.px(24), S.px(12)], reveal: { at: c + 6.5, dur: 0.45, from: 'start' } } } }),
        ];
      }),

      // ═══ ٥. شرح flat: ٤ محطات متزامنة مع كلمات التعليق ═══
      scene(4, C.paper, (c) => {
        const vo = c + 0.6;
        const st = [['lucide:sprout', 'الزراعة', 5], ['lucide:hand', 'القطاف', 6], ['lucide:flame', 'التحميص', 7], ['lucide:coffee', 'التحضير', 9]];
        const y0 = S.vh(30), dy = S.px(250), xr = S.vw(76);
        return [
          head('من الحبّة… إلى الفنجان', c + 0.05, { size: 78, fill: C.ink, y: S.safe.top + S.px(72) }),
          S.line({ points: [[xr, y0], [xr, y0 + dy * 3]], stroke: C.ink + '55', strokeWidth: S.px(5), trim: { at: vo + at(W5, 4) - 0.3, from: [0, 0], to: [0, 1], dur: 4.6, ease: 'smooth' } }),
          ...st.flatMap(([icon, label, wi], i) => {
            const t = vo + at(W5, wi) - 0.15, y = y0 + dy * i;
            const col = [C.blue, '#a8741c', C.red, C.ink][i];
            return [
              S.ellipse({ x: xr, y, w: S.px(150), fill: null, stroke: col, strokeWidth: S.px(5), scale: { at: vo + at(W5, 3) + [0, 0.09, 0.15, 0.26][i], from: 0, to: 1, spring: 'snappy' }, sfx: i ? false : { kind: 'tick', at: vo + at(W5, 3) } }),
              S.ellipse({ x: xr, y, w: S.px(150), fill: col, scale: { at: t, from: 0, to: 1, spring: 'playful' }, sfx: false }),
              S.icon({ icon, x: xr, y, size: S.px(76), color: i === 1 ? C.ink : '#fff', strokeWidth: 2, trim: { at: t + 0.12, from: [0, 0], to: [0, 1], dur: 0.6, ease: 'smooth' }, sfx: { kind: 'swish', at: t + 0.1 } }),
              S.text({ text: label, family: BODY, weight: 700, size: S.px(64), fill: C.ink, x: xr - S.px(120), y: y + S.px(6), anchor: 'start', ...S.fx.rise(t + 0.15, { size: 64, by: 'all' }) }),
              S.text({ text: `0${i + 1}`, family: HEAD, weight: 900, size: S.px(40), fill: col, x: xr - S.px(120), y: y - S.px(58), anchor: 'start', ...S.fx.rise(t + 0.05, { size: 40, by: 'all' }) }),
            ];
          }),
          ...caps5,
        ];
      }, drift(4, 0.04)),

      // ═══ ٦. Bauhaus: أشكال برذاذ بتتجمع لفنجان ═══
      scene(5, C.paper, (c) => {
        const cx = S.cx, cy = S.vh(48);
        const fly = (from, at, spring = 'default') => ({ x: { at, from: from[0], to: from[2], spring }, y: { at, from: from[1], to: from[3], spring } });
        return [
          // جسم الفنجان: نص دائرة
          S.path({ d: `M${-S.px(170)},0 A${S.px(170)},${S.px(170)} 0 0 0 ${S.px(170)},0 Z`, fill: C.red, ...fly([-S.W, cy - S.px(300), cx, cy], c, 'heavy'), scale: { kf: [[c + 4.6, 1, 'linear'], [c + 4.66, 1.14, { spring: 'rubber' }], [c + 5.8, 1]] }, rotation: { at: c, from: -120, to: 0, spring: 'heavy' }, spray: { angle: 60, start: 0.45, amount: 0.95 } }),
          // اليد: حلقة زرقا
          S.ellipse({ w: S.px(120), fill: null, stroke: C.blue, strokeWidth: S.px(26), ...fly([S.W + 200, cy + S.px(400), cx + S.px(185), cy + S.px(55)], c + 0.40, 'playful') }),
          // الصحن
          S.rect({ w: { at: c + 0.70, from: 0, to: S.px(520), spring: 'snappy' }, h: S.px(26), radius: S.px(13), fill: C.ink, x: cx, y: cy + S.px(185) }),
          // البخار: ٣ خطوط موجية
          ...[0, 1, 2].map((k) => S.path({ d: S.shapes.smoothPath([[0, 0], [S.px(26), -S.px(60)], [-S.px(22), -S.px(130)], [S.px(18), -S.px(200)]]), fill: null, stroke: C.ink, strokeWidth: S.px(12),
            x: cx - S.px(70) + k * S.px(70), y: cy - S.px(40), trim: { at: c + 1.30 + k * 0.15, from: [0, 0], to: [0, 1], dur: 0.8, ease: 'smooth' }, opacity: { base: 1, wiggle: { freq: 0.6, amp: 0.15, seed: k } } })),
          // حبة بن ذهبية + نقاط + مثلث
          S.ellipse({ w: S.px(150), h: S.px(210), fill: C.gold, rotation: { kf: [[c + 0.2, 40, { spring: 'playful' }], [c + 1.6, -30], [c + 4.0, -30, 'backIn'], [c + 4.6, 160]] }, spray: { angle: 230, start: 0.4 },
            x: { kf: [[c + 0.2, S.W + 300, { spring: 'playful' }], [c + 1.6, S.vw(80)], [c + 4.0, S.vw(80), 'quadIn'], [c + 4.6, cx]] }, y: { kf: [[c + 0.2, -200, { spring: 'playful' }], [c + 1.6, S.vh(25)], [c + 4.0, S.vh(25), 'backIn'], [c + 4.6, cy - S.px(30)]] },
            scale: { kf: [[c + 4.3, 1], [c + 4.6, 0.35, 'quadIn'], [c + 4.62, 0]] }, sfx: [{ kind: 'swish', at: c + 4.05 }, { kind: 'pop', at: c + 4.6, params: { pitch: 0.6 } }] }),
          S.polygon({ sides: 3, r: S.px(110), fill: C.blue, rotation: { at: c + 0.60, from: 180, to: 12, spring: 'default' }, spray: { angle: 10, start: 0.3 }, ...fly([-300, S.H + 200, S.vw(18), S.vh(75)], c + 0.60) }),
          ...[0, 1, 2, 3].map((k) => S.circle({ r: S.px(16), fill: [C.red, C.blue, C.ink, C.gold][k], x: S.vw(14) + k * S.px(46), y: { base: S.vh(22), wiggle: { freq: 0.7, amp: S.px(9), seed: k + 4 } }, scale: { at: c + 1.10 + k * 0.07, from: 0, to: 1, spring: 'playful' } })),
          S.text({ text: 'وفي كل محطة… فن', family: HEAD, weight: 700, size: S.px(76), fill: C.ink, x: X, y: S.vh(68), ...S.fx.maskRise(c + 2.10, { size: 76 }) }),
        ];
      }, drift(5, 0.06, -1.2)),

      // ═══ ٧. لقطة حية (Kling) ═══
      scene(6, '#000', (c) => [
        S.video({ src: 'assets/coffee/kling-pour.mp4', x: S.cx, y: S.cy + S.px(230), w: S.W, h: S.H, at: 0, rate: 0.88, fit: 'cover', scale: { kf: [[0, 1.08], [9, 1.0, 'linear']] } }),
        S.rect({ x: S.cx, y: S.vh(18), w: S.W, h: S.vh(46), fill: { linear: [[0, -S.vh(23)], [0, S.vh(23)]], stops: [[0, '#000'], [0.22, '#000000f0'], [0.6, '#00000088'], [1, '#00000000']] } }),
        S.text({ text: 'كلُّ كوبٍ تشربه', family: BODY, weight: 300, size: S.px(64), fill: C.cream, x: X, y: S.safe.top + S.px(60), ...S.fx.blurIn(c + 2.6, { size: 64 }) }),
        S.text({ text: 'يحمل حكاية', family: HEAD, weight: 900, size: S.px(150), fill: C.gold, x: X, y: S.safe.top + S.px(210), ...S.fx.maskRise(c + 4.85, { size: 150, each: 0.1 }) }),
      ]),

      // ═══ ٨. الختام ═══
      scene(7, C.esp, (c) => [
        S.ellipse({ x: X, y: S.vh(45), w: S.px(1100), fill: { radial: { c: [0, 0], r: S.px(550) }, stops: [[0, C.gold + '26'], [1, C.gold + '00']] }, opacity: { at: c, from: 0, to: 1, dur: 1.2 } }),
        S.particles({ count: 60, start: 0, life: [5, 8], emitter: { x: S.cx, y: S.vh(50), w: S.W, h: S.H }, angle: [-100, -80], speed: [S.px(8), S.px(30)], size: [S.px(2), S.px(5)], color: [C.gold + 'aa', C.cream + '66'], shape: 'circle', turbulence: { amp: S.px(20), freq: 0.3 }, seed: 7 }),
        S.ellipse({ x: X, y: S.vh(40), w: S.px(240), fill: null, stroke: C.gold, strokeWidth: S.px(8), lineCap: 'round', rotation: { kf: [[c, -90], [c + 7, 30, 'sineOut']] }, trim: { at: c + 0.2, from: [0, 0], to: [0, 0.86], dur: 0.9, ease: 'smooth' } }),
        S.text({ text: 'م', family: HEAD, weight: 900, size: S.px(150), fill: C.cream, x: X, y: S.vh(40) + S.px(8), ...S.fx.pop(c + 0.8, { size: 150, by: 'all' }) }),
        S.text({ text: 'استوديو الموشن', family: HEAD, weight: 900, size: S.px(100), fill: C.cream, x: X, y: S.vh(52), ...S.fx.maskRise(c + 1.1, { size: 100, each: 0.1 }) }),
        S.text({ text: 'كل ما شاهدته… صُنع بالكود', family: BODY, weight: 500, size: S.px(52), fill: C.muted, x: X, y: S.vh(58.5), ...S.fx.blurIn(c + 1.7, { size: 52 }) }),
      ], drift(7, 0.05)),
    ],
  };
};
