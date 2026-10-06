// معالجة نهائية بـ WebGL2: motion blur (تجميع float) + bloom + halation + chromatic aberration
// + تلوين سينمائي (grade/LUT) + vignette + grain متحرك + dither ضد الـ banding.
//
// comp.post = {
//   bloom: { strength: .6, threshold: .75, radius: 1 },  halation: { strength: .25 },
//   chromatic: .0015,  vignette: { strength: .35, softness: .6 },
//   grain: { amount: .06, size: 1.4 },  grade: { exposure: 0, contrast: 1.05, saturation: 1, temperature: 0, tint: 0,
//            lift: [0,0,0], gamma: [1,1,1], gain: [1,1,1] },  lut: { src: '/assets/luts/x.cube', mix: 1 },
//   dither: true }

import { value as v } from '../../lib/anim.js';

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;

const COPY = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D t; uniform float w;
void main(){ o = texture(t, vec2(uv.x, 1.-uv.y)) * w; }`;

const COPY_FLAT = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D t;
void main(){ o = texture(t, uv); }`;

const BRIGHT = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D t; uniform float th;
void main(){ vec3 c = texture(t, uv).rgb; float l = max(c.r, max(c.g, c.b));
  float k = smoothstep(th, th + .25, l); o = vec4(c * k, 1.); }`;

const BLUR = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D t; uniform vec2 d;
void main(){ vec3 s = texture(t, uv).rgb * .2270270;
  s += texture(t, uv + d*1.3846153).rgb * .3162162; s += texture(t, uv - d*1.3846153).rgb * .3162162;
  s += texture(t, uv + d*3.2307692).rgb * .0702702; s += texture(t, uv - d*3.2307692).rgb * .0702702;
  o = vec4(s, 1.); }`;

const FINAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D src, b1, b2, b3, lut;
uniform vec2 res; uniform float time, seed;
uniform float bloomK, halK, chroma, vigK, vigSoft, grainK, grainSize, exposure, contrast, sat, temp, tint, lutMix, useLut, dither;
uniform vec3 lift, gamma_, gain;

float hash(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 sampleLut(vec3 c){
  float N = 32.; c = clamp(c, 0., 1.) * (N - 1.);
  float b = floor(c.b); float f = c.b - b;
  vec2 a1 = vec2((b * N + c.r + .5) / (N * N), (c.g + .5) / N);
  vec2 a2 = vec2(((b + 1.) * N + c.r + .5) / (N * N), (c.g + .5) / N);
  return mix(texture(lut, a1).rgb, texture(lut, a2).rgb, f); }

void main(){
  vec2 st = uv;
  vec2 cc = st - .5;
  // chromatic aberration شعاعي (أقوى عالأطراف متل العدسات الحقيقية)
  vec3 col;
  if (chroma > 0.) {
    vec2 off = cc * dot(cc, cc) * chroma * 40.;
    col = vec3(texture(src, st + off).r, texture(src, st).g, texture(src, st - off).b);
  } else col = texture(src, st).rgb;
  vec3 bl = (texture(b1, st).rgb * .5 + texture(b2, st).rgb * .3 + texture(b3, st).rgb * .2);
  col += bl * bloomK;
  // halation: توهج أحمر/برتقالي حول الإضاءات (إحساس فيلم)
  col += bl * vec3(1., .35, .12) * halK;
  // grade
  col *= exp2(exposure);
  col.r *= 1. + temp * .1; col.b *= 1. - temp * .1; col.g *= 1. + tint * .08;
  col = pow(max(col * gain + lift * (1. - col), 0.), 1. / gamma_);
  float l = dot(col, vec3(.2126, .7152, .0722));
  col = mix(vec3(l), col, sat);
  col = (col - .5) * contrast + .5;
  if (useLut > .5) col = mix(col, sampleLut(col), lutMix);
  // vignette
  float vg = smoothstep(.85, .85 - vigSoft, length(cc * vec2(res.x / res.y, 1.) * 1.2));
  col *= mix(1., vg, vigK);
  // grain مرتبط بالإضاءة (أوضح بالمناطق المتوسطة متل الفيلم)
  if (grainK > 0.) {
    vec2 gp = floor(gl_FragCoord.xy / grainSize);
    float n = hash(vec3(gp, seed)) + hash(vec3(gp + 17.3, seed + 3.1)) - 1.;
    float lw = 1. - abs(l - .5) * 1.4;
    col += n * grainK * max(lw, .25);
  }
  // dither ضد الـ banding بالتدرجات
  if (dither > 0.) col += (hash(vec3(gl_FragCoord.xy, seed + 9.)) - .5) / 255.;
  o = vec4(clamp(col, 0., 1.), 1.);
}`;

export class Post {
  constructor(W, H, cfg = {}, quality = 'final') {
    this.W = W; this.H = H; this.cfg = cfg; this.quality = quality;
    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    const gl = (this.gl = this.canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false }));
    this.float = !!gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
    const buf = (this.buf = gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.prog = {
      copy: this.program(COPY), flat: this.program(COPY_FLAT), bright: this.program(BRIGHT), blur: this.program(BLUR), final: this.program(FINAL),
    };
    this.input = this.texture(W, H, false);
    this.accum = this.target(W, H, this.float);
    this.full = this.target(W, H, false);
    const lv = (d) => [this.target(Math.ceil(W / d), Math.ceil(H / d), false), this.target(Math.ceil(W / d), Math.ceil(H / d), false)];
    this.levels = [lv(4), lv(8), lv(16)];
    this.lutTex = null;
    this.frameNo = 0;
    this.ready = cfg.lut?.src ? this.loadLut(cfg.lut.src) : Promise.resolve();
  }

  program(fs) {
    const gl = this.gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }

  texture(w, h, float) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  target(w, h, float) {
    const gl = this.gl;
    const tex = this.texture(w, h, float);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb, w, h };
  }

  pass(prog, target, uniforms = {}, textures = {}) {
    const gl = this.gl;
    gl.useProgram(prog.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, target ? target.w : this.W, target ? target.h : this.H);
    let unit = 0;
    for (const [name, tex] of Object.entries(textures)) {
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(prog.u[name], unit++);
    }
    for (const [name, val] of Object.entries(uniforms)) {
      const loc = prog.u[name];
      if (loc == null) continue;
      if (Array.isArray(val)) gl[`uniform${val.length}fv`](loc, val); else gl.uniform1f(loc, val);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  upload(canvas) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.input);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  beginAccum() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.accum.fb);
    gl.viewport(0, 0, this.W, this.H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  }

  accumulate(canvas, w) {
    const gl = this.gl;
    this.upload(canvas);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    this.pass(this.prog.copy, this.accum, { w }, { t: this.input });
    gl.disable(gl.BLEND);
  }

  endAccum(out, t) { this.finish(this.accum.tex, out, t); }

  apply(canvas, out, t) {
    this.upload(canvas);
    this.pass(this.prog.copy, this.full, { w: 1 }, { t: this.input });
    this.finish(this.full.tex, out, t);
  }

  finish(srcTex, out, t) {
    const c = this.cfg;
    const val = (x, d) => (x == null ? d : v(x, t));
    const bloom = c.bloom ? { strength: 0.6, threshold: 0.72, radius: 1, ...v(c.bloom, t) } : null;
    const hal = c.halation ? { strength: 0.25, ...v(c.halation, t) } : null;
    if (bloom || hal) {
      let prev = srcTex;
      this.levels.forEach(([a, b], i) => {
        if (i === 0) this.pass(this.prog.bright, a, { th: bloom?.threshold ?? 0.72 }, { t: prev });
        else this.pass(this.prog.flat, a, {}, { t: prev });
        const r = (bloom?.radius ?? 1) * 1.2;
        this.pass(this.prog.blur, b, { d: [r / a.w, 0] }, { t: a.tex });
        this.pass(this.prog.blur, a, { d: [0, r / a.h] }, { t: b.tex });
        prev = a.tex;
      });
    }
    const g = { exposure: 0, contrast: 1, saturation: 1, temperature: 0, tint: 0, lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], ...(c.grade ? v(c.grade, t) : {}) };
    const vig = c.vignette ? { strength: 0.35, softness: 0.55, ...v(c.vignette, t) } : { strength: 0, softness: 0.5 };
    const gr = c.grain ? { amount: 0.05, size: 1.5, ...v(c.grain, t) } : { amount: 0, size: 1 };
    const fps = 30;
    this.pass(this.prog.final, null, {
      res: [this.W, this.H], time: t, seed: Math.floor(t * fps) * 1.618 % 100,
      bloomK: bloom ? bloom.strength : 0, halK: hal ? hal.strength : 0,
      chroma: val(c.chromatic, 0), vigK: vig.strength, vigSoft: vig.softness,
      grainK: this.quality === 'draft' ? 0 : gr.amount, grainSize: gr.size,
      exposure: g.exposure, contrast: g.contrast, sat: g.saturation, temp: g.temperature, tint: g.tint,
      lift: g.lift, gamma_: g.gamma, gain: g.gain,
      useLut: this.lutTex ? 1 : 0, lutMix: c.lut?.mix ?? 1, dither: c.dither === false ? 0 : 1,
    }, { src: srcTex, b1: this.levels[0][0].tex, b2: this.levels[1][0].tex, b3: this.levels[2][0].tex, lut: this.lutTex ?? this.input });
    if (out) out.getContext('2d').drawImage(this.canvas, 0, 0);
  }

  // البكسلات الخام للفريم الأخير (مقلوبة عمودياً، ffmpeg بيقلبها)
  pixels() {
    const gl = this.gl;
    if (!this._px) this._px = new Uint8Array(this.W * this.H * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, this.W, this.H, gl.RGBA, gl.UNSIGNED_BYTE, this._px);
    return this._px;
  }

  // تحميل LUT بصيغة .cube (أي حجم) وتحويله لشريط 32³
  async loadLut(src) {
    const txt = await (await fetch(src)).text();
    let size = 0;
    const data = [];
    for (const line of txt.split('\n')) {
      const s = line.trim();
      if (!s || s[0] === '#') continue;
      if (s.startsWith('LUT_3D_SIZE')) size = +s.split(/\s+/)[1];
      else if (/^[\d.\-]/.test(s)) data.push(s.split(/\s+/).map(Number));
    }
    const N = 32;
    const px = new Uint8Array(N * N * N * 4);
    const at = (r, g, b) => data[r + g * size + b * size * size];
    for (let b = 0; b < N; b++) for (let g = 0; g < N; g++) for (let r = 0; r < N; r++) {
      const m = (x) => Math.round((x / (N - 1)) * (size - 1));
      const c = at(m(r), m(g), m(b));
      const i = (g * N * N + b * N + r) * 4;
      px[i] = c[0] * 255; px[i + 1] = c[1] * 255; px[i + 2] = c[2] * 255; px[i + 3] = 255;
    }
    const gl = this.gl;
    this.lutTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N * N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
}
