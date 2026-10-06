// «أصغر عامل… أكبر وظيفة» — 17.5s، ألوان فاتحة (كريمي/عسلي/سماوي).
// عالم واحد وكاميرا وحدة متصلة: سحب لورا من الصحن ← دفع لجوّا حقل الزهور ← ميلان للسما (كرة أرضية 3D حقيقية)
// ← سحب لورا من خلية لقرص العسل ← الكاميرا بتلحق نقطة عسل نازلة للمرطبان.
// الانتقالات: ease أفتر (influence 75–85)؛ الثبات: drift بمنحنى الجزيرة المتعلّم. ملمس الجزيرة بالـ post.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { useCamera, World, Layer, At, aeEase } from '../../../../remotion/kit/camera.jsx';
import { DepthImage } from '../../../../remotion/kit/depth.jsx';
import { ArabicText } from '../../../../remotion/kit/arabic.jsx';
import { Flyers } from '../../../../remotion/kit/flyers.jsx';
import { Legacy } from '../../../../remotion/kit/legacy.jsx';
import { Globe, orbitHead2D } from '../../../../remotion/kit/globe.jsx';
import { asset, clamp, out, inOut, hash, lerp } from '../../../../remotion/kit/base.js';

const A = (f) => `projects/bees/assets/${f}`;
const C = { ink: '#2B2A33', muted: '#857D70', honey: '#E3A11C', amber: '#C97F12', cream: '#FBF7EF' };
const F = 'thmanyah sans';

// ── السكربت والمؤثرات (المستويات حسب القاعدة: −18 لـ −26، والماستر −24 بدون موسيقى) ──
export const meta = {
  duration: 17.5,
  post: { edge: 0.74, edgeWidth: 0.42, blur: 10, rgb: 3, bloom: 0.12, grain: 6 },
  audio: {
    master: { lufs: -24 },
    sfx: [
      { kind: 'swell', at: 0.1, params: { dur: 1.4 }, gain_db: -26 },
      { kind: 'whoosh', at: 1.5, align: 'peak', params: { dur: 0.9, brightness: 0.8 }, gain_db: -25 },
      { kind: 'pop', at: 1.45, params: { pitch: 0.8 }, gain_db: -27 },
      { kind: 'swish', at: 2.25, gain_db: -26 },
      { kind: 'whoosh', at: 3.95, align: 'peak', params: { dur: 1.1, brightness: 0.6 }, gain_db: -22 },
      ...Array.from({ length: 9 }, (_, i) => ({ kind: 'pop', at: 4.15 + i * 0.27, params: { pitch: 0.8 + i * 0.05 }, gain_db: -30 })),
      { kind: 'count', at: 4.3, gain_db: -28 },
      { kind: 'whoosh', at: 7.85, align: 'peak', params: { dur: 1.1, brightness: 0.7 }, gain_db: -22 },
      { kind: 'chime', at: 9.05, params: { pitch: 0.9 }, gain_db: -29 }, { kind: 'chime', at: 9.95, params: { pitch: 1.0 }, gain_db: -28 }, { kind: 'chime', at: 10.8, params: { pitch: 1.12 }, gain_db: -26 },
      { kind: 'whoosh', at: 11.55, align: 'peak', params: { dur: 0.9, brightness: 0.8 }, gain_db: -22 },
      { kind: 'count', at: 12.3, gain_db: -28 },
      { kind: 'riser', at: 14.1, align: 'end', params: { dur: 0.6, intensity: 0.4 }, gain_db: -28 },
      { kind: 'drop', at: 15.5, gain_db: -23 },
      { kind: 'swish', at: 15.75, gain_db: -26 },
      { kind: 'chime', at: 16.2, gain_db: -22 },
    ],
  },
};

// ── الكاميرا: نقاط الراحة لكل قسم ──
const CAM = {
  keys: [
    { t: 0, x: 0, y: 200, z: -430, roll: -1.5 },
    { t: 2.7, x: 0, y: 0, z: 0, roll: 0, ease: [55, 90] },               // سحب لورا يكشف الصحن والنحلة
    { t: 3.45, x: 20, y: -10, z: -40, profile: 'pull-pan' },              // drift
    { t: 4.55, x: 0, y: 30, z: -620, roll: 1, ease: [80, 85], dollyRef: 1800, perspective: 1500 }, // دفع لجوّا الحقل
    { t: 7.35, x: 40, y: 10, z: -680, roll: 0, profile: 'push-pan' },
    { t: 8.45, x: 0, y: -2050, z: -650, roll: -1, ease: [75, 85] },       // ميلان للسما
    { t: 11.3, x: -30, y: -2060, z: -700, roll: 0.5, profile: 'push-pan' },
    { t: 14.75, x: 20, y: -2020, z: -660, roll: 0, profile: 'pull-pan' },
    { t: 15.65, x: 0, y: -420, z: -660, roll: 0, ease: [60, 90] },        // لحاق نقطة العسل لتحت
    { t: 17.5, x: -15, y: -440, z: -720, roll: 0.6, profile: 'push-pan' },
  ],
  handheld: { amp: 2.5, freq: 0.32 },
};
const F0 = 1500;

const Txt = (p) => <ArabicText family={F} weight={900} fill={C.ink} {...p} />;
const Sub = (p) => <ArabicText family={F} weight={500} fill={C.muted} {...p} />;
const counter = (t, a, b, to) => Math.round(to * out(clamp((t - a) / (b - a)), 3));
const fmt = (n) => n.toLocaleString('en-US');

// ── عناصر العالم ──
function Stage({ t }) {
  const plateOut = clamp((t - 3.45) / 0.6);
  // نحلة البطل: بتدخل من اليمين بقوس وبتحوم
  const bk = inOut((t - 0.9) / 1.3, 3);
  const bx = lerp(980, -330, bk) + Math.sin(t * 2.3) * 14, by = lerp(-420, -60, bk) + Math.sin(t * 3.1) * 18 - Math.sin(Math.PI * clamp((t - 0.9) / 1.3)) * 180;
  const beeOut = clamp((t - 3.3) / 0.7);
  // زهور الحقل: كل وحدة بتطلع لحالها (spring) حسب تقدّم العدّاد
  const flowers = Array.from({ length: 46 }, (_, i) => {
    const r = (k) => hash(i * 7.3 + k);
    const at = 3.7 + (i / 46) * 2.7 + r(1) * 0.25;
    const k = clamp((t - at) / 0.45), s = k <= 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - (1 - out(k, 3));
    return { i, x: (r(2) - 0.5) * 1500, y: 180 + r(3) * 580, z: -330 + r(4) * 1250, w: 170 + r(5) * 140, src: r(6) > 0.45 ? 'cosmos.png' : 'daisy.png', s: Math.max(0, s), rot: (r(7) - 0.5) * 20 + Math.sin(t * 1.4 + i) * 3 };
  });
  // الكرة والقرص والمرطبان: z = −cam.z للقسم ⇒ حجم طبيعي (d = f + z + cam.z)
  const SZ = 660;
  const comb = clamp((t - 11.25) / 1.0), combIn = out(comb, 4);
  const combScale = lerp(4.2, 1, combIn) * (1 + 0.03 * Math.sin(t * 0.9));
  // نقطة العسل: بتنفصل من القرص وبتنزل بجاذبية لحد فم المرطبان
  const dropT = clamp((t - 14.65) / 0.95), dropY = lerp(-1700, -560, dropT ** 1.8);
  const splash = clamp((t - 15.6) / 0.6);
  return <>
    {/* الصحن + حلقة الثلث (من المحرك القديم عبر الجسر) */}
    <Layer z={0}>
      <At x={0} y={280 + plateOut * 700} opacity={1 - plateOut}><Img src={asset(A('plate.png'))} style={{ width: 820 }} /></At>
      <div style={{ position: 'absolute', left: -540, top: -960 + plateOut * 700, opacity: 1 - plateOut }}>
        <Legacy project="projects/bees" id="ring" build={(S) => ({ layers: [
          S.donut({ value: { at: 1.25, from: 0, to: 1 / 3, dur: 1.1, ease: 'ae:60:90' }, r: S.px(455), width: S.px(22), color: '#E3A11C', track: 'rgba(43,42,51,0.08)', x: S.cx, y: S.cy + S.px(280) }),
        ] })} />
      </div>
    </Layer>
    {/* الحقل */}
    {flowers.map((f) => f.s > 0.001 && <Layer key={f.i} z={f.z}><At x={f.x} y={f.y} scale={f.s} rotate={f.rot} origin="50% 100%"><Img src={asset(A(f.src))} style={{ width: f.w }} /></At></Layer>)}
    {/* الكرة الأرضية (3D) + نحلة على راس المدار */}
    <Layer z={SZ}><GlobeStage t={t} /></Layer>
    {/* قرص العسل: سحب لورا من خلية وحدة */}
    {t > 11.0 && t < 16.4 && <Layer z={SZ}><At x={0} y={-1880} scale={combScale} opacity={clamp((t - 11.1) / 0.3) * (1 - clamp((t - 15.8) / 0.5))}>
      <div style={{ position: 'relative', width: 1500 }}>
        <Img src={asset(A('honeycomb.png'))} style={{ width: 1500, display: 'block' }} />
        <HexGlow t={t} />
      </div>
    </At></Layer>}
    {/* نقطة العسل + رذاذ */}
    {t > 14.6 && t < 16.2 && <Layer z={SZ}>
      <At x={0} y={dropY}><svg width="110" height="154" viewBox="0 0 60 84"><path d="M30 2 C30 2 4 40 4 56 a26 26 0 0 0 52 0 C56 40 30 2 30 2Z" fill="#E9A21A" /><ellipse cx="22" cy="54" rx="6" ry="10" fill="#FFE3A3" opacity=".7" /></svg></At>
      {splash > 0 && <At x={0} y={-560} scale={0.3 + splash * 1.8} opacity={1 - splash}><div style={{ width: 120, height: 34, borderRadius: '50%', border: '5px solid #E9A21A' }} /></At>}
    </Layer>}
    {/* المرطبان */}
    {t > 13 && <Layer z={SZ}><At x={0} y={-260} scale={0.96 + 0.04 * out(clamp((t - 15.2) / 0.8))}><Img src={asset(A('jar.png'))} style={{ width: 780 }} /></At></Layer>}
    {/* نحلة البطل (قسم ١) */}
    {beeOut < 1 && <Layer z={-240}><At x={bx - beeOut * 900} y={by - beeOut * 300} rotate={-8 + Math.sin(t * 9) * 2} opacity={1 - beeOut}>
      <Img src={asset(A('bee-side.png'))} style={{ width: 330, transform: 'scaleX(-1)' }} />
    </At></Layer>}
    {/* نحلة بتحط على ملعقة العسل (قسم ٥) */}
    {t > 15.6 && <Layer z={SZ - 60}><At x={lerp(-700, 150, out(clamp((t - 15.7) / 0.9), 3)) + Math.sin(t * 2.2) * 8} y={lerp(-1100, -640, out(clamp((t - 15.7) / 0.9), 3)) + Math.sin(t * 3) * 6} rotate={6 + Math.sin(t * 8) * 1.5}>
      <Img src={asset(A('bee-front.png'))} style={{ width: 230 }} />
    </At></Layer>}
  </>;
}

// خلايا سداسية بتضوي موجة موجة من النص (فوق صورة القرص) مع عدّاد الـ60 ألف
function HexGlow({ t }) {
  const cells = [];
  const R = 34, w = Math.sqrt(3) * R;
  for (let row = 0; row < 9; row++) for (let col = 0; col < 13; col++) {
    const x = col * w + (row % 2) * w / 2 + 80, y = row * R * 1.5 + 90;
    const d = Math.hypot(x - 450, y - 330) / 520;
    const k = clamp((t - 12.25 - d * 1.5 - hash(row * 13 + col) * 0.2) / 0.35);
    if (k <= 0) continue;
    const pts = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 6 + (i * Math.PI) / 3; return `${(x + Math.cos(a) * R * 0.86).toFixed(1)},${(y + Math.sin(a) * R * 0.86).toFixed(1)}`; }).join(' ');
    cells.push(<polygon key={`${row}-${col}`} points={pts} fill="#FFD36B" opacity={0.45 * k * (1 - 0.5 * clamp((t - 13.6 - d) / 0.8))} />);
  }
  const m = `url(${asset(A('honeycomb.png'))})`;
  return <div style={{ position: 'absolute', inset: 0, maskImage: m, WebkitMaskImage: m, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}>
    <svg viewBox="0 0 900 675" style={{ width: '100%', height: '100%', mixBlendMode: 'screen' }}>{cells}</svg></div>;
}

function GlobeStage({ t }) {
  const laps = 3 * inOut(clamp((t - 8.25) / 2.6), 2);
  const gin = out(clamp((t - 7.75) / 0.9), 3), gout = clamp((t - 11.05) / 0.5);
  if (t < 7.4 || gout >= 1) return null;
  const size = 1000;
  const head = orbitHead2D(laps, size);
  return <At x={0} y={-1860 - gout * 400} scale={(0.7 + 0.3 * gin) * (1 - 0.5 * gout)} opacity={gin * (1 - gout)}>
    <div style={{ position: 'relative', width: size, height: size }}>
      <Globe size={size} spin={(tt) => 30 + tt * 22} orbit={laps > 0.01 ? { laps: () => laps, tilt: 18, color: '#E3A11C', width: 0.016 } : null} />
      {laps > 0.01 && <Img src={asset(A('bee-side.png'))} style={{ position: 'absolute', left: head.x - 70, top: head.y - 52, width: 140, opacity: head.front ? 1 : 0.25, transform: `scale(${head.front ? 1 : 0.8})` }} />}
    </div>
  </At>;
}

function Scene({ t }) {
  const cam = useCamera(CAM);
  return <World camera={cam} perspective={F0}>
    <AbsoluteFill style={{ background: '#F6F1E6' }} />
    <DepthImage dir={A('meadow-depth')} x={0} y={-1000} w={3500} z={1800} depth={600} />
    {/* غسلة كريمية بتخلّي الألوان فاتحة والنص مقروء */}
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(251,247,239,.82) 0%, rgba(251,247,239,.55) 45%, rgba(251,247,239,.25) 100%)' }} />
    <Stage t={t} />
    {/* أشياء طايرة قريبة (متل الأوراق النقدية بالجزيرة): بتلات ونحلات صغيرة */}
    <Flyers items={[{ src: A('daisy.png'), w: 110 }, { src: A('cosmos.png'), w: 120 }]} count={7} seed={4} t0={-2} t1={17.5} area={[-700, -1300, 700, 400]} z={[-520, -150]} drift={[-1, 0.55]} speed={[240, 420]} />
    <Flyers items={[{ src: A('bee-front.png'), w: 90 }]} count={6} seed={9} t0={3.9} t1={15} area={[-800, -2600, 800, 300]} z={[-200, 500]} drift={[1, -0.35]} speed={[180, 340]} spin={[-20, 20]} blurNear={6} />
  </World>;
}

// ── النصوص (طبقة الشاشة) ──
function Texts({ t }) {
  const X = 540;
  return <>
    {/* ١ */}
    <Txt text="لقمة من كل ثلاث" size={96} x={X} y={300} reveal={{ by: 'word', at: 0.35, dur: 0.6, stagger: 0.12, mask: true, from: { y: 100, opacity: 0 } }} exit={{ by: 'word', at: 3.25, dur: 0.3, stagger: 0.04, ease: 'in', to: { y: -50, opacity: 0, blur: 8 } }} />
    <Sub text="على مائدتك…" size={58} x={X} y={395} reveal={{ by: 'word', at: 0.85, dur: 0.45, stagger: 0.08, from: { y: 24, opacity: 0, blur: 6 } }} exit={{ by: 'all', at: 3.2, dur: 0.3, to: { opacity: 0 } }} />
    <Txt text="وراها نحلة" size={128} x={X} y={540} words={{ 1: { fill: C.honey } }} kashida={[{ word: 1, amount: 190 * out(clamp((t - 2.25) / 0.5), 3) }]}
      reveal={{ by: 'word', at: 1.95, dur: 0.55, stagger: 0.12, mask: true, from: { y: 130, opacity: 0 } }} exit={{ by: 'word', at: 3.3, dur: 0.3, stagger: 0.05, ease: 'in', to: { y: -60, opacity: 0, blur: 8 } }} />
    {/* ٢ */}
    <Txt text="لصنع كيلو عسل" size={86} x={X} y={250} reveal={{ by: 'word', at: 3.95, dur: 0.55, stagger: 0.1, mask: true, from: { y: 90, opacity: 0 } }} exit={{ by: 'word', at: 7.2, dur: 0.3, stagger: 0.04, ease: 'in', to: { y: -50, opacity: 0, blur: 8 } }} />
    <Sub text="تزور النحلات نحو" size={58} x={X} y={345} reveal={{ by: 'word', at: 4.2, dur: 0.45, stagger: 0.08, from: { y: 24, opacity: 0, blur: 6 } }} exit={{ by: 'all', at: 7.15, dur: 0.3, to: { opacity: 0 } }} />
    {t > 4.25 && t < 7.6 && <Txt text={fmt(counter(t, 4.25, 6.55, 4000000))} size={170} fill={C.honey} x={X} y={480} reveal={{ by: 'all', at: 4.25, dur: 0.35, from: { scale: 0.8, opacity: 0 } }} exit={{ by: 'all', at: 7.2, dur: 0.3, ease: 'in', to: { y: -60, opacity: 0, blur: 10 } }} />}
    <Txt text="زهرة" size={84} x={X} y={610} reveal={{ by: 'word', at: 4.5, dur: 0.5, mask: true, from: { y: 90, opacity: 0 } }} exit={{ by: 'word', at: 7.25, dur: 0.3, ease: 'in', to: { y: -50, opacity: 0, blur: 8 } }} />
    {/* ٣ */}
    <Txt text="وتطير مسافة تعادل" size={86} x={X} y={250} reveal={{ by: 'word', at: 7.95, dur: 0.55, stagger: 0.1, mask: true, from: { y: 90, opacity: 0 } }} exit={{ by: 'word', at: 11.05, dur: 0.3, stagger: 0.04, ease: 'in', to: { y: -50, opacity: 0, blur: 8 } }} />
    {t > 8.25 && t < 11.45 && <Txt text={String(Math.max(1, Math.min(3, Math.ceil(3 * inOut(clamp((t - 8.25) / 2.6), 2) - 1e-6))))} size={190} fill={C.honey} x={X - 120} y={410}
      reveal={{ by: 'all', at: 8.25, dur: 0.35, from: { scale: 0.7, opacity: 0 } }} exit={{ by: 'all', at: 11.1, dur: 0.3, ease: 'in', to: { y: -60, opacity: 0, blur: 10 } }} />}
    <Txt text="دورات" size={110} x={X + 90} y={415} reveal={{ by: 'word', at: 8.4, dur: 0.5, mask: true, from: { y: 110, opacity: 0 } }} exit={{ by: 'word', at: 11.1, dur: 0.3, ease: 'in', to: { y: -50, opacity: 0, blur: 8 } }} />
    <Sub text="حول الأرض" size={62} x={X} y={530} reveal={{ by: 'word', at: 8.65, dur: 0.45, stagger: 0.08, from: { y: 24, opacity: 0, blur: 6 } }} exit={{ by: 'all', at: 11.05, dur: 0.3, to: { opacity: 0 } }} />
    {/* ٤ */}
    <Txt text="خلية واحدة" size={96} x={X} y={250} reveal={{ by: 'word', at: 11.75, dur: 0.55, stagger: 0.12, mask: true, from: { y: 100, opacity: 0 } }} exit={{ by: 'word', at: 14.45, dur: 0.3, stagger: 0.04, ease: 'in', to: { y: -50, opacity: 0, blur: 8 } }} />
    <Sub text="تضمّ حتى" size={58} x={X} y={345} reveal={{ by: 'word', at: 12.0, dur: 0.45, stagger: 0.08, from: { y: 24, opacity: 0, blur: 6 } }} exit={{ by: 'all', at: 14.4, dur: 0.3, to: { opacity: 0 } }} />
    {t > 12.3 && t < 14.8 && <Txt text={fmt(counter(t, 12.3, 13.9, 60000))} size={170} fill={C.honey} x={X} y={480} reveal={{ by: 'all', at: 12.3, dur: 0.35, from: { scale: 0.8, opacity: 0 } }} exit={{ by: 'all', at: 14.45, dur: 0.3, ease: 'in', to: { y: -60, opacity: 0, blur: 10 } }} />}
    <Txt text="نحلة" size={84} x={X} y={610} reveal={{ by: 'word', at: 12.55, dur: 0.5, mask: true, from: { y: 90, opacity: 0 } }} exit={{ by: 'word', at: 14.5, dur: 0.3, ease: 'in', to: { y: -50, opacity: 0, blur: 8 } }} />
    {/* ٥ */}
    <Txt text="أصغر عامل…" size={104} x={X} y={300} reveal={{ by: 'word', at: 15.7, dur: 0.55, stagger: 0.12, mask: true, from: { y: 110, opacity: 0 } }} />
    <Txt text="أكبر وظيفة" size={134} x={X} y={460} words={{ 1: { fill: C.honey } }} kashida={[{ word: 1, amount: 170 * out(clamp((t - 16.45) / 0.55), 3) }]}
      reveal={{ by: 'word', at: 16.05, dur: 0.55, stagger: 0.14, mask: true, from: { y: 140, opacity: 0 } }} />
  </>;
}

export default function Bees() {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  return <AbsoluteFill style={{ background: '#F6F1E6' }}>
    <CameraMotionBlur shutterAngle={170} samples={5}><Scene t={t} /></CameraMotionBlur>
    <Texts t={t} />
  </AbsoluteFill>;
}
