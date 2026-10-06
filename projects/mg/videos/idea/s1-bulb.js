// مشهد ١ — 3D (أسلوب m1): لمبة بتسقط وبتنط (squash & stretch)، بتبلش "طين" رمادي
// وبيمسحها لون حقيقي (clay → texture متل مرجع Cinema 4D)، بعدين بتضوي. الكاميرا بتلف وبتدفع لجوّا الضو.
export function bulbScene(S, P, D) {
  const { C } = P;
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const easeIn = (x) => Math.pow(Math.min(1, Math.max(0, x)), 3);

  // سقوط بارتدادين: [ارتفاع، squash]
  function drop(t) {
    const T0 = 0.15, g = 9.8 * 3.2;
    const h0 = 4.2;
    const tHit = T0 + Math.sqrt((2 * h0) / g);
    if (t < T0) return { y: h0, sx: 1, sy: 1 };
    if (t < tHit) { const u = t - T0; const vy = g * u; const s = Math.min(0.12, vy * 0.004); return { y: h0 - 0.5 * g * u * u, sx: 1 - s * 0.6, sy: 1 + s }; }
    // ارتدادات بطاقة متناقصة
    const v0 = g * (tHit - T0);
    let tt = t - tHit, v = v0 * 0.42, base = 0;
    for (let k = 0; k < 3; k++) {
      const dur = (2 * v) / g;
      // squash لحظة الضربة (0.09 ثانية)
      if (tt < 0.09) { const q = Math.sin((tt / 0.09) * Math.PI) * (k === 0 ? 0.22 : 0.1 / k); return { y: base, sx: 1 + q * 0.7, sy: 1 - q }; }
      tt -= 0.09;
      if (tt < dur) return { y: v * tt - 0.5 * g * tt * tt, sx: 1, sy: 1 + Math.max(0, (v - g * tt)) * 0.002 };
      tt -= dur; v *= 0.38;
    }
    return { y: 0, sx: 1, sy: 1 };
  }

  const build = (THREE, { W, H, renderer }) => {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);

    // إضاءة استوديو ناعمة
    scene.add(new THREE.HemisphereLight(0xfff8ee, 0xd9d2c4, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-3.5, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 9;
    key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.bias = -0.0002; key.shadow.normalBias = 0.04;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2b8, 1.1); rim.position.set(4, 3, -3); scene.add(rim);

    // أرض: بس ظل (لون الأرض هو خلفية المشهد)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    // ── هندسة اللمبة (lathe) ──
    // بروفايل الزجاج: رقبة ← كرة لحد القمة (من تحت لفوق بدون رجوع)
    const glassPts = [new THREE.Vector2(0.33, 0.12), new THREE.Vector2(0.35, 0.28), new THREE.Vector2(0.42, 0.45)];
    for (let i = 0; i <= 48; i++) {
      const a = -Math.PI * 0.32 + (i / 48) * Math.PI * 0.82; // −58° → +90°
      glassPts.push(new THREE.Vector2(Math.max(0.0005, Math.cos(a) * 0.78), 1.2 + Math.sin(a) * 0.78));
    }
    const glassGeo = new THREE.LatheGeometry(glassPts, 96);
    const baseGeo = new THREE.LatheGeometry([
      new THREE.Vector2(0.001, -0.62), new THREE.Vector2(0.12, -0.6), new THREE.Vector2(0.2, -0.5),
      ...Array.from({ length: 9 }, (_, i) => new THREE.Vector2(0.33 + (i % 2 ? 0.035 : 0), -0.44 + i * 0.065)),
      new THREE.Vector2(0.34, 0.14),
    ], 96);

    const clay = new THREE.MeshStandardMaterial({ color: 0xd8d5ce, roughness: 0.85, metalness: 0 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xffd34d, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0xffb81c, emissiveIntensity: 0.0, sheen: 0.4 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x2b44c8, roughness: 0.3, metalness: 0.45 });

    // المسح: مستوى قص بيتحرك؛ الطين على جهة واللون على الجهة التانية
    const pColor = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -2);
    const pClay = new THREE.Plane(new THREE.Vector3(1, 0, 0), 2);
    for (const m of [glass, metal]) m.clippingPlanes = [pColor];
    const clayG = clay.clone(); clayG.clippingPlanes = [pClay];
    const clayB = clay.clone(); clayB.color = new THREE.Color(0xc9c6bf); clayB.clippingPlanes = [pClay];

    const bulb = new THREE.Group();
    const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; bulb.add(m); return m; };
    add(glassGeo, glass); add(baseGeo, metal); add(glassGeo, clayG); add(baseGeo, clayB);
    // الفتيل: حلزون صغير متوهج
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => { const a = i * 0.9; return new THREE.Vector3(Math.cos(a) * 0.09, 0.55 + i * 0.012, Math.sin(a) * 0.09); }));
    const filMat = new THREE.MeshBasicMaterial({ color: 0x8a6a2a });
    const fil = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.018, 8), filMat);
    bulb.add(fil);
    const lightIn = new THREE.PointLight(0xffc040, 0, 6); lightIn.position.y = 1.1; bulb.add(lightIn);

    const pivot = new THREE.Group(); // نقطة السكواش عند القاعدة
    pivot.add(bulb); bulb.position.y = 0.62; scene.add(pivot);

    const update = (t) => {
      const d = drop(t);
      pivot.position.y = d.y;
      pivot.scale.set(d.sx, d.sy, d.sx);
      bulb.rotation.y = 0.5 + t * 0.35;
      bulb.rotation.z = -0.08 + Math.sin(t * 1.3) * 0.02;
      // مسح اللون: من 1.75 لـ 2.75
      const s = -1.4 + ease((t - 1.75) / 1.0) * 2.8;
      pColor.constant = s; pClay.constant = -s;
      // الضو
      const on = easeOut((t - 2.95) / 0.5);
      glass.emissiveIntensity = on * 0.75;
      filMat.color.setRGB(0.54 + on * 0.46, 0.42 + on * 0.5, 0.17 + on * 0.5);
      lightIn.intensity = on * 6;
      // كاميرا: مدار بطيء + دفع؛ بالآخر بتغطس جوّا الضو
      const push = easeIn((t - (D - 1.0)) / 1.0);
      const r = 11.2 - ease(t / D) * 1.4 - push * 8.6;
      const az = -0.25 + t * 0.06;
      const ty = 1.55 + push * 0.05;
      camera.position.set(Math.sin(az) * r, 2.3 + ease(t / D) * 0.3 - push * 0.7, Math.cos(az) * r);
      camera.lookAt(0, ty, 0);
    };
    update(0);
    return { scene, camera, update };
  };

  return {
    duration: D,
    background: { layers: [S.rect({ x: S.cx, y: S.cy, w: S.W, h: S.H, fill: { radial: { c: [0, -S.H * 0.05], r: S.H * 0.75 }, stops: [[0, '#FBF8F1'], [1, '#ECE6D8']] } })] },
    layers: [
      S.three({ x: S.cx, y: S.cy, w: S.W, h: S.H, build }),
      // توهج 2D فوق اللمبة بعد ما تضوي (بيكبر بالدفعة الأخيرة ويصير بياض الانتقال)
      S.ellipse({ x: S.cx, y: S.vh(53), w: S.px(900), fill: { radial: { c: [0, 0], r: S.px(450) }, stops: [[0, 'rgba(255,214,90,0.55)'], [1, 'rgba(255,214,90,0)']] }, blend: 'screen',
        opacity: { kf: [[2.95, 0], [3.5, 1, 'quadOut'], [D - 1.0, 1], [D, 1]] }, scale: { kf: [[2.95, 0.6, 'quadOut'], [3.6, 1], [D - 0.9, 1.05, 'quadIn'], [D, 4.5]] } }),
      S.rect({ x: S.cx, y: S.cy, w: S.W, h: S.H, fill: '#FFFDF6', opacity: { kf: [[D - 0.45, 0], [D, 1, 'quadIn']] } }),
      // النص: فوق، بمساحة سلبية
      S.text({ text: 'كل فكرة كبيرة', family: P.BODY, weight: 400, size: S.px(74), fill: C.muted, x: S.cx, y: S.vh(17),
        reveal: { by: 'word', at: 3.25, mask: true, from: { y: S.px(80), opacity: 0 }, dur: 0.7, ease: 'ae:75:33', stagger: { each: 0.09 } },
        exit: { by: 'word', at: D - 0.75, to: { y: -S.px(40), opacity: 0 }, dur: 0.35, ease: 'quadIn', stagger: { each: 0.04 } } }),
      S.text({ text: 'بتبلش صغيرة', family: P.HEAD, weight: 900, size: S.px(150), fill: C.ink, x: S.cx, y: S.vh(25),
        reveal: { by: 'word', at: 3.55, mask: true, from: { y: S.px(170), opacity: 0 }, dur: 0.8, ease: 'ae:85:33', stagger: { each: 0.11 } },
        exit: { by: 'word', at: D - 0.7, to: { y: -S.px(60), opacity: 0 }, dur: 0.35, ease: 'quadIn', stagger: { each: 0.04 } } }),
    ],
  };
}
