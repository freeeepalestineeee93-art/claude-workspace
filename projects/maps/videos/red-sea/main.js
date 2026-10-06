// خريطة شارحة: البحر الأحمر وباب المندب — لقطة وحدة متصلة بكاميرا طائرة (أسلوب مراجع الجزيرة r15/r16)
export default async (S) => {
  const RED = '#c41d29', ORANGE = '#f08a24', WHITE = '#f4f1ea';
  const suez = [32.56, 29.96], mandeb = [43.33, 12.62], portSaid = [32.3, 31.27];

  // ── مسارات ──
  const redSea = { points: [suez, [33.75, 27.6], [35.6, 24.8], [37.9, 21.4], [40.1, 17.4], [41.9, 14.8], mandeb, [45.2, 12.1], [48.5, 12.6], [51.6, 12.4]], smooth: true };
  const toEurope = { points: [portSaid, [27.5, 33.6], [19.5, 35.2], [11.8, 37.4], [4.5, 37.6], [-5.6, 35.95], [-9.8, 39.5], [-7, 46.5], [-2.5, 49.6], [3.6, 51.8]], smooth: true };
  const toAsia = { points: [[51.6, 12.4], [62, 11.5], [73, 7.5], [80.8, 5.6], [91, 6.5], [97.5, 5.6], [103.9, 1.25], [110, 9.5], [116.5, 19.5], [121.6, 30.9]], smooth: true };

  const camera = S.fly([
    { t: 0, center: [38.5, 22.5], zoom: 4.05 },
    { t: 2.8, center: [37.5, 23], zoom: 4.3, ease: 'sineInOut' },
    { t: 5.6, center: [32.9, 29.4], zoom: 7.15, ease: 'smooth' },
    { t: 10.2, center: [43.2, 13.4], zoom: 7.35, ease: 'quadInOut', mode: 'linear' },
    { t: 11.6, center: [43.6, 13.2], zoom: 7.5, ease: 'sineInOut' },
    { t: 14.6, center: [55, 25], zoom: 3.38, ease: 'smooth' },
    { t: 19, center: [56, 25], zoom: 3.5, ease: 'sineInOut' },
  ]);

  const map = S.map({
    base: 'terrain',
    style: { land: '#45423d', high: '#7a756b', water: '#101215', deep: '#090a0b', exaggeration: 2.4, shade: 0.92 },
    camera,
    borders: { color: '#ffffff', opacity: 0.14, width: 1 },
    countries: [
      { id: 'EGY', fill: RED + '44', stroke: '#ff6b6b', strokeWidth: 2, hatch: { color: '#ffffff26', spacing: 11 }, wipe: { at: 3.4, from: 0, to: 1, dur: 1.4, ease: 'smooth' }, opacity: { kf: [[0, 1], [12.2, 1], [13.2, 0.35]] } },
      { id: 'YEM', fill: ORANGE + '70', stroke: '#ffb15c', strokeWidth: 2.5, glow: { blur: 16 }, wipe: { at: 8.6, from: 0, to: 1, dur: 1.2, ease: 'smooth' }, opacity: { kf: [[0, 1], [12.2, 1], [13.2, 0.35]] } },
    ],
    routes: [
      { ...redSea, color: WHITE, width: 3, dash: [12, 9], dashSpeed: 40, glow: { color: '#ffffff', blur: 8 }, trim: { kf: [[5.6, [0, 0]], [10.2, [0, 0.66], 'quadInOut'], [12.2, [0, 1], 'smooth']] } },
      { ...toEurope, color: '#5ec8ff', width: 3.5, glow: { blur: 12 }, trim: { kf: [[11.8, [0, 0]], [14.2, [0, 1], 'smooth']] } },
      { ...toAsia, color: '#ffc24b', width: 3.5, glow: { blur: 12 }, trim: { kf: [[12.1, [0, 0]], [14.5, [0, 1], 'smooth']] } },
    ],
    markers: [
      { at: suez, type: 'pulse', color: RED, size: 9, appear: 4.6 },
      { at: mandeb, type: 'pulse', color: RED, size: 10, appear: 8.4 },
    ],
  });

  // ── عناصر لاصقة على الخريطة ──
  const pill = (text, lonlat, at, o = {}) => S.text({
    text, role: 'body', weight: 700, size: S.px(o.size ?? 44), fill: WHITE, anchor: o.anchor ?? 'center',
    ...S.at(map, lonlat, o.off ?? [0, -S.px(62)]),
    box: { fill: o.color ?? RED, radius: S.px(14), pad: [S.px(22), S.px(12)], shadow: { blur: 20, y: 6 }, reveal: { at, spring: 'snappy', from: 'center' } },
    ...S.fx.rise(at + 0.08, { size: o.size ?? 44, by: 'all' }),
    ...(o.out ? { opacity: { kf: [[o.out, 1], [o.out + 0.35, 0]] } } : {}),
    sfx: { kind: 'pop', at, gain_db: -13 },
  });

  const ship = S.icon({ icon: 'lucide:ship', size: S.px(56), color: WHITE, strokeWidth: 2,
    ...S.along(map, redSea, { kf: [[5.6, 0.0], [10.2, 0.66, 'quadInOut'], [12.2, 1, 'smooth']] }, { rotate: false }),
    opacity: { kf: [[5.3, 0], [5.7, 1], [11.6, 1], [12.1, 0]] }, glow: { color: '#ffffff', radius: 14, strength: 0.6 }, sfx: false });

  // ── نصوص الواجهة ──
  const top = S.safe.top + S.px(70);
  const head = (text, at, out, o = {}) => S.text({
    text, size: S.px(o.size ?? 68), weight: 800, fill: WHITE, x: S.safe.cx, y: o.y ?? top, maxWidth: S.safe.w - S.px(40), lineHeight: 1.35,
    box: { fill: o.color ?? RED, radius: S.px(18), pad: [S.px(34), S.px(20)], reveal: { at, dur: 0.5, ease: 'glide', from: 'start' } },
    ...S.fx.combine(S.fx.maskRise(at + 0.12, { size: o.size ?? 68, each: 0.06 }), out ? S.fx.exitMask(out, { size: o.size ?? 68 }) : {}),
    ...(out ? { opacity: { kf: [[out + 0.25, 1], [out + 0.45, 0]] } } : {}),
  });

  return {
    background: '#000',
    audio: { music: { style: 'cinematic', bpm: 90, gain_db: -9 } },
    post: { grain: { amount: 0.05, size: 1.4 }, vignette: { strength: 0.55, softness: 0.6 }, chromatic: 0.0009, grade: { contrast: 1.08, temperature: 0.06 } },
    scenes: [{
      duration: 19,
      layers: [
        map,
        ship,
        // ١. العنوان
        head('البحر الأحمر', 0.35, 3.0, { size: 92 }),
        S.text({ text: 'ممر ضيّق… بيحرّك ثُمن تجارة العالم', role: 'body', size: S.px(46), weight: 600, fill: WHITE, x: S.safe.cx, y: top + S.px(120),
          ...S.fx.combine(S.fx.blurIn(0.9, { size: 46 }), S.fx.exitBlur(3.0, { size: 46 })) }),
        // ٢. قناة السويس
        pill('قناة السويس', suez, 4.7, { out: 6.5, off: [S.px(-130), S.px(-20)] }),
        head('بوابة الدخول من الشمال', 4.9, 8.0, { size: 56 }),
        // ٣. باب المندب
        pill('اليمن', [45.6, 15.4], 9.2, { color: '#a8540c', size: 40, out: 12.4 }),
        pill('مضيق باب المندب', mandeb, 8.7, { off: [S.px(-60), S.px(70)], out: 12.4 }),
        head('وبوابة الخروج من الجنوب', 8.4, 12.2, { size: 56 }),
        S.text({ text: 'عرضه حوالي ٢٩ كم بس', role: 'body', size: S.px(52), weight: 700, fill: '#101215', x: S.safe.cx, y: S.safe.bottom - S.px(150),
          box: { fill: '#f4f1ea', radius: S.px(16), pad: [S.px(28), S.px(16)], reveal: { at: 10.4, dur: 0.45, from: 'start' } },
          ...S.fx.combine(S.fx.rise(10.5, { size: 52 }), S.fx.exitBlur(12.4, { size: 52 })) }),
        // ٤. الصورة الكبيرة
        pill('أوروبا', [8, 48.5], 13.0, { color: '#2a6f9e', size: 42 }),
        pill('آسيا', [92, 33], 13.4, { color: '#a8780f', size: 42 }),
        S.text({ ...S.counter({ from: 0, to: 12, at: 14.0, dur: 1.2, suffix: '٪' }), size: S.px(200), weight: 900, fill: '#ffc24b', x: S.safe.cx, y: S.vh(66),
          opacity: { at: 13.9, from: 0, to: 1, dur: 0.3 }, scale: { at: 13.9, from: 0.7, to: 1, spring: 'heavy' } }),
        S.text({ text: 'من تجارة العالم بتمر من هون', role: 'body', size: S.px(52), weight: 600, fill: WHITE, x: S.safe.cx, y: S.vh(73), ...S.fx.maskRise(14.5, { size: 52 }) }),
        // ٥. الختام
        head('أي توتر هون… بيوصل لعندك', 16.2, null, { size: 60, y: S.vh(20) }),
      ],
    }],
  };
};
