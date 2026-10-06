// اختبار: تعليق صوتي + كابشن كاريوكي متزامن + موسيقى بتوطى تحت الصوت
export default async (S) => {
  const caps = await S.captions('assets/vo/intro.words.json', { style: 'karaoke', size: S.px(84), y: S.vh(70), offset: 0.4 });
  return {
    background: S.colors.bg,
    audio: { voice: [{ src: 'assets/vo/intro.wav', at: 0.4 }], music: { style: 'lofi', gain_db: -6 } },
    post: { grain: { amount: 0.04 }, vignette: { strength: 0.35 } },
    scenes: [{ duration: 4.8, layers: [
      S.text({ text: 'تعليق صوتي', size: S.px(130), x: S.cx, y: S.vh(38), ...S.fx.maskRise(0.2, { size: 130 }) }),
      ...caps,
    ] }],
  };
};
