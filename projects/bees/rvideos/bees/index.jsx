// «أصغر عامل… أكبر وظيفة» — 17.5s، ألوان فاتحة (كريمي/عسلي/سماوي). النسخة ٢.
// عالم واحد وكاميرا وحدة متصلة: نحلة بتمرق لاصقة بالعدسة (hook) ← سحب لورا من الصحن ← دفع لجوّا حقل الزهور
// ← ميلان للكرة الأرضية (3D) ← نحلة المدار بتغطس بخلية: ماكرو Blender بيسحب لورا لقرص العسل ← نقطة عسل
// بتنزل لمرطبان Blender (سطح العسل بيتموّج فعلياً) ← النحلة بتحط على الملعقة (ضربة الختام).
// قواعد النسخة ٢ (من نقد النسخة ١): تكوين مختلف لكل قسم، النص جوّا العالم (parallax + عناصر بتغطيه)،
// ضو شمس دافي بدل غسلة باهتة، جوانح بترفرف، خروج كل نص بحركة مختلفة، طنين نحلة stereo بيلحقها.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { useCamera, World, Layer, At } from '../../../../remotion/kit/camera.jsx';
import { DepthImage } from '../../../../remotion/kit/depth.jsx';
import { ArabicText } from '../../../../remotion/kit/arabic.jsx';
import { Flyers } from '../../../../remotion/kit/flyers.jsx';
import { Legacy } from '../../../../remotion/kit/legacy.jsx';
import { Globe, orbitHead2D } from '../../../../remotion/kit/globe.jsx';
import { asset, clamp, out, inOut, hash, lerp } from '../../../../remotion/kit/base.js';

const A = (f) => `projects/bees/assets/${f}`;
const C = { ink: '#2B2A33', muted: '#7A6F60', honey: '#E3A11C', deep: '#B9700C' };
const F = 'thmanyah sans';

// ── المؤثرات (−22 لـ −30، ماستر −24 بدون موسيقى) + طنين stereo (tools: projects/bees/blender/buzz.py) ──
export const meta = {
  duration: 17.5,
  post: { edge: 0.72, edgeWidth: 0.42, blur: 10, rgb: 3, bloom: 0.14, grain: 6 },
  audio: {
    master: { lufs: -24 },
    sfx: [
      { src: 'projects/bees/assets/gen/buzz.wav', at: 0, gain_db: -22 },
      { kind: 'whoosh', at: 0.32, align: 'peak', params: { dur: 0.6, brightness: 0.9 }, gain_db: -27 },
      { kind: 'swell', at: 0.4, params: { dur: 1.4 }, gain_db: -28 },
      { kind: 'pop', at: 1.45, params: { pitch: 0.8 }, gain_db: -27 },
      { kind: 'scribble', at: 1.3, params: { dur: 1.0 }, gain_db: -30 },
      { kind: 'swish', at: 2.3, gain_db: -27 },
      { kind: 'whoosh', at: 3.95, align: 'peak', params: { dur: 1.1, brightness: 0.6 }, gain_db: -23 },
      ...[3.62, 3.9, 4.21, 4.45, 4.8, 5.02, 5.4, 5.71, 6.1].map((at, i) => ({ kind: 'pop', at, params: { pitch: 0.75 + i * 0.06 }, gain_db: -31 })),
      { kind: 'count', at: 4.3, gain_db: -28 },
      { kind: 'whoosh', at: 7.85, align: 'peak', params: { dur: 1.1, brightness: 0.7 }, gain_db: -23 },
      { kind: 'chime', at: 9.05, params: { pitch: 0.9 }, gain_db: -29 }, { kind: 'chime', at: 9.95, params: { pitch: 1.0 }, gain_db: -28 }, { kind: 'chime', at: 10.8, params: { pitch: 1.12 }, gain_db: -26 },
      { kind: 'whoosh', at: 11.15, align: 'peak', params: { dur: 0.7, brightness: 0.9 }, gain_db: -23 },
      { kind: 'sparkle', at: 12.3, params: { dur: 1.6 }, gain_db: -30 },
      { kind: 'count', at: 12.3, gain_db: -29 },
      { kind: 'riser', at: 14.6, align: 'end', params: { dur: 0.6, intensity: 0.4 }, gain_db: -29 },
      { kind: 'pop', at: 15.6, params: { pitch: 0.55 }, gain_db: -24 },
      { kind: 'swish', at: 15.75, gain_db: -27 },
      { kind: 'hit', at: 16.62, gain_db: -26 },
      { kind: 'chime', at: 17.0, params: { pitch: 1.2 }, gain_db: -23 },
    ],
  },
};

// ── الكاميرا: نقاط الراحة لكل قسم (ease أفتر للانتقالات، drift متعلّم للثبات) ──
const CAM = {
  keys: [
    { t: 0, x: 30, y: 120, z: -200, roll: -1.8 },
    { t: 2.7, x: 0, y: 0, z: 0, roll: 0, ease: [55, 90] },
    { t: 3.45, x: 20, y: -10, z: -40, profile: 'pull-pan' },
    { t: 4.55, x: 0, y: 30, z: -620, roll: 1, ease: [80, 85], dollyRef: 1800, perspective: 1500 },
    { t: 7.2, x: 40, y: 10, z: -680, roll: 0, profile: 'push-pan' },
    { t: 8.6, x: 0, y: -1350, z: -650, roll: -1, ease: [55, 70] },
    { t: 11.3, x: -30, y: -1360, z: -700, roll: 0.5, profile: 'push-pan' },
    { t: 14.75, x: 20, y: -1320, z: -660, roll: 0, profile: 'pull-pan' },
    { t: 15.65, x: 0, y: -420, z: -660, roll: 0, ease: [92, 88] },
    { t: 17.5, x: -10, y: -450, z: -760, roll: 0.6, profile: 'push-pan' },
  ],
  handheld: { amp: 2.5, freq: 0.32 },
};
const F0 = 1500;

const T = (p) => <ArabicText family={F} weight={900} fill={C.ink} {...p} />;
const S = (p) => <ArabicText family={F} weight={500} fill={C.muted} {...p} />;
const WT = ({ z, children }) => <Layer z={z}>{children}</Layer>;   // نص جوّا العالم
const counter = (t, a, b, to) => Math.round(to * out(clamp((t - a) / (b - a)), 3));
const fmt = (n) => n.toLocaleString('en-US');

// ── نحلة بجوانح بترفرف: جسم + 3 نسخ جوانح بزوايا مختلفة (متل اللي بتلقطه كاميرا حقيقية لجنح 200Hz) ──
function Bee({ kind = 'side', w, t, seed = 0, flip = false, blur = 0, still = false }) {
  const n = kind === 'side' ? 'bee-side' : 'bee-front';
  const k = Math.floor(t * 30) + seed * 17;
  const ph = hash(k);
  const ghosts = kind === 'side'
    ? [[-26 + ph * 10, 0.5], [4 + ph * 8, 0.38], [30 - ph * 6, 0.22]].map(([a, o]) => ({ tr: `rotate(${a}deg)`, o }))
    : [[1, 0.5], [0.35 + ph * 0.2, 0.36], [-0.45 + ph * 0.2, 0.22]].map(([s, o]) => ({ tr: `scaleY(${s})`, o }));
  const origin = kind === 'side' ? '37% 31%' : '50% 35%';
  const gs = still ? [{ tr: 'none', o: 1 }] : ghosts;
  const st = { position: 'absolute', left: 0, top: 0, width: w };
  return <div style={{ position: 'relative', width: w, height: w * (kind === 'side' ? 0.749 : 1), transform: flip ? 'scaleX(-1)' : undefined, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
    {gs.map((g, i) => <Img key={i} src={asset(A(`${n}-wings.png`))} style={{ ...st, opacity: g.o, transform: g.tr, transformOrigin: origin }} />)}
    <Img src={asset(A(`${n}-body.png`))} style={st} />
  </div>;
}

// ── القسم ١: الصحن + حلقة الثلث + نحلة البطل ──
function Plate({ t }) {
  const k = clamp((t - 3.45) / 0.6) ** 2;
  if (t > 4.3) return null;   // ما منرسمها بعد ما تطلع (كانت تنرسم 17 ثانية على الفاضي)
  return <Layer z={60}>
    {/* ظل تلامس */}
    <At x={-40} y={600 + k * 1500}><div style={{ width: 760, height: 90, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(90,60,20,.28), rgba(90,60,20,0))' }} /></At>
    <At x={-40} y={330 + k * 1500} rotate={k * 14}><Img src={asset(A('plate.png'))} style={{ width: 880 }} /></At>
    <div style={{ position: 'absolute', left: -540, top: -960 + k * 1500 }}>
      <Legacy project="projects/bees" id="ring" build={(S) => ({ layers: [
        S.donut({ value: { at: 1.25, from: 0, to: 1 / 3, dur: 1.1, ease: 'ae:60:90' }, r: S.px(470), width: S.px(24), color: '#E3A11C', track: 'rgba(43,42,51,0.07)', x: S.cx - S.px(40), y: S.cy + S.px(330) }),
      ] })} />
    </div>
  </Layer>;
}

function HeroBee({ t }) {
  // بتدخل من اليمين بقوس، بتحوم فوق الحلقة، وبتطلع لفوق-يسار مع الدفع
  const bk = inOut((t - 0.9) / 1.3, 3), go = clamp((t - 3.3) / 0.7);
  if (t < 0.85 || go >= 1) return null;
  const bx = lerp(980, -360, bk) + Math.sin(t * 2.3) * 14 - out(go, 2) * 900;
  const by = lerp(-460, -150, bk) + Math.sin(t * 3.1) * 18 - Math.sin(Math.PI * clamp((t - 0.9) / 1.3)) * 180 - go * 420;
  return <Layer z={-240}><At x={bx} y={by} rotate={-8 + Math.sin(t * 9) * 2 - go * 18}><Bee kind="side" w={340} t={t} flip /></At></Layer>;
}

// hook: نحلة لاصقة بالعدسة بتمرق من اليمين لليسار بأول نص ثانية (مضببة، ضخمة)
function HookBee({ t }) {
  const k = (t - 0.02) / 0.62;
  if (k < 0 || k > 1) return null;
  const x = lerp(330, -360, inOut(k, 2)), y = 110 + Math.sin(k * Math.PI) * -70;
  return <Layer z={-700}><At x={x} y={y} rotate={-12 + k * 10}><Bee kind="side" w={330} t={t} seed={3} flip blur={7} /></At></Layer>;
}

// ── القسم ٢: الحقل — زهور بتطلع spring، والرقم الضخم ورا الزهور القريبة ──
function Field({ t, inserts = [] }) {
  const flowers = Array.from({ length: 46 }, (_, i) => {
    const r = (k) => hash(i * 7.3 + k);
    const at = 3.3 + Math.pow(i / 46, 1.5) * 3.0 + r(1) * 0.25;
    const k = clamp((t - at) / 0.45), s = k <= 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - (1 - out(k, 3));
    return { i, x: (r(2) - 0.5) * 1500, y: 120 + r(3) * 640, z: -330 + r(4) * 1250, w: 170 + r(5) * 140, src: r(6) > 0.45 ? 'cosmos.png' : 'daisy.png', s: Math.max(0, s),
      rot: (r(7) - 0.5) * 20 + Math.sin(t * (1.1 + r(8) * 0.6) + i) * 6 + Math.sin(t * 2.7 + i * 1.7) * 2 };
  });
  // ترتيب بالعمق (البعيد أول): الـ DOM ما بيرتّب حسب z، فالإدخالات (الرقم، «زهرة») بتنحط بمحلها بين الزهور
  const items = flowers.filter((f) => f.s > 0.001).map((f) => ({ z: f.z, el: <Layer key={f.i} z={f.z}><At x={f.x} y={f.y} scale={f.s} rotate={f.rot} origin="50% 100%"><Img src={asset(A(f.src))} style={{ width: f.w }} /></At></Layer> }));
  for (const [i, ins] of inserts.entries()) items.push({ z: ins.z, el: <React.Fragment key={`ins${i}`}>{ins.el}</React.Fragment> });
  items.sort((a, b) => b.z - a.z);
  return <>{items.map((it) => it.el)}</>;
}

function FieldWords({ t }) {
  return [
    { z: 780, el: t > 4.2 && t < 7.7 && <Layer z={780}>
      <T text={fmt(counter(t, 4.25, 6.55, 4000000))} size={215} fill={C.honey} x={0} y={-330} reveal={{ by: 'all', at: 4.25, dur: 0.4, spring: { damping: 15, stiffness: 140 }, from: { scale: 0.75, opacity: 0 } }}
        exit={{ by: 'all', at: 7.2, dur: 0.35, ease: 'in', to: { y: -140, scale: 1.08, opacity: 0, blur: 12 } }} />
    </Layer> },
    { z: 300, el: <Layer z={300}>
      <T text="زهرة" size={128} fill={C.deep} x={180} y={-60} kashida={[{ word: 0, amount: 120 * out(clamp((t - 5.0) / 0.6), 3) }]}
        reveal={{ by: 'all', at: 4.55, dur: 0.5, mask: true, from: { y: 120, opacity: 0 } }} exit={{ by: 'all', at: 7.25, dur: 0.3, ease: 'in', to: { y: 160, opacity: 0, blur: 8 } }} />
    </Layer> },
  ];
}

// ── القسم ٣: الكرة الأرضية (3D) + نحلة على راس المدار ──
function GlobeStage({ t }) {
  const laps = 3 * inOut(clamp((t - 8.25) / 2.6), 2);
  const gin = out(clamp((t - 7.45) / 0.8), 4), gout = clamp((t - 11.0) / 0.45);
  if (t < 7.4 || gout >= 1) return null;
  const size = 1000;
  const head = orbitHead2D(laps, size);
  return <Layer z={650}><At x={-230 + clamp((t - 8.0) / 3) * 70} y={-1080 - gout * 300 + Math.sin(t * 1.3) * 14} scale={(0.7 + 0.3 * gin) * (1 - 0.4 * gout)} opacity={clamp((t - 7.45) / 0.2) * (1 - gout)}>
    <div style={{ position: 'relative', width: size, height: size }}>
      <Globe size={size} spin={(tt) => 30 + tt * 40} orbit={laps > 0.01 ? { laps: () => laps, tilt: 18, color: '#E3A11C', width: 0.017 } : null} />
      {laps > 0.01 && <div style={{ position: 'absolute', left: head.x - 80, top: head.y - 60, opacity: head.front ? 1 : 0.3, transform: `scale(${head.front ? 1 : 0.75})` }}><Bee kind="side" w={160} t={t} seed={5} /></div>}
    </div>
  </At></Layer>;
}

// ── القسم ٤: قرص Blender — ماكرو جوّا خلية بيسحب لورا (39 فريم) ثم صورة ثابتة عالية الدقة ──
const COMB_T0 = 11.1, COMB_DUR = 1.45;
// بعد كاميرا Blender عن الهدف لكل فريم (comb.py --dump). المقياس الظاهري ∝ 1/البعد، فالسرعة المحسوسة = d(log بعد)/dt.
// Blender بيبلّش بقفزة (نتعة)؛ منعيد التوقيت لحتى log(البعد) يمشي على ease ناعم.
const COMB_D = [1.1948, 1.26, 1.4516, 1.7633, 2.1886, 2.7207, 3.3524, 4.0767, 4.8864, 5.7744, 6.7336, 7.7569, 8.8372, 9.9674, 11.1405, 12.3495, 13.5872, 14.8466, 16.1206, 17.4022, 18.6843, 19.9598, 21.2218, 22.4631, 23.6767, 24.8555, 25.9925, 27.0806, 28.1127, 29.0819, 29.981, 30.803, 31.5408, 32.1874, 32.7358, 33.1788, 33.5094, 33.7206, 33.8053].map(Math.log);
function combFrame(t) {
  const u = clamp((t - COMB_T0) / COMB_DUR);
  const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
  const L = COMB_D[0] + (COMB_D[38] - COMB_D[0]) * e;
  let i = 0; while (i < 37 && COMB_D[i + 1] < L) i++;
  return u >= 1 ? 38 : Math.min(38, i + clamp((L - COMB_D[i]) / (COMB_D[i + 1] - COMB_D[i])));
}
function Comb({ t }) {
  if (t < 10.95 || t > 15.8) return null;
  const fr = combFrame(t), f0 = Math.floor(fr), mix = fr - f0;
  const at = (i) => `gen/comb/${String(i).padStart(4, '0')}.png`;
  // دخول: دائرة بتكبر من مكان نحلة المدار (النحلة "بتغطس" بالخلية)
  const r = out(clamp((t - 10.95) / 0.45), 3) * 1500;
  const fade = 1 - clamp((t - 15.35) / 0.4);
  return <Layer z={700}><At x={-15} y={-1420} opacity={fade}>
    <div style={{ position: 'relative', width: 1210, height: 2150, clipPath: `circle(${r.toFixed(0)}px at 40% 62%)` }}>
      {fr >= 38 ? <Img src={asset(A('gen/comb-hold/0038.png'))} style={{ width: '100%', height: '100%', display: 'block' }} /> : <>
        <Img src={asset(A(at(f0)))} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        {mix > 0.02 && <Img src={asset(A(at(f0 + 1)))} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: mix }} />}
      </>}
      {fr >= 38 && <CombGlow t={t} />}
    </div>
  </At></Layer>;
}
// موجة ضو بتنتشر على القرص مع العدّاد — مقصوصة على بكسلات القرص نفسه
function CombGlow({ t }) {
  const k = clamp((t - 12.6) / 1.5);
  if (k <= 0 || k >= 1) return null;
  const R = 6 + out(k, 2) * 70, a = 0.75 * Math.sin(Math.PI * k);
  const m = `url(${asset(A('gen/comb-hold/0038.png'))})`;
  return <div style={{ position: 'absolute', inset: 0, maskImage: m, WebkitMaskImage: m, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', mixBlendMode: 'screen',
    background: `radial-gradient(ellipse 50% 28% at 48% 52%, rgba(255,236,170,0) ${Math.max(0, R - 14)}%, rgba(255,236,170,${a.toFixed(3)}) ${R}%, rgba(255,236,170,0) ${R + 10}%)` }} />;
}

// ── القسم ٥: نقطة العسل + مرطبان Blender + النحلة بتحط على الملعقة ──
const JAR = { x: -110, y: -230, w: 780 };
function Jar({ t }) {
  if (t < 14.65) return null;
  const rise = (1 - out(clamp((t - 14.7) / 0.95), 3)) * 700;
  const f = Math.min(76, Math.max(0, Math.floor((t - 15.0) * 15)) * 2);
  return <Layer z={660}><At x={JAR.x} y={JAR.y + rise}><Img src={asset(A(`gen/jar/${String(f).padStart(4, '0')}.png`))} style={{ width: JAR.w, display: 'block', filter: 'saturate(1.12) hue-rotate(-7deg)' }} /></At></Layer>;
}
function Drop({ t }) {
  const k = clamp((t - 14.65) / 0.95);
  if (t < 14.6 || k >= 1) return null;
  const x = lerp(-40, JAR.x, k), y = lerp(-960, -330, k ** 1.8);
  return <Layer z={660}><At x={x} y={y}><svg width="96" height="134" viewBox="0 0 60 84" style={{ transform: `scale(${1 - k * 0.15}, ${1 + k ** 2 * 0.35})` }}>
    <path d="M30 2 C30 2 4 40 4 56 a26 26 0 0 0 52 0 C56 40 30 2 30 2Z" fill="#E59B17" /><ellipse cx="22" cy="54" rx="6" ry="10" fill="#FFE3A3" opacity=".75" /></svg></At></Layer>;
}
function LandingBee({ t }) {
  if (t < 15.6) return null;
  const k = out(clamp((t - 15.7) / 0.95), 3);
  const land = clamp((t - 16.62) / 0.25);   // لحظة الهبوط: ضغطة خفيفة
  const squash = 1 - 0.08 * Math.sin(Math.PI * land);
  const hover = (1 - clamp((t - 16.5) / 0.2)) * Math.sin(t * 3) * 7;
  return <Layer z={600}><At x={lerp(-820, -236, k) + hover} y={lerp(-1150, -652, k) + hover} rotate={lerp(14, 4, k)} scale={squash} origin="50% 90%">
    <Bee kind="front" w={220} t={t} seed={9} still={t > 16.72} />
  </At></Layer>;
}
// حلقة تموّج على سطح العسل لحظة وقوع النقطة (تموّج Blender خفيف، هاد بيأكّده)
function Ripple({ t }) {
  const k = clamp((t - 15.6) / 0.7);
  if (k <= 0 || k >= 1) return null;
  return <Layer z={660}>{[0, 0.18].map((d, i) => { const q = clamp((k - d) / (1 - d)); return q > 0 && <At key={i} x={JAR.x + 4} y={JAR.y - 88}>
    <div style={{ width: 40 + q * 300, height: (40 + q * 300) * 0.22, borderRadius: '50%', border: `${(3 - q * 2).toFixed(1)}px solid rgba(255,226,150,${(0.8 * (1 - q)).toFixed(2)})` }} /></At>; })}</Layer>;
}
// ضربة الختام: لمعة ضو بتمسح زجاج المرطبان (مقصوصة على المرطبان نفسه) لما تحط النحلة
function Glint({ t }) {
  const k = clamp((t - 16.75) / 0.6);
  if (k <= 0 || k >= 1) return null;
  const m = `url(${asset(A('gen/jar/0040.png'))})`;
  return <Layer z={659}><At x={JAR.x} y={JAR.y}><div style={{ width: JAR.w, height: JAR.w * 1.25, maskImage: m, WebkitMaskImage: m, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', mixBlendMode: 'screen',
    background: `linear-gradient(115deg, rgba(255,255,255,0) ${-30 + k * 150}%, rgba(255,250,230,.75) ${-18 + k * 150}%, rgba(255,255,255,0) ${-6 + k * 150}%)` }} /></At></Layer>;
}

// ── النصوص (كلها جوّا العالم، كل قسم بتكوين وخروج مختلف) ──
function Words({ t }) {
  return <>
    {/* ١: عنوان يمين-فوق، «وراها نحلة» تحت يمين؛ خروج: حروف لفوق بـ blur / كلمات لتحت مع الصحن */}
    <WT z={-90}>
      <T text="لقمة من كل ثلاث" size={108} anchor="start" x={380} y={-690} reveal={{ by: 'word', at: 0.45, dur: 0.6, stagger: 0.13, mask: true, from: { y: 110, opacity: 0 } }}
        exit={{ by: 'glyph', at: 3.2, dur: 0.32, stagger: 0.018, ease: 'in', to: { y: -90, opacity: 0, blur: 10 } }} />
      <S text="على مائدتك…" size={54} anchor="start" x={380} y={-588} reveal={{ by: 'word', at: 0.95, dur: 0.45, stagger: 0.08, from: { x: 30, opacity: 0, blur: 6 } }}
        exit={{ by: 'all', at: 3.15, dur: 0.3, ease: 'in', to: { x: 60, opacity: 0 } }} />
      <T text="وراها نحلة" size={150} anchor="start" x={380} y={790} words={{ 1: { fill: C.honey } }} kashida={[{ word: 1, amount: 200 * out(clamp((t - 2.3) / 0.5), 3) }]}
        reveal={{ by: 'word', at: 1.95, dur: 0.55, stagger: 0.12, spring: { damping: 13, stiffness: 170, mass: 0.9 }, from: { y: 160, opacity: 0 } }}
        exit={{ by: 'word', at: 3.4, dur: 0.4, stagger: 0.06, ease: 'in', to: { y: 380, rotate: 6, opacity: 0 } }} />
    </WT>
    {/* ٢: عنوان يسار-فوق، الرقم ضخم ورا الزهور القريبة، «زهرة» بكشيدة قدّامها */}
    <WT z={560}>
      <T text="لصنع كيلو عسل" size={92} anchor="end" x={-400} y={-690} reveal={{ by: 'word', at: 3.75, dur: 0.55, stagger: 0.1, mask: true, from: { y: 90, opacity: 0 } }}
        exit={{ by: 'word', at: 7.15, dur: 0.3, stagger: 0.04, ease: 'in', to: { x: -120, opacity: 0, blur: 8 } }} />
      <S text="تزور النحلات نحو" size={54} anchor="end" x={-400} y={-592} reveal={{ by: 'word', at: 4.0, dur: 0.45, stagger: 0.08, from: { y: 24, opacity: 0, blur: 6 } }}
        exit={{ by: 'all', at: 7.1, dur: 0.3, to: { x: -80, opacity: 0 } }} />
    </WT>
    {/* ٣: كتلة يمين (الرقم 3 ضخم)، الكرة مقصوصة يسار-تحت */}
    <WT z={560}>
      <S text="وتطير مسافة تعادل" size={64} anchor="start" x={430} y={-2110} reveal={{ by: 'word', at: 7.95, dur: 0.5, stagger: 0.09, from: { x: 40, opacity: 0, blur: 6 } }}
        exit={{ by: 'word', at: 10.7, dur: 0.3, stagger: 0.04, ease: 'in', to: { y: -60, opacity: 0, blur: 8 } }} />
      {t > 8.2 && t < 11.15 && <T text={String(Math.max(1, Math.min(3, Math.ceil(3 * inOut(clamp((t - 8.25) / 2.6), 2) - 1e-6))))} size={340} fill={C.honey} anchor="right" x={430} y={-1840}
        reveal={{ by: 'all', at: 8.25, dur: 0.4, spring: { damping: 12, stiffness: 160 }, from: { scale: 0.6, opacity: 0 } }} exit={{ by: 'all', at: 10.75, dur: 0.3, ease: 'in', to: { scale: 0.4, opacity: 0, blur: 10 } }} />}
      <T text="دورات" size={124} anchor="start" x={200} y={-1810} reveal={{ by: 'word', at: 8.45, dur: 0.5, mask: true, from: { y: 120, opacity: 0 } }}
        exit={{ by: 'word', at: 10.8, dur: 0.3, ease: 'in', to: { x: 120, opacity: 0, blur: 8 } }} />
      <S text="حول الأرض" size={64} anchor="start" x={430} y={-1650} reveal={{ by: 'word', at: 8.7, dur: 0.45, stagger: 0.08, from: { y: 24, opacity: 0, blur: 6 } }}
        exit={{ by: 'all', at: 10.7, dur: 0.3, to: { opacity: 0, y: 40 } }} />
    </WT>
    {/* ٤: عنوان يسار-فوق، الرقم تحت القرص يسار */}
    <WT z={620}>
      <T text="خلية واحدة" size={104} anchor="end" x={-460} y={-2100} reveal={{ by: 'word', at: 11.75, dur: 0.55, stagger: 0.12, mask: true, from: { y: 110, opacity: 0 } }}
        exit={{ by: 'word', at: 14.45, dur: 0.3, stagger: 0.05, ease: 'in', to: { y: -80, opacity: 0, blur: 8 } }} />
      <S text="تضمّ حتى" size={54} anchor="end" x={-460} y={-1995} reveal={{ by: 'word', at: 12.0, dur: 0.45, stagger: 0.08, from: { x: -30, opacity: 0, blur: 6 } }}
        exit={{ by: 'all', at: 14.4, dur: 0.3, to: { opacity: 0, x: -60 } }} />
      {t > 12.25 && t < 14.9 && <T text={fmt(counter(t, 12.3, 13.9, 60000))} size={215} fill={C.honey} anchor="left" x={-440} y={-680}
        reveal={{ by: 'all', at: 12.3, dur: 0.4, spring: { damping: 15, stiffness: 140 }, from: { y: 80, opacity: 0 } }} exit={{ by: 'all', at: 14.5, dur: 0.35, ease: 'in', to: { y: 200, opacity: 0, blur: 10 } }} />}
      <T text="نحلة" size={104} anchor="end" x={-460} y={-505} reveal={{ by: 'word', at: 12.6, dur: 0.5, mask: true, from: { y: 100, opacity: 0 } }}
        exit={{ by: 'word', at: 14.55, dur: 0.3, ease: 'in', to: { y: 160, opacity: 0, blur: 8 } }} />
    </WT>
    {/* ٥: الختام يمين-فوق، المرطبان يسار-تحت، النحلة بالقطر بينهن */}
    <WT z={600}>
      <T text="أصغر عامل…" size={104} anchor="start" x={380} y={-1080} reveal={{ by: 'word', at: 15.7, dur: 0.55, stagger: 0.14, mask: true, from: { y: 110, opacity: 0 } }} />
      <T text="أكبر وظيفة" size={150} anchor="start" x={380} y={-910} words={{ 1: { fill: C.honey } }} kashida={[{ word: 1, amount: 180 * out(clamp((t - 16.55) / 0.55), 3) }]}
        reveal={{ by: 'word', at: 16.1, dur: 0.55, stagger: 0.15, spring: { damping: 13, stiffness: 170, mass: 0.9 }, from: { y: 150, opacity: 0 } }} />
    </WT>
  </>;
}

function Scene({ t }) {
  const cam = useCamera(CAM);
  return <World camera={cam} perspective={F0}>
    <AbsoluteFill style={{ background: '#F6F1E6' }} />
    <DepthImage dir={A('meadow-depth')} x={0} y={-1000} w={3500} z={1800} depth={600} />
    {/* غسلة خفيفة بس (النسخة ١ كانت مغسولة): فوق أكتر لقراية النص، وتحت الحقل بلونه */}
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(251,247,239,.62) 0%, rgba(251,247,239,.3) 40%, rgba(251,247,239,.06) 100%)' }} />
    {/* ترتيب الرسم = العمق (بعيد ← قريب) */}
    <GlobeStage t={t} />
    <Comb t={t} />
    <Drop t={t} />
    <Jar t={t} />
    <Ripple t={t} />
    <Glint t={t} />
    <Plate t={t} />
    <Field t={t} inserts={FieldWords({ t })} />
    <Words t={t} />
    <LandingBee t={t} />
    <HeroBee t={t} />
    <Flyers items={[{ src: A('daisy.png'), w: 110 }, { src: A('cosmos.png'), w: 120 }]} count={7} seed={4} t0={-2} t1={17.5} area={[-700, -1300, 700, 400]} z={[-520, -150]} drift={[-1, 0.55]} speed={[240, 420]} />
    <Flyers items={[{ src: A('bee-front.png'), w: 90 }]} count={5} seed={9} t0={3.9} t1={15} area={[-800, -2600, 800, 300]} z={[-200, 500]} drift={[1, -0.35]} speed={[180, 340]} spin={[-20, 20]} blurNear={6} />
    <HookBee t={t} />
  </World>;
}

// ضو شمس دافي من فوق-يمين + vignette خفيف (بدل الغسلة الباهتة)
function Light() {
  return <>
    <AbsoluteFill style={{ background: 'radial-gradient(120% 70% at 85% 0%, rgba(255,205,120,.32), rgba(255,205,120,0) 60%)', mixBlendMode: 'soft-light' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(130% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(70,45,10,.16) 100%)', mixBlendMode: 'multiply' }} />
  </>;
}

export default function Bees() {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  return <AbsoluteFill style={{ background: '#F6F1E6' }}>
    <CameraMotionBlur shutterAngle={170} samples={5}><Scene t={t} /></CameraMotionBlur>
    <Light />
  </AbsoluteFill>;
}
