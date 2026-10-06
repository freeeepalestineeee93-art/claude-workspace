// اختبار الطبقات المتقدمة: جزيئات، 3D، Lottie، فيديو، كاميرا بعمق.
export default async (S) => {
  const C = S.colors;
  return {
    background: C.bg,
    post: { bloom: { strength: 0.6 }, grain: { amount: 0.03 }, vignette: { strength: 0.3 } },
    scenes: [
      {
        duration: 2.5,
        camera: { x: { kf: [[0, -60], [2.5, 60, 'smooth']] }, zoom: { kf: [[0, 1], [2.5, 1.08]] } },
        layers: [
          S.text({ text: 'بعيد', size: 200, fill: C.muted, x: S.cx, y: S.vh(25), z: 900, opacity: 0.6 }),
          S.text({ text: 'قريب', size: 200, fill: C.text, x: S.cx, y: S.vh(50), z: -300 }),
          { type: 'particles', count: 220, rate: 120, start: 0, life: [0.8, 1.6], emitter: { x: S.cx, y: S.vh(70), r: 30 }, angle: [200, 340], speed: [300, 900],
            gravity: [0, 900], drag: 0.6, size: [4, 10], color: [C.primary, C.accent, '#fff'], shape: 'spark', particleBlend: 'add', seed: 3 },
        ],
      },
      {
        duration: 2.5,
        transition: { type: 'gl:crosswarp', dur: 0.6 },
        layers: [
          { type: 'three', x: S.cx, y: S.vh(40), w: S.W, h: S.vh(60), build: (THREE, { W, H }) => {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100); camera.position.z = 8;
            const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), new THREE.MeshStandardMaterial({ color: C.primary, flatShading: true, metalness: 0.3, roughness: 0.4 }));
            scene.add(mesh, new THREE.HemisphereLight(0xffffff, 0x202030, 1.4));
            const d = new THREE.DirectionalLight(0xffffff, 3); d.position.set(3, 4, 5); scene.add(d);
            return { scene, camera, update: (t) => { mesh.rotation.set(t * 0.7, t * 1.1, 0); } };
          } },
          { type: 'lottie', src: '/node_modules/lottie-web/test/animations/adrock.json', x: S.cx, y: S.vh(78), w: 600, h: 400, at: 0, loop: true },
        ],
      },
      {
        duration: 2.5,
        transition: { type: 'gl:cube', dur: 0.7 },
        layers: [
          { type: 'video', src: S.asset('assets/test-clip.mp4'), x: S.cx, y: S.cy, w: S.px(720), h: S.px(1280), at: 0, radius: 40 },
          S.text({ text: 'فيديو داخل المشهد', size: 90, x: S.cx, y: S.vh(88), ...S.fx.rise(0.3, { size: 90 }) }),
        ],
      },
    ],
  };
};
