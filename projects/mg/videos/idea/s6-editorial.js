// مشهد ٦ — تحريري أبيض/أسود/أحمر (أسلوب m2): حيط بلاطات مايل فيه أيقونات، بينقلب بموجة قطرية،
// الكاميرا بتمشي عليه قطري وبعدين بتغطس جوّا البلاطة الحمرا لحد ما الأحمر يملى الكادر ← جملة كبيرة.
export function editorialScene(S, P, D) {
  const { C } = P;
  const sfx = [];
  const px = S.px;
  const INK = '#17181F', GREY = '#D9D9DE', RED = '#EE3B33';
  const cx = S.cx, cy = S.cy;
  const ROT = -14, size = px(196), gap = px(26), cols = 7, rows = 11;
  const icons = ['lightbulb', 'rocket', 'heart', 'star', 'camera', 'music', 'globe', 'smartphone', 'mail', 'chart-column', 'pen-tool', 'palette', 'zap', 'target', 'users', 'play', 'code', 'cpu', 'bell', 'gift', 'coffee', 'briefcase', 'map-pin', 'film', 'mic', 'layers', 'compass', 'sparkles'];
  const TC = 3, TR = 5; // البلاطة الحمرا الهدف (بالنص)
  const rad = (ROT * Math.PI) / 180;
  const world = (lx, ly) => [cx + lx * Math.cos(rad) - ly * Math.sin(rad), cy + lx * Math.sin(rad) + ly * Math.cos(rad)];
  const pos = (c, r) => [(c - (cols - 1) / 2) * (size + gap), (r - (rows - 1) / 2) * (size + gap)];
  const [tx, ty] = world(...pos(TC, TR));

  const tiles = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const [lx, ly] = pos(c, r);
    const k = (r * 7 + c * 13) % 10;
    const isTarget = c === TC && r === TR;
    const kind = isTarget ? 'red' : k < 3 ? 'ink' : k < 6 ? 'white' : k < 8 ? 'grey' : 'red';
    const fill = { red: RED, ink: INK, white: '#FFFFFF', grey: GREY }[kind];
    const ic = { red: '#FFFFFF', ink: '#FFFFFF', white: INK, grey: INK }[kind];
    const at = 0.25 + (c + r) * 0.075 + ((c * 3 + r) % 4) * 0.02; // موجة قطرية مع تفاوت
    tiles.push(S.group({ x: lx, y: ly, scale: { at, from: [0, 1], to: [1, 1], spring: { stiffness: 260, damping: 18, mass: 1 } } }, [
      S.rect({ w: size, h: size, radius: px(6), fill, stroke: kind === 'white' ? INK : null, strokeWidth: px(4), shadow: { color: 'rgba(0,0,0,0.16)', blur: 16, y: 10 } }),
      ...(isTarget ? [] : [S.icon({ icon: `lucide:${icons[(r * cols + c) % icons.length]}`, size: px(80), color: ic, strokeWidth: 2 })]),
    ]));
  }
  for (let i = 0; i < 6; i++) sfx.push({ kind: 'click', at: 0.3 + i * 0.22, params: { pitch: 0.8 + i * 0.07 }, gain_db: -26 });

  const PUSH = 4.6, FULL = PUSH + 1.25;
  sfx.push({ kind: 'whoosh', at: PUSH + 0.6, align: 'peak', params: { dur: 1.1, brightness: 0.8 }, gain_db: -18 });

  // جزئين: (أ) الحيط والغطسة لحد ما الأحمر يملى الكادر، (ب) نفس الأحمر بدون كاميرا مع الجملة (القطع ما بيبين)
  const D2 = D - FULL;
  return [{
    duration: FULL,
    background: '#FFFFFF',
    transition: { type: 'whip', dir: 'left', dur: 0.45, ease: 'ae:85:85' },
    camera: {
      zoom: { kf: [[0, 1.25, 'sineInOut'], [PUSH, 1.12, 'ae:85:33'], [FULL, 11]] },
      x: { kf: [[0, -px(140), 'sineInOut'], [PUSH, px(60), 'ae:85:33'], [FULL, tx - cx]] },
      y: { kf: [[0, -px(260), 'sineInOut'], [PUSH, px(40), 'ae:85:33'], [FULL, ty - cy]] },
      rotation: { kf: [[0, 2, 'sineInOut'], [PUSH, -1], [FULL, 14, 'ae:85:33']] },
    },
    layers: [S.group({ x: cx, y: cy, rotation: ROT }, tiles)],
    sfx,
  }, {
    duration: D2,
    background: RED,
    layers: [
      S.text({ text: 'بس أول خطوة…', family: P.BODY, weight: 400, size: px(76), fill: '#FFFFFF', x: cx, y: S.vh(40),
        reveal: { by: 'word', at: 0.15, mask: true, from: { y: px(90), opacity: 0 }, dur: 0.6, ease: 'ae:85:33', stagger: { each: 0.12 } } }),
      S.text({ text: 'بدها جرأة', family: P.HEAD, weight: 900, size: px(210), fill: '#FFFFFF', x: cx, y: S.vh(52),
        reveal: { by: 'word', at: 0.45, mask: true, from: { y: px(230), opacity: 0 }, dur: 0.7, ease: 'ae:85:33', stagger: { each: 0.14 } } }),
    ],
    sfx: [{ kind: 'impact', at: 0.05, params: { weight: 0.5 }, gain_db: -22 }, { kind: 'swell', at: 1.05, params: { dur: 0.6 }, gain_db: -22 }],
  }];
}
