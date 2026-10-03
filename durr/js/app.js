/* الدر الثمين — منطق التطبيق (بدون مكتبات خارجية) */
(function () {
'use strict';

/* ───────── أدوات ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = n => String(n).replace(/\d/g, d => AR[d]);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = s => esc(s)
  .replace(/﴿([^﴾]+)﴾/g, '<span class="q">$1</span>')
  .replace(/\[\[([^\]]+)\]\]/g, '<span class="key">$1</span>');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const unitById = id => UNITS.find(u => u.id === id);
const plainText = s => String(s).replace(/[﴿﴾]|\[\[|\]\]/g, '');
const stripHarakat = s => String(s).replace(/[ً-ْٰـ]/g, '');

/* ───────── أيقونات ───────── */
const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 17.5c6 0 2-8 8-10.5"/></svg>',
  game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7" width="19" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="14" r=".9" fill="currentColor"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="6" width="13" height="15" rx="2.5"/><path d="M8 3h10.5A2.5 2.5 0 0 1 21 5.5V17"/></svg>',
  lab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c0-4.5 3.5-8 8-8 3 0 5 1.5 6.5 4L21 12l-2.5.8c0 3.5-2.5 6.7-6.5 6.7H9"/><path d="M4 12c0 2.5 1.5 5 4 6.5"/><circle cx="14" cy="9" r="1" fill="currentColor"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5"/><path d="M12 14v4M8.5 20.5h7"/></svg>',
  pearl: '<svg viewBox="0 0 24 24"><defs><radialGradient id="pg" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#f3e7cf"/><stop offset="1" stop-color="#c9a76a"/></radialGradient></defs><circle cx="12" cy="12" r="9" fill="url(#pg)" stroke="#b08a43" stroke-width=".8"/><circle cx="9" cy="8.5" r="2.2" fill="#fff" opacity=".85"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 21c4 0 7-2.7 7-6.6 0-3.2-2-5.4-3.6-7-.4 2-1.5 3-2.6 3.2C13.6 7 12 4.6 9.5 3c.4 3-1.5 5-3 6.6C5.4 10.9 5 12.6 5 14.4 5 18.3 8 21 12 21Z" fill="rgba(240,138,36,.3)" stroke="#e07a14"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="m7.5 12.3 3 3 6-6.3"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="m9 9 6 6M15 9l-6 6"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3Z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 12 8 18V6z"/></svg>',
  sort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="7" rx="2"/><rect x="14" y="4" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><path d="M14 17.5h7M17.5 14v7"/></svg>',
  meter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="12" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="20" cy="12" r="2" fill="currentColor"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/></svg>',
  verse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h7M15 12h5M4 17h16"/><path d="M11 12h4" stroke-dasharray="1.5 2"/></svg>',
  dna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 3c0 6 10 6 10 12M17 3c0 6-10 6-10 12M7 21c0-2 1-3.3 2.5-4.3M17 21c0-2-1-3.3-2.5-4.3"/><path d="M8.5 7h7M8.5 11h7"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m8 3 4 6 4-6"/><circle cx="12" cy="15" r="5.5"/><path d="m12 12.5.9 1.9 2 .2-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.2z" fill="currentColor"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z"/><path d="M12 6.5v13"/></svg>',
  redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/></svg>'
};

/* ───────── الحفظ (محلياً في المتصفح) ───────── */
const KEY = 'durr-thameen-v1';
const blank = () => ({ pearls: 0, read: {}, quiz: {}, games: {}, flash: {}, mistakes: {}, streak: { last: '', count: 0 }, badges: {}, sound: true, theme: '', answers: 0, correct: 0, bestCombo: 0, flashCount: 0, daily: '', played: {} });
let S = blank();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* التخزين غير متاح */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
function touchStreak() {
  const t = today(); if (S.streak.last === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
  S.streak.count = S.streak.last === ys ? S.streak.count + 1 : 1; S.streak.last = t; save();
}

/* ───────── المستويات والأوسمة ───────── */
const LEVELS = [[0, 'بادئ الرحلة'], [60, 'غوّاص ناشئ'], [180, 'جامع اللآلئ'], [360, 'صائغ الدرر'], [600, 'متقن الأحكام'], [900, 'حافظ العقد'], [1300, 'صاحب الدر الثمين']];
const levelOf = p => { let i = 0; LEVELS.forEach((l, k) => { if (p >= l[0]) i = k; }); const cur = LEVELS[i], nx = LEVELS[i + 1]; return { i, name: cur[1], next: nx ? nx[0] : null, base: cur[0], pct: nx ? (p - cur[0]) / (nx[0] - cur[0]) : 1 }; };
const TOTAL_LESSONS = UNITS.reduce((n, u) => n + u.lessons.length, 0);
const readCount = () => Object.keys(S.read).length;
const unitDone = u => (S.quiz[u.id] && S.quiz[u.id].best >= .7);
const doneUnits = () => UNITS.filter(unitDone).length;
const BADGES = [
  ['first-lesson', 'أوّل الغيث', 'اقرأ أوّل درس', () => readCount() >= 1, 'book'],
  ['ten-lessons', 'قارئ نهِم', 'أتمّ ١٠ دروس', () => readCount() >= 10, 'book'],
  ['all-lessons', 'خاتمة الكتاب', 'أتمّ جميع الدروس', () => readCount() >= TOTAL_LESSONS, 'book'],
  ['first-quiz', 'أوّل اختبار', 'أنهِ اختبار وحدة', () => Object.keys(S.quiz).length >= 1, 'check'],
  ['perfect', 'العلامة الكاملة', '١٠٠٪ في اختبار وحدة', () => Object.values(S.quiz).some(q => q.best >= 1), 'star'],
  ['half', 'نصف العقد', 'اجتز ٥ وحدات', () => doneUnits() >= 5, 'pearl'],
  ['necklace', 'العقد الثمين', 'اجتز الوحدات العشر', () => doneUnits() >= 10, 'pearl'],
  ['streak3', 'مواظب', 'تعلّم ٣ أيام متتالية', () => S.streak.count >= 3, 'flame'],
  ['streak7', 'أسبوع إتقان', 'تعلّم ٧ أيام متتالية', () => S.streak.count >= 7, 'flame'],
  ['combo10', 'سلسلة ذهبية', '١٠ إجابات صحيحة متتالية', () => S.bestCombo >= 10, 'bolt'],
  ['gamer', 'فارس الساحة', 'العب ٤ ألعاب مختلفة', () => Object.keys(S.played).length >= 4, 'game'],
  ['flash50', 'ذاكرة حديدية', 'راجع ٥٠ بطاقة', () => S.flashCount >= 50, 'cards'],
  ['sifat', 'خبير الصفات', '٨٠ نقطة في «استخرج الصفات»', () => (S.games.sifat || 0) >= 80, 'dna'],
  ['final', 'المجاز', '٨٠٪ في الامتحان الشامل', () => (S.quiz.final && S.quiz.final.best >= .8), 'medal']
];
function checkBadges() {
  BADGES.forEach(b => { if (!S.badges[b[0]] && b[3]()) { S.badges[b[0]] = today(); save(); toast('وسام جديد: ' + b[1], 'medal'); sfx('level'); burst(40); } });
}
function award(n, why) {
  if (!n) return;
  const before = levelOf(S.pearls).i; S.pearls += n; touchStreak(); save(); updateChrome();
  if (why) toast(`+${ar(n)} دُرّة — ${why}`, 'pearl');
  const after = levelOf(S.pearls);
  if (after.i > before) { setTimeout(() => { toast('ارتقيت إلى رتبة: ' + after.name, 'trophy'); sfx('level'); burst(90); }, 600); }
  checkBadges();
}

/* ───────── الصوت ───────── */
let actx = null;
function sfx(kind) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { ok: [[660, .08], [990, .12]], no: [[220, .16], [180, .18]], tick: [[880, .03]], level: [[523, .1], [659, .1], [784, .1], [1046, .22]], flip: [[540, .05]] }[kind] || [];
    let t = actx.currentTime;
    seq.forEach(([f, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'no' ? 'triangle' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02); t += d * .9;
    });
  } catch (e) { }
}

/* ───────── تأثير الدرر المتساقطة ───────── */
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function burst(n = 70) {
  if (reduceMotion) return;
  const c = document.createElement('canvas'); c.className = 'fx'; document.body.appendChild(c);
  const dpr = Math.min(window.devicePixelRatio || 1, 2), W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr; const x = c.getContext('2d');
  const cols = ['#fffaf0', '#f3e2bd', '#e3b453', '#3cc4a8', '#ffffff'];
  const P = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 14 * dpr, vy: (-Math.random() * 13 - 4) * dpr, r: (Math.random() * 5 + 3) * dpr, c: cols[Math.random() * cols.length | 0] }));
  let f = 0; (function tick() {
    x.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .45 * dpr; p.x += p.vx; p.y += p.vy; p.vx *= .985; const g = x.createRadialGradient(p.x - p.r / 3, p.y - p.r / 3, 1, p.x, p.y, p.r); g.addColorStop(0, '#fff'); g.addColorStop(1, p.c); x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); });
    if (++f < 110) requestAnimationFrame(tick); else c.remove();
  })();
}

/* ───────── إشعارات ───────── */
function toast(msg, icon = 'pearl') {
  let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = (I[icon] || '') + '<span>' + esc(msg) + '</span>';
  box.appendChild(t); setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 420); }, 2600);
}

/* ───────── عرض كتل الدروس ───────── */
const letterInfo = (l, madd) => { if (!madd && (l === 'ي' || l === 'و')) l = l + 'ْ'; return LETTERS.find(x => x.l === l) || LETTERS.find(x => stripHarakat(x.l) === stripHarakat(l)); };
function mnemoPhrase(b) {
  const words = b.phrase.split(/\s+/).filter(w => w && w !== '۞');
  if (b.mode === 'none') return esc(b.phrase);
  if (words.length === b.letters.length && words.length > 1) {
    return b.phrase.split(/(\s+)/).map(w => { if (!w.trim() || w === '۞') return esc(w); const m = w.match(/^([ء-ي])(.*)$/); return m ? '<span class="init">' + m[1] + '</span>' + esc(m[2]) : esc(w); }).join('');
  }
  return '<span class="init">' + esc(b.phrase) + '</span>';
}
const lettersHTML = (ls, madd) => '<div class="letters">' + ls.map(l => `<button class="lt" data-letter="${esc(l)}"${madd ? ' data-madd="1"' : ''} aria-label="الحرف ${esc(l)}">${esc(l)}</button>`).join('') + '</div>';
const beads = arr => { const max = Math.max(...arr); const set = new Set(arr); let s = ''; for (let i = 1; i <= 6; i++) s += `<i class="${i <= Math.min(...arr) ? 'on' : (i <= max && arr.some(v => v >= i) ? 'alt' : '')}"></i>`; return `<span class="beads" aria-label="${arr.map(ar).join(' أو ')} حركات">${s}<small>${arr.length === 1 && max === 2 ? 'حركتان' : arr.map(ar).join(' أو ') + ' حركات'}</small></span>`; };

const BLOCK = {
  p: b => `<p class="blk-p">${fmt(b.t)}</p>`,
  def: b => `<div class="def">${b.name ? `<div class="def-name">${esc(b.name)}</div>` : ''}${b.lugha ? `<div class="def-row"><b>لغةً</b><span>${fmt(b.lugha)}</span></div>` : ''}${b.istilah ? `<div class="def-row"><b>${b.lugha ? 'اصطلاحاً' : 'تعريفه'}</b><span>${fmt(b.istilah)}</span></div>` : ''}</div>`,
  list: b => `${b.title ? `<div class="blk-title">${fmt(b.title)}</div>` : ''}<ul class="olist ${b.ordered ? '' : 'ulist'}" style="--start:${(b.start || 1) - 1}">${b.items.map(i => `<li><span>${fmt(i)}</span></li>`).join('')}</ul>`,
  table: b => `${b.title ? `<div class="blk-title">${fmt(b.title)}</div>` : ''}<div class="tablewrap"><table class="t"><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
  cards: b => `${b.title ? `<div class="blk-title">${fmt(b.title)}</div>` : ''}<div class="cardgrid">${b.items.map(i => `<div class="mini"><h4>${fmt(i.h)}</h4><p>${fmt(i.t)}</p></div>`).join('')}</div>`,
  three: b => BLOCK.cards(b),
  grid4: b => BLOCK.cards(b),
  shahid: b => `<figure class="shahid" style="margin:0"><figcaption class="shahid-src">${I.book.replace('<svg', '<svg width="16" height="16"')}${esc(b.src)}</figcaption>${b.lines.map(l => `<div class="bayt"><span>${esc(l[0])}</span><span>${esc(l[1])}</span></div>`).join('')}</figure>`,
  note: b => `<div class="note">${I.bulb}<div>${b.title ? `<b class="nt">${esc(b.title)}</b>` : '<b class="nt">تنبيه</b>'}<p>${fmt(b.t)}</p></div></div>`,
  tree: b => `<div class="tree"><div class="tree-root">${esc(b.root)}</div><div class="tree-stem"></div><div class="tree-kids">${b.children.map(c => `<div class="tree-node"><b>${fmt(c.label)}</b>${c.sub ? `<span class="sub">${fmt(c.sub)}</span>` : ''}${c.body ? `<p>${fmt(c.body)}</p>` : ''}${c.verdict ? `<span class="tag" style="--hc:var(--bad)">${esc(c.verdict)}</span>` : ''}${c.children ? `<div class="kids">${c.children.map(k => `<div class="kid"><b>${fmt(k.label)}</b>${k.body ? fmt(k.body) : ''}</div>`).join('')}</div>` : ''}</div>`).join('')}</div></div>`,
  speed: b => `<div class="speed">${b.items.map(i => `<div class="speed-row"><b>${esc(i.h)}</b><div class="speed-track"><span>${fmt(i.t)}</span><div class="speed-bar" aria-hidden="true"><i style="animation-duration:${[0, 4.2, 2.6, 1.4][i.v]}s"></i></div></div></div>`).join('')}</div>`,
  compare: b => `<div class="compare"><div class="mini"><h4>${fmt(b.a.h)}</h4><p>${fmt(b.a.t)}</p></div><div class="mini"><h4>${fmt(b.b.h)}</h4><p>${fmt(b.b.t)}</p></div></div>`,
  split: b => `${b.title ? `<div class="blk-title">${fmt(b.title)}</div>` : ''}<div class="split">${[b.a, b.b].map(s => `<div class="mini"><h4>${fmt(s.h)}</h4><ul>${s.items.map(i => `<li>${fmt(i)}</li>`).join('')}</ul></div>`).join('')}</div>`,
  chain: b => `<div class="chain"><div class="blk-title" style="margin:0">${fmt(b.title)}</div>${b.ways.map((w, k) => `<div class="chain-row ${w.bad ? 'bad' : ''}"><div class="chain-seq">${b.parts.map((p, i) => `<span class="chain-part">${esc(p)}</span>${i < b.parts.length - 1 ? `<span class="chain-link ${w.links[i] ? 'join' : 'cut'}">${w.links[i] ? 'وصل' : 'قطع'}</span>` : ''}`).join('')}</div><p>${w.bad ? '✕ ' : ar(k + 1) + '. '}${fmt(w.h)}</p></div>`).join('')}</div>`,
  four: b => BLOCK.five({ title: b.title, items: b.items.map(t => ({ h: t, t: '' })) }),
  five: b => `${b.title ? `<div class="blk-title">${fmt(b.title)}</div>` : ''}<div class="five">${b.items.map(i => `<div class="mini"><h4>${fmt(i.h)}</h4>${i.t ? `<p>${fmt(i.t)}</p>` : ''}</div>`).join('')}</div>`,
  mnemo: b => `<div class="mnemo"><div class="eyebrow">${esc(b.label)}</div><div class="mnemo-phrase">${mnemoPhrase(b)}</div>${b.hint ? `<div class="muted" style="font-size:.9rem">${fmt(b.hint)}</div>` : ''}${lettersHTML(b.letters, b.phrase === 'واي')}</div>`,
  why: b => `<div class="why"><span class="q">${esc(b.ex.replace(/[﴿﴾]/g, ''))}</span><p><b>تعليل المثال: </b>${fmt(b.t)}</p></div>`,
  ex: b => `<div><div class="blk-title">${esc(b.label)}</div><div class="exrow">${b.words.map(w => `<span class="q">${esc(w)}</span>`).join('')}</div></div>`,
  ladder: b => `${b.title ? `<div class="blk-title">${fmt(b.title)}</div>` : ''}<div class="ladder">${b.items.map((i, k) => `<div class="rung" style="--i:${k}"><span class="n">${ar(k + 1)}</span><div><b>${fmt(i.h)}</b><p class="muted" style="color:var(--ink-2)">${fmt(i.t)}</p></div><span class="m">${esc(i.m)}</span></div>`).join('')}</div>`,
  madd: b => `<div class="madd"><div class="madd-head"><h4>${esc(b.name)}</h4>${beads(b.h)}</div><p>${fmt(b.t)}</p></div>`,
  podium: b => `<div class="blk-title">${esc(b.title)}</div><div class="podium">${b.items.map((t, k) => `<div class="pod" style="--w:${60 - k * 12}%"><b>${ar(k + 1)}</b><span>${esc(t)}</span></div>`).join('')}</div>`,
  strength: b => `<div class="blk-title">${esc(b.title)}</div><div class="strength">${[b.a, b.b].map(s => `<div class="mini"><h4>${esc(s.h)}</h4><p><span class="key">${esc(s.rule)}</span></p><p>${fmt(s.ex)}</p><div class="tablewrap"><table class="t"><thead><tr>${s.cols.map(c => `<th>${fmt(c)}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}</div>`,
  sifa: b => `<div class="sifa-grid">${b.items.map(s => `<div class="sifa"><h4>${esc(s.name)}</h4><div class="kv"><b>لغةً</b>${esc(s.lugha)}</div><div class="kv"><b>اصطلاحاً</b>${esc(s.ist)}</div><div class="kv"><b>حروفها (${esc(s.count)})</b></div><div class="lettersline">${esc(s.letters)}</div></div>`).join('')}</div>`,
  cta: b => `<a class="quiz-cta" href="#${b.go}" style="text-decoration:none;color:inherit"><div class="row">${I.dna.replace('<svg', '<svg width="28" height="28" style="color:var(--hc)"')}<b>${esc(b.t)}</b></div><span class="btn sm">العب الآن</span></a>`,
  mouth: () => mouthBlock(),
  teeth: () => teethBlock(),
  lettertable: () => `<div class="blk-title">جدول الحروف: المخرج والصفات واللقب (ص ${ar(84)} - ${ar(85)})</div><div class="tablewrap"><table class="t"><thead><tr><th>الحرف</th><th>المخرج</th><th>الصفات</th><th>اللقب</th></tr></thead><tbody>${LETTERS.map(l => `<tr><td style="font-family:var(--f-quran);font-size:1.3rem">${esc(l.l)}</td><td>${esc(l.mk)}</td><td>${l.s.concat(l.x).join('، ')}</td><td>${esc(l.lq)}</td></tr>`).join('')}<tr><td>الغنّة</td><td>الخيشوم</td><td>الجهر (على حسب الحرف الذي بعدها وذلك في الإخفاء) التفخيم أو الترقيق</td><td></td></tr></tbody></table></div>`
};
const renderBlocks = bs => bs.map(b => `<div class="blk">${(BLOCK[b.k] || (() => ''))(b)}</div>`).join('');

/* ───────── مخطط الفم (مخارج الحروف) ───────── */
const ZONE_HUE = { jawf: '--h-red', halq1: '--h-indigo', halq2: '--h-violet', halq3: '--h-rose', aqsa: '--h-amber', wasat: '--h-gold', hafa: '--h-cyan', taraf: '--h-teal', shafa: '--h-sky', khay: '--h-green' };
function mouthSVG() {
  const z = (id, d, lx, ly, label) => `<path class="zone" data-zone="${id}" style="--zc:var(${ZONE_HUE[id]})" d="${d}"><title>${ZONES[id].n}</title></path>`;
  const lb = (x, y, t, anchor = 'middle') => `<text class="lbl" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
  return `<svg class="mouth" viewBox="0 0 420 380" style="direction:ltr" role="img" aria-label="مخطط مقطع جانبي للفم والحلق يوضّح مواضع المخارج">
    <path class="head" d="M215 6C130 6 78 40 70 98L34 150c-5 8 1 14 10 14l18 2-2 24c-16 6-16 22-2 26-12 8-10 22 4 26l2 22c8 34 56 48 110 50l70 2 30 56h146V6Z"/>
    <path class="cav" d="M76 148c40-22 150-26 196-8 10 6 8 20-6 22-50 4-120 4-190 0Z"/>
    <path class="cav" d="M68 190c40-14 160-20 206-6l18 18 4 168h-40l-2-100c-60-2-140-8-184-28Z"/>
    ${z('khay', 'M84 150c40-18 140-22 182-8 6 4 4 12-6 13-48 5-116 5-176 1Z')}
    ${z('jawf', 'M84 207c40-14 140-22 192-14l10 14c-50-6-140 0-200 12Z')}
    <rect class="tooth" x="66" y="186" width="13" height="20" rx="4"/>
    <rect class="tooth" x="66" y="222" width="13" height="18" rx="4"/>
    ${z('shafa', 'M46 190c-12 8-12 20 0 24l18 0 0-26ZM48 220c-12 6-10 20 4 22l12-2 0-22Z')}
    <path class="tongue" d="M86 222c26-14 90-22 150-18 30 2 46 14 52 34l4 34c-56 0-150-6-196-26-12-6-14-18-10-24Z"/>
    ${z('taraf', 'M86 222c8-8 22-12 38-14l4 32c-16 0-34-2-42-8-4-3-4-6 0-10Z')}
    ${z('hafa', 'M130 236c30 2 60 4 92 4l0 12c-34 0-64-2-92-6Z')}
    ${z('wasat', 'M150 208c26-4 52-5 76-4l0 18c-24-1-50 0-76 3Z')}
    ${z('aqsa', 'M232 204c26 2 44 12 52 30l-50 2Z')}
    ${z('halq3', 'M290 196h36v44h-34Z')}
    ${z('halq2', 'M292 242h34v46h-33Z')}
    ${z('halq1', 'M293 290h33v48h-32Z')}
    ${lb(175, 140, 'الخيشوم')}${lb(178, 199, 'الجوف')}${lb(44, 182, 'الشفتان')}
    ${lb(104, 262, 'طرف اللسان')}${lb(176, 268, 'حافّة اللسان')}${lb(188, 232, 'وسطه')}${lb(250, 226, 'أقصاه')}
    ${lb(332, 222, 'أدنى الحلق', 'start')}${lb(332, 270, 'وسط الحلق', 'start')}${lb(332, 318, 'أقصى الحلق', 'start')}
  </svg>`;
}
function zoneLetters(id) { return id === 'khay' ? ['الغنّة'] : LETTERS.filter(l => l.z === id).map(l => l.l); }
function mouthBlock() {
  return `<div class="mouth-wrap" data-mouth>${mouthSVG()}<div class="zone-info" aria-live="polite"><h4>المخارج العامّة الخمسة</h4><p class="muted">اضغط على أي منطقة في المخطط لترى حروفها كما وردت في الكتاب.</p></div></div>`;
}
function bindMouth(root) {
  $$('[data-mouth]', root).forEach(w => {
    const info = $('.zone-info', w);
    $$('.zone', w).forEach(p => p.addEventListener('click', () => {
      const id = p.dataset.zone; $$('.zone', w).forEach(q => q.classList.toggle('on', q === p)); sfx('tick');
      info.innerHTML = `<h4>${ZONES[id].n}</h4><p>${esc(ZONES[id].d)}</p>${id === 'khay' ? '' : lettersHTML(zoneLetters(id))}`; bindLetters(info);
    }));
  });
}

/* ───────── مخطط الأسنان ───────── */
const TEETH = [['الثنايا', '--h-red'], ['الرَّباعيات', '--h-amber'], ['الأنياب', '--h-gold'], ['الضواحك', '--h-green'], ['الطواحن', '--h-sky'], ['النواجذ', '--h-violet']];
const TOOTH_SEQ = [0, 1, 2, 3, 4, 4, 4, 5];
function teethBlock() {
  let s = '';
  const arch = (cy, dir) => { for (let side of [-1, 1]) TOOTH_SEQ.forEach((t, k) => {
    const th = (k + .5) * (88 / 8) * Math.PI / 180; const x = 210 + side * 150 * Math.sin(th); const y = cy + dir * 120 * (1 - Math.cos(th)) * 1.25;
    const r = 10 + (t >= 4 ? 5 : t * 1.2); s += `<ellipse class="t" data-tt="${t}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r}" ry="${(r * .85).toFixed(1)}" fill="color-mix(in oklab, var(${TEETH[t][1]}) 45%, #fffaf0)"><title>${TEETH[t][0]}</title></ellipse>`;
  }); };
  arch(30, 1); arch(380, -1);
  return `<div class="stack" data-teeth><svg class="teeth" viewBox="0 0 420 410" role="img" aria-label="مخطط أسنان الفم الاثنين والثلاثين">${s}<text x="210" y="205" text-anchor="middle" class="lbl" style="font-family:var(--f-display);font-weight:700;font-size:22px;fill:var(--muted)">الأسنان (${ar(32)})</text></svg><div class="teeth-legend">${TEETH.map((t, i) => `<button data-tl="${i}"><i style="background:var(${t[1]})"></i>${t[0]}</button>`).join('')}</div></div>`;
}
function bindTeeth(root) {
  $$('[data-teeth]', root).forEach(w => {
    const hl = i => { $$('.t', w).forEach(e => e.style.opacity = (i === null || +e.dataset.tt === i) ? 1 : .18); $$('[data-tl]', w).forEach(b => b.classList.toggle('on', +b.dataset.tl === i)); };
    $$('[data-tl]', w).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.tl; hl(b.classList.contains('on') ? null : i); sfx('tick'); }));
    $$('.t', w).forEach(e => e.addEventListener('click', () => hl(+e.dataset.tt)));
  });
}
function bindLetters(root) {
  $$('.lt[data-letter]', root).forEach(b => b.addEventListener('click', () => {
    const L = letterInfo(b.dataset.letter, b.dataset.madd); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); sfx('tick');
    if (L) toast(`${L.name}: ${L.mk}`, 'lab');
  }));
}

/* ───────── عِقد الدرر (التقدّم) ───────── */
function necklaceSVG() {
  const P0 = [18, 26], P1 = [160, 250], P2 = [302, 26];
  const pt = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
  let pearls = '';
  UNITS.forEach((u, i) => {
    const [x, y] = pt(.92 - i * (.84 / 9)); const done = unitDone(u); const some = u.lessons.some((_, k) => S.read[u.id + '-' + k]);
    pearls += done
      ? `<g><circle cx="${x}" cy="${y}" r="15" fill="url(#np)" filter="url(#glow)"/><circle cx="${x - 5}" cy="${y - 5}" r="4" fill="#fff" opacity=".9"/></g>`
      : `<g><circle cx="${x}" cy="${y}" r="12" class="pearl-empty" ${some ? 'style="stroke:#e3b453;stroke-dasharray:none"' : ''}/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.7)">${ar(u.no)}</text></g>`;
  });
  return `<svg class="necklace" viewBox="0 0 320 210" role="img" aria-label="عقد الدرر: ${ar(doneUnits())} من ${ar(10)} وحدات">
    <defs><radialGradient id="np" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#f6ecd8"/><stop offset="1" stop-color="#c8a56a"/></radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d="M${P0} Q${P1} ${P2}" fill="none" stroke="rgba(227,180,83,.75)" stroke-width="1.6"/>
    ${pearls}
    <text x="160" y="200" text-anchor="middle" font-size="13" fill="#e8d6ad" font-weight="600">${ar(doneUnits())} / ${ar(10)} دُرَر في عِقدك</text>
  </svg>`;
}

/* ───────── الواجهة العامة ───────── */
const NAV = [['home', 'الرئيسية', 'home'], ['journey', 'الرحلة', 'map'], ['arena', 'ساحة التحدّي', 'game'], ['review', 'المراجعة', 'cards'], ['lab', 'مختبر الحروف', 'lab'], ['me', 'إنجازاتي', 'trophy']];
const brandSVG = '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><defs><radialGradient id="bm" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#f3e7cf"/><stop offset="1" stop-color="#c49a52"/></radialGradient></defs><path d="M4 22c4 10 28 10 32 0-6 6-26 6-32 0Z" fill="var(--accent)" opacity=".9"/><path d="M4 22C4 9 36 9 36 22c-6-5-26-5-32 0Z" fill="var(--accent)" opacity=".55"/><circle cx="20" cy="20" r="6.5" fill="url(#bm)"/><circle cx="18" cy="18" r="1.8" fill="#fff"/></svg>';
function shell() {
  const app = $('#app');
  app.innerHTML = `<div class="shell">
    <nav class="rail" aria-label="التنقل الرئيسي"><a class="brand" href="#home">${brandSVG}<span><span class="brand-name">الدر الثمين</span><br><span class="brand-sub">تجويد كلام ربّ العالمين</span></span></a>
      ${NAV.map(n => `<a class="navlink" href="#${n[0]}" data-nav="${n[0]}">${I[n[2]]}<span>${n[1]}</span></a>`).join('')}
      <div class="rail-foot">المحتوى مأخوذ حصراً من كتاب «الدر الثمين في تجويد كلام رب العالمين» — محمد حمزة عطار وأحمد خلوف أديب.</div></nav>
    <div style="min-width:0">
      <header class="topbar"><a class="brand" href="#home">${brandSVG}<span class="brand-name">الدر الثمين</span></a><div class="spacer"></div>
        <span class="chip-stat" title="الدرر">${I.pearl}<b id="c-pearls">${ar(S.pearls)}</b></span>
        <span class="chip-stat" title="أيام متتالية">${I.flame}<b id="c-streak">${ar(S.streak.count)}</b></span>
        <button class="icon-btn" id="b-search" aria-label="ابحث في الكتاب">${I.search}</button>
        <button class="icon-btn" id="b-sound" aria-label="الصوت">${S.sound ? I.sound : I.mute}</button>
        <button class="icon-btn" id="b-theme" aria-label="تبديل المظهر">${I.moon}</button></header>
      <main class="main" id="main" tabindex="-1"></main>
    </div>
    <nav class="dock" aria-label="التنقل السفلي">${NAV.filter(n => n[0] !== 'lab').map(n => `<a class="navlink" href="#${n[0]}" data-nav="${n[0]}">${I[n[2]]}<span>${n[1]}</span></a>`).join('')}</nav>
  </div>`;
  $('#b-sound').onclick = () => { S.sound = !S.sound; save(); $('#b-sound').innerHTML = S.sound ? I.sound : I.mute; sfx('ok'); };
  $('#b-theme').onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', nx); S.theme = nx; save(); themeIcon();
  };
  $('#b-search').onclick = openSearch;
  if (S.theme) document.documentElement.setAttribute('data-theme', S.theme);
  themeIcon();
}
function themeIcon() { const d = (document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'; $('#b-theme').innerHTML = d ? I.sun : I.moon; }
function updateChrome() { const p = $('#c-pearls'), s = $('#c-streak'); if (p) p.textContent = ar(S.pearls); if (s) s.textContent = ar(S.streak.count); }

/* ───────── البحث في الكتاب ───────── */
let INDEX = null;
function buildIndex() {
  INDEX = [];
  const walk = (v, out) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(x => walk(x, out)); else if (v && typeof v === 'object') Object.keys(v).forEach(k => { if (k !== 'k' && k !== 'go' && k !== 'z' && k !== 'mode') walk(v[k], out); }); };
  UNITS.forEach(u => u.lessons.forEach((l, i) => { const out = []; walk(l.blocks, out); INDEX.push({ u, i, l, text: plainText(out.join(' ')), norm: stripHarakat(plainText(out.join(' ') + ' ' + l.title)) }); }));
}
function openSearch() {
  if (!INDEX) buildIndex();
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="search-box" role="dialog" aria-label="البحث في الكتاب"><input id="sq" type="search" placeholder="ابحث عن حكم، مصطلح، أو كلمة… مثل: القلقلة" autocomplete="off"><div class="search-res" id="sr"><div class="empty">اكتب كلمة للبحث في كلّ دروس الكتاب.</div></div></div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  const inp = $('#sq', ov); inp.focus();
  inp.addEventListener('input', () => {
    const q = stripHarakat(inp.value.trim()); const box = $('#sr', ov);
    if (q.length < 2) { box.innerHTML = '<div class="empty">اكتب حرفين على الأقل.</div>'; return; }
    const res = INDEX.filter(x => x.norm.includes(q)).slice(0, 30);
    box.innerHTML = res.length ? res.map(x => { const t = stripHarakat(x.text); const at = Math.max(0, t.indexOf(q) - 40); const snip = t.slice(at, at + 120); return `<a class="sres" href="#${x.u.id}-${x.i}"><b>${esc(x.l.title)} <span class="tag hue-${x.u.hue}">${esc(x.u.short)}</span></b><small>${esc(snip).replace(esc(q), '<mark>' + esc(q) + '</mark>')}</small></a>`; }).join('') : '<div class="empty">لا توجد نتائج. جرّب كلمة أخرى بلا تشكيل.</div>';
    $$('.sres', box).forEach(a => a.addEventListener('click', close));
  });
}

/* ───────── المحرّك: الاختبارات ───────── */
let cleanup = null;
const setCleanup = fn => { if (cleanup) cleanup(); cleanup = fn; };
function normQ(q, key) {
  if (q.tf !== undefined) return { q: q.q, opts: ['صواب', 'خطأ'], a: q.tf ? 0 : 1, e: q.e, p: q.p, key, tf: true };
  const order = shuffle(q.o.map((t, i) => ({ t, i })));
  return { q: q.q, opts: order.map(x => x.t), a: order.findIndex(x => x.i === q.a), e: q.e, p: q.p, key };
}
function quizRun({ title, hue = 'teal', questions, back, onDone }) {
  const main = $('#main'); let i = 0, score = 0, combo = 0, wrong = [];
  const keys = ['أ', 'ب', 'ج', 'د'];
  function draw() {
    const q = questions[i];
    main.innerHTML = `<div class="play hue-${hue}"><div class="play-top"><a class="icon-btn" href="#${back}" aria-label="رجوع">${I.back}</a><div class="grow"><div class="eyebrow">${esc(title)} — السؤال ${ar(i + 1)} من ${ar(questions.length)}</div><div class="qbar"><i style="width:${(i / questions.length) * 100}%"></i></div></div><span class="combo" aria-live="polite">${combo >= 2 ? '×' + ar(combo) : ''}</span></div>
      <div class="qcard"><div class="qtext">${fmt(q.q)}</div><div class="opts ${q.tf ? 'two' : 'grid2'}">${q.opts.map((o, k) => `<button class="opt ${q.tf ? 'center' : ''}" data-k="${k}">${q.tf ? '' : `<span class="k">${keys[k]}</span>`}<span>${fmt(o)}</span></button>`).join('')}</div><div id="fb"></div></div></div>`;
    $$('.opt', main).forEach(b => b.addEventListener('click', () => answer(+b.dataset.k)));
  }
  function answer(k) {
    const q = questions[i]; const ok = k === q.a; S.answers++;
    $$('.opt', main).forEach((b, j) => { b.disabled = true; if (j === q.a) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
    if (ok) { score++; combo++; S.correct++; if (combo > S.bestCombo) S.bestCombo = combo; sfx('ok'); if (q.key) delete S.mistakes[q.key]; }
    else { combo = 0; sfx('no'); wrong.push(q); if (q.key) S.mistakes[q.key] = 1; }
    save();
    $('#fb', main).innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">${ok ? I.check : I.x}<div><b>${ok ? pick(['أحسنت!', 'إجابة موفّقة!', 'ممتاز!', 'بارك الله فيك!'], 1)[0] : 'الإجابة الصحيحة: ' + esc(plainText(q.opts[q.a]))}</b><span>${fmt(q.e || '')}</span> ${q.p ? `<span class="pagetag">ص ${ar(q.p)}</span>` : ''}</div></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="nx">${i + 1 < questions.length ? 'السؤال التالي' : 'النتيجة'} ${I.next}</button></div>`;
    $('.combo', main).textContent = combo >= 2 ? '×' + ar(combo) : '';
    const nx = $('#nx', main); nx.focus({ preventScroll: true }); nx.onclick = () => { i++; if (i < questions.length) draw(); else finish(); };
    $('#fb', main).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }
  function finish() {
    const pct = score / questions.length; const stars = pct >= .9 ? 3 : pct >= .7 ? 2 : pct >= .5 ? 1 : 0;
    const extra = onDone ? onDone({ score, pct, stars }) || 0 : 0;
    const gained = score * 2 + extra; award(gained, null);
    if (pct >= .7) { burst(); sfx('level'); }
    main.innerHTML = `<div class="play hue-${hue}"><div class="qcard result"><div class="eyebrow">${esc(title)}</div><div class="stars">${[1, 2, 3].map(n => `<span class="${n <= stars ? 'on' : ''}">${I.star}</span>`).join('')}</div>
      <div class="big">${ar(score)} / ${ar(questions.length)}</div><p class="lead">${pct >= .9 ? 'إتقانٌ يليق بحامل القرآن!' : pct >= .7 ? 'أحسنت، لقد اجتزت بنجاح.' : pct >= .5 ? 'بداية جيدة، راجع الدرس وحاول مرة أخرى.' : 'لا بأس، الإتقان يأتي بالتكرار. راجع الدرس ثم أعد المحاولة.'}</p>
      <span class="chip-stat">${I.pearl}+${ar(gained)} دُرّة</span>
      <div class="row" style="justify-content:center"><button class="btn" id="again">${I.redo} أعد المحاولة</button><a class="btn ghost" href="#${back}">متابعة</a></div>
      ${wrong.length ? `<div class="review-list"><div class="blk-title">راجع أخطاءك (حُفظت في دفتر الأخطاء)</div>${wrong.map(q => `<div class="review-item">${fmt(q.q)}<br><span class="ans">✓ ${fmt(q.opts[q.a])}</span> — <span class="muted">${fmt(q.e || '')}</span> ${q.p ? `<span class="pagetag">ص ${ar(q.p)}</span>` : ''}</div>`).join('')}</div>` : ''}</div></div>`;
    $('#again', main).onclick = () => route(true);
  }
  draw();
}
const unitQuestions = (uid, n) => pick(QUIZ[uid].map((q, k) => normQ(q, uid + ':' + k)), n);

/* ───────── الصفحات ───────── */
const V = {};
V.home = () => {
  const lv = levelOf(S.pearls); const nextU = UNITS.find(u => !unitDone(u)) || UNITS[0];
  const nextL = nextU.lessons.findIndex((_, k) => !S.read[nextU.id + '-' + k]);
  const cont = nextL >= 0 ? `#${nextU.id}-${nextL}` : `#quiz-${nextU.id}`;
  const dailyDone = S.daily === today(); const mCount = Object.keys(S.mistakes).length;
  const bubbles = reduceMotion ? '' : Array.from({ length: 12 }, (_, k) => `<span style="right:${(k * 83) % 100}%;width:${6 + (k * 7) % 14}px;height:${6 + (k * 7) % 14}px;animation-duration:${7 + (k * 3) % 9}s;animation-delay:-${(k * 1.7) % 9}s"></span>`).join('');
  return `<section class="hero"><div class="bubbles" aria-hidden="true">${bubbles}</div><div class="hero-grid"><div class="stack">
      <div class="eyebrow">منصّة تفاعليّة لكتاب «الدر الثمين في تجويد كلام ربّ العالمين»</div>
      <h1>غُصْ في بحر التجويد، <em>واجمع دُرَرَه</em></h1>
      <p>عشر وحدات مأخوذة من الكتاب، لكلّ وحدة دروس قصيرة واختبار. اجتز الاختبار لتضيف دُرّة إلى عقدك، ثم تحدَّ نفسك في الألعاب.</p>
      <div class="row"><a class="btn" href="${cont}">${I.play} ${readCount() ? 'تابع رحلتك' : 'ابدأ الرحلة'}</a><a class="btn ghost" href="#arena">ساحة التحدّي</a></div>
    </div>${necklaceSVG()}</div></section>
    <div class="section"><div class="stats">
      <div class="stat"><span>رتبتك</span><b style="font-size:1.1rem">${esc(lv.name)}</b><div class="levelbar"><i style="width:${Math.round(lv.pct * 100)}%"></i></div><span>${lv.next ? `${ar(lv.next - S.pearls)} دُرّة للرتبة التالية` : 'بلغت أعلى رتبة'}</span></div>
      <div class="stat"><span>الدروس المقروءة</span><b>${ar(readCount())} / ${ar(TOTAL_LESSONS)}</b></div>
      <div class="stat"><span>دقّة إجاباتك</span><b>${S.answers ? ar(Math.round(S.correct / S.answers * 100)) + '٪' : '—'}</b></div>
      <div class="stat"><span>أطول سلسلة صحيحة</span><b>${ar(S.bestCombo)}</b></div>
    </div></div>
    <div class="section"><div class="section-head"><h2>تحدّيات اليوم</h2><span class="muted">${new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span></div>
      <div class="arena">
        <a class="game-card hue-gold" href="#quiz-daily"><span class="gi">${I.bolt}</span><h3>تحدّي اليوم</h3><p>سبعة أسئلة متنوّعة من الكتاب كلّه، تتجدّد كلّ يوم. ${dailyDone ? 'أنجزته اليوم — يمكنك الإعادة للتدريب.' : 'مكافأة إضافية ١٥ دُرّة عند الإنجاز.'}</p><div class="best"><span>${dailyDone ? '✓ أُنجز' : 'لم يُنجز بعد'}</span></div></a>
        <a class="game-card hue-red" href="#${mCount ? 'quiz-mistakes' : 'review'}"><span class="gi">${I.redo}</span><h3>دفتر الأخطاء</h3><p>${mCount ? `لديك ${ar(mCount)} سؤالاً أخطأت فيه. صحّحها لتمحوها من الدفتر.` : 'دفترك نظيف! كلّ سؤال تخطئ فيه يُحفظ هنا لتراجعه.'}</p><div class="best"><span>${mCount ? 'ابدأ التصحيح' : 'انتقل إلى بطاقات المراجعة'}</span></div></a>
        <a class="game-card hue-teal" href="#review"><span class="gi">${I.cards}</span><h3>بطاقات المراجعة</h3><p>${ar(FLASH.length)} بطاقة للضوابط والمصطلحات بطريقة التكرار المتباعد: ما تعرفه يبتعد، وما تنساه يعود.</p><div class="best"><span>${ar(dueCards().length)} بطاقة بانتظارك</span></div></a>
      </div></div>
    <div class="section"><div class="section-head"><h2>تابع من حيث توقّفت</h2><a class="muted" href="#journey">كلّ الوحدات</a></div>${stationHTML(nextU)}</div>
    <p class="footer-note">جميع الأحكام والأمثلة والشواهد مأخوذة من كتاب «الدر الثمين في تجويد كلام رب العالمين» (مؤسسة إتقان للتعليم والتنمية)، ويُشار إلى رقم الصفحة بجانب كلّ شرح. والأصل في التجويد التلقّي من أفواه المشايخ المتقنين.</p>`;
};
function stationHTML(u) {
  const r = u.lessons.filter((_, k) => S.read[u.id + '-' + k]).length; const q = S.quiz[u.id]; const stars = q ? q.stars : 0;
  return `<a class="station hue-${u.hue} ${unitDone(u) ? 'done' : ''}" href="#${u.id}"><span class="station-orb">${u.glyph}</span><div class="station-body"><div class="row" style="justify-content:space-between"><span class="eyebrow">الوحدة ${ar(u.no)}</span><span class="stars">${[1, 2, 3].map(n => `<span class="${n <= stars ? 'on' : ''}">${I.star}</span>`).join('')}</span></div><h3>${esc(u.title)}</h3><p class="muted" style="font-size:.93rem">${esc(u.blurb)}</p><div class="station-meta"><span>${ar(r)} / ${ar(u.lessons.length)} دروس</span><span class="mini-progress"><i style="width:${r / u.lessons.length * 100}%"></i></span>${q ? `<span>أفضل نتيجة: ${ar(Math.round(q.best * 100))}٪</span>` : '<span>الاختبار لم يُجرَ</span>'}</div></div></a>`;
}
V.journey = () => `<div class="stack"><span class="eyebrow">رحلة الغوص — ${ar(10)} وحدات</span><h1 class="h-page">خريطة الكتاب</h1><p class="lead">كلّ وحدة أعمق من سابقتها. اقرأ الدروس، ثم اجتز اختبار الوحدة بنسبة ٧٠٪ لتظفر بدُرّتها.</p></div>
  <div class="section"><div class="path"><span class="depth" aria-hidden="true"></span>${UNITS.map(stationHTML).join('')}</div></div>
  <div class="section"><a class="quiz-cta hue-gold" href="#quiz-final" style="text-decoration:none;color:inherit"><div class="stack" style="gap:4px"><b style="font-size:1.15rem">الامتحان الشامل</b><span class="muted">ثلاثون سؤالاً من الوحدات العشر. احصل على ٨٠٪ لتنال وسام «المجاز».</span></div><span class="btn gold">ابدأ الامتحان</span></a></div>`;

V.unit = (u) => {
  const q = S.quiz[u.id];
  return `<div class="hue-${u.hue} stack"><div class="crumbs"><a href="#journey">الرحلة</a> / <span>الوحدة ${ar(u.no)}</span></div>
    <header class="unit-head"><span class="glyph" aria-hidden="true">${u.glyph}</span><span class="eyebrow">الوحدة ${ar(u.no)} — ${ar(u.lessons.length)} دروس</span><h1>${esc(u.title)}</h1><p class="lead">${esc(u.blurb)}</p></header>
    <div class="lesson-list">${u.lessons.map((l, k) => `<a class="lesson-item ${S.read[u.id + '-' + k] ? 'read' : ''}" href="#${u.id}-${k}"><span class="lesson-num">${S.read[u.id + '-' + k] ? '✓' : ar(k + 1)}</span><span class="t"><b>${esc(l.title)}</b></span><span class="pagetag">ص ${ar(l.p)}</span></a>`).join('')}</div>
    <div class="quiz-cta"><div class="stack" style="gap:4px"><b style="font-size:1.15rem">اختبار الوحدة</b><span class="muted">${ar(Math.min(10, QUIZ[u.id].length))} أسئلة عشوائيّة من بنك يضمّ ${ar(QUIZ[u.id].length)} سؤالاً. ${q ? `أفضل نتيجة لك: ${ar(Math.round(q.best * 100))}٪` : 'اجتزه بنسبة ٧٠٪ لتنال دُرّة الوحدة.'}</span></div><a class="btn" href="#quiz-${u.id}">${I.play} ابدأ الاختبار</a></div></div>`;
};
V.lesson = (u, k) => {
  const l = u.lessons[k]; const prev = k > 0 ? `#${u.id}-${k - 1}` : `#${u.id}`; const last = k === u.lessons.length - 1;
  return `<article class="lesson hue-${u.hue}"><div class="lesson-top"><div class="crumbs"><a href="#journey">الرحلة</a> / <a href="#${u.id}">${esc(u.short)}</a> / <span>الدرس ${ar(k + 1)} من ${ar(u.lessons.length)}</span></div>
    <h1>${esc(l.title)}</h1><div class="row"><span class="tag">${esc(u.title)}</span><span class="pagetag">من الكتاب: ص ${ar(l.p)}</span></div><div class="readbar"><i id="rb"></i></div></div>
    ${renderBlocks(l.blocks)}
    <div class="lesson-nav"><a class="btn ghost" href="${prev}">${I.back} ${k > 0 ? 'الدرس السابق' : 'الوحدة'}</a><button class="btn" id="done">${last ? 'أتممت الدرس — إلى الاختبار' : 'أتممت الدرس — التالي'} ${I.next}</button></div></article>`;
};
V.mountLesson = (u, k) => {
  const main = $('#main'); bindLetters(main); bindMouth(main); bindTeeth(main);
  const rb = $('#rb'); const onS = () => { const h = document.documentElement; const max = h.scrollHeight - innerHeight; rb.style.width = (max > 0 ? Math.min(1, scrollY / max) * 100 : 100) + '%'; };
  addEventListener('scroll', onS, { passive: true }); onS(); setCleanup(() => removeEventListener('scroll', onS));
  $('#done').onclick = () => {
    const id = u.id + '-' + k; if (!S.read[id]) { S.read[id] = today(); save(); award(5, 'أتممت درساً'); sfx('ok'); }
    location.hash = k < u.lessons.length - 1 ? `#${u.id}-${k + 1}` : `#quiz-${u.id}`;
  };
};

V.arena = () => {
  const G = GAMES;
  return `<div class="stack"><span class="eyebrow">تعلّم باللعب</span><h1 class="h-page">ساحة التحدّي</h1><p class="lead">ثمانية ألعاب تحوّل جداول الكتاب وأمثلته إلى تحدّيات سريعة. كلّ إجابة تُشرح لك فوراً مع رقم الصفحة.</p></div>
  <div class="section arena">${Object.keys(G).map(id => { const g = G[id]; return `<a class="game-card hue-${g.hue}" href="#g-${id}"><span class="gi">${I[g.icon]}</span><h3>${esc(g.name)}</h3><p>${esc(g.desc)}</p><div class="best"><span>${g.meta}</span><span>أفضل نتيجة: ${ar(S.games[id] || 0)}</span></div></a>`; }).join('')}</div>
  <div class="section"><a class="quiz-cta hue-gold" href="#quiz-final" style="text-decoration:none;color:inherit"><div class="stack" style="gap:4px"><b style="font-size:1.15rem">الامتحان الشامل</b><span class="muted">٣٠ سؤالاً من الكتاب كلّه.</span></div><span class="btn gold">ابدأ</span></a></div>`;
};

/* ───────── الألعاب ───────── */
const GAMES = {
  noon: { name: 'مصنّف أحكام النون', desc: 'تظهر كلمة من أمثلة الكتاب: هل حكم النون الساكنة أو التنوين فيها إظهار أم إدغام أم إقلاب أم إخفاء؟ سباق ٦٠ ثانية.', hue: 'green', icon: 'sort', meta: '٦٠ ثانية', kind: 'sort', rules: () => RULES_NOON, items: () => NOON_ITEMS, why: () => NOON_WHY, label: 'ما حكم النون الساكنة أو التنوين؟' },
  meem: { name: 'مصنّف الميم الساكنة', desc: 'إخفاء شفوي أم إدغام شفوي أم إظهار شفوي؟ صنّف الأمثلة قبل نفاد الوقت.', hue: 'rose', icon: 'sort', meta: '٦٠ ثانية', kind: 'sort', rules: () => RULES_MEEM, items: () => MEEM_ITEMS, why: () => MEEM_WHY, label: 'ما حكم الميم الساكنة؟' },
  lam: { name: 'شمسيّة أم قمريّة؟', desc: 'قرّر بسرعة: هل تُظهر لام «أل» في الكلمة أم تُدغم؟', hue: 'sky', icon: 'sun', meta: '٦٠ ثانية', kind: 'sort', rules: () => RULES_LAM, items: () => LAM_ITEMS, why: () => LAM_WHY, label: 'ما نوع لام التعريف؟' },
  madd: { name: 'ميزان المدّ', desc: 'كم حركة تمدّ هذا الموضع؟ اختر المقدار الصحيح وتعرّف على نوع المدّ.', hue: 'red', icon: 'meter', meta: '١٠ جولات', kind: 'madd' },
  tf: { name: 'صواب أم خطأ؟', desc: 'عبارات من الكتاب بعضها صحيح وبعضها مُحرَّف. احكم عليها بأسرع ما يمكن.', hue: 'indigo', icon: 'bolt', meta: '٦٠ ثانية', kind: 'tf' },
  verse: { name: 'أكمل الشاهد', desc: 'أبيات الجزريّة الواردة في الكتاب ناقصةٌ كلمة. اختر الكلمة الصحيحة لتكمل البيت.', hue: 'amber', icon: 'verse', meta: '٨ جولات', kind: 'verse' },
  sifat: { name: 'استخرج الصفات', desc: 'طبّق طريقة الكتاب: اختر لكلّ حرف صفاته الخمس المتضادّة وما له من الصفات التي لا ضدّ لها.', hue: 'gold', icon: 'dna', meta: '٦ حروف', kind: 'sifat' },
  makhraj: { name: 'اصطد المخرج', desc: 'يظهر حرف، وعليك أن تضغط على موضع خروجه في مخطط الفم والحلق.', hue: 'cyan', icon: 'target', meta: '١٠ جولات', kind: 'makhraj' }
};
function endGame(id, score, unit = 'نقطة') {
  S.played[id] = 1; const best = S.games[id] || 0; const isBest = score > best; if (isBest) S.games[id] = score; save();
  award(Math.round(score / 10), null); if (isBest && score > 0) { burst(); sfx('level'); }
  const g = GAMES[id];
  $('#main').innerHTML = `<div class="play hue-${g.hue}"><div class="qcard result"><div class="eyebrow">${esc(g.name)}</div><div class="big">${ar(score)} ${unit}</div><p class="lead">${isBest && score > 0 ? 'رقم قياسيّ جديد!' : `أفضل نتيجة لك: ${ar(Math.max(best, score))}`}</p><span class="chip-stat">${I.pearl}+${ar(Math.round(score / 10))} دُرّة</span><div class="row" style="justify-content:center"><button class="btn" id="again">${I.redo} العب مجدداً</button><a class="btn ghost" href="#arena">ساحة التحدّي</a></div></div></div>`;
  $('#again').onclick = () => route(true); checkBadges();
}
function timerHTML(t, T) { const c = 2 * Math.PI * 22; return `<div class="timer ${t <= 10 ? 'low' : ''}"><svg viewBox="0 0 52 52"><circle class="bgc" cx="26" cy="26" r="22"/><circle class="fg" cx="26" cy="26" r="22" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - t / T)}"/></svg><span>${ar(t)}</span></div>`; }
function startTimer(T, onTick, onEnd) {
  let t = T; const iv = setInterval(() => { t--; onTick(t); if (t <= 10 && t > 0) sfx('tick'); if (t <= 0) { clearInterval(iv); onEnd(); } }, 1000);
  setCleanup(() => clearInterval(iv)); return () => clearInterval(iv);
}

function gameSort(id) {
  const g = GAMES[id], R = g.rules(), why = g.why(); const main = $('#main');
  let deck = shuffle(g.items()), score = 0, combo = 0, t = 60, n = 0, lock = false, over = false;
  main.innerHTML = `<div class="play hue-${g.hue}"><div class="play-top"><a class="icon-btn" href="#arena" aria-label="رجوع">${I.back}</a><div class="grow"><div class="eyebrow">${esc(g.name)}</div><b id="sc">٠ نقطة</b></div><span class="combo" id="cb"></span><div id="tm">${timerHTML(60, 60)}</div></div>
    <div class="qcard"><div class="qtext muted" style="font-size:1rem">${esc(g.label)}</div><div class="qbig" id="w"></div><div class="rule-btns" id="rb">${Object.keys(R).map(k => `<button class="rule-btn hue-${R[k].c}" data-r="${k}">${esc(R[k].n)}</button>`).join('')}</div><div id="fb" style="min-height:64px"></div></div></div>`;
  const show = () => { if (!deck.length) deck = shuffle(g.items()); const it = deck.pop(); $('#w').textContent = it[0]; $('#w').dataset.r = it[1]; $('#w').dataset.h = it[2]; lock = false; $$('.rule-btn', main).forEach(b => { b.disabled = false; b.className = b.className.replace(/ ?(right|wrong)/g, ''); }); };
  $$('.rule-btn', main).forEach(b => b.addEventListener('click', () => {
    if (lock || over) return; lock = true; n++; const r = $('#w').dataset.r, h = $('#w').dataset.h; const ok = b.dataset.r === r;
    $$('.rule-btn', main).forEach(x => { x.disabled = true; if (x.dataset.r === r) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
    if (ok) { combo++; score += 10 * Math.min(3, 1 + Math.floor(combo / 3)); sfx('ok'); if (combo > S.bestCombo) { S.bestCombo = combo; save(); } } else { combo = 0; sfx('no'); }
    $('#sc').textContent = ar(score) + ' نقطة'; $('#cb').textContent = combo >= 3 ? '×' + ar(Math.min(3, 1 + Math.floor(combo / 3))) : '';
    $('#fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">${ok ? I.check : I.x}<div><b>${esc(R[r].n)}</b><span>${esc(why[r](h))}</span></div></div>`;
    setTimeout(() => { if (!over) show(); }, ok ? 700 : 1900);
  }));
  show();
  startTimer(60, x => { t = x; $('#tm').innerHTML = timerHTML(x, 60); }, () => { over = true; endGame(id, score); });
}
function gameTF() {
  const id = 'tf', g = GAMES.tf, main = $('#main'); let deck = shuffle(TF_ITEMS), score = 0, combo = 0, over = false, lock = false, cur;
  main.innerHTML = `<div class="play hue-${g.hue}"><div class="play-top"><a class="icon-btn" href="#arena" aria-label="رجوع">${I.back}</a><div class="grow"><div class="eyebrow">${esc(g.name)}</div><b id="sc">٠ نقطة</b></div><span class="combo" id="cb"></span><div id="tm">${timerHTML(60, 60)}</div></div>
    <div class="qcard"><div class="qtext" id="w" style="text-align:center;min-height:3.4em;display:grid;place-items:center"></div><div class="opts two"><button class="opt center" data-v="1">صواب ✓</button><button class="opt center" data-v="0">خطأ ✕</button></div><div id="fb" style="min-height:56px"></div></div></div>`;
  const show = () => { if (!deck.length) deck = shuffle(TF_ITEMS); cur = deck.pop(); $('#w').innerHTML = fmt(cur[0]); lock = false; $$('.opt', main).forEach(b => { b.disabled = false; b.classList.remove('right', 'wrong'); }); };
  $$('.opt', main).forEach(b => b.addEventListener('click', () => {
    if (lock || over) return; lock = true; const ok = (b.dataset.v === '1') === cur[1];
    b.classList.add(ok ? 'right' : 'wrong'); $$('.opt', main).forEach(x => x.disabled = true);
    if (ok) { combo++; score += 10 + Math.min(20, combo * 2); sfx('ok'); if (combo > S.bestCombo) { S.bestCombo = combo; save(); } } else { combo = 0; sfx('no'); }
    $('#sc').textContent = ar(score) + ' نقطة'; $('#cb').textContent = combo >= 2 ? '×' + ar(combo) : '';
    $('#fb').innerHTML = ok ? '' : `<div class="feedback no">${I.x}<div><b>العبارة ${cur[1] ? 'صحيحة' : 'خاطئة'}</b><span class="pagetag">راجع ص ${ar(cur[2])}</span></div></div>`;
    setTimeout(() => { if (!over) { $('#fb').innerHTML = ''; show(); } }, ok ? 500 : 1600);
  }));
  show(); startTimer(60, x => $('#tm').innerHTML = timerHTML(x, 60), () => { over = true; endGame(id, score); });
}
const HSETS = [[2], [4, 5], [2, 4, 6], [4, 5, 6], [6], [4, 6]];
const hsetLabel = s => s.map(ar).join(' أو ') + (s.length === 1 && s[0] === 2 ? ' (حركتان)' : ' حركات');
function gameMadd() {
  const id = 'madd', g = GAMES.madd, main = $('#main'); const deck = pick(MADD_ITEMS, 10); let i = 0, score = 0;
  const draw = () => {
    const it = deck[i];
    main.innerHTML = `<div class="play hue-${g.hue}"><div class="play-top"><a class="icon-btn" href="#arena" aria-label="رجوع">${I.back}</a><div class="grow"><div class="eyebrow">${esc(g.name)} — الجولة ${ar(i + 1)} من ${ar(deck.length)}</div><div class="qbar"><i style="width:${i / deck.length * 100}%"></i></div></div><b>${ar(score)}</b></div>
      <div class="qcard"><div class="qtext muted" style="font-size:1rem">كم حركة يُمدّ حرف المدّ هنا؟</div><div class="qbig">${esc(it.w)}</div><div class="opts grid2">${HSETS.map((s, k) => `<button class="opt center" data-k="${k}">${beads(s)}</button>`).join('')}</div><div id="fb"></div></div></div>`;
    $$('.opt', main).forEach(b => b.addEventListener('click', () => {
      const s = HSETS[+b.dataset.k]; const ok = s.join() === it.h.join(); const ri = HSETS.findIndex(x => x.join() === it.h.join());
      $$('.opt', main).forEach((x, k) => { x.disabled = true; if (k === ri) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
      if (ok) { score += 10; sfx('ok'); } else sfx('no');
      $('#fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">${ok ? I.check : I.x}<div><b>${esc(it.n)}</b><span>مقداره: ${hsetLabel(it.h)}</span></div></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="nx">${i + 1 < deck.length ? 'التالي' : 'النتيجة'} ${I.next}</button></div>`;
      $('#nx').onclick = () => { i++; i < deck.length ? draw() : endGame(id, score); };
    }));
  };
  draw();
}
function gameVerse() {
  const id = 'verse', g = GAMES.verse, main = $('#main'); const deck = pick(VERSES, 8); let i = 0, score = 0;
  const draw = () => {
    const v = deck[i]; const gapIn = v.a.includes(v.gap) ? 'a' : 'b'; const line = s => esc(s).replace(esc(v.gap), `<span class="gap">${esc(v.gap)}</span>`);
    main.innerHTML = `<div class="play hue-${g.hue}"><div class="play-top"><a class="icon-btn" href="#arena" aria-label="رجوع">${I.back}</a><div class="grow"><div class="eyebrow">${esc(g.name)} — ${esc(v.t)}</div><div class="qbar"><i style="width:${i / deck.length * 100}%"></i></div></div><b>${ar(score)}</b></div>
      <div class="qcard"><div class="verse-card"><div>${gapIn === 'a' ? line(v.a) : esc(v.a)}</div><div>${gapIn === 'b' ? line(v.b) : esc(v.b)}</div></div><div class="opts grid2">${shuffle(v.opts).map(o => `<button class="opt center" data-o="${esc(o)}" style="font-family:var(--f-quran);font-size:1.3rem">${esc(o)}</button>`).join('')}</div><div id="fb"></div></div></div>`;
    $$('.opt', main).forEach(b => b.addEventListener('click', () => {
      const ok = b.dataset.o === v.gap; $$('.opt', main).forEach(x => { x.disabled = true; if (x.dataset.o === v.gap) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
      $('.gap', main).classList.add('fill'); if (ok) { score += 10; sfx('ok'); } else sfx('no');
      $('#fb').innerHTML = `<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="nx">${i + 1 < deck.length ? 'البيت التالي' : 'النتيجة'} ${I.next}</button></div>`;
      $('#nx').onclick = () => { i++; i < deck.length ? draw() : endGame(id, score); };
    }));
  };
  draw();
}
function gameSifat() {
  const id = 'sifat', g = GAMES.sifat, main = $('#main'); const deck = pick(LETTERS.filter(l => !['ا', 'و', 'ي'].includes(l.l)), 6); let i = 0, score = 0;
  const draw = () => {
    const L = deck[i]; const sel = new Set();
    main.innerHTML = `<div class="play hue-${g.hue}"><div class="play-top"><a class="icon-btn" href="#arena" aria-label="رجوع">${I.back}</a><div class="grow"><div class="eyebrow">${esc(g.name)} — الحرف ${ar(i + 1)} من ${ar(deck.length)}</div><div class="qbar"><i style="width:${i / deck.length * 100}%"></i></div></div><b>${ar(score)}</b></div>
      <div class="qcard"><div class="row" style="justify-content:center;gap:16px"><span class="big-letter" style="font-size:4rem;padding:4px 26px">${esc(L.l)}</span><div><b>${esc(L.name)}</b><p class="muted" style="font-size:.9rem">اختر صفة واحدة من كلّ صفّ، ثم ما ينطبق من الصفات المفردة.</p></div></div>
      <div class="sifat-board">${SIFA_PAIRS.map((p, r) => `<div class="sifat-row" data-row="${r}">${p.map(s => `<button class="toggle" aria-pressed="false" data-s="${s}">${s}</button>`).join('')}</div>`).join('')}
      <div class="eyebrow" style="margin-top:6px">الصفات التي لا ضدّ لها (والغنّة)</div><div class="sifat-row" data-row="solo">${SIFA_SOLO.map(s => `<button class="toggle" aria-pressed="false" data-s="${s}">${s}</button>`).join('')}</div></div>
      <div class="row" style="justify-content:flex-end"><button class="btn" id="chk">تحقّق</button></div><div id="fb"></div></div></div>`;
    $$('.toggle', main).forEach(b => b.addEventListener('click', () => {
      const row = b.parentElement.dataset.row; const s = b.dataset.s; sfx('tick');
      if (row !== 'solo') $$('.toggle', b.parentElement).forEach(x => { if (x !== b) { x.setAttribute('aria-pressed', 'false'); sel.delete(x.dataset.s); } });
      const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); on ? sel.add(s) : sel.delete(s);
    }));
    $('#chk').onclick = () => {
      const truth = new Set(L.s.concat(L.x)); let pts = 0, miss = 0;
      $$('.toggle', main).forEach(b => { const s = b.dataset.s, on = sel.has(s), t = truth.has(s); b.disabled = true; if (on && t) { b.classList.add('right'); pts++; } else if (on && !t) { b.classList.add('wrong'); miss++; } else if (!on && t) { b.classList.add('miss'); miss++; } });
      const gained = Math.max(0, pts * 2 - miss); score += gained; const perfect = miss === 0;
      perfect ? sfx('ok') : sfx('no');
      $('#fb').innerHTML = `<div class="feedback ${perfect ? 'ok' : 'no'}">${perfect ? I.check : I.x}<div><b>${perfect ? 'صفات صحيحة كاملة!' : 'الصفات الصحيحة مؤطّرة بالأخضر'}</b><span>${esc(L.name)}: ${L.s.concat(L.x).join('، ')} — المخرج: ${esc(L.mk)} — اللقب: ${esc(L.lq)}</span> <span class="pagetag">ص ${ar(85)}</span></div></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="nx">${i + 1 < deck.length ? 'الحرف التالي' : 'النتيجة'} ${I.next}</button></div>`;
      $('#chk').remove(); $('#nx').onclick = () => { i++; i < deck.length ? draw() : endGame(id, score); };
    };
  };
  draw();
}
function gameMakhraj() {
  const id = 'makhraj', g = GAMES.makhraj, main = $('#main');
  const pool = LETTERS.map(l => ({ l: l.l, z: l.z, n: l.name })).concat([{ l: 'الغنّة', z: 'khay', n: 'صوت الغنّة' }]);
  const deck = pick(pool, 10); let i = 0, score = 0;
  const draw = () => {
    const it = deck[i];
    main.innerHTML = `<div class="play hue-${g.hue}"><div class="play-top"><a class="icon-btn" href="#arena" aria-label="رجوع">${I.back}</a><div class="grow"><div class="eyebrow">${esc(g.name)} — ${ar(i + 1)} من ${ar(deck.length)}</div><div class="qbar"><i style="width:${i / deck.length * 100}%"></i></div></div><b>${ar(score)}</b></div>
      <div class="qcard"><div class="row" style="justify-content:center;gap:14px"><span class="qtext">من أين يخرج</span><span class="big-letter" style="font-size:3rem;padding:2px 22px">${esc(it.l)}</span><span class="qtext">؟</span></div>${mouthSVG()}<div id="fb"></div></div></div>`;
    let done = false;
    $$('.zone', main).forEach(p => p.addEventListener('click', () => {
      if (done) return; done = true; const ok = p.dataset.zone === it.z;
      $$('.zone', main).forEach(q => { if (q.dataset.zone === it.z) q.classList.add('on'); else if (q !== p) q.classList.add('dim'); });
      if (ok) { score += 10; sfx('ok'); } else { sfx('no'); p.style.fill = 'color-mix(in oklab, var(--bad) 55%, transparent)'; }
      const L = letterInfo(it.l);
      $('#fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}">${ok ? I.check : I.x}<div><b>${esc(ZONES[it.z].n)}</b><span>${esc(L ? L.mk : ZONES[it.z].d)}</span></div></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" id="nx">${i + 1 < deck.length ? 'التالي' : 'النتيجة'} ${I.next}</button></div>`;
      $('#nx').onclick = () => { i++; i < deck.length ? draw() : endGame(id, score); };
    }));
  };
  draw();
}

/* ───────── بطاقات المراجعة (صناديق لايتنر) ───────── */
const GAPS = [0, 1, 3, 7, 16]; // أيام بين المراجعات لكل صندوق
const dayNum = () => Math.floor(Date.now() / 864e5);
function dueCards() { return FLASH.map((f, k) => ({ f, k, st: S.flash[k] || { b: 0, d: 0 } })).filter(x => x.st.d <= dayNum()); }
V.review = () => {
  const boxes = [0, 1, 2, 3, 4].map(b => FLASH.filter((_, k) => (S.flash[k] || { b: 0 }).b === b).length);
  return `<div class="stack"><span class="eyebrow">التكرار المتباعد</span><h1 class="h-page">بطاقات المراجعة</h1><p class="lead">اقرأ المصطلح، تذكّر الجواب، ثم اقلب البطاقة. إن عرفتها انتقلت إلى صندوق أبعد ولن تعود إلا بعد أيام؛ وإن نسيتها عادت إلى البداية.</p></div>
    <div class="section"><div class="boxes">${['جديدة', 'غداً', 'بعد ٣ أيام', 'بعد أسبوع', 'متقَنة'].map((n, b) => `<div class="box"><b>${ar(boxes[b])}</b>${n}</div>`).join('')}</div><div id="fc"></div></div>`;
};
V.mountReview = () => {
  let due = shuffle(dueCards()); const box = $('#fc');
  const draw = () => {
    if (!due.length) { box.innerHTML = `<div class="card empty">${I.check.replace('<svg', '<svg width="44" height="44" style="color:var(--good)"')}<b>أنهيت مراجعة اليوم!</b><span>عُد غداً لتجد البطاقات التي حان موعدها.</span><button class="btn ghost sm" id="all">راجع كلّ البطاقات الآن</button></div>`; $('#all').onclick = () => { due = shuffle(FLASH.map((f, k) => ({ f, k, st: S.flash[k] || { b: 0, d: 0 } }))); draw(); }; return; }
    const c = due[0]; const u = unitById(c.f[2]);
    box.innerHTML = `<div class="play"><div class="row" style="justify-content:space-between"><span class="tag hue-${u.hue}">${esc(u.title)}</span><span class="muted">${ar(due.length)} متبقّية</span></div>
      <div class="flip" id="fl"><div class="flip-inner" tabindex="0" role="button" aria-label="اقلب البطاقة"><div class="face"><span class="eyebrow">ما هو؟</span><div class="term">${fmt(c.f[0])}</div><span class="muted" style="font-size:.85rem">اضغط لقلب البطاقة</span></div><div class="face back"><span class="eyebrow">${esc(c.f[0])}</span><div class="ansr">${fmt(c.f[1])}</div></div></div></div>
      <div class="opts two" id="act" hidden><button class="opt center" id="no">لم أتذكّرها</button><button class="opt center" id="yes">عرفتها ✓</button></div></div>`;
    const fl = $('#fl'), inner = $('.flip-inner', fl);
    const flip = () => { fl.classList.toggle('on'); sfx('flip'); $('#act').hidden = false; };
    inner.addEventListener('click', flip); inner.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    const rate = ok => { const st = c.st; const b = ok ? Math.min(4, st.b + 1) : 0; S.flash[c.k] = { b, d: dayNum() + (ok ? GAPS[b] : 0) }; S.flashCount++; save(); due.shift(); if (!ok) due.push({ f: c.f, k: c.k, st: S.flash[c.k] }); if (ok) award(1, null); else sfx('no'); checkBadges(); draw(); };
    $('#yes').onclick = () => { sfx('ok'); rate(true); }; $('#no').onclick = () => rate(false);
  };
  draw();
};

/* ───────── مختبر الحروف ───────── */
V.lab = () => `<div class="stack"><span class="eyebrow">مستكشف تفاعلي — ص ${ar(60)} إلى ${ar(85)}</span><h1 class="h-page">مختبر الحروف</h1><p class="lead">اختر حرفاً لترى مخرجه وصفاته ولقبه كما في جدول الكتاب، أو اضغط على منطقة في مخطط الفم.</p></div>
  <div class="section card"><div class="letter-grid" id="lg">${LETTERS.map((l, k) => `<button class="lbtn" data-i="${k}" title="${esc(l.name)}" aria-label="${esc(l.name)}">${esc(l.l)}</button>`).join('')}</div></div>
  <div class="section card" id="lp" aria-live="polite"></div>
  <div class="section"><div class="section-head"><h2>خريطة المخارج</h2></div>${mouthBlock()}</div>
  <div class="section"><div class="section-head"><h2>أسنان الفم</h2><span class="pagetag">ص ${ar(66)}</span></div>${teethBlock()}</div>`;
V.mountLab = () => {
  const panel = $('#lp');
  const show = k => {
    const L = LETTERS[k]; $$('.lbtn').forEach((b, j) => { b.classList.toggle('on', j === k); b.classList.remove('hl'); }); sfx('tick');
    const hueOf = s => ({ 'جهر': 'indigo', 'همس': 'indigo', 'شدة': 'red', 'توسط': 'red', 'رخاوة': 'red', 'استعلاء': 'sky', 'استفال': 'sky', 'إطباق': 'violet', 'انفتاح': 'violet', 'إذلاق': 'green', 'إصمات': 'green' }[s] || 'gold');
    panel.innerHTML = `<div class="letter-panel"><div class="big-letter">${esc(L.l)}</div><div class="stack"><div><span class="eyebrow">الحرف</span><h2 style="font-family:var(--f-display);font-weight:800;font-size:1.6rem">${esc(L.name)}</h2></div>
      <div><span class="eyebrow">المخرج — ${esc(ZONES[L.z].n)}</span><p>${esc(L.mk)}</p></div>
      <div><span class="eyebrow">الصفات المتضادّة (خمس)</span><div class="sifa-chips">${L.s.map(s => `<span class="sifa-chip hue-${hueOf(s)}">${s}</span>`).join('')}</div></div>
      ${L.x.length ? `<div><span class="eyebrow">صفات لا ضدّ لها</span><div class="sifa-chips">${L.x.map(s => `<span class="sifa-chip solo">${s}</span>`).join('')}</div></div>` : ''}
      <div><span class="eyebrow">اللقب</span><p><b>${esc(L.lq)}</b></p></div>
      <div class="row"><span class="pagetag">جدول الكتاب ص ${ar(84)} - ${ar(85)}</span><span class="muted" style="font-size:.85rem">أخوات المخرج:</span>${LETTERS.filter(x => x.mk === L.mk && x !== L).map(x => `<button class="lt" data-sib="${LETTERS.indexOf(x)}" style="min-width:36px;height:36px;font-size:1.2rem">${esc(x.l)}</button>`).join('') || '<span class="muted">لا يشاركه حرف آخر في مخرجه</span>'}</div></div></div>`;
    $$('[data-sib]', panel).forEach(b => b.onclick = () => show(+b.dataset.sib));
    $$('[data-mouth] .zone').forEach(z => z.classList.toggle('on', z.dataset.zone === L.z));
  };
  $$('.lbtn').forEach(b => b.addEventListener('click', () => show(+b.dataset.i)));
  bindMouth($('#main')); bindTeeth($('#main'));
  $$('[data-mouth] .zone').forEach(z => z.addEventListener('click', () => { const id = z.dataset.zone; $$('.lbtn').forEach((b, j) => b.classList.toggle('hl', LETTERS[j].z === id)); }));
  show(9);
};

/* ───────── إنجازاتي ───────── */
V.me = () => {
  const lv = levelOf(S.pearls);
  return `<div class="stack"><span class="eyebrow">ملفّك</span><h1 class="h-page">إنجازاتي</h1></div>
  <div class="section stats"><div class="stat"><span>الرتبة</span><b style="font-size:1.1rem">${esc(lv.name)}</b><div class="levelbar"><i style="width:${Math.round(lv.pct * 100)}%"></i></div></div><div class="stat"><span>الدرر</span><b>${ar(S.pearls)}</b></div><div class="stat"><span>أيام متتالية</span><b>${ar(S.streak.count)}</b></div><div class="stat"><span>الأوسمة</span><b>${ar(Object.keys(S.badges).length)} / ${ar(BADGES.length)}</b></div></div>
  <div class="section"><div class="section-head"><h2>سُلّم الرُّتب</h2></div><div class="ladder">${LEVELS.map((l, k) => `<div class="rung hue-${k <= lv.i ? 'gold' : 'slate'}" style="--i:${k}"><span class="n">${ar(k + 1)}</span><div><b>${l[1]}</b></div><span class="m">${ar(l[0])} دُرّة</span></div>`).join('')}</div></div>
  <div class="section"><div class="section-head"><h2>الأوسمة</h2></div><div class="badges">${BADGES.map(b => `<div class="badge ${S.badges[b[0]] ? 'on' : ''}"><span class="bi">${I[b[4]]}</span><div><b>${b[1]}</b><small>${b[2]}</small></div></div>`).join('')}</div></div>
  <div class="section"><div class="section-head"><h2>نتائج الوحدات</h2></div><div class="tablewrap"><table class="t"><thead><tr><th>الوحدة</th><th>الدروس</th><th>أفضل نتيجة</th><th>النجوم</th></tr></thead><tbody>${UNITS.map(u => { const q = S.quiz[u.id]; return `<tr class="hue-${u.hue}"><td>${esc(u.title)}</td><td>${ar(u.lessons.filter((_, k) => S.read[u.id + '-' + k]).length)} / ${ar(u.lessons.length)}</td><td>${q ? ar(Math.round(q.best * 100)) + '٪' : '—'}</td><td>${q ? '★'.repeat(q.stars) || '—' : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>
  <div class="section card"><b>حول هذه المنصّة</b><p class="muted">بُنيت هذه الأداة لتيسير دراسة كتاب «الدر الثمين في تجويد كلام رب العالمين» تأليف محمد حمزة عطار وأحمد خلوف أديب (مؤسسة إتقان للتعليم والتنمية، سلسلة مطبوعات إتقان ١). المحتوى مأخوذ من الكتاب دون إضافة من مصادر أخرى. يُحفظ تقدّمك على هذا الجهاز فقط.</p><div class="row"><button class="btn ghost sm" id="reset">مسح التقدّم والبدء من جديد</button><span id="rs" class="muted"></span></div></div>`;
};
V.mountMe = () => {
  let armed = false; $('#reset').onclick = () => { if (!armed) { armed = true; $('#rs').textContent = 'اضغط مرّة أخرى للتأكيد — سيُحذف كلّ التقدّم.'; $('#reset').classList.add('gold'); return; } S = blank(); save(); updateChrome(); toast('تمّ مسح التقدّم', 'redo'); route(true); };
};

/* ───────── التوجيه ───────── */
function setNav(name) { $$('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === name ? 'page' : 'false')); }
function route(force) {
  setCleanup(null);
  const h = (location.hash || '#home').slice(1); const main = $('#main'); let nav = 'home';
  let m;
  if (h === 'home' || h === '') { main.innerHTML = V.home(); }
  else if (h === 'journey') { nav = 'journey'; main.innerHTML = V.journey(); }
  else if ((m = h.match(/^(u\d+)-(\d+)$/)) && unitById(m[1]) && unitById(m[1]).lessons[+m[2]]) { nav = 'journey'; const u = unitById(m[1]); main.innerHTML = V.lesson(u, +m[2]); V.mountLesson(u, +m[2]); }
  else if ((m = h.match(/^(u\d+)$/)) && unitById(m[1])) { nav = 'journey'; main.innerHTML = V.unit(unitById(m[1])); }
  else if ((m = h.match(/^quiz-(.+)$/))) {
    nav = 'journey'; const t = m[1];
    if (unitById(t)) {
      const u = unitById(t);
      quizRun({ title: 'اختبار: ' + u.title, hue: u.hue, back: u.id, questions: unitQuestions(u.id, 10), onDone: r => {
        const prev = S.quiz[u.id] || { best: 0, stars: 0 }; const bonus = Math.max(0, r.stars - prev.stars) * 10; const wasDone = prev.best >= .7;
        S.quiz[u.id] = { best: Math.max(prev.best, r.pct), stars: Math.max(prev.stars, r.stars) }; save();
        if (!wasDone && r.pct >= .7) setTimeout(() => toast('أضفت دُرّة «' + u.short + '» إلى عقدك!', 'pearl'), 400);
        return bonus;
      } });
    } else if (t === 'daily') {
      nav = 'home'; const all = []; UNITS.forEach(u => QUIZ[u.id].forEach((q, k) => all.push([u.id, k])));
      let seed = today().split('-').join('') | 0; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      const qs = []; const used = new Set(); while (qs.length < 7) { const x = all[Math.floor(rnd() * all.length)]; const kk = x.join(':'); if (!used.has(kk)) { used.add(kk); qs.push(normQ(QUIZ[x[0]][x[1]], kk)); } }
      quizRun({ title: 'تحدّي اليوم', hue: 'gold', back: 'home', questions: qs, onDone: () => { if (S.daily !== today()) { S.daily = today(); save(); return 15; } return 0; } });
    } else if (t === 'final') {
      const qs = []; UNITS.forEach(u => qs.push(...unitQuestions(u.id, 3)));
      quizRun({ title: 'الامتحان الشامل', hue: 'gold', back: 'journey', questions: shuffle(qs), onDone: r => { const prev = S.quiz.final || { best: 0, stars: 0 }; S.quiz.final = { best: Math.max(prev.best, r.pct), stars: Math.max(prev.stars, r.stars) }; save(); return r.pct >= .8 ? 30 : 0; } });
    } else if (t === 'mistakes') {
      nav = 'home'; const ks = Object.keys(S.mistakes); if (!ks.length) { location.hash = '#review'; return; }
      quizRun({ title: 'دفتر الأخطاء', hue: 'red', back: 'home', questions: shuffle(ks).slice(0, 12).map(kk => { const [u, i] = kk.split(':'); return QUIZ[u] && QUIZ[u][+i] ? normQ(QUIZ[u][+i], kk) : null; }).filter(Boolean) });
    } else { location.hash = '#home'; return; }
  }
  else if (h === 'arena') { nav = 'arena'; main.innerHTML = V.arena(); }
  else if ((m = h.match(/^g-(\w+)$/)) && GAMES[m[1]]) {
    nav = 'arena'; const g = GAMES[m[1]];
    ({ sort: () => gameSort(m[1]), tf: gameTF, madd: gameMadd, verse: gameVerse, sifat: gameSifat, makhraj: gameMakhraj })[g.kind]();
  }
  else if (h === 'review') { nav = 'review'; main.innerHTML = V.review(); V.mountReview(); }
  else if (h === 'lab') { nav = 'lab'; main.innerHTML = V.lab(); V.mountLab(); }
  else if (h === 'me') { nav = 'me'; main.innerHTML = V.me(); V.mountMe(); }
  else { location.hash = '#home'; return; }
  setNav(nav); updateChrome();
  window.scrollTo(0, 0);
}

/* ───────── التشغيل ───────── */
function start() {
  shell(); touchStreak(); route();
  addEventListener('hashchange', () => route());
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === '/' ) { e.preventDefault(); openSearch(); }
    const opts = $$('.opt:not([disabled])'); const n = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key];
    if (n !== undefined && opts[n]) opts[n].click();
    if (e.key === 'Enter' && $('#nx') && document.activeElement !== $('#nx')) { e.preventDefault(); $('#nx').click(); }
  });
  checkBadges();
}
if (window.claude && window.claude.hot && window.claude.hot.snapshot) { try { window.claude.hot.snapshot(() => ({ hash: location.hash })); } catch (e) { } }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
