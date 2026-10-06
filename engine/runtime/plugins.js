// طبقات متقدمة: جزيئات حتمية، 3D (Three.js)، Lottie، فيديو.
// كلها "قابلة للتقديم والتأخير" (seekable): أي فريم بينرسم لحاله بدون محاكاة اللي قبله.

import { value as v, rng, colorToCss, clamp, wiggle } from '../../lib/anim.js';

// ───────────────────────── جزيئات ─────────────────────────
// { type:'particles', count, rate, start, life:[a,b], emitter:{ x,y,w,h | r }, angle:[a,b], speed:[a,b],
//   gravity:[gx,gy], drag, size:[a,b], sizeEnd, color: '#fff' | [c1,c2,...], shape:'circle'|'square'|'line'|'spark',
//   spin:[a,b], opacityCurve:'fade'|'flash'|'constant', turbulence:{ amp, freq }, blend:'add', seed }

const rand = (r, [a, b]) => a + (b - a) * r();

function particles(ctx, L, t) {
  const n = L.count ?? 120;
  const rate = L.rate ?? n / Math.max(0.1, L.duration ?? 2);
  const start = L.start ?? 0;
  const seed = L.seed ?? 1;
  const em = L.emitter ?? { x: 0, y: 0, w: 0, h: 0 };
  const g = L.gravity ?? [0, 0];
  const drag = L.drag ?? 0;
  const colors = Array.isArray(L.color) ? L.color : [L.color ?? '#fff'];
  const shape = L.shape ?? 'circle';
  const loop = L.loop ?? false;
  const prevBlend = ctx.globalCompositeOperation;
  if (L.particleBlend) ctx.globalCompositeOperation = L.particleBlend === 'add' ? 'lighter' : L.particleBlend;
  for (let i = 0; i < n; i++) {
    const r = rng(seed * 7919 + i);
    let born = start + i / rate + (r() - 0.5) * (L.jitter ?? 0.5) / rate;
    const life = rand(r, L.life ?? [1, 2]);
    let age = t - born;
    if (loop && age > life) { const cycle = Math.max(life, n / rate); age = ((age % cycle) + cycle) % cycle; }
    if (age < 0 || age > life) continue;
    const k = age / life;
    // موقع الانطلاق
    let x0, y0;
    if (em.r != null) { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * em.r; x0 = (em.x ?? 0) + Math.cos(a) * rr; y0 = (em.y ?? 0) + Math.sin(a) * rr; }
    else { x0 = (em.x ?? 0) + (r() - 0.5) * (em.w ?? 0); y0 = (em.y ?? 0) + (r() - 0.5) * (em.h ?? 0); }
    const ang = (rand(r, L.angle ?? [0, 360]) * Math.PI) / 180;
    const sp = rand(r, L.speed ?? [50, 200]);
    const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
    // حل مغلق مع مقاومة الهواء
    const dd = drag > 0 ? (1 - Math.exp(-drag * age)) / drag : age;
    let x = x0 + vx * dd + 0.5 * g[0] * age * age;
    let y = y0 + vy * dd + 0.5 * g[1] * age * age;
    if (L.turbulence) {
      const { amp = 30, freq = 0.8 } = L.turbulence;
      x += wiggle(age + i, freq, amp, i);
      y += wiggle(age + i * 1.7, freq, amp, i + 99);
    }
    const s0 = rand(r, L.size ?? [3, 8]);
    const size = s0 * (1 + ((L.sizeEnd ?? 1) - 1) * k);
    const oc = L.opacityCurve ?? 'fade';
    const op = oc === 'constant' ? 1 : oc === 'flash' ? (k < 0.1 ? k / 0.1 : (1 - k) ** 2) : Math.min(1, k * 6) * (1 - k) ** 1.2;
    const col = colors[Math.floor(r() * colors.length)];
    const rot = rand(r, L.spin ?? [0, 0]) * age + r() * 360;
    ctx.globalAlpha = op * (L.particleOpacity ?? 1);
    ctx.fillStyle = colorToCss(col);
    ctx.strokeStyle = ctx.fillStyle;
    if (shape === 'circle') { ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill(); }
    else if (shape === 'square' || shape === 'confetti') {
      ctx.save(); ctx.translate(x, y); ctx.rotate((rot * Math.PI) / 180);
      const sy = shape === 'confetti' ? Math.abs(Math.cos(rot * 0.05)) : 1;
      ctx.fillRect(-size / 2, (-size / 2) * sy * 0.6, size, size * sy * 0.6); ctx.restore();
    } else if (shape === 'line' || shape === 'spark') {
      // خط باتجاه الحركة (شرارة)
      const vxa = vx * Math.exp(-drag * age) + g[0] * age, vya = vy * Math.exp(-drag * age) + g[1] * age;
      const m = Math.hypot(vxa, vya) || 1;
      const len = size * (shape === 'spark' ? 4 : 2.5);
      ctx.lineWidth = Math.max(1, size / 4); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (vxa / m) * len, y - (vya / m) * len); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = prevBlend;
}

// ───────────────────────── Three.js ─────────────────────────
// { type:'three', w, h, build: (THREE, { W, H }) => ({ scene, camera, update?(t), renderer? }) }

let THREE = null;
const threeState = new WeakMap();

async function prepThree(L, env) {
  if (!THREE) THREE = await import(/* webpackIgnore: true */ (globalThis.__studioBase ?? '') + '/node_modules/three/build/three.module.js'); // (جوّا Remotion: سيرفر الاستوديو)
  const w = L.w ?? env.W, h = L.h ?? env.H;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const built = await L.build(THREE, { W: w, H: h, renderer });
  threeState.set(L, { canvas, renderer, ...built, w, h });
}

function three(ctx, L, t) {
  const st = threeState.get(L);
  if (!st) throw new Error('طبقة three ما انجهزت');
  st.update?.(t);
  st.renderer.render(st.scene, st.camera);
  ctx.drawImage(st.canvas, -st.w / 2, -st.h / 2, st.w, st.h);
}

// ───────────────────────── Lottie ─────────────────────────
// { type:'lottie', src:'anim.json', w, h, at: 0, speed: 1, loop: false, frame?: (t)=>number }

let lottieLib = null;
const lottieState = new WeakMap();

async function prepLottie(L) {
  if (!lottieLib) {
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/node_modules/lottie-web/build/player/lottie_canvas.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    lottieLib = window.lottie;
  }
  const data = await (await fetch(L.src)).json();
  const canvas = document.createElement('canvas');
  canvas.width = L.w ?? data.w; canvas.height = L.h ?? data.h;
  const anim = lottieLib.loadAnimation({ renderer: 'canvas', loop: false, autoplay: false, animationData: data, rendererSettings: { context: canvas.getContext('2d'), clearCanvas: true, preserveAspectRatio: 'xMidYMid meet' } });
  await new Promise((r) => (anim.isLoaded ? r() : anim.addEventListener('DOMLoaded', r)));
  lottieState.set(L, { anim, canvas, fr: data.fr, frames: data.op - data.ip });
}

function lottie(ctx, L, t) {
  const st = lottieState.get(L);
  let f = L.frame ? L.frame(t) : (t - (L.at ?? 0)) * st.fr * (L.speed ?? 1);
  f = L.loop ? ((f % st.frames) + st.frames) % st.frames : clamp(f, 0, st.frames - 0.001);
  st.anim.goToAndStop(f, true);
  ctx.drawImage(st.canvas, -st.canvas.width / 2, -st.canvas.height / 2);
}

// ───────────────────────── فيديو ─────────────────────────
// { type:'video', src:'clip.mp4', w, h, at: 0, rate: 1, trimIn: 0, loop:false, fit:'cover' }
// الفريمات بتنستخرج مرة وحدة بالسيرفر (ffmpeg) وبتنحمل كصور حسب الحاجة.

const vcache = new Map();

async function prepVideo(L, env) {
  const r = await fetch(`/__video/info?src=${encodeURIComponent(L.src)}&fps=${env.fps ?? 30}`);
  if (!r.ok) throw new Error(`فشل تجهيز الفيديو ${L.src}: ${await r.text()}`);
  L.__info = await r.json();
}

function videoFrameIndex(L, t) {
  const info = L.__info;
  let lt = ((t - (L.at ?? 0)) * (L.rate ?? 1)) + (L.trimIn ?? 0);
  if (L.loop) lt = ((lt % info.duration) + info.duration) % info.duration;
  return Math.max(0, Math.min(info.frames - 1, Math.round(lt * info.fps)));
}

export async function ensureVideoFrames(layers, t) {
  const jobs = [];
  for (const L of layers) {
    if (L.type !== 'video' || !L.__info) continue;
    const i = videoFrameIndex(L, t - (L.__shift ?? 0));
    const url = `${L.__info.dir}/${String(i + 1).padStart(6, '0')}.jpg`;
    if (!vcache.has(url)) {
      const img = new Image();
      img.src = url;
      vcache.set(url, img);
      jobs.push(img.decode().catch(() => {}));
    }
    if (vcache.size > 400) for (const k of [...vcache.keys()].slice(0, 100)) vcache.delete(k);
  }
  await Promise.all(jobs);
}

function video(ctx, L, t) {
  const i = videoFrameIndex(L, t);
  const img = vcache.get(`${L.__info.dir}/${String(i + 1).padStart(6, '0')}.jpg`);
  if (!img || !img.complete) return;
  const w = v(L.w ?? img.naturalWidth, t), h = v(L.h ?? img.naturalHeight, t);
  const ir = img.naturalWidth / img.naturalHeight, br = w / h;
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  if ((L.fit ?? 'cover') === 'cover') { if (ir > br) { sw = sh * br; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / br; sy = (img.naturalHeight - sh) / 2; } }
  const r = v(L.radius ?? 0, t);
  if (r) { ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.clip(); }
  if (L.vhs) drawVHS(ctx, img, sx, sy, sw, sh, w, h, L.vhs, i);
  else ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  if (r) ctx.restore();
}

// شريط VHS/بث قديم: دقة منخفضة ناعمة، انزياح ألوان، ضجيج متغير كل فريم، خطوط مسح، تلوين دافي
let vhsC = null;
function drawVHS(ctx, img, sx, sy, sw, sh, w, h, o, frame) {
  const k = o.res ?? 0.3;
  const lw = Math.max(16, Math.round(w * k)), lh = Math.max(16, Math.round(h * k));
  vhsC ??= document.createElement('canvas');
  if (vhsC.width !== lw || vhsC.height !== lh) { vhsC.width = lw; vhsC.height = lh; }
  const g = vhsC.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, sx, sy, sw, sh, 0, 0, lw, lh);
  const id = g.getImageData(0, 0, lw, lh), d = id.data, src = new Uint8ClampedArray(d);
  const sh2 = Math.round((o.chroma ?? 2.5) * k * 3), noise = o.noise ?? 0.06, sat = o.saturation ?? 0.75;
  const tint = o.tint ?? [1.06, 1.0, 0.82];
  let seed = (frame + 1) * 9781;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < lh; y++) {
    const jitter = rnd() < 0.04 ? Math.round((rnd() - 0.5) * 3) : 0; // اهتزاز سطر نادر
    for (let x = 0; x < lw; x++) {
      const i = (y * lw + x) * 4;
      const xr = Math.min(lw - 1, Math.max(0, x + sh2 + jitter)), xb = Math.min(lw - 1, Math.max(0, x - sh2 + jitter));
      let R = src[(y * lw + xr) * 4], G = src[i + 1], B = src[(y * lw + xb) * 4 + 2];
      const l = 0.299 * R + 0.587 * G + 0.114 * B;
      R = l + (R - l) * sat; G = l + (G - l) * sat; B = l + (B - l) * sat;
      const n = (rnd() - 0.5) * 255 * noise;
      d[i] = R * tint[0] + n; d[i + 1] = G * tint[1] + n; d[i + 2] = B * tint[2] + n;
    }
  }
  g.putImageData(id, 0, 0);
  ctx.save();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(vhsC, -w / 2, -h / 2, w, h);
  const sl = o.scanlines ?? 0.12;
  if (sl) { ctx.fillStyle = `rgba(0,0,0,${sl})`; for (let y = -h / 2; y < h / 2; y += 4) ctx.fillRect(-w / 2, y, w, 1.5); }
  ctx.restore();
}

import { drawMap, prepMap, ensureMapTiles } from './map.js';

export const plugins = { particles, three, lottie, video, map: drawMap };
export { ensureMapTiles };

export async function preparePlugins(all, env) {
  for (const L of all) {
    if (L.type === 'three') await prepThree(L, env);
    if (L.type === 'lottie') await prepLottie(L);
    if (L.type === 'video') await prepVideo(L, env);
    if (L.type === 'map') await prepMap(L, env);
  }
}
