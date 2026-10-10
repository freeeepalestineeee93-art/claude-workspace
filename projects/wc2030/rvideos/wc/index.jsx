// «مونديال 2030» — 15.5s، نسخة طبق الأصل عن نمط Ref2 (فيديو رياضي بأسلوب الجزيرة) بسيناريو جديد.
// خريطة المرجع (projects/references/ref2): 4 لقطات:
//   ١ (0–4.75)  بداية لاصقة بقصاصة جريدة إنكليزية ← سحب لورا سريع بـ blur ← دفع بطيء. دائرة خضرا بتنط وبتعد،
//              سطر بينكتب حرف حرف، دائرة تانية. عنصر 3D معدني بالنص، عنصر قريب مضبّب تحت-يسار، عشب أخضر.
//   ↔ whip أفقي (4.75–5.2)
//   ٢ (5.0–8.2) رقم 3D ضخم + لاعب أبيض وأسود ماشي قدّامه + علم يمين. عنوان أخضر بينكتب، وكلمات سطر تاني بتطير من أماكن متفرقة.
//   ◌ defocus dissolve (8.1–8.4)
//   ٣ (8.25–11.9) منبّه 3D عليه الرقم + مشجّع من ورا قريب يسار. أول كلمة بكشيدة بتنكمش، سطر أخضر، سطر تالت.
//   ◌ defocus dissolve (11.75–12.05)
//   ٤ (11.9–15.5) علم عليه «؟» + جرايد طايرة + كرات قريبة مضببة + سطر إنكليزي بهايلايت. عنوان أخضر بينكتب حرف حرف، وسطر أسود.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { useCamera, World, Layer, At } from '../../../../remotion/kit/camera.jsx';
import { ArabicText } from '../../../../remotion/kit/arabic.jsx';
import { Flyers } from '../../../../remotion/kit/flyers.jsx';
import { asset, clamp, out, inOut, hash, lerp } from '../../../../remotion/kit/base.js';

const A = (f) => `projects/wc2030/assets/${f}`;
const C = { green: '#3DA947', mint: '#86E06B', ink: '#1E1F1D', grey: '#6B6A63', hl: '#8FE36E', grass: '#4DB143' };
const F = 'Al Jazeera';
const VO = { s1: 0.45, s2: 5.15, s3: 8.35, s4: 12.0 };

export const meta = {
  duration: 15.5,
  post: { edge: 0.78, edgeWidth: 0.4, blur: 12, rgb: 3, bloom: 0.1, grain: 7 },
  audio: {
    master: { lufs: -15 },
    voice: [
      { src: 'projects/wc2030/assets/vo/s1.wav', at: VO.s1 }, { src: 'projects/wc2030/assets/vo/s2.wav', at: VO.s2 },
      { src: 'projects/wc2030/assets/vo/s3.wav', at: VO.s3 }, { src: 'projects/wc2030/assets/vo/s4.wav', at: VO.s4 },
    ],
    music: { style: 'tech', bpm: 100, gain_db: -11, seed: 11 },
    sfx: [
      { kind: 'whoosh', at: 0.33, align: 'peak', params: { dur: 0.55, brightness: 0.7 }, gain_db: -24 },
      { kind: 'pop', at: 0.45, gain_db: -26 }, { kind: 'count', at: 0.6, params: { dur: 1.6 }, gain_db: -32 },
      { kind: 'typing', at: 2.6, params: { dur: 0.55 }, gain_db: -32 },
      { kind: 'pop', at: 3.3, params: { pitch: 1.15 }, gain_db: -26 }, { kind: 'count', at: 3.35, params: { dur: 0.4 }, gain_db: -32 },
      { kind: 'typing', at: 3.75, params: { dur: 0.45 }, gain_db: -32 },
      { kind: 'whoosh', at: 4.97, align: 'peak', params: { dur: 0.6, brightness: 0.9 }, gain_db: -22 },
      { kind: 'typing', at: 5.2, params: { dur: 0.55 }, gain_db: -31 },
      { kind: 'swish', at: 6.35, gain_db: -29 },
      { kind: 'swell', at: 8.0, params: { dur: 0.5 }, gain_db: -28 },
      { kind: 'typing', at: 10.3, params: { dur: 0.6 }, gain_db: -31 }, { kind: 'typing', at: 11.0, params: { dur: 0.4 }, gain_db: -32 },
      { kind: 'swell', at: 11.6, params: { dur: 0.5 }, gain_db: -28 },
      { kind: 'typing', at: 12.1, params: { dur: 0.8 }, gain_db: -30 }, { kind: 'typing', at: 13.9, params: { dur: 1.1 }, gain_db: -31 },
      { kind: 'impact', at: 15.05, gain_db: -27 },
    ],
  },
};

// ── قطع مشتركة ──
const Type = ({ text, at, size, fill = C.ink, weight = 700, x = 0, y = 0, anchor = 'center', per = 0.045, kashida, words }) =>
  <ArabicText text={text} family={F} weight={weight} size={size} fill={fill} x={x} y={y} anchor={anchor} kashida={kashida} words={words}
    reveal={{ by: 'glyph', at, dur: 0.14, stagger: per, ease: 'out', from: { opacity: 0, y: size * 0.12, blur: 3 } }} />;

// دائرة خضرا بتنط (overshoot) وبتعد للرقم
function Counter({ t, at, to, dur, x, y, d = 170 }) {
  const k = t - at;
  if (k < 0) return null;
  const s = k < 0.32 ? out(k / 0.32, 2) * (1 + 0.22 * Math.sin(Math.PI * clamp(k / 0.32))) : 1 + 0.06 * Math.exp(-(k - 0.32) * 6) * Math.sin((k - 0.32) * 22);
  const n = Math.round(to * out(clamp((k - 0.1) / dur), 2));
  return <At x={x} y={y} scale={s}><div style={{ width: d, height: d, borderRadius: '50%', background: C.mint, display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 24px rgba(60,140,40,.25)', font: `700 ${d * 0.5}px '${F}'`, color: C.ink, letterSpacing: -2 }}>{n}</div></At>;
}

// أرض العشب: أخضر مسطح مشبّع (متل المرجع) + بقع ضو بيضاوية + ملمس عشب خفيف
function Ground({ y, x = 0, w = 7000, spots = [] }) {
  return <div style={{ position: 'absolute', left: x - w / 2, top: y, width: w, height: 2600, overflow: 'hidden',
    background: `linear-gradient(180deg, #6CC75E 0%, ${C.grass} 18%, #3E9E38 100%)` }}>
    <Img src={asset(A('grass.jpg'))} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.22, mixBlendMode: 'soft-light' }} />
    {spots.map(([sx, sy, sw, sh], i) => <div key={i} style={{ position: 'absolute', left: w / 2 + sx - sw / 2, top: sy - sh / 2, width: sw, height: sh, borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(170,240,140,.55), rgba(170,240,140,0))' }} />)}
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 40, background: 'linear-gradient(180deg, rgba(238,231,216,.7), rgba(238,231,216,0))' }} />
  </div>;
}
// خط مدينة رمادي (ألفا من الغامق) قاعدته على خط الأفق y
const SKY_AR = 0.2;
const Skyline = ({ y, x = 0, w = 2600, o = 0.55 }) =>
  <Img src={asset(A('skyline.png'))} style={{ position: 'absolute', left: x - w / 2, top: y - w * SKY_AR + 10, width: w, opacity: o }} />;

// قصاصة جريدة إنكليزية بهايلايت أخضر
function Clipping({ w = 560 }) {
  return <div style={{ width: w, padding: '26px 30px 34px', background: '#FBFAF6', boxShadow: '0 10px 30px rgba(0,0,0,.12)', fontFamily: "'IBM Plex Sans', Arial, sans-serif", color: '#1d1d1d' }}>
    <div style={{ font: "700 30px/1.25 'IBM Plex Sans', Arial", letterSpacing: -0.3 }}>
      2030 World Cup to be staged across <span style={{ background: C.hl, padding: '0 4px' }}>six nations on three continents</span>, marking the tournament's centenary
    </div>
    <div style={{ marginTop: 14, fontSize: 13, color: '#777' }}>By Sports Desk · Updated</div>
    <div style={{ marginTop: 16, display: 'flex', gap: 14 }}>
      <div style={{ flex: '0 0 46%', height: 150, background: 'linear-gradient(135deg,#bbb,#888)', filter: 'grayscale(1)' }} />
      <div style={{ flex: 1 }}>{Array.from({ length: 7 }, (_, i) => <div key={i} style={{ height: 9, margin: '0 0 9px', background: '#c9c6bd', width: `${70 + hash(i) * 30}%` }} />)}</div>
    </div>
  </div>;
}

// ── اللقطة ١ + ٢ (عالم واحد، الـ whip = pan أفقي سريع للكاميرا) ──
const X2 = 1500;
const CAM12 = {
  keys: [
    { t: 0, x: -175, y: 80, z: -1150, roll: 0 },
    { t: 0.12, x: -175, y: 80, z: -1150, hold: true },
    { t: 0.58, x: 0, y: 0, z: 0, roll: 0, ease: [25, 88] },            // سحب لورا سريع بيرتاح طويل
    { t: 4.72, x: 10, y: -20, z: -110, ease: [0, 0] },                  // دفع بطيء ثابت
    { t: 5.18, x: X2, y: -20, z: -120, ease: [72, 72] },                // whip
    { t: 8.4, x: X2 - 20, y: -40, z: -250, ease: [0, 30] },
  ],
};
function Shot12({ t }) {
  const cam = useCamera(CAM12);
  const walk = clamp((t - 4.9) / 3.5);
  const px = X2 + lerp(300, -170, walk), bob = -Math.abs(Math.sin(t * 5.6)) * 7;
  return <World camera={cam} perspective={1500}>
    <AbsoluteFill style={{ background: '#EEE7D8' }}><Img src={asset(A('bg-paper.jpg'))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></AbsoluteFill>
    <Layer z={420}><Skyline y={560} x={0} w={2800} /><Skyline y={560} x={X2 + 400} w={2800} o={0.5} /></Layer>
    <Layer z={60}><Ground y={560} x={X2 / 2} w={8000} spots={[[-X2 / 2 + 180, 160, 1100, 260], [X2 / 2, 170, 1300, 280]]} /></Layer>
    {/* ١ */}
    <Layer z={120}><At x={-215} y={200} rotate={-1.5}><Clipping /></At></Layer>
    <Layer z={0}><At x={185} y={360}><Img src={asset(A('trophy.png'))} style={{ width: 540 }} /></At></Layer>
    <Layer z={-60}>
      <Counter t={t} at={0.42} to={6} dur={1.8} x={0} y={-690} />
      <Type text="دول من" at={2.6} size={112} y={-520} />
      <Counter t={t} at={3.3} to={3} dur={0.35} x={0} y={-360} d={150} />
      <Type text="قارّات" at={3.75} size={78} y={-215} weight={700} fill={C.green} />
    </Layer>
    <Layer z={-430}><At x={-370} y={760} rotate={-18 + t * 3}><Img src={asset(A('ball.png'))} style={{ width: 560, filter: 'blur(7px)' }} /></At></Layer>
    {/* ٢ */}
    <Layer z={40}><At x={X2 - 190} y={385}><Img src={asset(A('num100.png'))} style={{ width: 1180 }} /></At></Layer>
    <Layer z={-60}><At x={px} y={305 + bob}><Img src={asset(A('player.png'))} style={{ width: 360, transform: 'scaleX(-1)' }} /></At></Layer>
    <Layer z={-170}><At x={X2 + 400} y={240} rotate={2 + Math.sin(t * 1.3) * 1.5}><Img src={asset(A('flag.png'))} style={{ width: 400 }} /></At></Layer>
    <Layer z={-60}>
      <Type text="رقم تاريخي" at={5.22} size={150} y={-560} x={X2} fill={C.green} per={0.05} />
      <ArabicText text="مئة عام على أول مونديال" family={F} weight={700} size={74} fill={C.ink} x={X2} y={-400}
        reveal={{ by: 'word', at: 6.35, dur: 0.55, stagger: 0.16, ease: 'outQuint', from: (i) => ({ x: [140, -260, 220, -160][i % 4], y: [120, 260, 340, 190][i % 4], opacity: 0, scale: 1.25, blur: 4 }) }} />
    </Layer>
  </World>;
}

// ── اللقطة ٣: المنبّه ──
const CAM3 = { keys: [{ t: 8.0, x: 25, y: 0, z: 0 }, { t: 12.1, x: -25, y: -25, z: -160, ease: [0, 0] }] };
function Shot3({ t }) {
  const cam = useCamera(CAM3);
  const kk = 1 - out(clamp((t - 8.45) / 0.85), 3);   // كشيدة «منتخبـــاً» بتنكمش (متل «أمـــام»)
  return <World camera={cam} perspective={1500}>
    <AbsoluteFill style={{ background: '#EEE7D8' }}><Img src={asset(A('bg-paper.jpg'))} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} /></AbsoluteFill>
    <Layer z={420}><Skyline y={580} x={-200} w={2800} /></Layer>
    <Layer z={60}><Ground y={580} spots={[[60, 190, 1200, 280]]} /></Layer>
    <Layer z={320}><At x={420} y={500}><Img src={asset(A('trophy.png'))} style={{ width: 170, filter: 'grayscale(1) contrast(.9)' }} /></At></Layer>
    <Layer z={0}>
      <At x={70} y={360}><div style={{ position: 'relative', width: 640 }}>
        <Img src={asset(A('clock.png'))} style={{ width: 640, display: 'block' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '63%', textAlign: 'center', font: `700 62px '${F}'`, color: C.ink, letterSpacing: -1 }}>2030</div>
      </div></At>
    </Layer>
    <Layer z={-380}><At x={-390} y={540}><Img src={asset(A('fan.png'))} style={{ width: 780, filter: 'blur(2.5px)' }} /></At></Layer>
    <Layer z={-60}>
      <ArabicText text="بـ48 منتخباً" family={F} weight={700} size={86} fill={C.ink} y={-655} kashida={[{ word: 1, amount: 240 * kk }]}
        reveal={{ by: 'word', at: 8.42, dur: 0.4, stagger: 0.12, from: { opacity: 0, blur: 6 } }} />
      <Type text="النسخةُ الأكبر" at={10.3} size={118} y={-505} fill={C.green} per={0.04} />
      <Type text="في تاريخِه" at={11.0} size={80} y={-375} per={0.04} kashida={[{ word: 0, amount: 50 }]} />
    </Layer>
  </World>;
}

// ── اللقطة ٤: العلم بعلامة استفهام ──
const CAM4 = { keys: [{ t: 11.7, x: -10, y: 0, z: 0 }, { t: 15.5, x: 30, y: -20, z: -170, ease: [0, 0] }] };
function Shot4({ t }) {
  const cam = useCamera(CAM4);
  return <World camera={cam} perspective={1500}>
    <AbsoluteFill style={{ background: '#EEE7D8' }}><Img src={asset(A('bg-paper.jpg'))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></AbsoluteFill>
    <Layer z={420}><Skyline y={590} x={100} w={2800} o={0.6} /></Layer>
    <Layer z={60}><Ground y={590} spots={[[120, 200, 1100, 260]]} /></Layer>
    <Layer z={80}>
      <At x={-215} y={10}><div style={{ width: 470, font: "400 28px/1.5 'IBM Plex Sans', Arial", color: '#55544e' }}>
        With 48 teams and a new format, <span style={{ background: C.hl, color: '#1d1d1d', padding: '0 3px' }}>the race for the trophy is wide open</span>. Every result will rewrite the story.
      </div></At>
    </Layer>
    <Layer z={40}><At x={-400} y={650}><Img src={asset(A('ball.png'))} style={{ width: 210 }} /></At></Layer>
    <Layer z={20}><At x={-130} y={675} rotate={-14}><Img src={asset(A('paper.png'))} style={{ width: 300 }} /></At></Layer>
    <Layer z={0}><At x={170} y={200} rotate={Math.sin(t * 1.1) * 1.2}><div style={{ position: 'relative', width: 500 }}>
      <Img src={asset(A('flag.png'))} style={{ width: 500, display: 'block' }} />
      <div style={{ position: 'absolute', left: '12%', top: '2%', width: '86%', height: '28%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `900 230px/1 '${F}'`, color: '#222', transform: 'skewY(-7deg) rotate(-5deg)', opacity: 0.88 }}>؟</div>
    </div></At></Layer>
    <Flyers items={[{ src: A('paper.png'), w: 230 }]} count={5} seed={21} t0={11.0} t1={15.5} area={[-500, -500, 600, 300]} z={[-420, -80]} drift={[-1, 0.25]} speed={[160, 260]} spin={[-40, 40]} blurNear={6} />
    <Layer z={-440}><At x={400} y={830} rotate={t * 6}><Img src={asset(A('ball.png'))} style={{ width: 640, filter: 'blur(8px)' }} /></At></Layer>
    <Layer z={-60}>
      <Type text="لكن حتى الآن" at={12.1} size={136} x={360} y={-640} anchor="start" fill={C.green} per={0.07} />
      <Type text="البطلُ ما زالَ مجهولاً" at={13.9} size={76} x={360} y={-500} anchor="start" per={0.05} />
    </Layer>
  </World>;
}

// انتقال defocus: اللقطة بتتضبّب وبتختفي، اللي بعدها بتطلع مضبّبة وبتوضح
function Defocus({ t, show, inAt, outAt, children }) {
  if (t < show[0] || t > show[1]) return null;
  const bIn = inAt == null ? 0 : 1 - clamp((t - inAt) / 0.2), oIn = inAt == null ? 1 : clamp((t - inAt + 0.06) / 0.14);
  const bOut = outAt == null ? 0 : clamp((t - outAt) / 0.18), oOut = outAt == null ? 1 : 1 - clamp((t - outAt - 0.1) / 0.14);
  const b = Math.max(bIn, bOut) * 16;
  return <AbsoluteFill style={{ opacity: Math.min(oIn, oOut), filter: b > 0.3 ? `blur(${b.toFixed(1)}px)` : undefined }}>{children}</AbsoluteFill>;
}

export default function WC() {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  return <AbsoluteFill style={{ background: '#EEE7D8' }}>
    <CameraMotionBlur shutterAngle={200} samples={5}>
      <Defocus t={t} show={[0, 8.42]} outAt={8.1}><Shot12 t={t} /></Defocus>
      <Defocus t={t} show={[8.1, 12.05]} inAt={8.2} outAt={11.72}><Shot3 t={t} /></Defocus>
      <Defocus t={t} show={[11.72, 15.5]} inAt={11.82}><Shot4 t={t} /></Defocus>
    </CameraMotionBlur>
  </AbsoluteFill>;
}
