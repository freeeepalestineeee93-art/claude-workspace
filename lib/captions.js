// كابشن متزامن مع الكلام: من ملف توقيت الكلمات (words.json) لطبقات نص جاهزة.
// const caps = await S.captions('assets/vo.words.json', { y: S.vh(78), size: 72, style: 'karaoke' })
// الأساليب: karaoke (الكلمة الحالية بتتلوّن) · pop (كل كلمة بتنفقع وقت تنقال) · line (الجملة بتطلع مع بعض)

export function groupPhrases(words, { maxChars = 26, maxWords = 6, gap = 0.35 } = {}) {
  const out = [];
  let cur = [];
  const flush = () => { if (cur.length) out.push(cur); cur = []; };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const len = cur.reduce((a, x) => a + x.word.length + 1, 0) + w.word.length;
    if (cur.length && (len > maxChars || cur.length >= maxWords || (prev && w.start - prev.end > gap) || /[.!?؟،,]$/.test(prev?.word ?? ''))) flush();
    cur.push(w);
  });
  flush();
  return out;
}

export function captionLayers(S, words, o = {}) {
  const {
    x = S.cx, y = S.safe.bottom - S.px(120), size = S.px(70), style = 'karaoke', color = S.colors.text ?? '#fff',
    active = S.colors.primary ?? '#ffd84d', dim = 0.55, maxWidth = S.safe.w, family, weight, offset = 0, box = null,
  } = o;
  const phrases = groupPhrases(words, o);
  return phrases.map((ph, pi) => {
    const start = ph[0].start + offset, end = (phrases[pi + 1]?.[0].start ?? ph[ph.length - 1].end + 0.6) + offset;
    const text = ph.map((w) => w.word).join(' ');
    const L = S.text({ text, x, y, size, family, weight, maxWidth, fill: color, in: start - 0.05, out: end, role: 'body' });
    const times = ph.map((w) => w.start + offset);
    if (style === 'pop') L.reveal = { by: 'word', at: start, times, pivot: 'center', from: { scale: 0.4, opacity: 0, y: size * 0.25 }, spring: 'playful' };
    else if (style === 'line') L.reveal = { by: 'word', at: start, from: { opacity: 0, y: size * 0.3 }, spring: 'default', stagger: { each: 0.04 } };
    else L.reveal = { by: 'word', at: start, times, from: { opacity: dim }, dur: 0.08, ease: 'linear' };
    if (style === 'karaoke') {
      // الكلمة الحالية بلون مميز، والباقي باللون العادي
      L.words = {};
      ph.forEach((w, i) => {
        L.words[i] = { color: { kf: [[w.start + offset - 0.02, color], [w.start + offset + 0.04, active], [w.end + offset + 0.05, active], [w.end + offset + 0.15, color]] } };
      });
    }
    if (box) L.marks = [{ word: [0, ph.length - 1], type: 'box', color: box, at: start - 0.05, dur: 0.25 }];
    L.sfx = false; // الكلام نفسه هو الصوت
    return L;
  });
}
