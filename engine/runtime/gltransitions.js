// 125 انتقال GLSL من مكتبة gl-transitions: transition: { type: 'gl:crosswarp', dur: .8, params: {...} }
// الأسماء: /node_modules/gl-transitions/gl-transitions.json

let lib = null;
let gl = null, canvas = null, buf = null;
const programs = new Map();
const texA = { t: null }, texB = { t: null };

export async function loadGlTransitions() {
  if (!lib) lib = await (await fetch('/node_modules/gl-transitions/gl-transitions.json')).json();
  return lib;
}

function setup(W, H) {
  if (!canvas) {
    canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false });
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    for (const o of [texA, texB]) {
      o.t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, o.t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
  }
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
}

function program(name) {
  if (programs.has(name)) return programs.get(name);
  const tr = lib.find((x) => x.name === name);
  if (!tr) throw new Error(`انتقال GL غير موجود: ${name}`);
  const params = Object.entries(tr.paramsTypes || {}).map(([k, type]) => `uniform ${type} ${k};`).join('\n');
  const fs = `precision highp float;
varying vec2 _uv;
uniform sampler2D from, to;
uniform float progress, ratio;
${params}
vec4 getFromColor(vec2 uv){ return texture2D(from, uv); }
vec4 getToColor(vec2 uv){ return texture2D(to, uv); }
${tr.glsl}
void main(){ gl_FragColor = transition(_uv); }`;
  const vs = 'attribute vec2 p; varying vec2 _uv; void main(){ _uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }';
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`${name}: ${gl.getShaderInfoLog(s)}`); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'p');
  gl.linkProgram(p);
  const entry = { p, tr };
  programs.set(name, entry);
  return entry;
}

function setUniform(loc, type, val) {
  if (loc == null || val == null) return;
  if (type === 'float') gl.uniform1f(loc, val);
  else if (type === 'int' || type === 'bool') gl.uniform1i(loc, +val);
  else if (type === 'vec2') gl.uniform2fv(loc, val);
  else if (type === 'vec3') gl.uniform3fv(loc, val);
  else if (type === 'vec4') gl.uniform4fv(loc, val);
  else if (type === 'ivec2') gl.uniform2iv(loc, val);
}

export function glTransition(ctx, a, b, p, o) {
  const name = o.type.slice(3);
  setup(o.W, o.H);
  const { p: prog, tr } = program(name);
  gl.viewport(0, 0, o.W, o.H);
  gl.useProgram(prog);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  [[texA, a, 'from', 0], [texB, b, 'to', 1]].forEach(([tx, img, uname, unit]) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tx.t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(gl.getUniformLocation(prog, uname), unit);
  });
  gl.uniform1f(gl.getUniformLocation(prog, 'progress'), p);
  gl.uniform1f(gl.getUniformLocation(prog, 'ratio'), o.W / o.H);
  const params = { ...tr.defaultParams, ...(o.params || {}) };
  for (const [k, type] of Object.entries(tr.paramsTypes || {})) setUniform(gl.getUniformLocation(prog, k), type, params[k]);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  ctx.drawImage(canvas, 0, 0);
}
