export default async (S) => {
  const map = S.map({
    base: 'terrain',
    style: { land: '#5a5650', high: '#9a958a', water: '#141619', deep: '#0b0c0e', exaggeration: 2.2, shade: 0.9 },
    camera: S.fly([{ t: 0, center: [40, 20], zoom: 4.2 }, { t: 2, center: [43.3, 13.2], zoom: 6.6, ease: 'smooth' }]),
    borders: { color: '#ffffff', opacity: 0.18, width: 1 },
    countries: [
      { id: 'YEM', fill: '#e8892c88', stroke: '#ffb15c', strokeWidth: 2, glow: { blur: 18 }, opacity: { at: 0.3, from: 0, to: 1, dur: 0.6 } },
      { id: 'EGY', fill: '#e0303388', stroke: '#ff5a5a', strokeWidth: 2, hatch: { color: '#ffffff30', spacing: 10 }, wipe: { at: 0.4, from: 0, to: 1, dur: 1 } },
    ],
    routes: [{ points: [[32.55, 29.9], [34.5, 26.5], [38.5, 19.5], [42.0, 14.6], [43.4, 12.6], [45, 12.3]], color: '#ffffff', width: 3, dash: [10, 8], dashSpeed: 30, trim: { at: 0.2, from: [0, 0], to: [0, 1], dur: 1.6 } }],
    markers: [{ at: [43.4, 12.6], type: 'pulse', color: '#ff3b3b', size: 9, appear: 1.2 }],
  });
  return {
    background: '#000',
    post: { grain: { amount: 0.04 }, vignette: { strength: 0.5 } },
    scenes: [{ duration: 3, layers: [map] }],
  };
};
