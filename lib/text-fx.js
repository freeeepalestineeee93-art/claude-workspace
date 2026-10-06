// وصفات تحريك النص الجاهزة. كل وصفة بترجع خصائص بتندمج بطبقة النص:
//   S.text({ text: 'مرحبا', size: 140, ...S.fx.maskRise(0.4, { size: 140 }) })
// القيم نسبية لحجم الخط (em)، فبتشتغل صح بأي حجم.

const em = (o, n) => (o.size ?? 100) * n;

export const textFx = {
  // ── دخول ──

  // الأفخم: كل سطر/كلمة بيطلع من ورا خط قص (أسلوب عناوين الأفلام)
  maskRise: (at, o = {}) => ({
    reveal: { by: o.by ?? 'word', at, mask: true, from: { y: em(o, 1.55), rotation: o.tilt ?? 4 }, spring: o.spring ?? 'heavy', stagger: { each: o.each ?? 0.07, jitter: 0.1, ...o.stagger } },
  }),

  rise: (at, o = {}) => ({
    reveal: { by: o.by ?? 'word', at, from: { y: em(o, 0.45), opacity: 0 }, spring: o.spring ?? 'default', stagger: { each: o.each ?? 0.06, ...o.stagger } },
  }),

  // ضبابي لواضح: هادي وسينمائي
  blurIn: (at, o = {}) => ({
    reveal: { by: o.by ?? 'word', at, from: { opacity: 0, blur: em(o, 0.18), scale: 1.12, y: em(o, 0.1) }, dur: o.dur ?? 0.9, ease: o.ease ?? 'glide', stagger: { each: o.each ?? 0.09, ...o.stagger } },
  }),

  // الحروف بتنفقع واحد ورا التاني (مرح)
  pop: (at, o = {}) => ({
    reveal: { by: o.by ?? 'char', at, pivot: 'center', from: { scale: 0, opacity: 0, rotation: o.rot ?? -12 }, spring: o.spring ?? 'playful', stagger: { each: o.each ?? 0.035, jitter: 0.25, ...o.stagger } },
  }),

  // الكلمة بتنزل بقوة من حجم كبير (عناوين قوية)
  slam: (at, o = {}) => ({
    reveal: { by: o.by ?? 'word', at, pivot: 'center', from: { scale: o.from ?? 2.4, opacity: 0, blur: em(o, 0.12) }, spring: o.spring ?? 'heavy', stagger: { each: o.each ?? 0.16, jitter: 0.05, ...o.stagger } },
  }),

  // الحروف بتسقط من فوق وبترتد
  drop: (at, o = {}) => ({
    reveal: { by: o.by ?? 'char', at, from: { y: -em(o, 0.9), opacity: 0, rotation: o.rot ?? -14 }, spring: o.spring ?? 'rubber', stagger: { each: o.each ?? 0.03, jitter: 0.3, ...o.stagger } },
  }),

  // شلال: حروف بتنزلق مع ميلان وضباب خفيف
  cascade: (at, o = {}) => ({
    reveal: { by: o.by ?? 'char', at, from: { y: em(o, 0.35), opacity: 0, rotation: 9, blur: em(o, 0.05) }, spring: o.spring ?? 'default', stagger: { each: o.each ?? 0.028, ease: 'sineOut', jitter: 0.2, ...o.stagger } },
  }),

  // آلة كاتبة (حرف حرف بالترتيب الصحيح للقراءة)
  type: (at, o = {}) => ({
    reveal: { by: 'char', at, from: { opacity: 0 }, dur: 0.001, ease: 'hold', stagger: { each: o.each ?? 0.05, ease: 'linear', jitter: o.jitter ?? 0.35, ...o.stagger } },
  }),

  // رسم حدود الحرف ثم تعبئته (خط اليد)
  draw: (at, o = {}) => ({
    draw: true, strokeWidth: o.strokeWidth ?? 2.5,
    reveal: { by: o.by ?? 'char', at, from: { draw: 0 }, dur: o.dur ?? 1.1, ease: o.ease ?? 'smooth', stagger: { each: o.each ?? 0.07, ease: 'linear', ...o.stagger } },
  }),

  // تمدد أفقي من خط رفيع
  stretch: (at, o = {}) => ({
    reveal: { by: o.by ?? 'word', at, pivot: 'center', from: { scaleX: 0, opacity: 0 }, spring: o.spring ?? 'snappy', stagger: { each: o.each ?? 0.08, ...o.stagger } },
  }),

  // انقلاب عمودي (متل لوحة المطار)
  flip: (at, o = {}) => ({
    reveal: { by: o.by ?? 'char', at, pivot: 'center', from: { scaleY: 0, opacity: 0 }, spring: o.spring ?? 'snappy', stagger: { each: o.each ?? 0.03, jitter: 0.4, ...o.stagger } },
  }),

  // من عشوائي لمكانه (الحروف متناثرة وبتتجمع)
  assemble: (at, o = {}) => ({
    reveal: { by: o.by ?? 'char', at, order: 'random', from: { y: em(o, 0.8), x: em(o, 0.3), rotation: 40, scale: 0.4, opacity: 0, blur: em(o, 0.08) }, spring: o.spring ?? 'default', stagger: { each: o.each ?? 0.03 } },
  }),

  // ── خروج ──

  exitUp: (at, o = {}) => ({
    exit: { by: o.by ?? 'word', at, to: { y: -em(o, 0.5), opacity: 0 }, dur: o.dur ?? 0.45, ease: 'cubicIn', stagger: { each: o.each ?? 0.04, ...o.stagger } },
  }),
  exitBlur: (at, o = {}) => ({
    exit: { by: o.by ?? 'word', at, to: { opacity: 0, blur: em(o, 0.2), scale: 0.92 }, dur: o.dur ?? 0.5, ease: 'quadIn', stagger: { each: o.each ?? 0.05, ...o.stagger } },
  }),
  exitMask: (at, o = {}) => ({
    exit: { by: o.by ?? 'word', at, mask: true, to: { y: -em(o, 1.55) }, dur: o.dur ?? 0.5, ease: 'expoIn', stagger: { each: o.each ?? 0.05, ...o.stagger } },
  }),
  exitCollapse: (at, o = {}) => ({
    exit: { by: o.by ?? 'char', at, to: { scale: 0, opacity: 0 }, dur: o.dur ?? 0.35, ease: 'backIn', stagger: { each: o.each ?? 0.02, from: 'center', ...o.stagger } },
  }),

  // ── حركة مستمرة ──

  wave: (o = {}) => ({ loop: { by: o.by ?? 'char', freq: o.freq ?? 0.8, phase: o.phase ?? 0.45, amp: { y: -em(o, o.amp ?? 0.08) } } }),
  breathe: (o = {}) => ({ loop: { by: o.by ?? 'word', freq: o.freq ?? 0.4, phase: o.phase ?? 0.9, amp: { scale: o.amp ?? 0.025 } } }),
};

// دمج أكتر من وصفة: S.fx.combine(S.fx.maskRise(0.2), S.fx.exitBlur(3))
textFx.combine = (...parts) => Object.assign({}, ...parts);
