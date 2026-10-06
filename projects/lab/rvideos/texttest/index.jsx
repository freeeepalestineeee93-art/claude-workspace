// اختبار النص العربي بمستوى الحرف: دخول كلمة كلمة بقناع، حرف حرف، رسم الخط، ولون كلمة
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ArabicText } from '../../../../remotion/kit/arabic.jsx';

export const meta = { duration: 3 };
export default () => <AbsoluteFill style={{ background: '#0C1553' }}>
  <ArabicText text="عينك على الحقيقة" size={110} x={540} y={600} words={{ 2: { fill: '#4FDCFF' } }}
    reveal={{ by: 'word', at: 0.2, dur: 0.6, stagger: 0.12, mask: true, from: { y: 110, opacity: 0 } }} />
  <ArabicText text="بالأدلّة، لا بالرأي" size={96} x={980} y={900} anchor="start"
    reveal={{ by: 'glyph', at: 0.5, dur: 0.45, stagger: 0.04, ease: 'back', from: { y: 50, opacity: 0, scale: 0.6 } }} />
  <ArabicText text="كشّاف" size={220} x={540} y={1250} fill="#fff" draw={{ at: 0.3, dur: 1.6 }} />
  <ArabicText text="● رمز ناقص" size={50} x={540} y={1550} fill="#C9CDF0" reveal={{ by: 'all', at: 0.2, dur: 0.4, from: { opacity: 0 } }} />
</AbsoluteFill>;
