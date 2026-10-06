import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Globe } from '../../../../remotion/kit/globe.jsx';
export const meta = { duration: 2 };
export default () => <AbsoluteFill style={{ background: '#F6F1E6', alignItems: 'center', justifyContent: 'center' }}>
  <Globe size={900} spin={(t) => 40 + t * 25} orbit={{ laps: (t) => 1.6, tilt: 18 }} />
</AbsoluteFill>;
