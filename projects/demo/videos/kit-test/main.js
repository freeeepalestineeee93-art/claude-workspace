// اختبار أدوات المراجع: قصاصة sticker، دونات، أعمدة، رذاذ Bauhaus، CRT
export default async (S) => ({
  background: '#e9e6df',
  post: { grain: { amount: 0.05 }, crt: 0.35, lens: 0.12, scanlines: 0.05, vignette: { strength: 0.3 } },
  scenes: [{ duration: 3, layers: [
    S.text({ text: '١٠', size: S.px(900), weight: 900, fill: '#1f8a4c22', x: S.cx, y: S.vh(40) }),
    S.ellipse({ x: S.cx, y: S.vh(52), w: S.px(620), h: S.px(110), fill: '#1f8a4c' }),
    S.sticker({ src: 'assets/kit/player.png', x: S.cx, y: S.vh(38), w: S.px(560), scale: { at: 0.1, from: 0.6, to: 1, spring: 'playful' }, rotation: -3 }),
    S.donut({ x: S.vw(26), y: S.vh(72), r: S.px(120), width: S.px(30), color: '#c41d29', value: { at: 0.4, from: 0, to: 0.62, dur: 1.2, ease: 'expoOut' } }),
    S.text({ text: '٪٦٢', size: S.px(80), weight: 800, fill: '#222', x: S.vw(26), y: S.vh(72) }),
    S.bars({ x: S.vw(68), y: S.vh(75), values: [0.35, 0.8, 0.55, 1], h: S.px(300), barWidth: S.px(60), gap: S.px(22), color: ['#2a5bd7', '#c41d29', '#2a5bd7', '#111'], at: 0.5 }),
    S.ellipse({ x: S.vw(20), y: S.vh(14), w: S.px(260), fill: '#2a5bd7', spray: { angle: 30, start: 0.3, amount: 1, grain: 1.6 } }),
    S.polygon({ x: S.vw(74), y: S.vh(15), sides: 3, r: S.px(150), fill: '#c41d29', spray: { angle: 200, start: 0.4 } }),
  ] }],
});
