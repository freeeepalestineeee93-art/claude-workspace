// عرض الأساس الجديد: صورة مسطحة بعمق + كاميرا بمنحنى الجزيرة المتعلّم + نص عربي حرف/كلمة + عالم كروت بعمق.
// حركة كاميرا وحدة متصلة (ما في توقف ولا قطع)، motion blur، ومؤثرات هادية.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { useCamera, World, Layer, At } from '../../../../remotion/kit/camera.jsx';
import { DepthImage } from '../../../../remotion/kit/depth.jsx';
import { ArabicText } from '../../../../remotion/kit/arabic.jsx';
import { asset, out, clamp } from '../../../../remotion/kit/base.js';

export const meta = {
  duration: 8,
  audio: { sfx: [
    { kind: 'swell', at: 0.2, params: { dur: 1.2 }, gain_db: -26 },
    { kind: 'whoosh', at: 3.95, align: 'peak', params: { dur: 1.2, brightness: 0.7 }, gain_db: -23 },
    { kind: 'pop', at: 4.3, gain_db: -27 }, { kind: 'pop', at: 4.5, params: { pitch: 1.2 }, gain_db: -28 },
  ], master: { lufs: -24 } },
};

const Card = ({ year, place, img, t, at }) => {
  const k = out((t - at) / 0.7);
  return <div style={{ width: 420, height: 540, borderRadius: 34, overflow: 'hidden', background: '#0D1656', boxShadow: '0 40px 90px rgba(0,0,20,.55)', opacity: k, transform: `translateY(${(1 - k) * 80}px) rotate(${(1 - k) * -6}deg)` }}>
    <img src={asset(img)} style={{ width: '100%', height: 380, objectFit: 'cover', filter: 'grayscale(1) contrast(1.1)' }} />
    <div style={{ position: 'relative', height: 160 }}>
      <ArabicText text={year} size={86} x={380} y={60} anchor="right" fill="#4FDCFF" reveal={{ by: 'glyph', at: at + 0.2, dur: 0.4, stagger: 0.05, ease: 'back', from: { y: 30, opacity: 0 } }} />
      <ArabicText text={place} size={44} x={380} y={125} anchor="right" fill="#C9CDF0" reveal={{ by: 'word', at: at + 0.4, dur: 0.4, mask: true, from: { y: 40, opacity: 0 } }} />
    </div>
  </div>;
};

function Scene() {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  // كاميرا وحدة: drift هادي جوّا الصورة (منحنى push-pan المتعلّم) ← غطسة جوّا الصورة بـ ease الأفتر (80/85)
  // ← عالم الكروت اللي كان ورا الصورة، و drift هادي. الصورة ما بتطلع حدودها أبداً: بتكبر وبتعدّي من جنب الكاميرا.
  const cam = useCamera({
    keys: [
      { t: 0, x: 0, y: 40, z: 0, roll: 0 },
      { t: 3.3, x: 50, y: -10, z: -300, roll: -1, profile: 'push-pan' },
      { t: 4.55, x: 40, y: -60, z: -2420, roll: 1.2, ease: [80, 85], dollyRef: 2600, perspective: 1500 },
      { t: 8, x: 70, y: -40, z: -2600, roll: 0, profile: 'push-pan' },
    ],
    handheld: { amp: 3, freq: 0.3 },
  });
  return <World camera={cam} perspective={1500}>
    <AbsoluteFill style={{ background: 'linear-gradient(#050827, #10184F)' }} />
    {/* عالم الكروت: ورا الصورة (z أبعد)، بيبيّن لما الكاميرا تغطس */}
    <Layer z={3600}>{Array.from({ length: 48 }, (_, i) => <At key={i} x={-1400 + (i % 8) * 400} y={-1500 + Math.floor(i / 8) * 520}><div style={{ width: 12, height: 12, borderRadius: 6, background: 'rgba(130,160,255,.35)' }} /></At>)}</Layer>
    <Layer z={2850}><At x={300} y={190}><Card year="1970" place="أزتيكا، مكسيكو" img="projects/sport/assets/cards/azteca.png" t={t} at={4.05} /></At></Layer>
    <Layer z={2600}><At x={-180} y={-260}><Card year="1966" place="ويمبلي، لندن" img="projects/sport/assets/cards/stadium1966.png" t={t} at={3.85} /></At></Layer>
    <DepthImage dir="projects/lab/assets/stadium-depth" x={0} y={0} w={1320} z={0} depth={700} />
  </World>;
}

export default function Demo() {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  return <AbsoluteFill>
    <CameraMotionBlur shutterAngle={180} samples={6}><Scene /></CameraMotionBlur>
    {/* عنوان بطبقة الشاشة: كلمة كلمة بقناع، وبيطلع قبل الطيران */}
    <AbsoluteFill style={{ background: 'linear-gradient(transparent 55%, rgba(5,8,39,.75))', opacity: interpolate(t, [3.2, 3.6], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
    <ArabicText text="ذاكرة الملاعب" size={128} x={540} y={1480} words={{ 1: { fill: '#4FDCFF' } }}
      reveal={{ by: 'word', at: 0.5, dur: 0.7, stagger: 0.14, mask: true, from: { y: 140, opacity: 0 } }}
      exit={{ by: 'word', at: 3.15, dur: 0.35, stagger: 0.05, ease: 'in', to: { y: -60, opacity: 0, blur: 8 } }} />
    <ArabicText text="من الأرشيف إلى الشاشة" size={50} weight={500} x={540} y={1590} fill="#C9CDF0"
      reveal={{ by: 'word', at: 1.0, dur: 0.5, stagger: 0.07, from: { y: 24, opacity: 0, blur: 6 } }}
      exit={{ by: 'all', at: 3.1, dur: 0.3, to: { opacity: 0 } }} />
  </AbsoluteFill>;
}
