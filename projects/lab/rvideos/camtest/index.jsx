// اختبار الكاميرا: 3 طبقات عمق + مسار متصل السرعة + motion blur
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { useCamera, World, Layer, At } from '../../../../remotion/kit/camera.jsx';
import { hash } from '../../../../remotion/kit/base.js';

export const meta = { duration: 5 };

const Card = ({ c, label }) => <div style={{ width: 300, height: 200, borderRadius: 28, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'IBM Plex Sans Arabic', fontWeight: 700, fontSize: 56, boxShadow: '0 20px 50px rgba(0,0,30,.4)' }}>{label}</div>;

function Scene() {
  const cam = useCamera({
    keys: [{ t: 0, x: 0, y: 0, z: 0, roll: -2 }, { t: 1.6, x: 520, y: 260, z: -250, roll: 1 }, { t: 3.2, x: 1100, y: -80, z: -120, roll: 3 }, { t: 5, x: 1500, y: 120, z: -420, roll: 0, hold: true }],
    handheld: { amp: 4 },
  });
  return <World camera={cam} perspective={1300} focus={0} dof={0}>
    <AbsoluteFill style={{ background: 'linear-gradient(#050827,#162186)' }} />
    <Layer z={1200}>{Array.from({ length: 60 }, (_, i) => <At key={i} x={-1200 + (i % 10) * 420} y={-1400 + Math.floor(i / 10) * 520}><div style={{ width: 14, height: 14, borderRadius: 7, background: 'rgba(130,160,255,.35)' }} /></At>)}</Layer>
    <Layer z={0}>{[['#2747F0', 'أ', 0, 0], ['#1FB5A3', 'ب', 520, 260], ['#F0433A', 'ج', 1100, -80], ['#FFC531', 'د', 1500, 120]].map(([c, l, x, y]) => <At key={l} x={x} y={y}><Card c={c} label={l} /></At>)}</Layer>
    <Layer z={-380}>{Array.from({ length: 14 }, (_, i) => <At key={i} x={-300 + i * 170} y={(hash(i) - 0.5) * 1700}><div style={{ width: 70, height: 70, borderRadius: 35, background: 'rgba(79,220,255,.55)' }} /></At>)}</Layer>
  </World>;
}
export default function CamTest() {
  return <CameraMotionBlur shutterAngle={180} samples={8}><Scene /></CameraMotionBlur>;
}
