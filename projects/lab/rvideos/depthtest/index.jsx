// اختبار العمق: صورة ملعب مسطحة → 4 طبقات، والكاميرا بتدفع لجوّا بمنحنى الجزيرة المتعلّم (push-pan)
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { useCamera, World } from '../../../../remotion/kit/camera.jsx';
import { DepthImage } from '../../../../remotion/kit/depth.jsx';

export const meta = { duration: 4 };

function Scene() {
  const cam = useCamera({ keys: [{ t: 0, x: 0, y: 0, z: 0, roll: 0 }, { t: 4, x: 60, y: -40, z: -420, roll: -1.5, profile: 'push-pan' }], handheld: { amp: 3 } });
  return <World camera={cam} perspective={1500}>
    <AbsoluteFill style={{ background: '#111' }} />
    <DepthImage dir="projects/lab/assets/stadium-depth" x={0} y={0} w={1180} z={0} depth={700} />
  </World>;
}
export default () => <CameraMotionBlur shutterAngle={180} samples={6}><Scene /></CameraMotionBlur>;
