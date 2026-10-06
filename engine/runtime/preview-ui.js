// واجهة المعاينة: تشغيل/إيقاف، شريط زمن مع علامات المشاهد، تبديل المقاس، تحديث تلقائي عند الحفظ.
export function mountPreview(studio, { aspect, quality }) {
  const css = document.createElement('style');
  css.textContent = `
    body{background:#0b0b0d;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui,'IBM Plex Sans Arabic',sans-serif;color:#ddd}
    #out{max-height:calc(100vh - 96px);max-width:96vw;width:auto!important;height:auto!important;box-shadow:0 20px 60px #000a;border-radius:6px}
    #bar{position:fixed;bottom:0;left:0;right:0;padding:10px 16px;background:#141418ee;display:flex;gap:12px;align-items:center;direction:ltr}
    #bar button,#bar select{background:#24242a;color:#eee;border:1px solid #333;border-radius:6px;padding:6px 10px;font:inherit;cursor:pointer}
    #tl{flex:1;position:relative;height:28px}
    #tl input{width:100%;margin:0;position:absolute;top:6px}
    .mk{position:absolute;top:0;width:2px;height:8px;background:#ff6a3d}
    #time{font-variant-numeric:tabular-nums;min-width:110px;text-align:right}`;
  document.head.appendChild(css);
  const bar = document.createElement('div');
  bar.id = 'bar';
  bar.innerHTML = `<button id="pp">▶</button><div id="tl"><input id="sk" type="range" min="0" max="${studio.duration}" step="${1 / studio.fps}" value="0"></div>
    <span id="time">0.00 / ${studio.duration.toFixed(2)}</span>
    <select id="as">${['9:16', '4:5', '1:1', '16:9'].map((a) => `<option ${a === aspect ? 'selected' : ''}>${a}</option>`).join('')}</select>
    <select id="q"><option value="draft" ${quality === 'draft' ? 'selected' : ''}>سريع</option><option value="final" ${quality === 'final' ? 'selected' : ''}>نهائي</option></select>`;
  document.body.appendChild(bar);
  const tl = bar.querySelector('#tl');
  for (const s of studio.comp.scenes) {
    const m = document.createElement('div');
    m.className = 'mk';
    m.style.left = `${(s.start / studio.duration) * 100}%`;
    tl.appendChild(m);
  }
  const sk = bar.querySelector('#sk'), pp = bar.querySelector('#pp'), time = bar.querySelector('#time');
  let t = 0, playing = false, last = 0, busy = false;
  const show = async (x) => {
    if (busy) return;
    busy = true;
    t = Math.max(0, Math.min(studio.duration, x));
    await studio.seek(t);
    sk.value = t;
    time.textContent = `${t.toFixed(2)} / ${studio.duration.toFixed(2)}`;
    busy = false;
  };
  const loop = (now) => {
    if (!playing) return;
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    let nt = t + dt;
    if (nt >= studio.duration) nt = 0;
    show(nt).then(() => requestAnimationFrame(loop));
  };
  const toggle = () => { playing = !playing; pp.textContent = playing ? '❚❚' : '▶'; last = 0; if (playing) requestAnimationFrame(loop); };
  pp.onclick = toggle;
  sk.oninput = () => { playing = false; pp.textContent = '▶'; show(+sk.value); };
  const reload = (k, val) => { const q = new URLSearchParams(location.search); q.set(k, val); q.set('t', t.toFixed(3)); location.search = q; };
  bar.querySelector('#as').onchange = (e) => reload('aspect', e.target.value);
  bar.querySelector('#q').onchange = (e) => reload('quality', e.target.value);
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    if (e.code === 'ArrowRight') show(t + (e.shiftKey ? 1 : 1 / studio.fps));
    if (e.code === 'ArrowLeft') show(t - (e.shiftKey ? 1 : 1 / studio.fps));
  });
  // تحديث تلقائي لما ينحفظ ملف
  try {
    const es = new EventSource('/__live');
    es.onmessage = () => reload('t', t.toFixed(3));
  } catch { /* بدون سيرفر معاينة */ }
  const q = new URLSearchParams(location.search);
  show(+(q.get('t') || 0));
}
