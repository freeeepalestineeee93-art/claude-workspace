import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const meta = { duration: 2, audio: { sfx: [{ kind: 'pop', at: 0.3, gain_db: -24 }], master: { lufs: -24 } } };

export default function Hello() {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const s = spring({ frame: f - 9, fps, config: { damping: 12 } });
  return <AbsoluteFill style={{ background: '#0C1553', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#4FDCFF', fontSize: 140, fontFamily: 'IBM Plex Sans Arabic', fontWeight: 700, transform: `scale(${s})`, opacity: interpolate(f, [8, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>أهلاً</div>
  </AbsoluteFill>;
}
