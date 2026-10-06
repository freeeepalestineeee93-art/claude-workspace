// اختبار جسر المحرك القديم: S.donut + S.text بكشيدة متحركة + S.particles من المحرك القديم جوّا Remotion
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Legacy } from '../../../../remotion/kit/legacy.jsx';
export const meta = { duration: 2 };
const build = (S) => ({ layers: [
  S.donut({ value: { at: 0.2, from: 0, to: 0.333, dur: 1.2, ease: 'ae:60:85' }, r: S.px(220), width: S.px(46), color: '#F2B33D', track: 'rgba(0,0,0,0.08)', x: S.cx, y: S.vh(40) }),
  S.text({ text: 'نحلة', size: S.px(200), weight: 700, fill: '#2B2A33', x: S.cx, y: S.vh(70), kashida: [{ word: 0, amount: { at: 0.4, from: 0, to: S.px(220), spring: 'heavy' } }] }),
  S.particles({ count: 40, start: 0, rate: 80, emitter: { x: S.cx, y: S.vh(40), r: S.px(60) }, life: [0.8, 1.6], speed: [S.px(150), S.px(420)], size: [S.px(6), S.px(14)], color: ['#F2B33D', '#FFD27A'], drag: 2 }),
] });
export default () => <AbsoluteFill style={{ background: '#F6F1E6' }}><Legacy project="projects/bees" id="legacytest" build={build} /></AbsoluteFill>;
