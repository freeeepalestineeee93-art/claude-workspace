export default async (S) => ({
  background: S.colors.bg,
  post: { grain: { amount: 0.04 }, bloom: { strength: 0.4 } },
  scenes: [
    { duration: 2.2, layers: [S.logo({ y: S.vh(45), reveal: { mode: 'draw', at: 0.1, each: 0.25, dur: 1.2, order: 'area' } })] },
    { duration: 2.2, transition: { type: 'zoom', dur: 0.5 }, layers: [S.logo({ y: S.vh(45), reveal: { mode: 'assemble', at: 0.1, each: 0.12, spring: 'default' } })] },
  ],
});
