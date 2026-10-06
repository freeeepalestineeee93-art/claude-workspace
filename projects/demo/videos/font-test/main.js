export default async (S) => ({
  background: '#0d0e10', motionBlur: false,
  scenes: [{ duration: 1, layers: [
    S.text({ text: 'خط الجزيرة الثقيل', family: 'Al Jazeera', weight: 900, size: 120, x: S.cx, y: S.vh(25), fill: '#fff' }),
    S.text({ text: 'إضاعة الوقت', family: 'Al Jazeera', weight: 700, size: 130, x: S.cx, y: S.vh(38), fill: '#e8c547', kashida: [{ word: 0, amount: 160 }] }),
    S.text({ text: 'ثمانية بخط عريض', family: 'thmanyah sans', weight: 900, size: 120, x: S.cx, y: S.vh(55), fill: '#fff' }),
    S.text({ text: 'خفيف ١٢٣٤ After Effects', family: 'thmanyah sans', weight: 300, size: 76, x: S.cx, y: S.vh(66), fill: '#9aa' }),
  ] }],
});
