// اختبار للفاحص: كاميرا بتنتقل من وقوف لسرعة كاملة بفريم (ease 0/0 = خطي) — لازم تنكشف كنتعة
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useCamera, World, Layer, At } from '../../../../remotion/kit/camera.jsx';
export const meta = { duration: 3 };
export default function SnapTest() {
  const cam = useCamera({ keys: [{ t: 0, x: 0, y: 0 }, { t: 1, x: 0, y: 0, hold: true }, { t: 2, x: 1200, y: 0, ease: [0, 0] }, { t: 3, x: 1200, y: 0, hold: true }] });
  return <World camera={cam}><AbsoluteFill style={{ background: '#0C1553' }} />
    <Layer z={0}>{Array.from({ length: 160 }, (_, i) => <At key={i} x={-900 + (i % 16) * 220} y={-900 + Math.floor(i / 16) * 200}><div style={{ width: 60, height: 60, borderRadius: 12, background: ['#4FDCFF', '#FFC531', '#F0433A', '#fff'][i % 4] }} /></At>)}</Layer>
  </World>;
}
