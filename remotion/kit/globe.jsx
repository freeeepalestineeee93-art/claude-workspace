// كرة أرضية ثلاثية الأبعاد حقيقية (Three.js عبر @remotion/three): بتلف، بإضاءة ناعمة، ومسار طيران حواليها.
//   <Globe size={760} spin={(t) => t * 20} ocean="#CFE6F5" land="#FBF7EF" orbit={{ laps: (t) => …, tilt: 18, color: '#F2B33D' }} />
// اليابسة من assets/geo/countries-110.json (مرسومة على texture)، فالكرة دقيقة جغرافياً.
import React, { useEffect, useMemo, useState } from 'react';
import { delayRender, continueRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { asset } from './base.js';

const texCache = new Map();
function useLandTexture(ocean, land, coast) {
  const key = `${ocean}|${land}|${coast}`;
  const [tex, setTex] = useState(texCache.get(key) ?? null);
  const [h] = useState(() => (texCache.has(key) ? null : delayRender('globe texture')));
  useEffect(() => {
    if (texCache.has(key)) return;
    fetch(asset('assets/geo/countries-110.json')).then((r) => r.json()).then((geo) => {
      const W = 2048, H = 1024, c = document.createElement('canvas');
      c.width = W; c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = ocean; g.fillRect(0, 0, W, H);
      // خطوط عرض/طول خفيفة
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5;
      for (let lat = -60; lat <= 60; lat += 30) { const y = (90 - lat) / 180 * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      for (let lon = -180; lon < 180; lon += 30) { const x = (lon + 180) / 360 * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      g.fillStyle = land; g.strokeStyle = coast; g.lineWidth = 2;
      for (const f of geo.features) {
        const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
        for (const poly of polys) {
          g.beginPath();
          for (const ring of poly) ring.forEach(([lon, lat], i) => { const x = (lon + 180) / 360 * W, y = (90 - lat) / 180 * H; i ? g.lineTo(x, y) : g.moveTo(x, y); });
          g.fill('evenodd'); g.stroke();
        }
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      texCache.set(key, t); setTex(t); continueRender(h);
    });
  }, [key]);
  return tex;
}

export function Globe({ size = 760, spin = (t) => t * 18, tilt = 23, ocean = '#BFE0F4', land = '#FFFBF2', coast = 'rgba(110,150,175,0.55)', orbit, style }) {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const tex = useLandTexture(ocean, land, coast);
  const ry = (spin(t) * Math.PI) / 180;
  // مسار المدار: حلقة مائلة، وراسها بيتقدّم حسب laps(t) (عدد اللفّات)، والذيل خط ذهبي
  const orb = useMemo(() => {
    if (!orbit) return null;
    const laps = orbit.laps(t);
    const R = 1.22, n = Math.max(2, Math.floor(laps * 160));
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = (i / 160) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a * 1) * 0.0, Math.sin(a) * R)); }
    const head = pts[pts.length - 1];
    // خط سميك = أنبوب ثلاثي الأبعاد (WebGL ما بيدعم linewidth)
    const tube = pts.length > 3 ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.min(600, pts.length * 2), orbit.width ?? 0.014, 8, false) : null;
    return { pts, head, laps, tube };
  }, [orbit && orbit.laps(t)]);
  if (!tex) return null;
  return <div style={{ width: size, height: size, ...style }}>
    <ThreeCanvas width={size} height={size} camera={{ fov: 30, position: [0, 0, 5.6] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <ambientLight intensity={1.9} />
      <directionalLight position={[3, 2, 4]} intensity={1.6} />
      <group rotation={[(tilt * Math.PI) / 180, 0, (-12 * Math.PI) / 180]}>
        <mesh rotation={[0, ry, 0]}>
          <sphereGeometry args={[1, 96, 96]} />
          <meshStandardMaterial map={tex} roughness={0.85} metalness={0} />
        </mesh>
        {/* هالة جوية خفيفة */}
        <mesh><sphereGeometry args={[1.035, 64, 64]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.BackSide} /></mesh>
        {orb && <group rotation={[(orbit.tilt ?? 18) * Math.PI / 180, 0, 0]}>
          {orb.tube && <mesh geometry={orb.tube}><meshBasicMaterial color={orbit.color ?? '#F2B33D'} transparent opacity={0.95} /></mesh>}
          {orb.pts.length > 2 && <mesh position={orb.head}><sphereGeometry args={[0.035, 16, 16]} /><meshBasicMaterial color={orbit.color ?? '#F2B33D'} /></mesh>}
        </group>}
      </group>
    </ThreeCanvas>
  </div>;
}

// موقع راس المدار على الشاشة (لتركيب صورة النحلة فوقه): بنحسبه بنفس الإسقاط تقريباً
export function orbitHead2D(laps, size, tilt = 23, otilt = 18) {
  const a = laps * Math.PI * 2, R = 1.22;
  let p = new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
  p.applyEuler(new THREE.Euler((otilt * Math.PI) / 180, 0, 0));
  p.applyEuler(new THREE.Euler((tilt * Math.PI) / 180, 0, (-12 * Math.PI) / 180));
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0, 5.6); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const v = p.clone().project(cam);
  return { x: ((v.x + 1) / 2) * size, y: ((1 - v.y) / 2) * size, front: p.z > 0, depth: p.z };
}
